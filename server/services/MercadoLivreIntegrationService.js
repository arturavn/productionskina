import axios from 'axios';
import crypto from 'crypto';
import { query } from '../config/database.js';

class MercadoLivreIntegrationService {
  constructor() {
    this.baseURL = 'https://api.mercadolibre.com';
    this.config = null;
  }

  // Aplicar configurações do banco
  async applyConfig() {
    this.config = await this.getSyncConfig();
  }

  // Fazer requisições para a API do ML
  async makeRequest(endpoint, accessToken, options = {}) {
    try {
      const config = {
        method: options.method || 'GET',
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await axios(config);
      
      // Rate limiting usando configuração
      const syncConfig = await this.getSyncConfig();
      const delay = parseInt(syncConfig.rate_limit_delay_ms) || 1000;
      await this.sleep(delay);
      
      return response.data;
    } catch (error) {
      console.error(`Erro na requisição ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Buscar produto com descrição
  async fetchProductWithDescription(mlId, accessToken) {
    try {
      // Buscar dados do produto
      const productData = await this.makeRequest(`/items/${mlId}`, accessToken);
      
      // Buscar descrição
      let description = '';
      try {
        const descriptionData = await this.makeRequest(`/items/${mlId}/description`, accessToken);
        description = descriptionData.plain_text || descriptionData.text || descriptionData.content || '';
      } catch (descError) {
        console.warn(`Erro ao buscar descrição do produto ${mlId}:`, descError.message);
      }

      return { productData, description };
    } catch (error) {
      console.error(`Erro ao buscar produto ${mlId}:`, error);
      throw error;
    }
  }

  // Mapear dados do ML para formato local
  mapMercadoLivreToLocal(mlProduct, description = '') {
    try {
      // Extrair peso e dimensões dos atributos
      const { weight, dimensions } = this.extractWeightAndDimensions(mlProduct.attributes || []);
      
      // Extrair marca
      const brandAttribute = mlProduct.attributes?.find(attr => attr.id === 'BRAND');
      const brand = brandAttribute?.value_name || '';

      // Mapear dados básicos
      const mappedData = {
        name: mlProduct.title || '',
        description: description || mlProduct.description || '',
        original_price: parseFloat(mlProduct.price) || 0,
        discount_price: parseFloat(mlProduct.original_price) || parseFloat(mlProduct.price) || 0,
        stock_quantity: parseInt(mlProduct.available_quantity) || 0,
        image_url: mlProduct.thumbnail || (mlProduct.pictures && mlProduct.pictures[0] ? mlProduct.pictures[0].url : ''),
        brand: brand,
        specifications: JSON.stringify(mlProduct.attributes || []),
        ml_id: mlProduct.id,
        ml_family_id: mlProduct.family_id || null,
        dimensions: dimensions,
        weight: weight,
        width_cm: dimensions?.width || null,
        height_cm: dimensions?.height || null,
        length_cm: dimensions?.length || null,
        weight_kg: weight ? weight / 1000 : null // Converter gramas para kg
      };

      return mappedData;
    } catch (error) {
      console.error('Erro ao mapear dados do ML:', error);
      throw error;
    }
  }

  // Extrair peso e dimensões dos atributos
  extractWeightAndDimensions(attributes) {
    let weight = null;
    let dimensions = {};

    attributes.forEach(attr => {
      switch (attr.id) {
        case 'WEIGHT':
          if (attr.value_name) {
            const weightMatch = attr.value_name.match(/([\d.,]+)\s*(kg|g|gramos?|kilos?)/i);
            if (weightMatch) {
              let value = parseFloat(weightMatch[1].replace(',', '.'));
              const unit = weightMatch[2].toLowerCase();
              
              // Converter para gramas
              if (unit.includes('kg') || unit.includes('kilo')) {
                value *= 1000;
              }
              weight = value;
            }
          }
          break;
          
        case 'WIDTH':
          if (attr.value_name) {
            const widthMatch = attr.value_name.match(/([\d.,]+)\s*(cm|mm|m)/i);
            if (widthMatch) {
              let value = parseFloat(widthMatch[1].replace(',', '.'));
              const unit = widthMatch[2].toLowerCase();
              
              // Converter para cm
              if (unit === 'mm') {
                value /= 10;
              } else if (unit === 'm') {
                value *= 100;
              }
              dimensions.width = value;
            }
          }
          break;
          
        case 'HEIGHT':
          if (attr.value_name) {
            const heightMatch = attr.value_name.match(/([\d.,]+)\s*(cm|mm|m)/i);
            if (heightMatch) {
              let value = parseFloat(heightMatch[1].replace(',', '.'));
              const unit = heightMatch[2].toLowerCase();
              
              // Converter para cm
              if (unit === 'mm') {
                value /= 10;
              } else if (unit === 'm') {
                value *= 100;
              }
              dimensions.height = value;
            }
          }
          break;
          
        case 'LENGTH':
          if (attr.value_name) {
            const lengthMatch = attr.value_name.match(/([\d.,]+)\s*(cm|mm|m)/i);
            if (lengthMatch) {
              let value = parseFloat(lengthMatch[1].replace(',', '.'));
              const unit = lengthMatch[2].toLowerCase();
              
              // Converter para cm
              if (unit === 'mm') {
                value /= 10;
              } else if (unit === 'm') {
                value *= 100;
              }
              dimensions.length = value;
            }
          }
          break;
      }
    });

    return { weight, dimensions: Object.keys(dimensions).length > 0 ? dimensions : null };
  }

  // Gerar hash para detectar mudanças
  generateSnapshotHash(productData, description) {
    try {
      const relevantData = {
        title: productData.title,
        price: productData.price,
        available_quantity: productData.available_quantity,
        status: productData.status,
        description: description,
        pictures: productData.pictures?.map(p => p.url).sort(),
        attributes: productData.attributes?.map(a => ({ id: a.id, value_name: a.value_name })).sort((a, b) => a.id.localeCompare(b.id))
      };
      
      const dataString = JSON.stringify(relevantData);
      return crypto.createHash('md5').update(dataString).digest('hex');
    } catch (error) {
      console.error('Erro ao gerar hash:', error);
      return null;
    }
  }

  // Configurações de sincronização
  async getSyncConfig() {
    try {
      const { rows } = await query('SELECT key, value FROM sync_config_ml');
      
      const config = {};
      rows.forEach(row => {
        config[row.key] = row.value;
      });
      
      // Valores padrão
      return {
        auto_sync_enabled: config.auto_sync_enabled || 'false',
        sync_interval_minutes: config.sync_interval_minutes || '60',
        batch_size: config.batch_size || '50',
        rate_limit_delay_ms: config.rate_limit_delay_ms || '1000',
        max_retries: config.max_retries || '3',
        webhook_enabled: config.webhook_enabled || 'false',
        ...config
      };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {
        auto_sync_enabled: 'false',
        sync_interval_minutes: '60',
        batch_size: '50',
        rate_limit_delay_ms: '1000',
        max_retries: '3',
        webhook_enabled: 'false'
      };
    }
  }

  async updateSyncConfig(key, value) {
    try {
      await query(`
        INSERT INTO sync_config_ml (key, value) 
        VALUES ($1, $2) 
        ON CONFLICT (key) DO UPDATE SET 
          value = $2, 
          updated_at = NOW()
      `, [key, value]);
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  // Utilitários
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validar dados do produto
  validateProductData(productData) {
    const errors = [];
    
    if (!productData.name || productData.name.trim() === '') {
      errors.push('Nome do produto é obrigatório');
    }
    
    if (!productData.ml_id) {
      errors.push('ML ID é obrigatório');
    }
    
    if (productData.original_price < 0) {
      errors.push('Preço não pode ser negativo');
    }
    
    if (productData.stock_quantity < 0) {
      errors.push('Quantidade em estoque não pode ser negativa');
    }
    
    return errors;
  }

  // Formatar dados para log
  formatLogData(data) {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  }

  // Verificar se uma string é um ML ID válido
  isValidMlId(mlId) {
    return /^ML[A-Z]\d+$/.test(mlId);
  }

  // Extrair informações de erro da resposta da API
  extractErrorInfo(error) {
    if (error.response?.data) {
      const data = error.response.data;
      return {
        status: error.response.status,
        message: data.message || data.error || 'Erro desconhecido',
        details: data.cause || data.details || null
      };
    }
    
    return {
      status: null,
      message: error.message || 'Erro desconhecido',
      details: null
    };
  }
}

export default MercadoLivreIntegrationService;