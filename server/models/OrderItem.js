import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: [true, 'product_id é obrigatório']
  },
  order_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: [true, 'order_id é obrigatório'] 
  },
  quantity: { 
    type: Number, 
    required: [true, 'quantity é obrigatório'],
    min: [1, 'Quantidade mínima é 1']
  },
  unit_price: { 
    type: Number, 
    required: [true, 'unit_price é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  total_price: { 
    type: Number, 
    required: [true, 'total_price é obrigatório'],
    min: [0, 'Total não pode ser negativo']
  }
}, { 
  timestamps: true,
  versionKey: false
});

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
