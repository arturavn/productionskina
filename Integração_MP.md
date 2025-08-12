


## Arquitetura da Integração

### Estrutura de Arquivos

```
server/
├── services/
│   └── MercadoPagoService.js
├── routes/
│   ├── orders.js
│   └── webhooks.js
│   
├── models/
│   ├── Order.js
│   └── WebhookEvent.js
└── migrations/
    └── 007_Integracao_MP.sql
        008_webhook_events.sql 

frontend/
├── pages/
│   ├── Checkout.tsx
│   ├── PaymentSuccess.tsx
│   ├── PaymentFailure.tsx
│   └── CheckoutPending.tsx
└── services/
    └── api.ts
```

---

## Fluxo de Pagamento

### 1. Criação do Pedido
```
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant MP as Mercado Pago

    U->>F: Preenche checkout
    F->>B: POST /api/orders
    B->>B: Valida dados
    B->>B: Cria pedido no Bnco de dados
    B->>MP: createPreference()
    MP->>B: Retorna payment_url
    B->>F: Retorna payment_url
    F->>MP: Redireciona para pagamento
```

### 2. Processamento do Webhook
```
    participant MP as Mercado Pago
    participant B as Backend
    participant BD as Banco de Dados

    MP->>B: POST /api/webhooks/mercado_pago/:token
    B->>B: Valida token secreto
    B->>MP: GET /v1/payments/:id
    MP->>B: Retorna dados do pagamento
    B->>B: Atualiza status do pedido
    B->>BD: Salva dados do pagamento
    B->>B: Log do evento
    B->>MP: 200 OK
```

---

## Segurança Implementada

### 1. Autenticação e Autorização

#### Middleware de Autenticação
```javascript
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token de autenticação necessário' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};
```

#### Verificação de Propriedade
```javascript
if (order.userId !== req.user.userId && req.user.role !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Você não tem permissão para acessar este pedido'
  });
}
```

### 2. Proteção de Webhooks

#### Token Secreto na URL
```javascript
router.post('/mercado_pago/:token', async (req, res) => {
  const urlToken = req.params.token;
  const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;
  if (urlToken !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
});
```

#### Rate Limiting
```javascript
const checkRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 20;
};
```

---

## Rotas e Endpoints

### Rotas Públicas
- `POST /api/orders`: Criação de pedido
- `POST /api/webhooks/mercado_pago/:token`: Notificações do Mercado Pago

### Rotas Protegidas
- `GET /api/orders/external/:reference`: Detalhes do pedido
- `GET /api/orders/:externalReference/payment-url`: Retomar pagamento
- `GET /api/payments/:paymentId`: Status e detalhes

### Rotas Administrativas
- Logs de eventos:
  - `/api/mercado_pago/events`
  - `/api/mercado_pago/events/:id`
  - `/api/mercado_pago/events/external/:reference`
  - `/api/mercado_pago/events/payment/:paymentId`

---

## Proteção das Páginas de Retorno

### PaymentSuccess.tsx
- Verifica autenticação
- Busca dados do pedido
- Verifica permissões

### PaymentFailure.tsx e CheckoutPending.tsx
- Mesmo fluxo de proteção
- Redireciona se não autenticado

---

## Configuração do Mercado Pago

### Variáveis de Ambiente
```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADO_PAGO_ENVIRONMENT=PRODUCTION
WEBHOOK_SECRET_TOKEN=XXXXXXX
```

### Configuração da Preferência
```javascript
const preference = {
  items: items,
  payer: {
    name: orderData.customerName,
    email: orderData.customerEmail,
    phone: { number: orderData.customerPhone },
    ...(orderData.cpf ? { identification: { type: 'CPF', number: orderData.cpf } } : {})
  },
  statement_descriptor: "SKINA ECOPECAS",
  payment_methods: {
    excluded_payment_types: [{ id: 'atm' }],
    installments: 12,
    default_installments: 1
  },
  external_reference: orderData.orderId.toString(),
  notification_url: `${BASE_URL}/api/mercado_pago/${WEBHOOK_SECRET_TOKEN}`,
  back_urls: {
    success: `${FRONTEND_URL}/payment-success`,
    pending: `${FRONTEND_URL}/payment-pending`,
    failure: `${FRONTEND_URL}/payment-failure`
  },
  expires: true,
  expiration_date_from: currentDate.toISOString(),
  expiration_date_to: expirationDate.toISOString(),
  binary_mode: false
};
```

---

## Campos Atualizados via Webhook

### Tabela `orders`
```sql
mercado_pago_payment_method
mercado_pago_payment_id
payment_details
mercado_pago_approved_at
mercado_pago_status
payment_status
```

### Mapeamento de Status
```javascript
switch (paymentDetails.status) {
  case 'approved':
    orderStatus = 'processing';
    paymentStatus = 'paid';
    break;
  case 'rejected':
  case 'cancelled':
    orderStatus = 'cancelled';
    paymentStatus = 'failed';
    break;
  case 'refunded':
    orderStatus = 'refunded';
    paymentStatus = 'refunded';
    break;
  case 'pending':
    orderStatus = 'pending';
    paymentStatus = 'pending';
    break;
  case 'in_process':
    orderStatus = 'processing';
    paymentStatus = 'processing';
    break;
}
```

---

## Métricas Importantes
- Tempo de processamento de webhooks
- Taxa de sucesso/falha de webhooks
- Tempo de resposta da API do Mercado Pago
- Número de pedidos por status
- Volume de transações

---

## Fluxo de Recuperação

### Pedidos Pendentes
```javascript
const checkPendingOrders = async () => {
  const pendingOrders = await Order.findByStatus('pending');
  for (const order of pendingOrders) {
    if (order.mercadoPagoPaymentId) {
      const paymentStatus = await mercadoPagoService.verifyPayment(order.mercadoPagoPaymentId);
      if (paymentStatus.success && paymentStatus.payment.status !== 'pending') {
        await processPaymentUpdate(order.mercadoPagoPaymentId);
      }
    }
  }
};
```

### Webhooks Perdidos
```javascript
const checkWebhookProcessing = async (paymentId) => {
  const webhookEvent = await WebhookEvent.findByPaymentId(paymentId);
  if (!webhookEvent) {
    const paymentStatus = await mercadoPagoService.verifyPayment(paymentId);
    if (paymentStatus.success) {
      await processPaymentUpdate(paymentId);
    }
  }
};
```

---

## Checklist de Segurança

### Implementado
- [x] Autenticação JWT
- [x] Verificação de propriedade
- [x] Token de webhook
- [x] Rate limiting
- [x] Validação e sanitização
- [x] Logs de auditoria
- [x] Rollback
- [x] CSRF protection
- [x] Helmet

### Em Monitoramento
- Análise de logs suspeitos
- Tentativas de acesso não autorizado
- Verificação de integridade

---


---

## Observações Gerais

1. Ao criar uma preferência de pagamento e ocorrer erro no pagamento, verifique se os `back_urls` não estão sendo enviados como `localhost`. Utilize a URL real do site. Para testes locais, use ferramentas como Ngrok e configure no `.env`.

2. O link da tela de checkout possui tempo de expiração definido para 12 horas por padrão. Isso pode ser ajustado no arquivo `MercadoPagoService.js`:
```javascript
const currentDate = new Date();
const expirationDate = new Date(currentDate.getTime() + (12 * 60 * 60 * 1000)); // 12 horas
```

3. Definição de `binary_mode`:

- `binary_mode: false`: Pagamento pode ficar em status `in_process`, `pending`, `authorized`, `approved` ou `rejected`. Útil para vendas com risco médio ou alto volume. Pode aumentar conversões, mas com mais risco de fraudes.

- `binary_mode: true`: Ativa o modo binário. O pagamento será `approved` ou `rejected` imediatamente. Não permite status intermediários. Mais rigoroso, indicado para decisões instantâneas de aprovação.

### Status possíveis
- `approved`
- `rejected`
- `in_process`
- `pending`
- `authorized`
