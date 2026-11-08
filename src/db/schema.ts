import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Forfaits SaaS
export const plans = pgTable('plans', {
  id: text('id').primaryKey(), // 'starter', 'business', 'pro'
  name: text('name').notNull(),
  priceMonth: integer('price_month').notNull(), // in FCFA: 5000, 10000, 15000
  maxUsers: integer('max_users').notNull(),
  features: text('features').notNull(), // JSON string
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Boutiques (Tenants)
export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  activity: text('activity').notNull().default('Commerce général'),
  ownerName: text('owner_name').notNull(),
  phone: text('phone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull().default('Dakar'),
  country: text('country').notNull().default('Sénégal'),
  currency: text('currency').notNull().default('FCFA'),
  planId: text('plan_id').notNull().default('starter'),
  subscriptionStatus: text('subscription_status').notNull().default('trial'), // 'trial', 'active', 'expired', 'suspended'
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Utilisateurs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or generated unique auth ID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // for email/password authentication
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('merchant'), // 'superadmin', 'merchant', 'staff', 'delivery'
  shopId: integer('shop_id').references(() => shops.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Employés / Collaborateurs
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  role: text('role').notNull().default('manager'), // 'owner', 'manager', 'order_agent', 'delivery'
  permissions: text('permissions').notNull().default('[]'), // JSON array
  status: text('status').notNull().default('active'), // 'active', 'invited', 'suspended'
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Produits
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Général'),
  imageUrl: text('image_url'),
  purchasePrice: integer('purchase_price').notNull().default(0), // Prix d'achat unitaire (FCFA)
  salePrice: integer('sale_price').notNull().default(0), // Prix de vente unitaire (FCFA)
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  hasVariants: boolean('has_variants').default(false).notNull(),
  variants: text('variants').default('[]'), // JSON array: [{ name: 'Taille M', stock: 10 }, ...]
  description: text('description'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Mouvements de stock
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  type: text('type').notNull(), // 'initial', 'order_out', 'cancel_in', 'return_in', 'restock', 'adjustment'
  quantity: integer('quantity').notNull(),
  reason: text('reason'),
  orderId: integer('order_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Clients
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  altPhone: text('alt_phone'),
  address: text('address'),
  neighborhood: text('neighborhood'), // Quartier (ex: Medina, Sacré-Cœur, Almadies, Guédiawaye)
  city: text('city').notNull().default('Dakar'),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  unpaidAmount: integer('unpaid_amount').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Livreurs
export const deliveryAgents = pgTable('delivery_agents', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  vehicleType: text('vehicle_type').notNull().default('moto'), // moto, voiture, vélo, autre
  licensePlate: text('license_plate'),
  pinCode: text('pin_code').notNull().default('1234'), // Code PIN pour accès livreur
  status: text('status').notNull().default('active'), // active, inactive
  cashCollected: integer('cash_collected').notNull().default(0), // Espèces encaissées à reverser
  cashRemitted: integer('cash_remitted').notNull().default(0), // Total reversé au commerçant
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Commandes
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // ex: SC-2601
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  clientId: integer('client_id')
    .references(() => clients.id)
    .notNull(),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  neighborhood: text('neighborhood'),
  city: text('city').notNull().default('Dakar'),
  subtotal: integer('subtotal').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  deliveryFee: integer('delivery_fee').notNull().default(0),
  totalAmount: integer('total_amount').notNull().default(0),
  totalPurchaseCost: integer('total_purchase_cost').notNull().default(0),
  source: text('source').notNull().default('whatsapp'), // 'whatsapp', 'tiktok', 'facebook', 'instagram', 'autre'
  status: text('status').notNull().default('new'), // 'new', 'confirmed', 'preparation', 'ready', 'assigned', 'in_delivery', 'delivered', 'cancelled', 'returned'
  paymentMethod: text('payment_method').notNull().default('cash'), // 'wave', 'orange_money', 'cash', 'transfer', 'other'
  paymentStatus: text('payment_status').notNull().default('unpaid'), // 'unpaid', 'partial', 'paid', 'refunded'
  amountPaid: integer('amount_paid').notNull().default(0),
  assignedDeliveryId: integer('assigned_delivery_id').references(
    () => deliveryAgents.id
  ),
  customerNotes: text('customer_notes'),
  merchantNotes: text('merchant_notes'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Articles commandés
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  productName: text('product_name').notNull(),
  variantInfo: text('variant_info'),
  purchasePrice: integer('purchase_price').notNull().default(0),
  unitPrice: integer('unit_price').notNull().default(0),
  quantity: integer('quantity').notNull().default(1),
  totalPrice: integer('total_price').notNull().default(0),
});

// 11. Livraisons
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  deliveryAgentId: integer('delivery_agent_id')
    .references(() => deliveryAgents.id)
    .notNull(),
  status: text('status').notNull().default('assigned'), // 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'
  amountToCollect: integer('amount_to_collect').notNull().default(0),
  amountCollected: integer('amount_collected').notNull().default(0),
  proofNote: text('proof_note'),
  assignedAt: timestamp('assigned_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Paiements
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  orderId: integer('order_id').references(() => orders.id),
  deliveryAgentId: integer('delivery_agent_id').references(
    () => deliveryAgents.id
  ),
  amount: integer('amount').notNull(),
  method: text('method').notNull(), // 'wave', 'orange_money', 'cash', 'transfer', 'other'
  type: text('type').notNull().default('order_payment'), // 'order_payment', 'partial', 'cash_remittance', 'subscription_fee', 'refund'
  reference: text('reference'), // ID transaction Wave, Orange Money, etc.
  notes: text('notes'),
  recordedBy: text('recorded_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Dépenses (charges de la boutique)
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull().default('autre'), // 'pub_social', 'packaging', 'transport', 'loyer', 'salaire', 'connexion', 'autre'
  amount: integer('amount').notNull(),
  expenseDate: text('expense_date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Abonnements SaaS
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  planId: text('plan_id').notNull(), // starter, business, pro
  amountPaid: integer('amount_paid').notNull(),
  paymentMethod: text('payment_method').notNull().default('wave'),
  paymentReference: text('payment_reference'),
  status: text('status').notNull().default('active'), // 'pending', 'active', 'expired', 'suspended'
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Journaux d'activité (Audit logs)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').references(() => shops.id),
  userId: integer('user_id').references(() => users.id),
  userName: text('user_name'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. Support & Assistance
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').references(() => shops.id),
  shopName: text('shop_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  priority: text('priority').notNull().default('normal'), // low, normal, urgent
  status: text('status').notNull().default('open'), // open, in_progress, resolved, closed
  adminResponse: text('admin_response'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const shopsRelations = relations(shops, ({ many }) => ({
  users: many(users),
  products: many(products),
  clients: many(clients),
  orders: many(orders),
  deliveryAgents: many(deliveryAgents),
  expenses: many(expenses),
  subscriptions: many(subscriptions),
  activityLogs: many(activityLogs),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, { fields: [orders.shopId], references: [shops.id] }),
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  deliveryAgent: one(deliveryAgents, {
    fields: [orders.assignedDeliveryId],
    references: [deliveryAgents.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  deliveries: many(deliveries),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  shop: one(shops, { fields: [clients.shopId], references: [shops.id] }),
  orders: many(orders),
}));

export const deliveryAgentsRelations = relations(
  deliveryAgents,
  ({ one, many }) => ({
    shop: one(shops, {
      fields: [deliveryAgents.shopId],
      references: [shops.id],
    }),
    deliveries: many(deliveries),
    assignedOrders: many(orders),
  })
);
