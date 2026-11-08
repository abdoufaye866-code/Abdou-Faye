import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  Truck,
  ArrowUpRight,
  Clock,
  CheckCircle,
  PlusCircle,
  Share2,
  Calendar,
  Layers,
  ChevronRight,
  Package,
} from 'lucide-react';
import { apiRequest, formatFCFA, formatDateFR } from '../lib/api.ts';
import { DashboardStats, Order } from '../types/index.ts';

interface DashboardViewProps {
  onOpenNewOrder: () => void;
  onSelectTab: (tab: string) => void;
  onShareWhatsApp: (orderId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewOrder,
  onSelectTab,
  onShareWhatsApp,
}) => {
  const [period, setPeriod] = useState<string>('this_month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardStats>(`/api/dashboard/stats?period=${period}`);
      setStats(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const s = stats || {
    period: 'this_month',
    totalOrdersCount: 0,
    statusCounts: {},
    totalSales: 0,
    totalCollected: 0,
    totalUnpaid: 0,
    totalDeliveryFees: 0,
    totalPurchaseCost: 0,
    grossMargin: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalCashInDriversHands: 0,
    expensesByCategory: {},
    sourceCounts: {},
    lowStockCount: 0,
    lowStockProducts: [],
    topItems: [],
    recentOrders: [],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tableau de bord financier & ventes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivez vos encaissements, livraisons et bénéfices nets en temps réel (FCFA).
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold self-start">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'today' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('this_week')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'this_week' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'this_month' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              period === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Low Stock Warning Alert Banner */}
      {s.lowStockCount > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Alerte Stock Faible ({s.lowStockCount} produit{s.lowStockCount > 1 ? 's' : ''})
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Certains articles sont presque en rupture :{' '}
                {s.lowStockProducts.map((p) => `${p.name} (${p.stockQuantity} restant${p.stockQuantity > 1 ? 's' : ''})`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('products')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0"
          >
            Gérer les stocks
          </button>
        </div>
      )}

      {/* PRIMARY FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chiffre d'Affaires */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Chiffre d'Affaires</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatFCFA(s.totalSales)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{s.totalOrdersCount} commandes</span>
            <span className="text-emerald-600 font-semibold">Liv: {formatFCFA(s.totalDeliveryFees)}</span>
          </div>
        </div>

        {/* Encaissements Réalisés */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Montants Encaissés</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-teal-700 tracking-tight">
            {formatFCFA(s.totalCollected)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {s.totalUnpaid > 0 ? (
              <span className="text-amber-600 font-semibold">Impayés : {formatFCFA(s.totalUnpaid)}</span>
            ) : (
              <span className="text-emerald-600">✓ 100% encaissé</span>
            )}
          </div>
        </div>

        {/* Espèces chez les Livreurs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Espèces chez Livreurs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-700 tracking-tight">
            {formatFCFA(s.totalCashInDriversHands)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <button
              onClick={() => onSelectTab('delivery')}
              className="text-amber-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Voir les versements</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bénéfice Net Estimé */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Bénéfice Net Estimé</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
            {formatFCFA(s.netProfit)}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Marge brute: {formatFCFA(s.grossMargin)} • Dépenses: -{formatFCFA(s.totalExpenses)}
          </div>
        </div>
      </div>

      {/* ORDERS BY STATUS PIPELINE */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Pipeline des commandes en cours
          </h2>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <span>Toutes les commandes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-xs text-slate-500 block">Nouvelles</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {s.statusCounts.new || 0}
            </span>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-center">
            <span className="text-xs text-blue-700 block">Confirmées</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">
              {s.statusCounts.confirmed || 0}
            </span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-center">
            <span className="text-xs text-amber-700 block">En Préparation</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">
              {s.statusCounts.preparation || 0}
            </span>
          </div>
          <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200 text-center">
            <span className="text-xs text-purple-700 block">Prêtes</span>
            <span className="text-xl font-black text-purple-900 mt-1 block">
              {s.statusCounts.ready || 0}
            </span>
          </div>
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200 text-center">
            <span className="text-xs text-indigo-700 block">En Livraison</span>
            <span className="text-xl font-black text-indigo-900 mt-1 block">
              {s.statusCounts.in_delivery || s.statusCounts.assigned || 0}
            </span>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 block">Livrées</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">
              {s.statusCounts.delivered || 0}
            </span>
          </div>
          <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-center col-span-2 sm:col-span-1">
            <span className="text-xs text-rose-700 block">Annulées/Retours</span>
            <span className="text-xl font-black text-rose-900 mt-1 block">
              {(s.statusCounts.cancelled || 0) + (s.statusCounts.returned || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: SOCIAL CHANNELS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Channels Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Ventes par Réseau Social
          </h2>
          <div className="space-y-3">
            {[
              { id: 'whatsapp', name: 'WhatsApp', color: 'bg-emerald-500', icon: '💬' },
              { id: 'tiktok', name: 'TikTok', color: 'bg-slate-900', icon: '🎵' },
              { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', icon: '📸' },
              { id: 'facebook', name: 'Facebook', color: 'bg-blue-600', icon: '👥' },
              { id: 'autre', name: 'Boutique / Autre', color: 'bg-slate-400', icon: '🌐' },
            ].map((ch) => {
              const data = s.sourceCounts[ch.id] || { count: 0, total: 0 };
              const percentage = s.totalSales > 0 ? Math.round((data.total / s.totalSales) * 100) : 0;
              return (
                <div key={ch.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span>{ch.icon}</span>
                      <span>{ch.name}</span>
                      <span className="text-slate-400">({data.count} cmd)</span>
                    </span>
                    <span className="font-mono text-slate-900">{formatFCFA(data.total)} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${ch.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Top Produits les plus vendus
            </h2>
            <button
              onClick={() => onSelectTab('products')}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              Gérer
            </button>
          </div>

          {s.topItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucune vente enregistrée pour cette période.
            </div>
          ) : (
            <div className="space-y-3">
              {s.topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                      {item.productName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block">{item.totalQty} vendus</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatFCFA(item.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Commandes Récentes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Dernières commandes enregistrées</p>
          </div>
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Commande</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">N° Commande</th>
                <th className="py-3 px-4">Client & Quartier</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Montant Total</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Aucune commande pour l'instant.
                  </td>
                </tr>
              ) : (
                s.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ord.clientName}</div>
                      <div className="text-[11px] text-slate-400">
                        {ord.neighborhood || ord.city} • {ord.clientPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {ord.source === 'whatsapp' ? '💬 WhatsApp' : ord.source === 'tiktok' ? '🎵 TikTok' : ord.source === 'instagram' ? '📸 Instagram' : '👥 Facebook'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {formatFCFA(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ord.paymentStatus === 'paid'
                          ? 'Payé'
                          : ord.paymentStatus === 'partial'
                          ? 'Acompte'
                          : 'Non payé'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'in_delivery' || ord.status === 'assigned'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ord.status === 'preparation'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'cancelled' || ord.status === 'returned'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {ord.status === 'new'
                          ? 'Nouvelle'
                          : ord.status === 'confirmed'
                          ? 'Confirmée'
                          : ord.status === 'preparation'
                          ? 'Préparation'
                          : ord.status === 'ready'
                          ? 'Prête'
                          : ord.status === 'in_delivery'
                          ? 'En livraison'
                          : ord.status === 'delivered'
                          ? 'Livrée'
                          : ord.status === 'cancelled'
                          ? 'Annulée'
                          : 'Retournée'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onShareWhatsApp(ord.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition"
                        title="Partager sur WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
