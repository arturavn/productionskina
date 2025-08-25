import db from '../config/database.js';
import axios from 'axios';

class MercadoLivreAccount {
  static async createOrUpdate(accountData) {
    const { userId, accessToken, refreshToken, expiresAt, scope, sellerId, nickname } = accountData;
    
    console.log('🔍 MercadoLivreAccount.createOrUpdate - Dados recebidos:', {
      userId,
      sellerId,
      nickname,
      sellerIdType: typeof sellerId
    });
    
    const result = await db.query(
      `INSERT INTO mercado_livre_accounts 
      (user_id, access_token, refresh_token, expires_at, scope, seller_id, nickname, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        access_token = $2,
        refresh_token = $3,
        expires_at = $4,
        scope = $5,
        seller_id = $6,
        nickname = $7,
        updated_at = NOW()
      RETURNING *`,
      [userId, accessToken, refreshToken, expiresAt, scope, sellerId, nickname]
    );
    
    //console.log('MercadoLivreAccount.createOrUpdate - Resultado da query:', result.rows[0]);
    /*console.log('MercadoLivreAccount.createOrUpdate - Seller ID retornado:', {
      value: result.rows[0].seller_id,
      type: typeof result.rows[0].seller_id
    });*/
    
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM mercado_livre_accounts WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async refreshToken(userId) {
    const account = await this.findByUserId(userId);
    if (!account) {
      throw new Error('Account not found');
    }

    try {
      const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.ML_APP_ID,
        client_secret: process.env.ML_APP_SECRET,
        refresh_token: account.refresh_token
      });

      return await this.createOrUpdate({
        userId,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        scope: response.data.scope,
        sellerId: account.seller_id, 
        nickname: account.nickname 
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  static async disconnect(userId) {
    await db.query(
      'DELETE FROM mercado_livre_accounts WHERE user_id = $1',
      [userId]
    );
  }

  static async findAll() {
    const result = await db.query(
      'SELECT * FROM mercado_livre_accounts ORDER BY updated_at DESC'
    );
    return result.rows;
  }
}

export default MercadoLivreAccount;
