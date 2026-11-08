export interface Shop {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  activity: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  planId: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  createdAt?: string;
}

export interface User {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: 'superadmin' | 'merchant' | 'staff' | 'delivery';
  shopId?: number | null;
  deliveryAgentId?: number | null;
}

export interface Product {
  id: number;
  shopId: number;
  name: string;
  category: string;
  imageUrl?: string | null;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  hasVariants?: boolean;
  variants?: string;
  description?: string | null;
  isAvailable: boolean;
  isArchived: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  variantInfo?: string;
  purchasePrice: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  shopId: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  neighborhood?: string | null;
  city: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  totalPurchaseCost: number;
  source: 'whatsapp' | 'tiktok' | 'facebook' | 'instagram' | 'autre';
  status:
    | 'new'
    | 'confirmed'
    | 'preparation'
    | 'ready'
    | 'assigned'
    | 'in_delivery'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  paymentMethod: 'wave' | 'orange_money' | 'cash' | 'transfer' | 'other';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  amountPaid: number;
  assignedDeliveryId?: number | null;
  customerNotes?: string | null;
  merchantNotes?: string | null;
  deliveredAt?: string | null;
  createdAt?: string;
  items?: OrderItem[];
  deliveryAgent?: DeliveryAgent | null;
}

export interface Client {
  id: number;
  shopId: number;
  fullName: string;
  phone: string;
  altPhone?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city: string;
  totalOrders: number;
  totalSpent: number;
  unpaidAmount: number;
  notes?: string | null;
  createdAt?: string;
}

export interface DeliveryAgent {
  id: number;
  shopId: number;
  userId?: number | null;
  fullName: string;
  phone: string;
  vehicleType: 'moto' | 'voiture' | 'velo' | 'autre';
  licensePlate?: string | null;
  pinCode: string;
  status: 'active' | 'inactive';
  cashCollected: number;
  cashRemitted: number;
  remainingCashToRemit?: number;
  activeOrdersCount?: number;
  createdAt?: string;
}

export interface Expense {
  id: number;
  shopId: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
  createdAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  priceMonth: number;
  maxUsers: number;
  features: string;
  isActive: boolean;
}

export interface DashboardStats {
  period: string;
  totalOrdersCount: number;
  statusCounts: Record<string, number>;
  totalSales: number;
  totalCollected: number;
  totalUnpaid: number;
  totalDeliveryFees: number;
  totalPurchaseCost: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  totalCashInDriversHands: number;
  expensesByCategory: Record<string, number>;
  sourceCounts: Record<string, { count: number; total: number }>;
  lowStockCount: number;
  lowStockProducts: Product[];
  topItems: { productName: string; totalQty: number; totalRevenue: number }[];
  recentOrders: Order[];
}
