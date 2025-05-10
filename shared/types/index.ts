export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseDocument {
  email: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Cart extends BaseDocument {
  userId: string;
  items: CartItem[];
  total: number;
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED';
}

export interface Order extends BaseDocument {
  userId: string;
  items: CartItem[];
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  shippingAddress: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
}

export interface EventMessage {
  type: 'USER_CREATED' | 'USER_UPDATED' | 
        'CART_CREATED' | 'CART_UPDATED' | 'CART_CONVERTED' |
        'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_COMPLETED';
  payload: any;
  timestamp: Date;
  source: 'USER_SERVICE' | 'CART_SERVICE' | 'ORDER_SERVICE';
} 