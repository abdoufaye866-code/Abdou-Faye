import React, { useState, useEffect } from 'react';
import {
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { apiRequest, formatFCFA } from '../lib/api.ts';
import { Order, DeliveryAgent } from '../types/index.ts';
import confetti from 'canvas-confetti';

interface DriverDeliveriesResponse {
  agent: DeliveryAgent;
  deliveries: Order[];
  stats: {
    totalCollected: number;
    totalRemitted: number;
    dueToMerchant: number;
  };
}

export const DriverSpaceView: React.FC = () => {
  const [data, setData] = useState<DriverDeliveriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal for confirming delivery and collected cash
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [proofNote, setProofNote] = useState<string>('Encaissé en espèces par le livreur');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DriverDeliveriesResponse>('/api/driver/my-deliveries');
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string, amount: number = 0) => {
    try {
      await apiRequest(`/api/driver/orders/${orderId}/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          amountCollected: amount,
          proofNote,
        }),
      });

      if (status === 'delivered') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setConfirmingOrder(null);
      loadDeliveries();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  const agent = data?.agent;
  const deliveries = data?.deliveries || [];
  const stats = data?.stats || { totalCollected: 0, totalRemitted: 0, dueToMerchant: 0 };

  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== 'delivered' && d.status !== 'cancelled' && d.status !== 'returned'
  );
  const completedDeliveries = deliveries.filter((d) => d.status === 'delivered');

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Driver Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
                Espace Livreur Moto
              </span>
              <h1 className="text-xl font-black">{agent?.fullName || 'Livreur'}</h1>
              <span className="text-xs text-amber-100 font-mono">{agent?.phone}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold">
            {pendingDeliveries.length} à livrer
          </span>
        </div>

        {/* Financial Counter for Driver */}
        <div className="mt-4 pt-3 border-t border-amber-500/40 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-amber-800/40 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-amber-200 text-[10px] block">Espèces encaissées</span>
            <span className="text-base font-black font-mono mt-0.5 block">
              {formatFCFA(stats.totalCollected)}
            </span>
          </div>

          <div className="bg-amber-800/40 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-amber-200 text-[10px] block">À reverser à la boutique</span>
            <span className="text-base font-black font-mono text-amber-300 mt-0.5 block">
              {formatFCFA(stats.dueToMerchant)}
            </span>
          </div>
        </div>
      </div>

      {/* PENDING DELIVERIES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Courses à livrer ({pendingDeliveries.length})
          </h2>
          <span className="text-xs text-slate-400">Ordre d'urgence</span>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-2xs">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">Toutes les courses sont terminées !</h3>
            <p className="text-xs text-slate-500 mt-1">
              Vous n'avez aucune livraison en attente pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDeliveries.map((order) => {
              const cleanPhone = order.clientPhone.replace(/[^0-9]/g, '');
              const phoneWithCode = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
              const waUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(
                `Bonjour ${order.clientName}, c'est votre livreur pour votre commande #${order.orderNumber}. Je suis en route vers votre adresse.`
              )}`;

              const amountToCollect = Math.max(0, order.totalAmount - order.amountPaid);

              return (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md space-y-4"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {order.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {order.status === 'in_delivery' ? 'En cours de route' : 'Assignée'}
                      </span>
                    </div>

                    {/* Amount to collect in big numbers */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        À Encaisser
                      </span>
                      <span className="text-xl font-black text-amber-700 font-mono block">
                        {formatFCFA(amountToCollect)}
                      </span>
                    </div>
                  </div>

                  {/* Client & Address Info with Big touch targets */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Client :</span>
                      <span className="font-bold text-slate-900 text-sm block">
                        {order.clientName}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {order.neighborhood || order.city}
                        </span>
                        <span className="text-slate-600 block mt-0.5">
                          {order.deliveryAddress}
                        </span>
                      </div>
                    </div>

                    {/* Products recap */}
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <span className="font-semibold text-slate-700">Colis : </span>
                      {order.items?.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>
                  </div>

                  {/* Driver Fast Action Buttons: Call & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Appeler Client</span>
                    </a>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Delivery Status buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    {order.status !== 'in_delivery' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                        className="w-full py-2.5 rounded-xl border border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition"
                      >
                        🛵 Démarrer la course (En route)
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setConfirmingOrder(order);
                        setCollectedAmount(amountToCollect);
                      }}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Check className="w-5 h-5" />
                      <span>Confirmer Livré & Encaissé ({formatFCFA(amountToCollect)})</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'returned')}
                      className="w-full py-1.5 text-slate-400 hover:text-rose-600 text-xs font-semibold"
                    >
                      Signaler échec / Client absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED DELIVERIES TODAY */}
      {completedDeliveries.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 px-1">
            Courses terminées aujourd'hui ({completedDeliveries.length})
          </h2>
          <div className="space-y-2">
            {completedDeliveries.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 block">
                    {ord.orderNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {ord.clientName} • {ord.neighborhood || ord.city}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700 block">
                    {formatFCFA(ord.amountPaid || ord.totalAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Livré</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL WITH CASH INPUT */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Validation de la Livraison
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Commande {confirmingOrder.orderNumber} pour {confirmingOrder.clientName}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Montant en espèces encaissé auprès du client (FCFA) *
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-emerald-500 text-lg font-mono font-black text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Note de confirmation (optionnelle)
                </label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStatus(confirmingOrder.id, 'delivered', collectedAmount)
                  }
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Confirmer Livré & Encaissé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
