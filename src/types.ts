export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  contactLink?: string;
  category?: string;
  telegramPostId?: number;
  telegramChannel?: string;
  createdAt: string;
  updatedAt: string;
  stockCount?: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerName: string;
  contactInfo: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TelegramSettings {
  botToken: string;
  channelId: string;
  chatId: string;
  webhookUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  rating: number; // 1-5
  comment: string;
  userName: string;
  createdAt: string; // ISO string
}

