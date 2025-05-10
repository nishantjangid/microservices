import mongoose from 'mongoose';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED';
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new mongoose.Schema<Cart>({
  userId: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    name: { type: String, required: true }
  }],
  total: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: ['ACTIVE', 'CONVERTED', 'ABANDONED'],
    default: 'ACTIVE'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const CartModel = mongoose.model<Cart>('Cart', cartSchema); 