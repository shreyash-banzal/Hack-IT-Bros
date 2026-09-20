export interface Product {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  aliases?: string[];
  description?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'confirmed' | 'pending_approval' | 'dispatched' | 'delivered' | 'cancelled' | 'rejected';
  source: 'chattify' | 'whatsapp' | 'web';
  notes?: string;
  createdAt: string;
}

export interface AgentActivity {
  type: string;
  label: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  details?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'store';
  text: string;
  timestamp: string;
  orderId?: string;
  orderData?: {
    orderId: string;
    totalAmount: number;
    items: OrderItem[];
  };
  activities?: AgentActivity[];
  rawResult?: any;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  todayOrders: number;
  todaySales: number;
  totalSales: number;
  lowStockCount: number;
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
    unit: string;
    price: number;
  }[];
  recentOrders: {
    id: string;
    orderId: string;
    customerName: string;
    itemsCount: number;
    totalAmount: number;
    status: string;
    source: string;
    createdAt: string;
  }[];
}

export interface SystemHealth {
  status: string;
  service: string;
  database: 'connected' | 'disconnected';
  databaseDetails?: {
    state: string;
    connected: boolean;
    uri?: string;
    isMemoryServer?: boolean;
  };
  groq: 'configured' | 'missing_key';
  timestamp: string;
}
