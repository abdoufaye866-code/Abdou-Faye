import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  Filter,
  Share2,
  Phone,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { apiRequest, formatFCFA, formatDateFR } from '../lib/api.ts';
import { Order, DeliveryAgent } from '../types/index.ts';

interface OrdersViewProps {
  onOpenNewOrder: () => void;
  onShareWhatsApp: (orderId: number) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenNewOrder,
  onShareWhatsApp,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
    loadDeliveryAgents();
  }, [statusFilter, paymentFilter, sourceFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (search) params.set('search', search);

      const res = await apiRequest<Order[]>(`/api/orders?${params.toString()}`);
      setOrders(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryAgents = async () => {
    try {
      const res = await apiRequest<DeliveryAgent[]>('/api/delivery-agents');
      setDeliveryAgents(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour statut');
    }
  };

  const handleAssignDriver = async (orderId: number, driverId: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedDeliveryId: driverId ? Number(driverId) : null,
          status: driverId ? 'assigned' : 'confirmed',
        }),
      });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur affectation livreur');
    }
  };

  const handleUpdatePayment = async (orderId: number, newPaymentStatus: string) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const amountPaid = newPaymentStatus === 'paid' ? targetOrder?.totalAmount : 0;
      await apiRequest(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ paymentStatus: newPaymentStatus, amountPaid }),
      });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour paiement');
    }
  };

  const filteredOrders = search
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.clientName.toLowerCase().includes(search.toLowerCase()) ||
          o.clientPhone.includes(search) ||
          (o.neighborhood && o.neighborhood.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestion des Commandes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi rapide, affectation aux livreurs moto et partage WhatsApp en 1 clic.
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvelle Commande</span>
        </button>
      </div>

      {/* Search & Filters FilterBar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher par n° de commande, client, téléphone, quartier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Quick status filter pills */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="new">Nouvelles</option>
              <option value="confirmed">Confirmées</option>
              <option value="preparation">En Préparation</option>
              <option value="ready">Prêtes</option>
              <option value="in_delivery">En Livraison</option>
              <option value="delivered">Livrées</option>
              <option value="cancelled">Annulées</option>
              <option value="returned">Retournées</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white outline-none"
            >
              <option value="all">Tous paiements</option>
              <option value="unpaid">Non payé</option>
              <option value="partial">Acompte / Partiel</option>
              <option value="paid">Payé</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white outline-none"
            >
              <option value="all">Tous réseaux</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="instagram">📸 Instagram</option>
              <option value="facebook">👥 Facebook</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">N° Commande</th>
                <th className="py-3.5 px-4 font-bold">Client & Quartier</th>
                <th className="py-3.5 px-4 font-bold">Articles</th>
                <th className="py-3.5 px-4 font-bold">Total Net</th>
                <th className="py-3.5 px-4 font-bold">Paiement</th>
                <th className="py-3.5 px-4 font-bold">Livreur Moto</th>
                <th className="py-3.5 px-4 font-bold">Statut</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Chargement des commandes...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Aucune commande trouvée pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDateFR(ord.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{ord.clientName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{ord.clientPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {ord.neighborhood ? `${ord.neighborhood}, ` : ''}{ord.deliveryAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 max-w-[160px]">
                        {ord.items && ord.items.length > 0 ? (
                          <span>
                            {ord.items[0].quantity}x {ord.items[0].productName}
                            {ord.items.length > 1 && (
                              <span className="text-slate-400 font-semibold block text-[10px]">
                                + {ord.items.length - 1} autre(s)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">Détails articles</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-slate-900 block">
                        {formatFCFA(ord.totalAmount)}
                      </span>
                      {ord.deliveryFee > 0 && (
                        <span className="text-[10px] text-slate-400">
                          dont liv. {formatFCFA(ord.deliveryFee)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={ord.paymentStatus}
                        onChange={(e) => handleUpdatePayment(ord.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full outline-none cursor-pointer border ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ord.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <option value="unpaid">Non payé</option>
                        <option value="partial">Acompte</option>
                        <option value="paid">Payé ✓</option>
                      </select>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {ord.paymentMethod === 'wave' ? 'Wave' : ord.paymentMethod === 'orange_money' ? 'Orange Money' : 'Espèces'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={ord.assignedDeliveryId || ''}
                        onChange={(e) => handleAssignDriver(ord.id, e.target.value)}
                        className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none max-w-[130px] truncate"
                      >
                        <option value="">Non affecté</option>
                        {deliveryAgents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            🛵 {ag.fullName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full outline-none cursor-pointer border ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : ord.status === 'in_delivery' || ord.status === 'assigned'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : ord.status === 'preparation'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : ord.status === 'cancelled' || ord.status === 'returned'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <option value="new">Nouvelle</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="preparation">En Préparation</option>
                        <option value="ready">Prête</option>
                        <option value="assigned">Affectée livreur</option>
                        <option value="in_delivery">En Livraison</option>
                        <option value="delivered">Livrée ✓</option>
                        <option value="cancelled">Annulée ✗</option>
                        <option value="returned">Retournée ↩</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onShareWhatsApp(ord.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          title="Partager le récapitulatif sur WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                          title="Voir tous les détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Commande {selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatDateFR(selectedOrder.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">Client :</span>
                <div className="font-semibold text-slate-900">{selectedOrder.clientName}</div>
                <div className="text-slate-600">Tel: {selectedOrder.clientPhone}</div>
                <div className="text-slate-600 mt-1">
                  Adresse: {selectedOrder.deliveryAddress} ({selectedOrder.neighborhood || selectedOrder.city})
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-2">Articles commandés :</span>
                <div className="space-y-1.5">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50">
                      <span>{it.quantity}x {it.productName}</span>
                      <span className="font-mono font-bold">{formatFCFA(it.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-sm">
                <span>Total Net à encaisser :</span>
                <span className="font-mono text-emerald-700">{formatFCFA(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => {
                  onShareWhatsApp(selectedOrder.id);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager sur WhatsApp</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
