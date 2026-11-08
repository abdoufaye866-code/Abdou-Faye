import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db, schema } from './src/db/index.ts';
import { eq, desc, and, sql, gte, lte, or, inArray } from 'drizzle-orm';
import {
  requireAuth,
  requireSuperAdmin,
  requireShopAccess,
  generateToken,
  AuthRequest,
} from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to format order numbers: SC-26-XXXX
const generateOrderNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SC-26-${random}`;
};

// ==========================================
// 1. AUTHENTICATION & ONBOARDING
// ==========================================

// Register a new merchant with their shop (14 days free trial)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      shopName,
      shopActivity,
      shopWhatsapp,
      shopAddress,
      shopCity,
    } = req.body;

    if (!email || !password || !fullName || !shopName) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' });
    }

    // Check if user email already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()));

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Slug for shop
    const slug = `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    // 14 days trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create Shop
    const [shop] = await db
      .insert(schema.shops)
      .values({
        name: shopName,
        slug,
        activity: shopActivity || 'Commerce général',
        ownerName: fullName,
        phone: phone || '',
        whatsapp: shopWhatsapp || phone || '',
        email: email.toLowerCase().trim(),
        address: shopAddress || 'Dakar',
        city: shopCity || 'Dakar',
        country: 'Sénégal',
        currency: 'FCFA',
        planId: 'starter',
        subscriptionStatus: 'trial',
        trialEndsAt,
      })
      .returning();

    // Create User (Owner)
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [user] = await db
      .insert(schema.users)
      .values({
        uid,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone: phone || '',
        role: 'merchant',
        shopId: shop.id,
      })
      .returning();

    // Add as employee with owner role
    await db.insert(schema.employees).values({
      shopId: shop.id,
      userId: user.id,
      role: 'owner',
      permissions: JSON.stringify(['all']),
      status: 'active',
    });

    // Create default delivery agent for the shop
    await db.insert(schema.deliveryAgents).values({
      shopId: shop.id,
      fullName: 'Livreur Standard',
      phone: shopWhatsapp || phone || '770000000',
      vehicleType: 'moto',
      pinCode: '1234',
      status: 'active',
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      shopId: shop.id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        shopId: shop.id,
      },
      shop,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || "Erreur lors de l'inscription" });
  }
});

// Login with email and password
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()));

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    let shop = null;
    if (user.shopId) {
      const [foundShop] = await db
        .select()
        .from(schema.shops)
        .where(eq(schema.shops.id, user.shopId));
      shop = foundShop;
    }

    const token = generateToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      shopId: user.shopId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        shopId: user.shopId,
      },
      shop,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la connexion' });
  }
});

// Driver Quick Login with Phone + PIN code
app.post('/api/auth/driver-login', async (req: Request, res: Response) => {
  try {
    const { phone, pinCode } = req.body;
    if (!phone || !pinCode) {
      return res.status(400).json({ error: 'Numéro de téléphone et code PIN requis' });
    }

    const sanitizedPhone = phone.replace(/[^0-9]/g, '');

    const agents = await db.select().from(schema.deliveryAgents);
    const agent = agents.find(
      (a) => a.phone.replace(/[^0-9]/g, '').includes(sanitizedPhone) && a.pinCode === pinCode
    );

    if (!agent) {
      return res.status(401).json({ error: 'Numéro ou code PIN incorrect' });
    }

    const [shop] = await db
      .select()
      .from(schema.shops)
      .where(eq(schema.shops.id, agent.shopId));

    const token = generateToken({
      id: agent.id,
      uid: `driver_${agent.id}`,
      email: `${agent.phone}@driver.socialcom`,
      fullName: agent.fullName,
      role: 'delivery',
      shopId: agent.shopId,
      deliveryAgentId: agent.id,
    });

    res.json({
      token,
      user: {
        id: agent.id,
        uid: `driver_${agent.id}`,
        email: `${agent.phone}@driver.socialcom`,
        fullName: agent.fullName,
        role: 'delivery',
        shopId: agent.shopId,
        deliveryAgentId: agent.id,
      },
      deliveryAgent: agent,
      shop,
    });
  } catch (error: any) {
    console.error('Driver login error:', error);
    res.status(500).json({ error: error.message || 'Erreur connexion livreur' });
  }
});

// Demo Account Switcher (allows instant testing as Merchant, Driver, or SuperAdmin)
app.post('/api/auth/quick-demo', async (req: Request, res: Response) => {
  try {
    const { role = 'merchant' } = req.body;

    // Find or create appropriate demo profile
    let demoUser = null;
    let shop = null;

    if (role === 'superadmin') {
      const [admin] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'superadmin'));

      if (admin) {
        demoUser = admin;
      } else {
        const [newAdmin] = await db
          .insert(schema.users)
          .values({
            uid: 'admin_socialcom_master',
            email: 'admin@socialcom.sn',
            fullName: 'Super Admin SOCIALCOM',
            phone: '770000001',
            role: 'superadmin',
          })
          .returning();
        demoUser = newAdmin;
      }
    } else if (role === 'delivery') {
      // Find a delivery agent
      const [agent] = await db.select().from(schema.deliveryAgents);
      if (agent) {
        const [agentShop] = await db
          .select()
          .from(schema.shops)
          .where(eq(schema.shops.id, agent.shopId));
        shop = agentShop;
        const token = generateToken({
          id: agent.id,
          uid: `driver_${agent.id}`,
          email: `${agent.phone}@driver.socialcom`,
          fullName: agent.fullName,
          role: 'delivery',
          shopId: agent.shopId,
          deliveryAgentId: agent.id,
        });
        return res.json({
          token,
          user: {
            id: agent.id,
            uid: `driver_${agent.id}`,
            email: `${agent.phone}@driver.socialcom`,
            fullName: agent.fullName,
            role: 'delivery',
            shopId: agent.shopId,
            deliveryAgentId: agent.id,
          },
          deliveryAgent: agent,
          shop,
        });
      }
    }

    if (!demoUser) {
      // Find default merchant shop
      const [foundShop] = await db.select().from(schema.shops);
      if (foundShop) {
        shop = foundShop;
        const [foundUser] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.shopId, foundShop.id));
        demoUser = foundUser;
      }
    }

    if (!demoUser) {
      return res.status(404).json({ error: 'Aucun compte démo disponible. Veuillez initialiser les données.' });
    }

    const token = generateToken({
      id: demoUser.id,
      uid: demoUser.uid,
      email: demoUser.email,
      fullName: demoUser.fullName,
      role: demoUser.role as any,
      shopId: demoUser.shopId,
    });

    res.json({
      token,
      user: {
        id: demoUser.id,
        uid: demoUser.uid,
        email: demoUser.email,
        fullName: demoUser.fullName,
        phone: demoUser.phone,
        role: demoUser.role,
        shopId: demoUser.shopId,
      },
      shop,
    });
  } catch (error: any) {
    console.error('Quick demo error:', error);
    res.status(500).json({ error: error.message || 'Erreur démo' });
  }
});

// Current user profile
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userPayload = req.user!;
    let shop = null;
    let plan = null;

    if (userPayload.shopId) {
      const [foundShop] = await db
        .select()
        .from(schema.shops)
        .where(eq(schema.shops.id, userPayload.shopId));
      shop = foundShop;

      if (shop) {
        const [foundPlan] = await db
          .select()
          .from(schema.plans)
          .where(eq(schema.plans.id, shop.planId));
        plan = foundPlan;
      }
    }

    res.json({
      user: userPayload,
      shop,
      plan,
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement profil' });
  }
});

// ==========================================
// 2. DASHBOARD STATS (Real-time financial & sales engine)
// ==========================================

app.get('/api/dashboard/stats', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const period = (req.query.period as string) || 'this_month'; // 'today', 'this_week', 'this_month', 'all'

    // Compute date cutoff
    const now = new Date();
    let startDate: Date | null = null;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'this_week') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Orders query for shop
    let conditions = [eq(schema.orders.shopId, shopId)];
    if (startDate) {
      conditions.push(gte(schema.orders.createdAt, startDate));
    }

    const shopOrders = await db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.createdAt));

    // Stats calculations
    let totalSales = 0;
    let totalCollected = 0;
    let totalUnpaid = 0;
    let totalDeliveryFees = 0;
    let totalPurchaseCost = 0;

    const statusCounts: Record<string, number> = {
      new: 0,
      confirmed: 0,
      preparation: 0,
      ready: 0,
      assigned: 0,
      in_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    const sourceCounts: Record<string, { count: number; total: number }> = {
      whatsapp: { count: 0, total: 0 },
      tiktok: { count: 0, total: 0 },
      facebook: { count: 0, total: 0 },
      instagram: { count: 0, total: 0 },
      autre: { count: 0, total: 0 },
    };

    shopOrders.forEach((order) => {
      // count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      // don't count cancelled or returned in sales
      if (order.status !== 'cancelled' && order.status !== 'returned') {
        totalSales += order.totalAmount;
        totalCollected += order.amountPaid;
        totalUnpaid += Math.max(0, order.totalAmount - order.amountPaid);
        totalDeliveryFees += order.deliveryFee;
        totalPurchaseCost += order.totalPurchaseCost;

        const src = order.source || 'autre';
        if (!sourceCounts[src]) sourceCounts[src] = { count: 0, total: 0 };
        sourceCounts[src].count += 1;
        sourceCounts[src].total += order.totalAmount;
      }
    });

    // Expenses for the period
    let expenseConditions = [eq(schema.expenses.shopId, shopId)];
    const shopExpenses = await db
      .select()
      .from(schema.expenses)
      .where(and(...expenseConditions));

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};
    shopExpenses.forEach((exp) => {
      totalExpenses += exp.amount;
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    // Gross Margin & Net Profit
    const grossMargin = totalSales - totalPurchaseCost;
    const netProfit = grossMargin - totalExpenses;

    // Delivery Agents stats
    const agents = await db
      .select()
      .from(schema.deliveryAgents)
      .where(eq(schema.deliveryAgents.shopId, shopId));

    let totalCashInDriversHands = 0;
    agents.forEach((ag) => {
      totalCashInDriversHands += Math.max(0, ag.cashCollected - ag.cashRemitted);
    });

    // Low stock alerts
    const lowStockProducts = await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.shopId, shopId),
          eq(schema.products.isArchived, false),
          sql`${schema.products.stockQuantity} <= ${schema.products.lowStockThreshold}`
        )
      );

    // Top selling items from order_items
    const topItems = await db
      .select({
        productName: schema.orderItems.productName,
        totalQty: sql<number>`sum(${schema.orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${schema.orderItems.totalPrice})`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(
        and(
          eq(schema.orders.shopId, shopId),
          sql`${schema.orders.status} NOT IN ('cancelled', 'returned')`
        )
      )
      .groupBy(schema.orderItems.productName)
      .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
      .limit(5);

    res.json({
      period,
      totalOrdersCount: shopOrders.length,
      statusCounts,
      totalSales,
      totalCollected,
      totalUnpaid,
      totalDeliveryFees,
      totalPurchaseCost,
      grossMargin,
      totalExpenses,
      netProfit,
      totalCashInDriversHands,
      expensesByCategory,
      sourceCounts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      topItems,
      recentOrders: shopOrders.slice(0, 8),
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement tableau de bord' });
  }
});

// ==========================================
// 3. PRODUCTS & INVENTORY MANAGEMENT
// ==========================================

// Get all products
app.get('/api/products', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';

    let conditions = [
      eq(schema.products.shopId, shopId),
      eq(schema.products.isArchived, false),
    ];

    if (category) {
      conditions.push(eq(schema.products.category, category));
    }

    const productsList = await db
      .select()
      .from(schema.products)
      .where(and(...conditions))
      .orderBy(desc(schema.products.createdAt));

    const filtered = search
      ? productsList.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
        )
      : productsList;

    res.json(filtered);
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement produits' });
  }
});

// Create product
app.post('/api/products', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const {
      name,
      category,
      imageUrl,
      purchasePrice,
      salePrice,
      stockQuantity,
      lowStockThreshold,
      hasVariants,
      variants,
      description,
      isAvailable,
    } = req.body;

    if (!name || salePrice === undefined) {
      return res.status(400).json({ error: 'Nom et prix de vente obligatoires' });
    }

    const [product] = await db
      .insert(schema.products)
      .values({
        shopId,
        name,
        category: category || 'Général',
        imageUrl: imageUrl || '',
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        hasVariants: Boolean(hasVariants),
        variants: typeof variants === 'string' ? variants : JSON.stringify(variants || []),
        description: description || '',
        isAvailable: isAvailable !== false,
      })
      .returning();

    // Log initial stock movement
    if (Number(stockQuantity) > 0) {
      await db.insert(schema.stockMovements).values({
        shopId,
        productId: product.id,
        type: 'initial',
        quantity: Number(stockQuantity),
        reason: 'Stock initial à la création',
      });
    }

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message || 'Erreur création produit' });
  }
});

// Update product
app.put('/api/products/:id', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const productId = Number(req.params.id);

    const {
      name,
      category,
      imageUrl,
      purchasePrice,
      salePrice,
      stockQuantity,
      lowStockThreshold,
      hasVariants,
      variants,
      description,
      isAvailable,
    } = req.body;

    const [existing] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shopId)));

    if (!existing) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const [updated] = await db
      .update(schema.products)
      .set({
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : existing.purchasePrice,
        salePrice: salePrice !== undefined ? Number(salePrice) : existing.salePrice,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : existing.stockQuantity,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : existing.lowStockThreshold,
        hasVariants: hasVariants !== undefined ? Boolean(hasVariants) : existing.hasVariants,
        variants: variants !== undefined ? (typeof variants === 'string' ? variants : JSON.stringify(variants)) : existing.variants,
        description: description !== undefined ? description : existing.description,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : existing.isAvailable,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shopId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message || 'Erreur mise à jour produit' });
  }
});

// Adjust stock directly
app.post('/api/products/:id/adjust-stock', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const productId = Number(req.params.id);
    const { delta, reason = 'Ajustement manuel' } = req.body;

    const [existing] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shopId)));

    if (!existing) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const newStock = Math.max(0, existing.stockQuantity + Number(delta));

    const [updated] = await db
      .update(schema.products)
      .set({ stockQuantity: newStock, updatedAt: new Date() })
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shopId)))
      .returning();

    await db.insert(schema.stockMovements).values({
      shopId,
      productId,
      type: Number(delta) >= 0 ? 'restock' : 'adjustment',
      quantity: Number(delta),
      reason,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: error.message || 'Erreur ajustement stock' });
  }
});

// Archive product
app.delete('/api/products/:id', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const productId = Number(req.params.id);

    await db
      .update(schema.products)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(schema.products.id, productId), eq(schema.products.shopId, shopId)));

    res.json({ success: true, message: 'Produit archivé' });
  } catch (error: any) {
    console.error('Archive product error:', error);
    res.status(500).json({ error: error.message || 'Erreur archivage produit' });
  }
});

// ==========================================
// 4. ORDERS MANAGEMENT (High Priority)
// ==========================================

// List orders with search and filters
app.get('/api/orders', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { status, paymentStatus, source, search } = req.query;

    let conditions = [eq(schema.orders.shopId, shopId)];

    if (status && status !== 'all') {
      conditions.push(eq(schema.orders.status, status as string));
    }
    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push(eq(schema.orders.paymentStatus, paymentStatus as string));
    }
    if (source && source !== 'all') {
      conditions.push(eq(schema.orders.source, source as string));
    }

    const ordersList = await db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.createdAt));

    // Fetch order items and delivery agent info for each order
    const orderIds = ordersList.map((o) => o.id);
    let allItems: any[] = [];
    if (orderIds.length > 0) {
      allItems = await db
        .select()
        .from(schema.orderItems)
        .where(inArray(schema.orderItems.orderId, orderIds));
    }

    const agents = await db
      .select()
      .from(schema.deliveryAgents)
      .where(eq(schema.deliveryAgents.shopId, shopId));

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    const enrichedOrders = ordersList.map((order) => {
      const items = allItems.filter((i) => i.orderId === order.id);
      const deliveryAgent = order.assignedDeliveryId ? agentMap.get(order.assignedDeliveryId) : null;
      return {
        ...order,
        items,
        deliveryAgent,
      };
    });

    const filtered = search
      ? enrichedOrders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes((search as string).toLowerCase()) ||
            o.clientName.toLowerCase().includes((search as string).toLowerCase()) ||
            o.clientPhone.includes(search as string) ||
            (o.neighborhood && o.neighborhood.toLowerCase().includes((search as string).toLowerCase()))
        )
      : enrichedOrders;

    res.json(filtered);
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement commandes' });
  }
});

// Create Order (Ultra-rapid entry)
app.post('/api/orders', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const {
      clientName,
      clientPhone,
      deliveryAddress,
      neighborhood,
      city = 'Dakar',
      items, // array of { productId, productName, variantInfo, purchasePrice, unitPrice, quantity, totalPrice }
      discount = 0,
      deliveryFee = 0,
      source = 'whatsapp',
      paymentMethod = 'cash',
      paymentStatus = 'unpaid',
      amountPaid = 0,
      assignedDeliveryId,
      customerNotes,
      merchantNotes,
    } = req.body;

    if (!clientName || !clientPhone || !deliveryAddress || !items || items.length === 0) {
      return res.status(400).json({ error: 'Veuillez renseigner le client, le téléphone, l’adresse et au moins un article' });
    }

    // 1. Find or create Client
    let clientRecord: any;
    const existingClients = await db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.shopId, shopId),
          eq(schema.clients.phone, clientPhone.trim())
        )
      );

    if (existingClients.length > 0) {
      clientRecord = existingClients[0];
      // update address if needed
      await db
        .update(schema.clients)
        .set({
          fullName: clientName,
          address: deliveryAddress,
          neighborhood: neighborhood || clientRecord.neighborhood,
          city: city || clientRecord.city,
          updatedAt: new Date(),
        })
        .where(eq(schema.clients.id, clientRecord.id));
    } else {
      const [newClient] = await db
        .insert(schema.clients)
        .values({
          shopId,
          fullName: clientName,
          phone: clientPhone.trim(),
          address: deliveryAddress,
          neighborhood: neighborhood || '',
          city: city || 'Dakar',
        })
        .returning();
      clientRecord = newClient;
    }

    // 2. Compute Totals
    let subtotal = 0;
    let totalPurchaseCost = 0;

    items.forEach((item: any) => {
      const lineTotal = Number(item.unitPrice) * Number(item.quantity);
      subtotal += lineTotal;
      totalPurchaseCost += (Number(item.purchasePrice) || 0) * Number(item.quantity);
    });

    const totalAmount = Math.max(0, subtotal - Number(discount) + Number(deliveryFee));
    const paid = Number(amountPaid) || 0;
    const finalPaymentStatus = paid >= totalAmount ? 'paid' : paid > 0 ? 'partial' : paymentStatus;

    // 3. Create Order
    const orderNumber = generateOrderNumber();
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        shopId,
        clientId: clientRecord.id,
        clientName,
        clientPhone: clientPhone.trim(),
        deliveryAddress,
        neighborhood: neighborhood || '',
        city,
        subtotal,
        discount: Number(discount),
        deliveryFee: Number(deliveryFee),
        totalAmount,
        totalPurchaseCost,
        source,
        status: assignedDeliveryId ? 'assigned' : 'confirmed',
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        amountPaid: paid,
        assignedDeliveryId: assignedDeliveryId ? Number(assignedDeliveryId) : null,
        customerNotes: customerNotes || '',
        merchantNotes: merchantNotes || '',
      })
      .returning();

    // 4. Create Order Items & Deduct Stock
    for (const item of items) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: Number(item.productId),
        productName: item.productName,
        variantInfo: item.variantInfo || '',
        purchasePrice: Number(item.purchasePrice) || 0,
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity),
        totalPrice: Number(item.unitPrice) * Number(item.quantity),
      });

      // Stock deduction
      const [product] = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, Number(item.productId)));

      if (product) {
        const updatedQty = Math.max(0, product.stockQuantity - Number(item.quantity));
        await db
          .update(schema.products)
          .set({ stockQuantity: updatedQty, updatedAt: new Date() })
          .where(eq(schema.products.id, product.id));

        await db.insert(schema.stockMovements).values({
          shopId,
          productId: product.id,
          type: 'order_out',
          quantity: -Number(item.quantity),
          reason: `Commande ${orderNumber}`,
          orderId: order.id,
        });
      }
    }

    // 5. If assigned to a delivery agent, create delivery entry
    if (assignedDeliveryId) {
      await db.insert(schema.deliveries).values({
        shopId,
        orderId: order.id,
        deliveryAgentId: Number(assignedDeliveryId),
        status: 'assigned',
        amountToCollect: Math.max(0, totalAmount - paid),
      });
    }

    // 6. Record payment if paid > 0
    if (paid > 0) {
      await db.insert(schema.payments).values({
        shopId,
        orderId: order.id,
        amount: paid,
        method: paymentMethod,
        type: 'order_payment',
        recordedBy: req.user!.fullName,
      });
    }

    // 7. Update client aggregates
    await db
      .update(schema.clients)
      .set({
        totalOrders: sql`${schema.clients.totalOrders} + 1`,
        totalSpent: sql`${schema.clients.totalSpent} + ${totalAmount}`,
        unpaidAmount: sql`${schema.clients.unpaidAmount} + ${Math.max(0, totalAmount - paid)}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.clients.id, clientRecord.id));

    res.status(201).json({
      ...order,
      items,
      client: clientRecord,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Erreur enregistrement commande' });
  }
});

// Update Order (Status, Payment, Delivery Assignment)
app.put('/api/orders/:id', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const orderId = Number(req.params.id);
    const {
      status,
      paymentStatus,
      amountPaid,
      assignedDeliveryId,
      merchantNotes,
    } = req.body;

    const [existing] = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.shopId, shopId)));

    if (!existing) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    // Handle stock restock if transitioning to cancelled or returned
    if (
      (status === 'cancelled' || status === 'returned') &&
      existing.status !== 'cancelled' &&
      existing.status !== 'returned'
    ) {
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));

      for (const item of items) {
        await db
          .update(schema.products)
          .set({
            stockQuantity: sql`${schema.products.stockQuantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, item.productId));

        await db.insert(schema.stockMovements).values({
          shopId,
          productId: item.productId,
          type: status === 'cancelled' ? 'cancel_in' : 'return_in',
          quantity: item.quantity,
          reason: `Rétablissement stock (${status === 'cancelled' ? 'Annulation' : 'Retour'} ${existing.orderNumber})`,
          orderId,
        });
      }
    }

    // If assigned to a new driver
    if (assignedDeliveryId && assignedDeliveryId !== existing.assignedDeliveryId) {
      await db.insert(schema.deliveries).values({
        shopId,
        orderId,
        deliveryAgentId: Number(assignedDeliveryId),
        status: 'assigned',
        amountToCollect: Math.max(0, existing.totalAmount - (amountPaid ?? existing.amountPaid)),
      });
    }

    // Delivered timestamp
    const deliveredAt = status === 'delivered' && !existing.deliveredAt ? new Date() : existing.deliveredAt;

    const [updated] = await db
      .update(schema.orders)
      .set({
        status: status !== undefined ? status : existing.status,
        paymentStatus: paymentStatus !== undefined ? paymentStatus : existing.paymentStatus,
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : existing.amountPaid,
        assignedDeliveryId: assignedDeliveryId !== undefined ? (assignedDeliveryId ? Number(assignedDeliveryId) : null) : existing.assignedDeliveryId,
        merchantNotes: merchantNotes !== undefined ? merchantNotes : existing.merchantNotes,
        deliveredAt,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.shopId, shopId)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Update order error:', error);
    res.status(500).json({ error: error.message || 'Erreur mise à jour commande' });
  }
});

// Generate WhatsApp Share Message for Order
app.get('/api/orders/:id/share-whatsapp', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const orderId = Number(req.params.id);

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.shopId, shopId)));

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.id, shopId));
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));

    const itemsText = items
      .map(
        (i) =>
          `• *${i.quantity}x* ${i.productName}${i.variantInfo ? ` (${i.variantInfo})` : ''} — ${i.totalPrice.toLocaleString('fr-FR')} FCFA`
      )
      .join('\n');

    const paymentText =
      order.paymentStatus === 'paid'
        ? '✅ *Paiement effectué*'
        : order.paymentStatus === 'partial'
        ? `⚠️ *Paiement partiel :* ${order.amountPaid.toLocaleString('fr-FR')} FCFA réglés (Reste : ${(order.totalAmount - order.amountPaid).toLocaleString('fr-FR')} FCFA)`
        : `💵 *À régler à la livraison :* ${order.totalAmount.toLocaleString('fr-FR')} FCFA (${order.paymentMethod === 'wave' ? 'Wave' : order.paymentMethod === 'orange_money' ? 'Orange Money' : 'Espèces'})`;

    const message = `🛍️ *RÉCAPITULATIF DE COMMANDE #${order.orderNumber}*
*Boutique :* ${shop.name}
----------------------------------
👤 *Client :* ${order.clientName}
📞 *Téléphone :* ${order.clientPhone}
📍 *Adresse :* ${order.deliveryAddress}${order.neighborhood ? `, ${order.neighborhood}` : ''} (${order.city})
----------------------------------
📦 *Articles commandés :*
${itemsText}
----------------------------------
💰 *Sous-total :* ${order.subtotal.toLocaleString('fr-FR')} FCFA
🛵 *Frais de livraison :* ${order.deliveryFee.toLocaleString('fr-FR')} FCFA
${order.discount > 0 ? `🎁 *Réduction :* -${order.discount.toLocaleString('fr-FR')} FCFA\n` : ''}🔥 *TOTAL NET : ${order.totalAmount.toLocaleString('fr-FR')} FCFA*
----------------------------------
${paymentText}
----------------------------------
Merci pour votre commande ! Notre livreur vous contactera sous peu. 🙏`;

    // WhatsApp clean link
    const cleanPhone = order.clientPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;

    res.json({
      message,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error('Share WhatsApp error:', error);
    res.status(500).json({ error: error.message || 'Erreur génération WhatsApp' });
  }
});

// ==========================================
// 5. CLIENTS MANAGEMENT
// ==========================================

// List clients with purchase history & unpaid balances
app.get('/api/clients', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const search = (req.query.search as string) || '';

    const clientsList = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.shopId, shopId))
      .orderBy(desc(schema.clients.totalOrders));

    const filtered = search
      ? clientsList.filter(
          (c) =>
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            (c.neighborhood && c.neighborhood.toLowerCase().includes(search.toLowerCase()))
        )
      : clientsList;

    res.json(filtered);
  } catch (error: any) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement clients' });
  }
});

// Client details with past orders
app.get('/api/clients/:id', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const clientId = Number(req.params.id);

    const [client] = await db
      .select()
      .from(schema.clients)
      .where(and(eq(schema.clients.id, clientId), eq(schema.clients.shopId, shopId)));

    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    const clientOrders = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.clientId, clientId), eq(schema.orders.shopId, shopId)))
      .orderBy(desc(schema.orders.createdAt));

    res.json({
      client,
      orders: clientOrders,
    });
  } catch (error: any) {
    console.error('Get client details error:', error);
    res.status(500).json({ error: error.message || 'Erreur détails client' });
  }
});

// ==========================================
// 6. DELIVERY AGENTS & DRIVER SPACE
// ==========================================

// Get all delivery agents for shop
app.get('/api/delivery-agents', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const agents = await db
      .select()
      .from(schema.deliveryAgents)
      .where(eq(schema.deliveryAgents.shopId, shopId))
      .orderBy(desc(schema.deliveryAgents.createdAt));

    // Calculate active assigned orders count for each
    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const activeOrders = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.assignedDeliveryId, agent.id),
              sql`${schema.orders.status} IN ('assigned', 'in_delivery')`
            )
          );
        return {
          ...agent,
          activeOrdersCount: Number(activeOrders[0]?.count || 0),
          remainingCashToRemit: Math.max(0, agent.cashCollected - agent.cashRemitted),
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('Get delivery agents error:', error);
    res.status(500).json({ error: error.message || 'Erreur livreurs' });
  }
});

// Create Delivery Agent
app.post('/api/delivery-agents', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { fullName, phone, vehicleType = 'moto', licensePlate, pinCode = '1234' } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }

    const [agent] = await db
      .insert(schema.deliveryAgents)
      .values({
        shopId,
        fullName,
        phone: phone.trim(),
        vehicleType,
        licensePlate: licensePlate || '',
        pinCode: pinCode || '1234',
        status: 'active',
      })
      .returning();

    res.status(201).json(agent);
  } catch (error: any) {
    console.error('Create delivery agent error:', error);
    res.status(500).json({ error: error.message || 'Erreur création livreur' });
  }
});

// Driver Cash Remittance (Livreur reverse l'argent encaissé au commerçant)
app.post('/api/delivery-agents/:id/remit-cash', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const agentId = Number(req.params.id);
    const { amount, notes, method = 'cash' } = req.body;

    const [agent] = await db
      .select()
      .from(schema.deliveryAgents)
      .where(and(eq(schema.deliveryAgents.id, agentId), eq(schema.deliveryAgents.shopId, shopId)));

    if (!agent) return res.status(404).json({ error: 'Livreur introuvable' });

    const remitAmount = Number(amount);
    if (remitAmount <= 0) return res.status(400).json({ error: 'Montant invalide' });

    // Update agent cash remitted
    const [updatedAgent] = await db
      .update(schema.deliveryAgents)
      .set({
        cashRemitted: sql`${schema.deliveryAgents.cashRemitted} + ${remitAmount}`,
      })
      .where(eq(schema.deliveryAgents.id, agentId))
      .returning();

    // Record payment receipt
    await db.insert(schema.payments).values({
      shopId,
      deliveryAgentId: agentId,
      amount: remitAmount,
      method,
      type: 'cash_remittance',
      notes: notes || `Versement espèces par le livreur ${agent.fullName}`,
      recordedBy: req.user!.fullName,
    });

    res.json({
      success: true,
      agent: updatedAgent,
      remainingCashToRemit: Math.max(0, updatedAgent.cashCollected - updatedAgent.cashRemitted),
    });
  } catch (error: any) {
    console.error('Remit cash error:', error);
    res.status(500).json({ error: error.message || 'Erreur versement espèces' });
  }
});

// Driver Space: Get deliveries assigned to the logged-in driver
app.get('/api/driver/my-deliveries', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let deliveryAgentId = user.deliveryAgentId;

    if (!deliveryAgentId && user.shopId) {
      // Find agent linked to user or first agent
      const agents = await db
        .select()
        .from(schema.deliveryAgents)
        .where(eq(schema.deliveryAgents.shopId, user.shopId));
      if (agents.length > 0) deliveryAgentId = agents[0].id;
    }

    if (!deliveryAgentId) {
      return res.status(403).json({ error: 'Aucun compte livreur identifié' });
    }

    const [agent] = await db
      .select()
      .from(schema.deliveryAgents)
      .where(eq(schema.deliveryAgents.id, deliveryAgentId));

    // Get orders assigned to driver
    const assignedOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.assignedDeliveryId, deliveryAgentId))
      .orderBy(desc(schema.orders.createdAt));

    // Fetch items for assigned orders
    const orderIds = assignedOrders.map((o) => o.id);
    let allItems: any[] = [];
    if (orderIds.length > 0) {
      allItems = await db
        .select()
        .from(schema.orderItems)
        .where(inArray(schema.orderItems.orderId, orderIds));
    }

    const enriched = assignedOrders.map((o) => ({
      ...o,
      items: allItems.filter((i) => i.orderId === o.id),
    }));

    res.json({
      agent,
      deliveries: enriched,
      stats: {
        totalCollected: agent.cashCollected,
        totalRemitted: agent.cashRemitted,
        dueToMerchant: Math.max(0, agent.cashCollected - agent.cashRemitted),
      },
    });
  } catch (error: any) {
    console.error('Driver deliveries error:', error);
    res.status(500).json({ error: error.message || 'Erreur chargement livraisons' });
  }
});

// Driver Action: Update status (Pick up, Mark Delivered & Collect Cash)
app.post('/api/driver/orders/:id/update-status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { status, amountCollected = 0, proofNote } = req.body;

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const collected = Number(amountCollected);

    // Update order
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled' || status === 'returned';

    await db
      .update(schema.orders)
      .set({
        status,
        deliveredAt: isDelivered ? new Date() : order.deliveredAt,
        amountPaid: isDelivered && collected > 0 ? collected : order.amountPaid,
        paymentStatus: isDelivered && collected >= order.totalAmount ? 'paid' : order.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));

    // Update driver cashCollected if delivered with cash
    if (isDelivered && collected > 0 && order.assignedDeliveryId) {
      await db
        .update(schema.deliveryAgents)
        .set({
          cashCollected: sql`${schema.deliveryAgents.cashCollected} + ${collected}`,
        })
        .where(eq(schema.deliveryAgents.id, order.assignedDeliveryId));

      // Record payment
      await db.insert(schema.payments).values({
        shopId: order.shopId,
        orderId: order.id,
        deliveryAgentId: order.assignedDeliveryId,
        amount: collected,
        method: order.paymentMethod || 'cash',
        type: 'order_payment',
        notes: proofNote || 'Encaissé par le livreur lors de la livraison',
        recordedBy: 'Livreur',
      });
    }

    // Handle return of stock if returned
    if (isCancelled && order.status !== 'cancelled' && order.status !== 'returned') {
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));

      for (const item of items) {
        await db
          .update(schema.products)
          .set({
            stockQuantity: sql`${schema.products.stockQuantity} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, item.productId));
      }
    }

    res.json({ success: true, status });
  } catch (error: any) {
    console.error('Driver update status error:', error);
    res.status(500).json({ error: error.message || 'Erreur mise à jour livraison' });
  }
});

// ==========================================
// 7. PAYMENTS & EXPENSES
// ==========================================

// Get all payments history
app.get('/api/payments', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const paymentsList = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.shopId, shopId))
      .orderBy(desc(schema.payments.createdAt));

    res.json(paymentsList);
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: error.message || 'Erreur paiements' });
  }
});

// Record a manual payment
app.post('/api/payments', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { orderId, amount, method, reference, notes } = req.body;

    const [payment] = await db
      .insert(schema.payments)
      .values({
        shopId,
        orderId: orderId ? Number(orderId) : null,
        amount: Number(amount),
        method,
        type: 'order_payment',
        reference: reference || '',
        notes: notes || '',
        recordedBy: req.user!.fullName,
      })
      .returning();

    // If orderId is provided, update order amountPaid and paymentStatus
    if (orderId) {
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, Number(orderId)));
      if (order) {
        const newPaid = order.amountPaid + Number(amount);
        const newStatus = newPaid >= order.totalAmount ? 'paid' : 'partial';
        await db
          .update(schema.orders)
          .set({ amountPaid: newPaid, paymentStatus: newStatus, updatedAt: new Date() })
          .where(eq(schema.orders.id, order.id));
      }
    }

    res.status(201).json(payment);
  } catch (error: any) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: error.message || 'Erreur enregistrement paiement' });
  }
});

// Expenses: List and Create
app.get('/api/expenses', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const expensesList = await db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.shopId, shopId))
      .orderBy(desc(schema.expenses.createdAt));

    res.json(expensesList);
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: error.message || 'Erreur dépenses' });
  }
});

app.post('/api/expenses', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { title, category = 'autre', amount, expenseDate, notes } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Titre et montant obligatoires' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const [expense] = await db
      .insert(schema.expenses)
      .values({
        shopId,
        title,
        category,
        amount: Number(amount),
        expenseDate: expenseDate || todayStr,
        notes: notes || '',
      })
      .returning();

    res.status(201).json(expense);
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: error.message || 'Erreur création dépense' });
  }
});

app.delete('/api/expenses/:id', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const expenseId = Number(req.params.id);

    await db
      .delete(schema.expenses)
      .where(and(eq(schema.expenses.id, expenseId), eq(schema.expenses.shopId, shopId)));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: error.message || 'Erreur suppression dépense' });
  }
});

// ==========================================
// 8. EMPLOYEES & COLLABORATORS
// ==========================================

app.get('/api/employees', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const staff = await db
      .select({
        id: schema.employees.id,
        role: schema.employees.role,
        permissions: schema.employees.permissions,
        status: schema.employees.status,
        createdAt: schema.employees.createdAt,
        fullName: schema.users.fullName,
        email: schema.users.email,
        phone: schema.users.phone,
      })
      .from(schema.employees)
      .innerJoin(schema.users, eq(schema.employees.userId, schema.users.id))
      .where(eq(schema.employees.shopId, shopId));

    res.json(staff);
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: error.message || 'Erreur collaborateurs' });
  }
});

app.post('/api/employees', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { fullName, email, phone, role = 'manager', password = 'ChangeMe2026!' } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Nom et email requis' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const uid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create user
    const [newUser] = await db
      .insert(schema.users)
      .values({
        uid,
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone: phone || '',
        role: 'staff',
        shopId,
      })
      .returning();

    // Create employee link
    const [employee] = await db
      .insert(schema.employees)
      .values({
        shopId,
        userId: newUser.id,
        role,
        permissions: JSON.stringify(['orders', 'products', 'clients']),
        status: 'active',
      })
      .returning();

    res.status(201).json({ employee, user: newUser });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: error.message || 'Erreur ajout collaborateur' });
  }
});

// ==========================================
// 9. SAAS PLANS & SUBSCRIPTIONS
// ==========================================

// Get public plans
app.get('/api/subscriptions/plans', async (_req: Request, res: Response) => {
  try {
    const allPlans = await db.select().from(schema.plans).where(eq(schema.plans.isActive, true));
    res.json(allPlans);
  } catch (error: any) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: error.message || 'Erreur plans' });
  }
});

// Request or Upgrade subscription
app.post('/api/subscriptions/upgrade', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { planId, paymentMethod = 'wave', paymentReference } = req.body;

    const [plan] = await db.select().from(schema.plans).where(eq(schema.plans.id, planId));
    if (!plan) return res.status(404).json({ error: 'Forfait introuvable' });

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    // Create subscription record
    const [subscription] = await db
      .insert(schema.subscriptions)
      .values({
        shopId,
        planId,
        amountPaid: plan.priceMonth,
        paymentMethod,
        paymentReference: paymentReference || `WAVE-${Date.now().toString().slice(-6)}`,
        status: 'active',
        startsAt,
        endsAt,
        approvedBy: req.user!.fullName,
      })
      .returning();

    // Update shop plan and dates
    await db
      .update(schema.shops)
      .set({
        planId,
        subscriptionStatus: 'active',
        subscriptionEndsAt: endsAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.shops.id, shopId));

    res.json({
      success: true,
      subscription,
      message: `Votre boutique est désormais sous le forfait ${plan.name} !`,
    });
  } catch (error: any) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ error: error.message || 'Erreur abonnement' });
  }
});

// ==========================================
// 10. SUPER ADMINISTRATOR DASHBOARD
// ==========================================

app.get('/api/admin/overview', requireAuth, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const allShops = await db.select().from(schema.shops);
    const allUsers = await db.select().from(schema.users);
    const allOrders = await db.select().from(schema.orders);
    const allSubscriptions = await db.select().from(schema.subscriptions);
    const allTickets = await db.select().from(schema.supportTickets);

    // Calculate MRR
    let mrr = 0;
    allShops.forEach((s) => {
      if (s.subscriptionStatus === 'active') {
        if (s.planId === 'starter') mrr += 5000;
        else if (s.planId === 'business') mrr += 10000;
        else if (s.planId === 'pro') mrr += 15000;
      }
    });

    let totalGMV = 0;
    allOrders.forEach((o) => {
      if (o.status !== 'cancelled' && o.status !== 'returned') {
        totalGMV += o.totalAmount;
      }
    });

    res.json({
      totalShops: allShops.length,
      activeShops: allShops.filter((s) => s.subscriptionStatus === 'active' || s.subscriptionStatus === 'trial').length,
      trialShops: allShops.filter((s) => s.subscriptionStatus === 'trial').length,
      expiredShops: allShops.filter((s) => s.subscriptionStatus === 'expired').length,
      suspendedShops: allShops.filter((s) => s.subscriptionStatus === 'suspended').length,
      totalUsers: allUsers.length,
      totalOrders: allOrders.length,
      totalGMV,
      mrr,
      recentSubscriptions: allSubscriptions.slice(0, 10),
      openTickets: allTickets.filter((t) => t.status === 'open').length,
      shops: allShops,
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: error.message || 'Erreur admin' });
  }
});

app.put('/api/admin/shops/:id/status', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = Number(req.params.id);
    const { status, extendDays = 0, planId } = req.body;

    const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.id, shopId));
    if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

    let trialEndsAt = shop.trialEndsAt;
    if (extendDays > 0) {
      const baseDate = trialEndsAt ? new Date(trialEndsAt) : new Date();
      baseDate.setDate(baseDate.getDate() + Number(extendDays));
      trialEndsAt = baseDate;
    }

    const [updated] = await db
      .update(schema.shops)
      .set({
        subscriptionStatus: status || shop.subscriptionStatus,
        planId: planId || shop.planId,
        trialEndsAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.shops.id, shopId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Update shop status error:', error);
    res.status(500).json({ error: error.message || 'Erreur mise à jour boutique' });
  }
});

// Admin Support Tickets
app.get('/api/admin/support-tickets', requireAuth, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const tickets = await db.select().from(schema.supportTickets).orderBy(desc(schema.supportTickets.createdAt));
    res.json(tickets);
  } catch (error: any) {
    console.error('Admin tickets error:', error);
    res.status(500).json({ error: error.message || 'Erreur support admin' });
  }
});

app.put('/api/admin/support-tickets/:id', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ticketId = Number(req.params.id);
    const { status, adminResponse } = req.body;

    const [updated] = await db
      .update(schema.supportTickets)
      .set({
        status: status || 'resolved',
        adminResponse: adminResponse || '',
      })
      .where(eq(schema.supportTickets.id, ticketId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: error.message || 'Erreur réponse support' });
  }
});

// Merchant Support Request
app.post('/api/support', requireAuth, requireShopAccess, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.user!.shopId!;
    const { subject, message, priority = 'normal' } = req.body;

    const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.id, shopId));

    const [ticket] = await db
      .insert(schema.supportTickets)
      .values({
        shopId,
        shopName: shop ? shop.name : 'Boutique',
        contactPhone: shop ? shop.phone : req.user!.phone || '',
        subject,
        message,
        priority,
        status: 'open',
      })
      .returning();

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: error.message || 'Erreur envoi ticket' });
  }
});

// ==========================================
// 11. DEMO DATA SEEDING (One click Dakar setup)
// ==========================================

app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    // 1. Ensure SuperAdmin
    const [existingAdmin] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'superadmin'));

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Admin2026!', salt);
      await db.insert(schema.users).values({
        uid: 'superadmin_master_1',
        email: 'admin@socialcom.sn',
        passwordHash: hash,
        fullName: 'Super Administrateur',
        phone: '770000000',
        role: 'superadmin',
      });
    }

    // 2. Demo Shop: "Dakar Mode & Beauté"
    let shop: any;
    const existingShops = await db
      .select()
      .from(schema.shops)
      .where(eq(schema.shops.slug, 'dakar-mode-beaute'));

    if (existingShops.length > 0) {
      shop = existingShops[0];
    } else {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const [newShop] = await db
        .insert(schema.shops)
        .values({
          name: 'Dakar Mode & Beauté',
          slug: 'dakar-mode-beaute',
          activity: 'Mode, Robes Wax & Cosmétiques',
          ownerName: 'Fatou Diop',
          phone: '77 450 12 34',
          whatsapp: '774501234',
          email: 'fatou@dakarmode.sn',
          address: 'Avenue Cheikh Anta Diop, près Université',
          city: 'Dakar',
          country: 'Sénégal',
          currency: 'FCFA',
          planId: 'business',
          subscriptionStatus: 'active',
          trialEndsAt,
        })
        .returning();
      shop = newShop;

      // Merchant User
      const salt = await bcrypt.genSalt(10);
      const userHash = await bcrypt.hash('Fatou2026!', salt);
      const [merchantUser] = await db
        .insert(schema.users)
        .values({
          uid: 'fatou_merchant_uid',
          email: 'fatou@dakarmode.sn',
          passwordHash: userHash,
          fullName: 'Fatou Diop',
          phone: '77 450 12 34',
          role: 'merchant',
          shopId: shop.id,
        })
        .returning();

      await db.insert(schema.employees).values({
        shopId: shop.id,
        userId: merchantUser.id,
        role: 'owner',
        permissions: JSON.stringify(['all']),
      });
    }

    // 3. Delivery Agent: "Moussa Ndiaye"
    let driver: any;
    const existingDrivers = await db
      .select()
      .from(schema.deliveryAgents)
      .where(eq(schema.deliveryAgents.shopId, shop.id));

    if (existingDrivers.length > 0) {
      driver = existingDrivers[0];
    } else {
      const [newDriver] = await db
        .insert(schema.deliveryAgents)
        .values({
          shopId: shop.id,
          fullName: 'Moussa Ndiaye',
          phone: '77 890 55 66',
          vehicleType: 'moto',
          licensePlate: 'DK-4589-AF',
          pinCode: '1234',
          status: 'active',
          cashCollected: 35000,
          cashRemitted: 10000,
        })
        .returning();
      driver = newDriver;
    }

    // 4. Products
    const existingProducts = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.shopId, shop.id));

    if (existingProducts.length === 0) {
      const demoProducts = [
        {
          name: 'Robe Soie Wax Royale',
          category: 'Vêtements',
          purchasePrice: 12000,
          salePrice: 25000,
          stockQuantity: 14,
          lowStockThreshold: 4,
          description: 'Robe longue en soie et wax véritable, idéale pour cérémonies et sorties chics.',
          imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sneakers Street Dakar Blanche',
          category: 'Chaussures',
          purchasePrice: 8000,
          salePrice: 18000,
          stockQuantity: 3, // Low stock on purpose!
          lowStockThreshold: 5,
          description: 'Baskets légères et aérées, parfaites pour la marche à Dakar.',
          imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sérum Éclat Karité & Baobab (50ml)',
          category: 'Cosmétiques',
          purchasePrice: 3500,
          salePrice: 9500,
          stockQuantity: 28,
          lowStockThreshold: 6,
          description: 'Sérum visage hydratant anti-tâches 100% bio fait au Sénégal.',
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
        },
        {
          name: 'Sac à Main Cuir Artisanal Touba',
          category: 'Accessoires',
          purchasePrice: 9000,
          salePrice: 22000,
          stockQuantity: 8,
          lowStockThreshold: 3,
          description: 'Sac en cuir véritable fait main, finitions haut de gamme et motifs gravés.',
          imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80',
        },
      ];

      for (const p of demoProducts) {
        await db.insert(schema.products).values({
          shopId: shop.id,
          name: p.name,
          category: p.category,
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold,
          description: p.description,
          imageUrl: p.imageUrl,
          isAvailable: true,
        });
      }
    }

    // 5. Clients & Orders
    const existingOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.shopId, shop.id));

    if (existingOrders.length === 0) {
      const allProds = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.shopId, shop.id));

      const demoClients = [
        { name: 'Awa Ndiaye', phone: '771234567', neighborhood: 'Almadies', address: 'Près de la Brioche Dorée' },
        { name: 'Mamadou Seck', phone: '782345678', neighborhood: 'Plateau', address: 'Rue Carnot, Immeuble Horizon' },
        { name: 'Khady Diouf', phone: '763456789', neighborhood: 'Sacré-Cœur 3', address: 'Villa 124, près de la VDN' },
        { name: 'Ousmane Bâ', phone: '704567890', neighborhood: 'Guédiawaye', address: 'Arrêt Bus Tally Boubess' },
      ];

      const insertedClients = [];
      for (const c of demoClients) {
        const [cl] = await db
          .insert(schema.clients)
          .values({
            shopId: shop.id,
            fullName: c.name,
            phone: c.phone,
            neighborhood: c.neighborhood,
            address: c.address,
            city: 'Dakar',
            totalOrders: 1,
            totalSpent: 27000,
          })
          .returning();
        insertedClients.push(cl);
      }

      // Create realistic orders
      if (allProds.length >= 2) {
        // Order 1: Delivered
        const [ord1] = await db
          .insert(schema.orders)
          .values({
            orderNumber: 'SC-26-4821',
            shopId: shop.id,
            clientId: insertedClients[0].id,
            clientName: insertedClients[0].fullName,
            clientPhone: insertedClients[0].phone,
            deliveryAddress: insertedClients[0].address || '',
            neighborhood: insertedClients[0].neighborhood,
            city: 'Dakar',
            subtotal: 25000,
            discount: 0,
            deliveryFee: 2000,
            totalAmount: 27000,
            totalPurchaseCost: 12000,
            source: 'whatsapp',
            status: 'delivered',
            paymentMethod: 'wave',
            paymentStatus: 'paid',
            amountPaid: 27000,
            assignedDeliveryId: driver.id,
            deliveredAt: new Date(),
          })
          .returning();

        await db.insert(schema.orderItems).values({
          orderId: ord1.id,
          productId: allProds[0].id,
          productName: allProds[0].name,
          purchasePrice: allProds[0].purchasePrice,
          unitPrice: allProds[0].salePrice,
          quantity: 1,
          totalPrice: allProds[0].salePrice,
        });

        // Order 2: In delivery
        const [ord2] = await db
          .insert(schema.orders)
          .values({
            orderNumber: 'SC-26-7193',
            shopId: shop.id,
            clientId: insertedClients[1].id,
            clientName: insertedClients[1].fullName,
            clientPhone: insertedClients[1].phone,
            deliveryAddress: insertedClients[1].address || '',
            neighborhood: insertedClients[1].neighborhood,
            city: 'Dakar',
            subtotal: 18000,
            discount: 1000,
            deliveryFee: 1500,
            totalAmount: 18500,
            totalPurchaseCost: 8000,
            source: 'tiktok',
            status: 'in_delivery',
            paymentMethod: 'cash',
            paymentStatus: 'unpaid',
            amountPaid: 0,
            assignedDeliveryId: driver.id,
          })
          .returning();

        await db.insert(schema.orderItems).values({
          orderId: ord2.id,
          productId: allProds[1].id,
          productName: allProds[1].name,
          purchasePrice: allProds[1].purchasePrice,
          unitPrice: allProds[1].salePrice,
          quantity: 1,
          totalPrice: allProds[1].salePrice,
        });

        // Order 3: New from WhatsApp
        const [ord3] = await db
          .insert(schema.orders)
          .values({
            orderNumber: 'SC-26-9042',
            shopId: shop.id,
            clientId: insertedClients[2].id,
            clientName: insertedClients[2].fullName,
            clientPhone: insertedClients[2].phone,
            deliveryAddress: insertedClients[2].address || '',
            neighborhood: insertedClients[2].neighborhood,
            city: 'Dakar',
            subtotal: 31500,
            discount: 0,
            deliveryFee: 2000,
            totalAmount: 33500,
            totalPurchaseCost: 15500,
            source: 'instagram',
            status: 'new',
            paymentMethod: 'wave',
            paymentStatus: 'unpaid',
            amountPaid: 0,
          })
          .returning();

        await db.insert(schema.orderItems).values({
          orderId: ord3.id,
          productId: allProds[2].id,
          productName: allProds[2].name,
          purchasePrice: allProds[2].purchasePrice,
          unitPrice: allProds[2].salePrice,
          quantity: 1,
          totalPrice: allProds[2].salePrice,
        });
      }

      // Demo Expenses
      await db.insert(schema.expenses).values([
        {
          shopId: shop.id,
          title: 'Campagne Publicitaire TikTok Ads',
          category: 'pub_social',
          amount: 15000,
          expenseDate: new Date().toISOString().slice(0, 10),
          notes: 'Vidéo présentation robes wax',
        },
        {
          shopId: shop.id,
          title: 'Sachets d’emballage kraft & rubans',
          category: 'packaging',
          amount: 8000,
          expenseDate: new Date().toISOString().slice(0, 10),
        },
      ]);
    }

    res.json({
      success: true,
      message: 'Données de démonstration initialisées avec succès !',
      shop,
      driver,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message || 'Erreur initialisation données' });
  }
});

// ==========================================
// 12. VITE DEV SERVER / PRODUCTION STATIC SERVE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SOCIALCOM] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SOCIALCOM] Failed to start server:', err);
});
