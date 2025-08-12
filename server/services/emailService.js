import nodemailer from 'nodemailer';

// Configuração do transporter de email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Função para enviar email de reset de senha
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    
    // Usar apenas a primeira URL se houver múltiplas URLs separadas por vírgula
    const frontendUrl = process.env.FRONTEND_URL.split(',')[0].trim();
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Redefinição de Senha - Skina Ecopeças',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha - Skina Ecopeças</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; width: 100% !important; min-width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f3f4f6;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 40px 20px; text-align: center;">

                      
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        Skina Ecopeças
                      </h1>
                      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                        Autopeças de Qualidade
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Conteúdo Principal -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
                          🔐 Redefinição de Senha
                        </h2>
                        <div style="width: 60px; height: 4px; background: #10b981; margin: 0 auto; border-radius: 2px;"></div>
                      </div>
                      
                      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <p style="color: #1f2937; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                          Olá, ${userName}! 👋
                        </p>
                        
                        <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 15px;">
                          Recebemos uma solicitação para redefinir a senha da sua conta na <strong style="color: #10b981;">Skina Ecopeças</strong>. 
                          Nossa equipe está aqui para ajudar você a recuperar o acesso de forma segura e rápida.
                        </p>
                      </div>
                      
                      <!-- Botão Principal -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                  color: #ffffff; padding: 16px 32px; text-decoration: none; 
                                  border-radius: 8px; font-weight: bold; font-size: 16px;
                                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                          🚀 Redefinir Minha Senha
                        </a>
                      </div>
                      
                      <!-- Informações de Segurança -->
                      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <p style="color: #92400e; margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                          ⚠️ IMPORTANTE - SEGURANÇA
                        </p>
                        <p style="color: #b45309; margin: 0; font-size: 14px; line-height: 1.5;">
                          Este link é válido por <strong>apenas 1 hora</strong> por motivos de segurança. 
                          Se você não solicitou esta redefinição, pode ignorar este email com tranquilidade.
                        </p>
                      </div>
                      
                      <!-- Link Alternativo -->
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-align: center; font-weight: bold;">
                          Problemas com o botão? Copie e cole o link abaixo:
                        </p>
                        <div style="background-color: #ffffff; border: 2px dashed #d1d5db; border-radius: 6px; padding: 12px; word-break: break-all; text-align: center;">
                          <a href="${resetUrl}" style="color: #10b981; font-size: 13px; text-decoration: none;">
                            ${resetUrl}
                          </a>
                        </div>
                      </div>
                      
                      <!-- Suporte -->
                      <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
                          Precisa de ajuda? Nossa equipe está sempre pronta para atender!
                        </p>
                        <p style="color: #10b981; font-size: 14px; font-weight: bold; margin: 5px 0;">
                          📞 WhatsApp: (61) 99850-1771
                        </p>
                        <p style="color: #10b981; font-size: 14px; font-weight: bold; margin: 5px 0;">
                          ✉️ contato@skinaecopecas.com
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #374151; padding: 25px 30px; text-align: center;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">
                        Skina Ecopeças
                      </h3>
                      <p style="color: #d1d5db; margin: 0 0 15px 0; font-size: 14px;">
                        Autopeças de Qualidade • Preços Justos • Entrega Rápida
                      </p>
                      
                      <div style="border-top: 1px solid #6b7280; padding-top: 15px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                          © 2024 Skina Ecopeças. Todos os direitos reservados.<br>
                          Este é um email automático, não responda a esta mensagem.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Redefinição de Senha - Skina Ecopeças
        
        Olá ${userName},
        
        Recebemos uma solicitação para redefinir a senha da sua conta.
        Se você fez esta solicitação, acesse o link abaixo para criar uma nova senha:
        
        ${resetUrl}
        
        Este link é válido por apenas 1 hora por motivos de segurança.
        Se você não solicitou esta redefinição, ignore este email.
        
        Atenciosamente,
        Equipe Skina Ecopeças
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email de reset enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de reset:', error);
    return { success: false, error: error.message };
  }
};

// Função para testar a configuração de email
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Configuração de email válida');
    return true;
  } catch (error) {
    console.error('Erro na configuração de email:', error);
    return false;
  }
};

// Função para enviar email de confirmação de pedido
const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL.split(',')[0].trim();
    const orderUrl = `${frontendUrl}/orders/${orderData.id}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: orderData.customerEmail,
      subject: `Pedido Confirmado #${orderData.orderNumber} - Skina Ecopeças`,
      html: generateOrderEmailTemplate(orderData, 'confirmed', orderUrl),
      text: generateOrderEmailText(orderData, 'confirmed', orderUrl)
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email de confirmação de pedido enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de pedido:', error);
    return { success: false, error: error.message };
  }
};

// Função para enviar email de atualização de status do pedido
const sendOrderStatusUpdateEmail = async (orderData, newStatus, oldStatus) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL.split(',')[0].trim();
    const orderUrl = `${frontendUrl}/orders/${orderData.id}`;
    
    const statusMessages = {
      pending: 'Aguardando Confirmação',
      processing: 'Em Processamento',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    };
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: orderData.customerEmail,
      subject: `Atualização do Pedido #${orderData.orderNumber} - ${statusMessages[newStatus]} - Skina Ecopeças`,
      html: generateOrderEmailTemplate(orderData, newStatus, orderUrl, oldStatus),
      text: generateOrderEmailText(orderData, newStatus, orderUrl, oldStatus)
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email de atualização de status enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de atualização de status:', error);
    return { success: false, error: error.message };
  }
};

// Função para gerar template HTML do email de pedido
const generateOrderEmailTemplate = (orderData, status, orderUrl, oldStatus = null) => {
  const statusConfig = {
    pending: {
      title: '⏳ Pedido Recebido',
      message: 'Obrigado por comprar conosco! Seu pedido foi recebido e estamos aguardando a confirmação do pagamento.',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fbbf24'
    },
    processing: {
      title: '🔄 Pedido Confirmado',
      message: 'Ótima notícia! Seu pagamento foi confirmado e seu pedido está sendo processado.',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      borderColor: '#60a5fa'
    },
    shipped: {
      title: '🚚 Pedido Enviado',
      message: 'Seu pedido foi enviado! Você pode acompanhar o status da entrega usando o código de rastreio fornecido abaixo.',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      borderColor: '#a78bfa'
    },
    delivered: {
      title: '✅ Pedido Entregue',
      message: 'Seu pedido foi entregue com sucesso! Esperamos que esteja satisfeito com sua compra.',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7'
    },
    cancelled: {
      title: '❌ Pedido Cancelado',
      message: 'Houve alguma falha no pagamento ou confirmação de dados. Caso tenha alguma dúvida, por favor entre em contato.',
      color: '#ef4444',
      bgColor: '#fee2e2',
      borderColor: '#fca5a5'
    },
    refunded: {
      title: '💰 Pedido Reembolsado',
      message: 'O reembolso do seu pedido foi processado. O valor será creditado em sua conta em até 5 dias úteis.',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const itemsHtml = orderData.items?.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.product_name || item.productName || item.name || 'Produto'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">R$ ${(item.total_price || (item.unit_price * item.quantity) || (item.price * item.quantity) || 0).toFixed(2)}</td>
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title} - Skina Ecopeças</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; width: 100% !important; min-width: 100%;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    Skina Ecopeças
                  </h1>
                  <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Autopeças de Qualidade
                  </p>
                </td>
              </tr>
              
              <!-- Conteúdo Principal -->
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
                      ${config.title}
                    </h2>
                    <div style="width: 60px; height: 4px; background: ${config.color}; margin: 0 auto; border-radius: 2px;"></div>
                  </div>
                  
                  <div style="background-color: ${config.bgColor}; border: 1px solid ${config.borderColor}; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <p style="color: #1f2937; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                      Olá, ${orderData.customerName}! 👋
                    </p>
                    
                    <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 15px;">
                      ${config.message}
                    </p>
                  </div>
                  
                  <!-- Detalhes do Pedido -->
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📋 Detalhes do Pedido</h3>
                    
                    <div style="margin-bottom: 15px;">
                      <p style="color: #6b7280; margin: 0; font-size: 14px;"><strong>Número do Pedido:</strong> #${orderData.orderNumber}</p>
                      <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Data:</strong> ${new Date(orderData.createdAt).toLocaleDateString('pt-BR')}</p>
                      <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Status:</strong> ${config.title}</p>
                      ${orderData.trackingCode && status === 'shipped' ? `<p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Código de Rastreio:</strong> <span style="color: #10b981; font-weight: bold;">${orderData.trackingCode}</span></p>` : ''}
                    </div>
                    
                    ${itemsHtml ? `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                      <thead>
                        <tr style="background-color: #e5e7eb;">
                          <th style="padding: 12px; text-align: left; color: #374151; font-weight: bold;">Produto</th>
                          <th style="padding: 12px; text-align: center; color: #374151; font-weight: bold;">Qtd</th>
                          <th style="padding: 12px; text-align: right; color: #374151; font-weight: bold;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: right;">
                      <p style="color: #1f2937; margin: 0; font-size: 16px; font-weight: bold;">Total: R$ ${orderData.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    ` : ''}
                  </div>
                  
                  <!-- Botão de Ação -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${orderUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                              color: #ffffff; padding: 16px 32px; text-decoration: none; 
                              border-radius: 8px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      🔍 Ver Detalhes do Pedido
                    </a>
                  </div>
                  
                  <!-- Suporte -->
                  <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
                      Precisa de ajuda? Nossa equipe está sempre pronta para atender!
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin: 5px 0;">
                      📞 WhatsApp: (61) 99850-1771
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin: 5px 0;">
                      ✉️ contato@skinaecopecas.com
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #374151; padding: 25px 30px; text-align: center;">
                  <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">
                    Skina Ecopeças
                  </h3>
                  <p style="color: #d1d5db; margin: 0 0 15px 0; font-size: 14px;">
                    Autopeças de Qualidade • Preços Justos • Entrega Rápida
                  </p>
                  
                  <div style="border-top: 1px solid #6b7280; padding-top: 15px;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                      © 2024 Skina Ecopeças. Todos os direitos reservados.<br>
                      Este é um email automático, não responda a esta mensagem.
                    </p>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Função para gerar texto simples do email de pedido
const generateOrderEmailText = (orderData, status, orderUrl, oldStatus = null) => {
  const statusMessages = {
    pending: 'Pedido Recebido - Aguardando Confirmação',
    processing: 'Pedido Confirmado - Em Processamento',
    shipped: 'Pedido Enviado',
    delivered: 'Pedido Entregue',
    cancelled: 'Pedido Cancelado',
    refunded: 'Pedido Reembolsado'
  };

  const statusDescriptions = {
    pending: 'Obrigado por comprar conosco! Seu pedido foi recebido e estamos aguardando a confirmação do pagamento.',
    processing: 'Ótima notícia! Seu pagamento foi confirmado e seu pedido está sendo processado.',
    shipped: 'Seu pedido foi enviado! Você pode acompanhar o status da entrega usando o código de rastreio fornecido.',
    delivered: 'Seu pedido foi entregue com sucesso! Esperamos que esteja satisfeito com sua compra.',
    cancelled: 'Houve alguma falha no pagamento ou confirmação de dados. Caso tenha alguma dúvida, por favor entre em contato.',
    refunded: 'O reembolso do seu pedido foi processado. O valor será creditado em sua conta em até 5 dias úteis.'
  };

  return `
    ${statusMessages[status]} - Skina Ecopeças
    
    Olá ${orderData.customerName},
    
    ${statusDescriptions[status]}
    
    Detalhes do Pedido:
    - Número: #${orderData.orderNumber}
    - Data: ${new Date(orderData.createdAt).toLocaleDateString('pt-BR')}
    - Status: ${statusMessages[status]}
    ${orderData.trackingCode && status === 'shipped' ? `- Código de Rastreio: ${orderData.trackingCode}` : ''}
    - Total: R$ ${orderData.total?.toFixed(2) || '0.00'}
    
    Para ver mais detalhes do seu pedido, acesse:
    ${orderUrl}
    
    Precisa de ajuda?
    WhatsApp: (61) 99850-1771
    Email: contato@skinaecopecas.com
    
    Atenciosamente,
    Equipe Skina Ecopeças
  `;
};

// Função para enviar notificação de novo pedido para a gestão
const sendNewOrderNotificationToManagement = async (orderData) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL.split(',')[0].trim();
    const adminOrderUrl = `${frontendUrl}/admin/orders/${orderData.id}`;
    
    const itemsHtml = orderData.items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.product_name || item.productName || item.name || 'Produto'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">R$ ${(item.total_price || (item.unit_price * item.quantity) || (item.price * item.quantity) || 0).toFixed(2)}</td>
      </tr>
    `).join('') || '';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'Skinapecasusadas@gmail.com',
      subject: `🚨 VOCEEE VENDEUUUU #${orderData.orderNumber} - Skina Ecopeças`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Novo Pedido - Skina Ecopeças</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; width: 100% !important; min-width: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f3f4f6;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        🚨 NOVO PEDIDO
                      </h1>
                      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                        Skina Ecopeças - Gestão
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Conteúdo Principal -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
                          📋 Houve um pedido na sua loja
                        </h2>
                        <div style="width: 60px; height: 4px; background: #dc2626; margin: 0 auto; border-radius: 2px;"></div>
                      </div>
                      
                      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <p style="color: #1f2937; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                          ⚠️ ATENÇÃO GESTÃO! 📢
                        </p>
                        
                        <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 15px;">
                          Um novo pedido foi recebido na loja online. Verifique no painel administrativo para processar o pedido.
                        </p>
                      </div>
                      
                      <!-- Detalhes do Pedido -->
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📋 Detalhes do Pedido</h3>
                        
                        <div style="margin-bottom: 15px;">
                          <p style="color: #6b7280; margin: 0; font-size: 14px;"><strong>Número do Pedido:</strong> #${orderData.orderNumber}</p>
                          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Data:</strong> ${new Date(orderData.createdAt).toLocaleDateString('pt-BR')} às ${new Date(orderData.createdAt).toLocaleTimeString('pt-BR')}</p>
                          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Cliente:</strong> ${orderData.customerName}</p>
                          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Email:</strong> ${orderData.customerEmail}</p>
                          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;"><strong>Status:</strong> Aguardando Processamento</p>
                        </div>
                        
                        ${itemsHtml ? `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                          <thead>
                            <tr style="background-color: #e5e7eb;">
                              <th style="padding: 12px; text-align: left; color: #374151; font-weight: bold;">Produto</th>
                              <th style="padding: 12px; text-align: center; color: #374151; font-weight: bold;">Qtd</th>
                              <th style="padding: 12px; text-align: right; color: #374151; font-weight: bold;">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                        </table>
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: right;">
                          <p style="color: #1f2937; margin: 0; font-size: 18px; font-weight: bold;">💰 Total: R$ ${orderData.total?.toFixed(2) || '0.00'}</p>
                        </div>
                        ` : ''}
                      </div>
                      
                      <!-- Botão de Ação -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${adminOrderUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                                  color: #ffffff; padding: 16px 32px; text-decoration: none; 
                                  border-radius: 8px; font-weight: bold; font-size: 16px;
                                  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                          🔧 Acessar Painel Administrativo
                        </a>
                      </div>
                      
                      <!-- Informações Importantes -->
                      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <p style="color: #92400e; margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                          ⚡ AÇÃO NECESSÁRIA
                        </p>
                        <p style="color: #b45309; margin: 0; font-size: 14px; line-height: 1.5;">
                          Este pedido precisa ser processado o mais rápido possível. Acesse o painel administrativo para:
                          <br>• Verificar o pagamento
                          <br>• Confirmar o estoque
                          <br>• Processar o envio
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #374151; padding: 25px 30px; text-align: center;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">
                        Skina Ecopeças - Gestão
                      </h3>
                      <p style="color: #d1d5db; margin: 0 0 15px 0; font-size: 14px;">
                        Sistema de Notificação de Pedidos
                      </p>
                      
                      <div style="border-top: 1px solid #6b7280; padding-top: 15px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                          © 2024 Skina Ecopeças. Todos os direitos reservados.<br>
                          Este é um email automático de notificação para a gestão.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        NOVO PEDIDO RECEBIDO - Skina Ecopeças
        
        ATENÇÃO GESTÃO!
        
        Houve um pedido na sua loja. Verifique no painel administrativo.
        
        Detalhes do Pedido:
        - Número: #${orderData.orderNumber}
        - Data: ${new Date(orderData.createdAt).toLocaleDateString('pt-BR')} às ${new Date(orderData.createdAt).toLocaleTimeString('pt-BR')}
        - Cliente: ${orderData.customerName}
        - Email: ${orderData.customerEmail}
        - Total: R$ ${orderData.total?.toFixed(2) || '0.00'}
        
        Acesse o painel administrativo para processar este pedido:
        ${adminOrderUrl}
        
        AÇÃO NECESSÁRIA:
        • Verificar o pagamento
        • Confirmar o estoque
        • Processar o envio
        
        Sistema de Notificação - Skina Ecopeças
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email de notificação para gestão enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de notificação para gestão:', error);
    return { success: false, error: error.message };
  }
};

// Função para enviar email de cupom de desconto
const sendCouponEmail = async (email, userName, couponCode, discountPercentage, expiresAt) => {
  try {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.FRONTEND_URL.split(',')[0].trim();
    const shopUrl = `${frontendUrl}/products`;
    
    const expirationDate = new Date(expiresAt).toLocaleDateString('pt-BR');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🎉 Você ganhou ${discountPercentage}% de desconto! - Skina Ecopeças`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cupom de Desconto - Skina Ecopeças</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; width: 100% !important; min-width: 100%;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f3f4f6;">
            <tr>
              <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        🎉 PARABÉNS!
                      </h1>
                      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                        Você ganhou um cupom de desconto!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Conteúdo Principal -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: bold;">
                          Olá, ${userName}!
                        </h2>
                        <div style="width: 60px; height: 4px; background: #f59e0b; margin: 0 auto; border-radius: 2px;"></div>
                      </div>
                      
                      <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin-bottom: 25px; text-align: center;">
                        <p style="color: #92400e; line-height: 1.6; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
                          🎁 Você ganhou ${discountPercentage}% de desconto!
                        </p>
                        
                        <div style="background-color: #ffffff; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                          <p style="color: #374151; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">SEU CÓDIGO DE CUPOM:</p>
                          <p style="color: #1f2937; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                            ${couponCode}
                          </p>
                        </div>
                        
                        <p style="color: #b45309; margin: 0; font-size: 14px; line-height: 1.5;">
                          ⏰ Válido até: <strong>${expirationDate}</strong><br>
                          💡 Use no checkout da sua próxima compra!
                        </p>
                      </div>
                      
                      <!-- Como usar -->
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
                        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📋 Como usar seu cupom:</h3>
                        
                        <div style="margin-bottom: 15px;">
                          <p style="color: #374151; margin: 0 0 8px 0; font-size: 15px;"><strong>1.</strong> Adicione produtos ao seu carrinho</p>
                          <p style="color: #374151; margin: 0 0 8px 0; font-size: 15px;"><strong>2.</strong> Vá para o checkout</p>
                          <p style="color: #374151; margin: 0 0 8px 0; font-size: 15px;"><strong>3.</strong> Digite o código <strong>${couponCode}</strong> no campo "Cupom de Desconto"</p>
                          <p style="color: #374151; margin: 0; font-size: 15px;"><strong>4.</strong> Aproveite ${discountPercentage}% de desconto no seu pedido!</p>
                        </div>
                      </div>
                      
                      <!-- Botão de Ação -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${shopUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                                  color: #ffffff; padding: 16px 32px; text-decoration: none; 
                                  border-radius: 8px; font-weight: bold; font-size: 16px;
                                  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                          🛒 Comprar Agora
                        </a>
                      </div>
                      
                      <!-- Informações Importantes -->
                      <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <p style="color: #1e40af; margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">
                          ℹ️ INFORMAÇÕES IMPORTANTES
                        </p>
                        <p style="color: #1d4ed8; margin: 0; font-size: 14px; line-height: 1.5;">
                          • Este cupom é pessoal e intransferível<br>
                          • Válido apenas para uma compra<br>
                          • Não pode ser combinado com outras promoções<br>
                          • Válido até ${expirationDate}
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #374151; padding: 25px 30px; text-align: center;">
                      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">
                        Skina Ecopeças
                      </h3>
                      <p style="color: #d1d5db; margin: 0 0 15px 0; font-size: 14px;">
                        Peças automotivas de qualidade
                      </p>
                      
                      <div style="border-top: 1px solid #6b7280; padding-top: 15px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                          © 2024 Skina Ecopeças. Todos os direitos reservados.<br>
                          Este é um email automático. Não responda a esta mensagem.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        PARABÉNS! Você ganhou um cupom de desconto - Skina Ecopeças
        
        Olá, ${userName}!
        
        Você ganhou ${discountPercentage}% de desconto na Skina Ecopeças!
        
        SEU CÓDIGO DE CUPOM: ${couponCode}
        
        Como usar:
        1. Adicione produtos ao seu carrinho
        2. Vá para o checkout
        3. Digite o código ${couponCode} no campo "Cupom de Desconto"
        4. Aproveite ${discountPercentage}% de desconto no seu pedido!
        
        Válido até: ${expirationDate}
        
        Acesse nossa loja: ${shopUrl}
        
        INFORMAÇÕES IMPORTANTES:
        • Este cupom é pessoal e intransferível
        • Válido apenas para uma compra
        • Não pode ser combinado com outras promoções
        
        Atenciosamente,
        Equipe Skina Ecopeças
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email de cupom enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erro ao enviar email de cupom:', error);
    return { success: false, error: error.message };
  }
};

export {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendNewOrderNotificationToManagement,
  sendCouponEmail,
  testEmailConfiguration
};