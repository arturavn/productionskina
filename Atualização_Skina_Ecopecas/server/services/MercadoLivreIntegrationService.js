import axios from 'axios';
import { query, transaction } from '../config/database.js';
import crypto from 'crypto';

class MercadoLivreIntegrationService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    // Valores padrão (serão sobrescritos pelas configurações)
    this.rateLimitDelay = 750; // ms entre requisições (padrão mais seguro)
    this.maxConcurrentRequests = 4; 
    this.retryAttempts = 3;
    this.retryDelay = 800; 
    
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const config = await this.getSyncConfig();
      
      
      if (config.rate_limit_delay_ms) {
        this.rateLimitDelay = parseInt(config.rate_limit_delay_ms);
      }
      if (config.max_concurrent_requests) {
        this.maxConcurrentRequests = parseInt(config.max_concurrent_requests);
      }
      if (config.retry_attempts) {
        this.retryAttempts = parseInt(config.retry_attempts);
      }
      
      console.log('Configurações carregadas:', {
        rateLimitDelay: this.rateLimitDelay,
        maxConcurrentRequests: this.maxConcurrentRequests,
        retryAttempts: this.retryAttempts
      });
      
    } catch (error) {
      //console.warn('Erro ao carregar configurações, usando valores padrão:', error.message);
    }
  }

  // Aplicar configurações em tempo real
  async applyConfig() {
    await this.loadConfig();
  }

  // Cliente API com rate limiting e retry
  async makeRequest(endpoint, accessToken, options = {}) {
    const { retries = this.retryAttempts, delay = this.retryDelay } = options;
    
    // Rate limiting ANTES de cada requisição
    await this.sleep(this.rateLimitDelay);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.apiClient.get(endpoint, {
          params: { access_token: accessToken },
          ...options
        });
        
        return response.data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff com jitter
        const backoffDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⚠️ Tentativa ${attempt} falhou, aguardando ${backoffDelay}ms antes de retry...`);
        await this.sleep(backoffDelay);
      }
    }
  }

  // converte dados do ML para formato local
  mapMercadoLivreToLocal(mlProduct, description = '') {
    const mapped = {};
    
    mapped.name = mlProduct.title || `Produto ML ${mlProduct.id}`;
    mapped.description = description || mlProduct.description || `Produto importado do Mercado Livre (ID: ${mlProduct.id})`;
    mapped.ml_id = mlProduct.id;
    mapped.ml_seller_id = mlProduct.seller_id;
    
   
    if (mlProduct.price) {
      mapped.original_price = parseFloat(mlProduct.price);
      mapped.discount_price = parseFloat(mlProduct.price);
    }
    
   
    if (mlProduct.available_quantity !== undefined) {
      mapped.stock_quantity = parseInt(mlProduct.available_quantity) || 0;
    }
  
    if (mlProduct.pictures && mlProduct.pictures.length > 0) {
      const firstPicture = mlProduct.pictures[0];
      mapped.image_url = firstPicture.url || firstPicture.secure_url;
    }
    
    
    if (mlProduct.attributes && Array.isArray(mlProduct.attributes)) {
      const specs = {};
      let brand = null;
      
      mlProduct.attributes.forEach((attr, index) => {
        if (attr.name && attr.value_name) {
          // Detectar brand APENAS do atributo "Marca"
          const attrName = attr.name.toLowerCase();
          const attrId = attr.id?.toLowerCase() || '';
          
          if (attrName === 'marca' || attrId === 'brand') {
            
            brand = attr.value_name;
            
            
            specs[attr.name] = attr.value_name;
          } else {
            
            specs[attr.name] = attr.value_name;
          }
        }
      });
      
      mapped.specifications = JSON.stringify(specs);
      if (brand) {
        mapped.brand = brand;
      }
    }
    
    
    if (mlProduct.parent_item_id) {
      mapped.ml_family_id = mlProduct.parent_item_id;
    } else if (mlProduct.family_id) {
      mapped.ml_family_id = mlProduct.family_id;
    } else if (mlProduct.category_id) {
      mapped.ml_family_id = mlProduct.category_id;
    }
    
    
    const weightData = this.extractWeightAndDimensions(mlProduct.attributes || []);
    mapped.weight = weightData.weight;
    mapped.width_cm = weightData.width_cm;
    mapped.height_cm = weightData.height_cm;
    mapped.length_cm = weightData.length_cm;
    mapped.weight_kg = weightData.weight_kg;
    
   
    mapped.dimensions = this.extractDimensions(mlProduct);
    
    return mapped;
  }


  extractWeightAndDimensions(attributes) {
    const result = {
      weight: null,
      width_cm: null,
      height_cm: null,
      length_cm: null,
      weight_kg: null
    };

    if (!Array.isArray(attributes)) return result;

    attributes.forEach(attr => {
      if (!attr.name || !attr.value_name) return;

      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value_name.toLowerCase();

      // Peso
      if (attrName.includes('peso') || attrName.includes('weight')) {
        const weightMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas?|quilos?)/i);
        if (weightMatch) {
          const value = parseFloat(weightMatch[1].replace(',', '.'));
          const unit = weightMatch[2].toLowerCase();
          
          if (unit === 'kg' || unit === 'quilos' || unit === 'quilo') {
            result.weight_kg = value;
            result.weight = value * 1000; // Converter para gramas
          } else if (unit === 'g' || unit === 'gr' || unit === 'gramas' || unit === 'grama') {
            result.weight = value;
            result.weight_kg = value / 1000; // Converter para kg
          }
        }
      }

      
      if (attrName.includes('largura') || attrName.includes('width')) {
        const widthMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (widthMatch) {
          const value = parseFloat(widthMatch[1].replace(',', '.'));
          const unit = widthMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.width_cm = value;
          } else if (unit === 'mm') {
            result.width_cm = value / 10;
          } else if (unit === 'm') {
            result.width_cm = value * 100;
          }
        }
      }

      if (attrName.includes('altura') || attrName.includes('height')) {
        const heightMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (heightMatch) {
          const value = parseFloat(heightMatch[1].replace(',', '.'));
          const unit = heightMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.height_cm = value;
          } else if (unit === 'mm') {
            result.height_cm = value / 10;
          } else if (unit === 'm') {
            result.height_cm = value * 100;
          }
        }
      }

      if (attrName.includes('comprimento') || attrName.includes('length') || attrName.includes('profundidade')) {
        const lengthMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (lengthMatch) {
          const value = parseFloat(lengthMatch[1].replace(',', '.'));
          const unit = lengthMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.length_cm = value;
          } else if (unit === 'mm') {
            result.length_cm = value / 10;
          } else if (unit === 'm') {
            result.length_cm = value * 100;
          }
        }
      }
    });

    return result;
  }

  
  extractDimensions(mlProduct) {
    const dimensions = {};
    
    // Tentar shippingdimensions
    if (mlProduct.shipping && mlProduct.shipping.dimensions) {
      dimensions.source = 'shipping.dimensions';
      dimensions.data = mlProduct.shipping.dimensions;
    }
    
    else if (mlProduct.package) {
      dimensions.source = 'package';
      dimensions.data = mlProduct.package;
    }
   
    else if (mlProduct.attributes) {
      const dimAttrs = mlProduct.attributes.filter(attr => 
        ['WEIGHT', 'DIMENSIONS', 'LENGTH', 'WIDTH', 'HEIGHT'].includes(attr.id) ||
        ['Peso', 'Dimensões', 'Comprimento', 'Largura', 'Altura'].includes(attr.name)
      );
      
      if (dimAttrs.length > 0) {
        dimensions.source = 'attributes';
        dimensions.data = dimAttrs;
      }
    }
    
    return dimensions;
  }

  
  normalizeDimensions(dimensions) {
    let width = null, height = null, length = null, weight = null;
    
    if (!dimensions.data) return { width, height, length, weight };
    
    try {
      if (dimensions.source === 'shipping.dimensions') {
        const dims = dimensions.data;
        
        // Converter de mm para cm se necessário
        width = dims.width ? this.convertToCm(dims.width, dims.unit || 'mm') : null;
        height = dims.height ? this.convertToCm(dims.height, dims.unit || 'mm') : null;
        length = dims.length ? this.convertToCm(dims.length, dims.unit || 'mm') : null;
        
        if (dims.weight) {
          weight = this.convertToKg(dims.weight, dims.weight_unit || 'g');
        }
      }
      else if (dimensions.source === 'package') {
        const pkg = dimensions.data;
        
        if (pkg.dimensions) {
          width = pkg.dimensions.width ? this.convertToCm(pkg.dimensions.width, pkg.dimensions.unit || 'mm') : null;
          height = pkg.dimensions.height ? this.convertToCm(pkg.dimensions.height, pkg.dimensions.unit || 'mm') : null;
          length = pkg.dimensions.length ? this.convertToCm(pkg.dimensions.length, pkg.dimensions.unit || 'mm') : null;
        }
        
        if (pkg.weight) {
          weight = this.convertToKg(pkg.weight, pkg.weight_unit || 'g');
        }
      }
      else if (dimensions.source === 'attributes') {
        dimensions.data.forEach(attr => {
          const value = parseFloat(attr.value_name);
          if (isNaN(value)) return;
          
          if (attr.id === 'WEIGHT' || attr.name === 'Peso') {
            weight = this.convertToKg(value, attr.value_unit || 'g');
          } else if (attr.id === 'LENGTH' || attr.name === 'Comprimento') {
            length = this.convertToCm(value, attr.value_unit || 'mm');
          } else if (attr.id === 'WIDTH' || attr.name === 'Largura') {
            width = this.convertToCm(value, attr.value_unit || 'mm');
          } else if (attr.id === 'HEIGHT' || attr.name === 'Altura') {
            height = this.convertToCm(value, attr.value_unit || 'mm');
          }
        });
      }
    } catch (error) {
      console.error('Erro ao normalizar dimensões:', error);
    }
    
    return { width, height, length, weight };
  }

  // Converter para centímetros
  convertToCm(value, unit) {
    if (!value || isNaN(value)) return null;
    
    switch (unit?.toLowerCase()) {
      case 'mm':
      case 'millimeters':
        return value / 10;
      case 'm':
      case 'meters':
        return value * 100;
      case 'cm':
      case 'centimeters':
      default:
        return value;
    }
  }

  // Converter para quilogramas
  convertToKg(value, unit) {
    if (!value || isNaN(value)) return null;
    
    switch (unit?.toLowerCase()) {
      case 'g':
      case 'grams':
        return value / 1000;
      case 'lb':
      case 'pounds':
        return value * 0.453592;
      case 'oz':
      case 'ounces':
        return value * 0.0283495;
      case 'kg':
      case 'kilograms':
      default:
        return value;
    }
  }

  // Gerar hash dos dados para detectar mudanças
  generateSnapshotHash(mlProduct, description = '') {
    const relevantData = {
      title: mlProduct.title || '',
      price: mlProduct.price || '',
      available_quantity: mlProduct.available_quantity || '',
      condition: mlProduct.condition || '',
      status: mlProduct.status || '',
      description: description || '',
      pictures: mlProduct.pictures ? mlProduct.pictures.map(p => p.url || p.secure_url).join('') : '',
      attributes: mlProduct.attributes ? JSON.stringify(mlProduct.attributes) : ''
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(relevantData)).digest('hex');
  }

  // Buscar produto do ML com descrição
  async fetchProductWithDescription(mlId, accessToken) {
    try {
      // Buscar dados básicos do produto
      const productData = await this.makeRequest(`/items/${mlId}`, accessToken);
      
      // Buscar descrição separadamente
      let description = '';
      try {
        const descriptionData = await this.makeRequest(`/items/${mlId}/description`, accessToken);
        description = descriptionData.plain_text || descriptionData.text || descriptionData.content || '';
      } catch (descError) {
        console.warn(`Erro ao buscar descrição do produto ${mlId}:`, descError.message);
      }
      
      return { productData, description };
    } catch (error) {
      throw new Error(`Erro ao buscar produto ${mlId}: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obter configurações de sincronização
  async getSyncConfig() {
    try {
      const { rows } = await query('SELECT key, value FROM ml_sync_config');
      const config = {};
      
      rows.forEach(row => {
        config[row.key] = row.value;
      });
      
      return config;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {};
    }
  }

  // Atualizar configuração
  async updateSyncConfig(key, value) {
    try {
      await query(
        'UPDATE ml_sync_config SET value = $1, updated_at = NOW() WHERE key = $2',
        [value, key]
      );
      return true;
    } catch (error) {
      //console.error('Erro ao atualizar configuração:', error);
      return false;
    }
  }
}

export default MercadoLivreIntegrationService;
