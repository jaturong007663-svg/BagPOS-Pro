export interface Variant {
  id: string;
  color: string;
  size?: string;
  stock: number;
  imageUrl?: string;
}

export interface Bag {
  id: string;
  name: string;
  price: number;
  cost: number;
  basePrice: number;
  shippingFee: number;
  shippingId: string;
  storeId: string;
  image: string;
  images: string[];
  productUrl?: string;
  productUrl2?: string;
  category?: string;
  variants: Variant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size?: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Transaction {
  id: string;
  date: string;
  marketId: string;
  items: CartItem[];
  total: number;
  discount?: number;
}

export interface Claim {
  id: string;
  date: string;
  productId: string;
  reason: string;
  image: string;
  status: string;
}

export interface Expense {
  id: string;
  date: string;
  rent: number;
  utilities: number;
  wages: number;
  other: number;
  note: string;
}

export interface Shipping {
  id: string;
  name: string;
  avgDays: number;
  damageRate: string;
  costPerKg: number;
}

export interface ChinaStore {
  id: string;
  name: string;
  rating: number;
  totalOrders: number;
  claimCount: number;
}

export interface RestockOrder {
  id: string;
  date: string;
  totalPairs: number;
  totalCost: number;
  shippingFee: number;
  items: {
    name: string;
    qty: number;
    cost?: number;
    basePrice?: number;
    shippingFee?: number;
    image?: string;
    productUrl?: string;
    variants?: { color: string, stock: number, imageUrl?: string }[];
  }[];
}

export const MARKETS = [
  { id: 'm-sun', name: 'ตลาดคนเดิน (อาทิตย์)', day: 0 },
  { id: 'm-mon', name: 'ตลาดไทยประกัน (จันทร์)', day: 1 },
  { id: 'm-tue', name: 'ตลาดหนองแปป (อังคาร)', day: 2 },
  { id: 'm-wed', name: 'ตลาดไทยประกัน (พุธ)', day: 3 },
  { id: 'm-thu', name: 'ตลาดกระสัง (พฤหัส)', day: 4 },
  { id: 'm-fri', name: 'ตลาดภัทระ (ศุกร์)', day: 5 },
  { id: 'm-sat', name: 'ตลาดคนเดิน (เสาร์)', day: 6 },
];
