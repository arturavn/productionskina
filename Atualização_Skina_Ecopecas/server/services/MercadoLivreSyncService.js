import cron from 'node-cron';
import MercadoLivreAccount from '../models/MercadoLivreAccount.js';
import MercadoLivreIntegrationService from './MercadoLivreIntegrationService.js';
import { query, transaction } from '../config/database.js';
import crypto from 'crypto';
import axios from 'axios';

class MercadoLivreSyncService {
  constructor() {
    this.integrationService = new MercadoLivreIntegrationService();
    this.syncTask = null;
    this.isRunning = false;
  }

  async start() {
    if (this.syncTask) {
      this.stop();
    }

    // Verificar se sincronização automática está habilitada
    const config = await this.integrationService.getSyncConfig();
    if (config.auto_sync_enabled === 'true') {
      const intervalMinutes = parseInt(config.sync_interval_minutes) || 60;
      
      this.syncTask = cron.schedule(`0 */${intervalMinutes} * * * *`, async () => {
        await this.runDeltaSync();
      });
    }

    // Agendar verificação automática de tokens expirados (a cada 60minutos)
    this.tokenRefreshTask = cron.schedule('0 */60 * * * *', async () => {
      await this.refreshExpiredTokens();
    });
  }

  async stop() {
    if (this.syncTask) {
      this.syncTask.stop();
    }
    
    if (this.tokenRefreshTask) {
      this.tokenRefreshTask.stop();
    }
  }

  // Sincronização individual de um produto
  async syncSingleProduct(mlId, userId) {
    try {
      console.log(`🔄 Iniciando sincronização individual do produto ${mlId}`);
      
      // Buscar conta do usuário
      const account = await MercadoLivreAccount.findByUserId(userId);
      if (!account) {
        throw new Error('Conta do Mercado Livre não encontrada');
      }

      // Criar job de sincronização
      const jobId = await this.createSyncJob('single_item', 1);
      
      try {
        // Marcar job como iniciado
        await this.startSyncJob(jobId);
        
        // Buscar dados do produto no ML
        const { productData, description } = await this.integrationService.fetchProductWithDescription(mlId, account.access_token);
        
        // Mapear dados
        const mappedData = this.integrationService.mapMercadoLivreToLocal(productData, description);
        mappedData.ml_seller_id = account.seller_id;
        
        // Gerar hash para detectar mudanças
        const newHash = this.integrationService.generateSnapshotHash(productData, description);
        
        // Verificar se há mudanças
        const hasChanges = await this.checkProductChanges(mlId, newHash);
        
        if (hasChanges) {
          // Sincronizar produto
          const result = await this.syncProductData(mappedData, productData, account.seller_id);
          
          // Atualizar estado de sincronização
          await this.updateSyncState(mlId, newHash, null, null);
          
          // Registrar log de sucesso
          await this.logSyncAction(jobId, mlId, 'update', result.diff, true);
          
          console.log(`✅ Produto ${mlId} sincronizado com sucesso`);
          return { success: true, action: 'update', diff: result.diff };
        } else {
          // Registrar log de noop
          await this.logSyncAction(jobId, mlId, 'noop', null, true);
          
          console.log(`Produto ${mlId} sem mudanças`);
          return { success: true, action: 'noop' };
        }
        
      } catch (error) {
        // Registrar erro
        await this.logSyncAction(jobId, mlId, 'error', null, false, error.message);
        await this.updateSyncState(mlId, null, null, error.message);
        
        throw error;
      } finally {
        // Finalizar job
        await this.finishSyncJob(jobId, 'success');
      }
      
    } catch (error) {
      console.error(`❌ Erro na sincronização individual do produto ${mlId}:`, error);
      throw error;
    }
  }

  // Sincronização em massa (delta)
  async runDeltaSync() {
    if (this.isRunning) {
      console.log('⚠️ Sincronização delta já está em execução');
      return;
    }

    this.isRunning = true;
    const jobId = await this.createSyncJob('delta', 0);
    
    try {
      console.log('🔄 Iniciando sincronização delta');
      
      // Marcar job como iniciado
      await this.startSyncJob(jobId);
      
      // Aplicar configurações atualizadas
      await this.integrationService.applyConfig();
      
      // Buscar todas as contas ativas
      const accounts = await MercadoLivreAccount.findAll();
      if (accounts.length === 0) {
        //console.log('Nenhuma conta do Mercado Livre encontrada');
        return;
      }
      
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalErrors = 0;
      
      for (const account of accounts) {
        try {
          console.log(`🔄 Sincronizando conta do usuário ${account.user_id}`);
          
          if (!account.seller_id) {
           //console.log(`⚠️ Conta ${account.user_id} sem seller_id configurado`);
            continue;
          }

          // Buscar produtos existentes com ml_id
          const { rows: existingProducts } = await query(`
            SELECT ml_id, name FROM products 
            WHERE ml_id IS NOT NULL AND ml_id != ''
          `);

          if (existingProducts.length === 0) {
            //console.log(`ℹ️ Nenhum produto com ML ID encontrado para a conta ${account.user_id}`);
            continue;
          }

          console.log(`Encontrados ${existingProducts.length} produtos para sincronizar`);



          // Processar em lotes usando configuração
          const config = await this.integrationService.getSyncConfig();
          const batchSize = parseInt(config.batch_size) || 50;
          console.log(`Processando em lotes de ${batchSize} produtos`);
          
          for (let i = 0; i < existingProducts.length; i += batchSize) {
            const batch = existingProducts.slice(i, i + batchSize);
            
            console.log(`🔄 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(existingProducts.length/batchSize)} (${batch.length} produtos)`);
            
            const batchResults = await Promise.allSettled(
              batch.map(product => this.syncProductInBatch(product.ml_id, account))
            );

            // Contar resultados
            batchResults.forEach(result => {
              totalProcessed++;
              if (result.status === 'fulfilled') {
                if (result.value.action === 'update') totalUpdated++;
              } else {
                totalErrors++;
                console.error('Erro no lote:', result.reason);
              }
            });

            // Atualizar progresso do job
            await this.updateSyncJobProgress(jobId, totalProcessed, existingProducts.length);

            // Rate limiting entre lotes usando configuração
            const config = await this.integrationService.getSyncConfig();
            const delayBetweenBatches = parseInt(config.rate_limit_delay_ms) * 2 || 1000; // 2x o delay normal entre lotes
            console.log(`Aguardando ${delayBetweenBatches}ms antes do próximo lote...`);
            await this.integrationService.sleep(delayBetweenBatches);
          }

        } catch (accountError) {
          console.error(`❌ Erro ao sincronizar conta ${account.user_id}:`, accountError);
          totalErrors++;
        }
      }

      console.log(`Sincronização delta concluída: ${totalProcessed} processados, ${totalUpdated} atualizados, ${totalErrors} erros`);
      
      // Finalizar job
      const finalStatus = totalErrors === 0 ? 'success' : (totalUpdated > 0 ? 'partial' : 'failed');
      await this.finishSyncJob(jobId, finalStatus, totalErrors > 0 ? 'Alguns produtos falharam na sincronização' : null);

    } catch (error) {
      console.error('❌ Erro na sincronização delta:', error);
      await this.finishSyncJob(jobId, 'failed', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Sincronização em massa (importação completa)
  async runFullImport(userId) {
    try {
      //console.log('🔄 Iniciando importação completa');
      
      // Aplicar configurações atualizadas
      await this.integrationService.applyConfig();
      
      // Buscar conta do usuário
      const account = await MercadoLivreAccount.findByUserId(userId);
      if (!account) {
        throw new Error('Conta do Mercado Livre não encontrada');
      }

      if (!account.seller_id) {
        throw new Error('Conta sem seller_id configurado');
      }

      const jobId = await this.createSyncJob('full_import', 0);
      
      try {
        // Marcar job como iniciado
        await this.startSyncJob(jobId);
        
        // Buscar todos os produtos do usuário no ML
        const mlProducts = await this.fetchAllUserProducts(account);
        console.log(`Encontrados ${mlProducts.length} produtos no Mercado Livre`);



        // Atualizar total do job
        await this.updateSyncJobProgress(jobId, 0, mlProducts.length);

        let processed = 0;
        let imported = 0;
        let errors = 0;

        // Processar em lotes usando configuração
        const config = await this.integrationService.getSyncConfig();
        const batchSize = parseInt(config.batch_size) || 100;
        console.log(`Processando em lotes de ${batchSize} produtos`);
        
        for (let i = 0; i < mlProducts.length; i += batchSize) {
          const batch = mlProducts.slice(i, i + batchSize);
          
          console.log(`🔄 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(mlProducts.length/batchSize)} (${batch.length} produtos)`);
          
          const batchResults = await Promise.allSettled(
            batch.map(mlProduct => this.importProductFromML(mlProduct, account))
          );

          // Contar resultados
          batchResults.forEach(result => {
            processed++;
            if (result.status === 'fulfilled') {
              imported++;
            } else {
              errors++;
              console.error('Erro na importação:', result.reason);
            }
          });

          // Atualizar progresso
          await this.updateSyncJobProgress(jobId, processed, mlProducts.length);

          // Rate limiting entre lotes usando configuração
          const config = await this.integrationService.getSyncConfig();
          const delayBetweenBatches = parseInt(config.rate_limit_delay_ms) * 2 || 2000; // 2x o delay normal entre lotes
          console.log(`Aguardando ${delayBetweenBatches}ms antes do próximo lote...`);
          await this.integrationService.sleep(delayBetweenBatches);
        }

        console.log(`Importação completa concluída: ${processed} processados, ${imported} importados, ${errors} erros`);
        
        const finalStatus = errors === 0 ? 'success' : (imported > 0 ? 'partial' : 'failed');
        await this.finishSyncJob(jobId, finalStatus, errors > 0 ? 'Alguns produtos falharam na importação' : null);

        return { processed, imported, errors };

      } catch (error) {
        await this.finishSyncJob(jobId, 'failed', error.message);
        throw error;
      }

    } catch (error) {
      console.error('❌ Erro na importação completa:', error);
      throw error;
    }
  }



  // Métodos auxiliares privados

  async syncProductInBatch(mlId, account) {
    try {
      // Buscar dados do produto no ML
      const { productData, description } = await this.integrationService.fetchProductWithDescription(mlId, account.access_token);
      
      // Mapear dados
      const mappedData = this.integrationService.mapMercadoLivreToLocal(productData, description);
      mappedData.ml_seller_id = account.seller_id;
      
      // Gerar hash
      const newHash = this.integrationService.generateSnapshotHash(productData, description);
      
      // Verificar mudanças
      const hasChanges = await this.checkProductChanges(mlId, newHash);
      
      if (hasChanges) {
        const result = await this.syncProductData(mappedData, productData, account.seller_id);
        await this.updateSyncState(mlId, newHash, null, null);
        return { action: 'update', diff: result.diff };
      } else {
        return { action: 'noop' };
      }
      
    } catch (error) {
      console.error(`❌ Erro ao sincronizar produto ${mlId}:`, error);
      await this.updateSyncState(mlId, null, null, error.message);
      throw error;
    }
  }

  async importProductFromML(mlProduct, account) {
    try {
      // Buscar descrição
      let description = '';
      try {
        const descriptionData = await this.integrationService.makeRequest(`/items/${mlProduct.id}/description`, account.access_token);
        description = descriptionData.plain_text || descriptionData.text || descriptionData.content || '';
      } catch (descError) {
        console.warn(`Erro ao buscar descrição do produto ${mlProduct.id}:`, descError.message);
      }

      // Mapear dados
      const mappedData = this.integrationService.mapMercadoLivreToLocal(mlProduct, description);
      mappedData.ml_seller_id = account.seller_id;
      
      // Importar produto
      const result = await this.syncProductData(mappedData, mlProduct, account.seller_id);
      
      // Atualizar estado
      const newHash = this.integrationService.generateSnapshotHash(mlProduct, description);
      await this.updateSyncState(mlProduct.id, newHash, null, null);
      
      return { action: 'insert', diff: result.diff };
      
    } catch (error) {
      console.error(`❌ Erro ao importar produto ${mlProduct.id}:`, error);
      await this.updateSyncState(mlProduct.id, null, null, error.message);
      throw error;
    }
  }

  async fetchAllUserProducts(account) {
    const products = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      try {
        const response = await this.integrationService.makeRequest(
          `/users/${account.seller_id}/items/search`,
          account.access_token,
          { params: { limit, offset, status: 'active' } }
        );
        
        const batch = response.results || [];
        if (batch.length === 0) break;
        
        products.push(...batch);
        offset += limit;
        
        // Rate limiting usando configuração
        const config = await this.integrationService.getSyncConfig();
        const delay = parseInt(config.rate_limit_delay_ms) || 1000;
        await this.integrationService.sleep(delay);
        
      } catch (error) {
        console.error('Erro ao buscar produtos do usuário:', error);
        break;
      }
    }
    
    return products;
  }

  async checkProductChanges(mlId, newHash) {
    try {
      const { rows } = await query(
        'SELECT last_ml_snapshot_hash FROM product_sync_state WHERE ml_id = $1',
        [mlId]
      );
      
      if (rows.length === 0) return true; 
      
      return rows[0].last_ml_snapshot_hash !== newHash;
    } catch (error) {
      console.error('Erro ao verificar mudanças:', error);
      return true; 
    }
  }

  async syncProductData(mappedData, mlProduct, sellerId) {
    return await transaction(async (client) => {
      // Preparar dados
      const productData = {
        name: mappedData.name,
        description: mappedData.description,
        original_price: mappedData.original_price,
        discount_price: mappedData.discount_price,
        stock_quantity: mappedData.stock_quantity,
        image_url: mappedData.image_url,
        brand: mappedData.brand,
        specifications: mappedData.specifications,
        ml_id: mappedData.ml_id,
        ml_seller_id: sellerId,
        ml_family_id: mappedData.ml_family_id,
        dimensions: mappedData.dimensions ? JSON.stringify(mappedData.dimensions) : null,
        weight: mappedData.weight,
        width_cm: mappedData.width_cm,
        height_cm: mappedData.height_cm,
        length_cm: mappedData.length_cm,
        weight_kg: mappedData.weight_kg,
        updated_at: new Date()
      };

      // Remover campos undefined/null
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined || productData[key] === null) {
          delete productData[key];
        }
      });

      console.log('Dados para sincronização:', productData);

      // Construir query de upsert
      const fields = Object.keys(productData);
      const values = Object.values(productData);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const updateFields = fields.map(field => `${field} = EXCLUDED.${field}`).join(', ');

      const upsertQuery = `
        INSERT INTO products (${fields.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (ml_id) DO UPDATE SET
          ${updateFields}
        RETURNING id, name, ml_id
      `;

      //console.log('🔍 Query de upsert:', upsertQuery);
      //console.log('Parâmetros:', values);

      const result = await client.query(upsertQuery, values);
      const product = result.rows[0];

      console.log('✅ Produto sincronizado:', product);

      // Sincronizar imagens do produto
      if (mlProduct.pictures && Array.isArray(mlProduct.pictures)) {
        console.log(`Sincronizando ${mlProduct.pictures.length} imagens para produto ${product.ml_id}`);
        await this.syncProductImages(client, mappedData.ml_id, mlProduct.pictures);
      } else {
        console.log('⚠️ Nenhuma imagem para sincronizar no produto:', mappedData.ml_id);
      }

      // Gerar diff para log
      const diff = this.generateDiff(productData);

      return { product, diff };
    });
  }

  async syncProductImages(client, mlId, pictures) {
    try {
      // Remover imagens antigas
      await client.query('DELETE FROM product_images_ml WHERE ml_id = $1', [mlId]);
      
      // Inserir novas imagens
      if (pictures && pictures.length > 0) {
        const imageValues = pictures.map((pic, index) => ({
          ml_id: mlId,
          image_url: pic.url || pic.secure_url,
          position: index
        }));

        for (const image of imageValues) {
          await client.query(
            'INSERT INTO product_images_ml (ml_id, image_url, position) VALUES ($1, $2, $3)',
            [image.ml_id, image.image_url, image.position]
          );
        }
      }
            } catch (error) {
      console.error('Erro ao sincronizar imagens:', error);
      throw error;
    }
  }

  generateDiff(newData) {
    // Simplificado - em produção, comparar com dados existentes
    return {
      fields_updated: Object.keys(newData).filter(key => 
        !['updated_at', 'ml_id', 'ml_seller_id'].includes(key)
      ),
      timestamp: new Date().toISOString()
    };
  }

  // Gerenciamento de jobs

  async createSyncJob(type, total) {
    const { rows } = await query(
      'INSERT INTO sync_jobs (type, total, status) VALUES ($1, $2, $3) RETURNING id',
      [type, total, 'queued']
    );
    return rows[0].id;
  }

  async startSyncJob(jobId) {
    try {
      
      const result = await query(
        'UPDATE sync_jobs SET status = $1, started_at = NOW() WHERE id = $2 RETURNING id, status, started_at',
        ['running', jobId]
      );
      
      
      // Verificar se foi realmente atualizado
      const { rows: [verifyJob] } = await query(
        'SELECT id, status, started_at FROM sync_jobs WHERE id = $1',
        [jobId]
      );
      
      
    } catch (error) {
      throw error;
    }
  }

  async updateSyncJobProgress(jobId, processed, total) {
    await query(
      'UPDATE sync_jobs SET processed = $1, total = $2 WHERE id = $3',
      [processed, total, jobId]
    );
  }

  async finishSyncJob(jobId, status, error = null) {
    await query(
      'UPDATE sync_jobs SET status = $1, finished_at = NOW(), error = $2 WHERE id = $3',
      [status, error, jobId]
    );
  }

  // Gerenciamento de estado

  async updateSyncState(mlId, hash, etag, error) {
    try {
      await query(`
        INSERT INTO product_sync_state (ml_id, last_synced_at, last_ml_snapshot_hash, last_ml_etag, last_error, retry_count)
        VALUES ($1, NOW(), $2, $3, $4, 0)
        ON CONFLICT (ml_id) DO UPDATE SET
          last_synced_at = NOW(),
          last_ml_snapshot_hash = COALESCE($2, product_sync_state.last_ml_snapshot_hash),
          last_ml_etag = $3,
          last_error = $4,
          retry_count = CASE WHEN $4 IS NULL THEN 0 ELSE product_sync_state.retry_count + 1 END
      `, [mlId, hash, etag, error]);
    } catch (error) {
      console.error('Erro ao atualizar estado de sincronização:', error);
    }
  }

  // Logs

  async logSyncAction(jobId, mlId, action, diff, success, error = null) {
    try {
      await query(
        'INSERT INTO sync_logs_ml (job_id, ml_id, action, diff, success, error) VALUES ($1, $2, $3, $4, $5, $6)',
        [jobId, mlId, action, diff ? JSON.stringify(diff) : null, success, error]
      );
    } catch (error) {
      console.error('Erro ao registrar log de sincronização:', error);
    }
  }

  // Renovação automática de tokens
  async refreshExpiredTokens() {
    try {
      //console.log('🔄 Verificando tokens expirados...');
      
      // Buscar contas com tokens expirados ou próximos de expirar (1 hora antes)
      const { rows: expiredAccounts } = await query(`
        SELECT id, user_id, access_token, refresh_token, expires_at, seller_id, nickname
        FROM mercado_livre_accounts 
        WHERE expires_at < NOW() + INTERVAL '1 hour'
        AND refresh_token IS NOT NULL
        AND refresh_token != ''
      `);

      if (expiredAccounts.length === 0) {
        //console.log('✅ Nenhum token expirado encontrado');
        return;
      }

      console.log(`🔄 Encontrados ${expiredAccounts.length} tokens para renovar`);

      for (const account of expiredAccounts) {
        try {
          console.log(`🔄 Renovando token para usuário ${account.user_id} (${account.nickname})`);
          
          const success = await this.refreshAccountToken(account);
          
          if (success) {
            console.log(`✅ Token renovado com sucesso para usuário ${account.user_id}`);
          } else {
            console.log(`❌ Falha ao renovar token para usuário ${account.user_id}`);
          }
          
          // Aguardar entre renovações para evitar rate limiting
          await this.integrationService.sleep(1000);
          
        } catch (error) {
          console.error(`❌ Erro ao renovar token para usuário ${account.user_id}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar tokens expirados:', error);
    }
  }

  async refreshAccountToken(account) {
    try {
      console.log(`🔄 Renovando token para conta ${account.id}`);
      
      // Fazer requisição para renovar o token
      const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.ML_APP_ID,
        client_secret: process.env.ML_APP_SECRET,
        refresh_token: account.refresh_token
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.access_token) {
        const newExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);
        
        await query(`
          UPDATE mercado_livre_accounts 
          SET 
            access_token = $1,
            refresh_token = $2,
            expires_at = $3,
            updated_at = NOW()
          WHERE id = $4
        `, [
          response.data.access_token,
          response.data.refresh_token || account.refresh_token, // Manter o antigo se não receber novo
          newExpiresAt,
          account.id
        ]);

        console.log(`✅ Token renovado com sucesso para conta ${account.id}`);
        return true;
      } else {
        console.log(`❌ Resposta inválida ao renovar token para conta ${account.id}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao renovar token para conta ${account.id}:`, error.response?.data || error.message);
      
      // Se o refresh token também expirou, marcar como erro
      if (error.response?.status === 400 && error.response?.data?.error === 'invalid_grant') {
        console.log(`⚠️ Refresh token expirado para conta ${account.id}, precisa reconectar`);
        
        // Marcar erro na conta
        await query(`
          UPDATE mercado_livre_accounts 
          SET 
            access_token = NULL,
            expires_at = NULL,
            updated_at = NOW()
          WHERE id = $1
        `, [account.id]);
      }
      
      return false;
    }
  }

  // Verificar se uma conta precisa de renovação de token
  async checkTokenValidity(accountId) {
    try {
      const { rows } = await query(`
        SELECT id, access_token, expires_at, seller_id, nickname
        FROM mercado_livre_accounts 
        WHERE id = $1
      `, [accountId]);

      if (rows.length === 0) {
        return { valid: false, reason: 'Conta não encontrada' };
      }

      const account = rows[0];
      
      if (!account.access_token) {
        return { valid: false, reason: 'Token de acesso não encontrado' };
      }

      if (account.expires_at && new Date(account.expires_at) <= new Date()) {
        return { valid: false, reason: 'Token expirado' };
      }

      // Verificar se expira em menos de 1 hora
      if (account.expires_at && new Date(account.expires_at) <= new Date(Date.now() + 60 * 60 * 1000)) {
        return { valid: true, reason: 'Token válido mas expira em breve', needsRefresh: true };
      }

      return { valid: true, reason: 'Token válido' };
    } catch (error) {
      console.error('Erro ao verificar validade do token:', error);
      return { valid: false, reason: 'Erro ao verificar token' };
    }
  }

  async updateSyncConfig(key, value) {
    return await this.integrationService.updateSyncConfig(key, value);
  }

  async getSyncConfig() {
    return await this.integrationService.getSyncConfig();
  }
}

export default MercadoLivreSyncService;
