import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  UserCheck,
  PlusCircle,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { apiRequest, getStoredToken, removeStoredToken, setStoredToken } from './lib/api.ts';
import { User, Shop } from './types/index.ts';
import { HomePublic } from './components/HomePublic.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { QuickOrderModal } from './components/QuickOrderModal.tsx';
import { WhatsAppShareModal } from './components/WhatsAppShareModal.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { ClientsView } from './components/ClientsView.tsx';
import { DeliveryView } from './components/DeliveryView.tsx';
import { DriverSpaceView } from './components/DriverSpaceView.tsx';
import { FinancesView } from './components/FinancesView.tsx';
import { EmployeesView } from './components/EmployeesView.tsx';
import { SubscriptionView } from './components/SubscriptionView.tsx';
import { SuperAdminView } from './components/SuperAdminView.tsx';
import { OfflineIndicator } from './components/PWAInstallButton.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [currentSpace, setCurrentSpace] = useState<'merchant' | 'driver' | 'superadmin'>('merchant');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'driver'>('login');
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [whatsAppShareOrderId, setWhatsAppShareOrderId] = useState<number | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest<{ user: User; shop: Shop | null }>('/api/auth/me');
      setUser(res.user);
      setShop(res.shop);
      if (res.user.role === 'delivery') {
        setCurrentSpace('driver');
      } else if (res.user.role === 'superadmin') {
        setCurrentSpace('superadmin');
      } else {
        setCurrentSpace('merchant');
      }
    } catch (_err) {
      removeStoredToken();
      setUser(null);
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setShop(null);
    setCurrentSpace('merchant');
    setActiveTab('dashboard');
  };

  const handleQuickDemo = async (role: 'merchant' | 'delivery' | 'superadmin') => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/auth/quick-demo', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setStoredToken(res.token);
      setUser(res.user);
      setShop(res.shop || null);
      setCurrentSpace(role === 'delivery' ? 'driver' : role);
      setActiveTab(role === 'merchant' ? 'dashboard' : 'orders');
    } catch (err: any) {
      alert(err.message || 'Erreur chargement compte démo');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSpace = (space: 'merchant' | 'driver' | 'superadmin') => {
    setCurrentSpace(space);
    if (space === 'merchant') {
      setActiveTab('dashboard');
    }
  };

  // If loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Chargement de SOCIALCOM...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the Public Landing Homepage
  if (!user) {
    return (
      <>
        <HomePublic
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
          onQuickDemo={handleQuickDemo}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(data) => {
            setUser(data.user);
            setShop(data.shop || null);
            if (data.user?.role === 'delivery') {
              setCurrentSpace('driver');
            } else if (data.user?.role === 'superadmin') {
              setCurrentSpace('superadmin');
            } else {
              setCurrentSpace('merchant');
            }
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Render Logged-in App Shell
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Navbar */}
      <Navbar
        user={user}
        shop={shop}
        currentSpace={currentSpace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSwitchSpace={handleSwitchSpace}
        onOpenNewOrder={() => setQuickOrderOpen(true)}
        onOpenSupport={() => setSupportModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 flex-1">
        {/* DRIVER SPACE VIEW */}
        {currentSpace === 'driver' && <DriverSpaceView />}

        {/* SUPER ADMIN SPACE VIEW */}
        {currentSpace === 'superadmin' && <SuperAdminView />}

        {/* MERCHANT SPACE VIEW */}
        {currentSpace === 'merchant' && (
          <div className="space-y-6">
            {/* Desktop Tabs Header */}
            <div className="hidden lg:flex items-center gap-1 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
                { id: 'orders', label: 'Commandes', icon: ShoppingBag },
                { id: 'products', label: 'Produits & Stocks', icon: Package },
                { id: 'clients', label: 'Clients', icon: Users },
                { id: 'delivery', label: 'Livreurs & Espèces', icon: Truck },
                { id: 'finances', label: 'Finances & Dépenses', icon: DollarSign },
                { id: 'employees', label: 'Équipe', icon: UserCheck },
                { id: 'subscription', label: 'Abonnement', icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Views */}
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewOrder={() => setQuickOrderOpen(true)}
                onSelectTab={setActiveTab}
                onShareWhatsApp={(orderId) => setWhatsAppShareOrderId(orderId)}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersView
                onOpenNewOrder={() => setQuickOrderOpen(true)}
                onShareWhatsApp={(orderId) => setWhatsAppShareOrderId(orderId)}
              />
            )}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'delivery' && <DeliveryView />}
            {activeTab === 'finances' && <FinancesView />}
            {activeTab === 'employees' && <EmployeesView />}
            {activeTab === 'subscription' && (
              <SubscriptionView shop={shop} onRefreshShop={checkAuth} />
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR for quick thumb access */}
      {currentSpace === 'merchant' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold text-slate-500 shadow-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : ''
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tableau</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'orders' ? 'text-emerald-700 font-bold' : ''
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commandes</span>
          </button>

          {/* Quick Central Action Button */}
          <button
            onClick={() => setQuickOrderOpen(true)}
            className="w-11 h-11 -mt-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            title="Nouvelle commande express"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'products' ? 'text-emerald-700 font-bold' : ''
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stocks</span>
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            className={`flex flex-col items-center gap-1 p-1 rounded-lg ${
              activeTab === 'finances' ? 'text-emerald-700 font-bold' : ''
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finances</span>
          </button>
        </div>
      )}

      {/* MODALS */}
      <QuickOrderModal
        isOpen={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        onOrderCreated={(newOrder) => {
          setWhatsAppShareOrderId(newOrder.id);
        }}
      />

      <WhatsAppShareModal
        orderId={whatsAppShareOrderId}
        onClose={() => setWhatsAppShareOrderId(null)}
      />

      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
