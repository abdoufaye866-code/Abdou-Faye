import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Edit2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest, formatFCFA, formatDateFR } from '../lib/api.ts';
import { Shop, Plan } from '../types/index.ts';

export const SuperAdminView: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Response modal for ticket
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketResponse, setTicketResponse] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, ticketsRes] = await Promise.all([
        apiRequest('/api/admin/overview'),
        apiRequest('/api/admin/support-tickets'),
      ]);
      setOverview(ovRes);
      setTickets(ticketsRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShopStatus = async (shopId: number, status: string, extendDays = 0) => {
    try {
      await apiRequest(`/api/admin/shops/${shopId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, extendDays }),
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Erreur mise à jour boutique');
    }
  };

  const handleResolveTicket = async (ticketId: number) => {
    try {
      await apiRequest(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'resolved',
          adminResponse: ticketResponse,
        }),
      });
      setSelectedTicket(null);
      setTicketResponse('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Erreur réponse ticket');
    }
  };

  const ov = overview || {
    totalShops: 0,
    activeShops: 0,
    trialShops: 0,
    expiredShops: 0,
    suspendedShops: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalGMV: 0,
    mrr: 0,
    openTickets: 0,
    shops: [],
  };

  const filteredShops = (ov.shops as Shop[]).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : s.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Panneau Maître SOCIALCOM</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Administration Générale & Revenus SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des boutiques inscrites, contrôle des abonnements, MRR récurrent et assistance.
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 block font-semibold">MRR (Revenus Récurrents)</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block font-mono">
            {formatFCFA(ov.mrr)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Abonnements actifs mensuels</span>
        </div>

        {/* Total Shops */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-semibold">Boutiques Inscrites</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
            {ov.totalShops}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            {ov.activeShops} actives ({ov.trialShops} en essai)
          </span>
        </div>

        {/* Total GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-semibold">Volume d'Affaires Global (GMV)</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
            {formatFCFA(ov.totalGMV)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">{ov.totalOrders} commandes traitées</span>
        </div>

        {/* Support Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-semibold">Demandes d'Assistance</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block font-mono">
            {ov.openTickets}
          </span>
          <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Ticket(s) ouvert(s)</span>
        </div>
      </div>

      {/* SHOPS MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Boutiques Commerçantes Inscrites ({filteredShops.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion des forfaits, activation, prolongation et suspension
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Rechercher boutique, propriétaire, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs w-full sm:w-64 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="trial">En essai (14j)</option>
              <option value="expired">Expirées</option>
              <option value="suspended">Suspendues</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Boutique & Propriétaire</th>
                <th className="py-3.5 px-4 font-bold">Ville & Activité</th>
                <th className="py-3.5 px-4 font-bold">Forfait</th>
                <th className="py-3.5 px-4 font-bold">Statut Abonnement</th>
                <th className="py-3.5 px-4 font-bold">Date Création</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block text-sm">{shp.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {shp.ownerName} • {shp.phone}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{shp.city}</span>
                    <span className="text-[10px] text-slate-400">{shp.activity}</span>
                  </td>
                  <td className="py-3.5 px-4 uppercase font-bold text-emerald-800">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                      {shp.planId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        shp.subscriptionStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : shp.subscriptionStatus === 'trial'
                          ? 'bg-blue-100 text-blue-800'
                          : shp.subscriptionStatus === 'expired'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {shp.subscriptionStatus === 'active'
                        ? 'Actif'
                        : shp.subscriptionStatus === 'trial'
                        ? 'Essai 14j'
                        : shp.subscriptionStatus === 'expired'
                        ? 'Expiré'
                        : 'Suspendu'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {formatDateFR(shp.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {shp.subscriptionStatus !== 'active' && (
                        <button
                          onClick={() => handleUpdateShopStatus(shp.id, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition"
                        >
                          Activer
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateShopStatus(shp.id, shp.subscriptionStatus, 14)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                        title="Ajouter 14 jours d'essai gratuit"
                      >
                        +14j Essai
                      </button>

                      {shp.subscriptionStatus !== 'suspended' ? (
                        <button
                          onClick={() => handleUpdateShopStatus(shp.id, 'suspended')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px] transition"
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateShopStatus(shp.id, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition"
                        >
                          Débloquer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUPPORT TICKETS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Demandes d'Assistance & Support ({tickets.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Questions et tickets soumis par les commerçants
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Boutique</th>
                <th className="py-3 px-4 font-bold">Sujet & Message</th>
                <th className="py-3 px-4 font-bold">Priorité</th>
                <th className="py-3 px-4 font-bold">Statut</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Aucune demande d'assistance pour le moment.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {t.shopName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {t.contactPhone}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block">{t.subject}</span>
                      <span className="text-[11px] text-slate-600 line-clamp-1">{t.message}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.status === 'open' ? 'Ouvert' : 'Résolu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDateFR(t.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px]"
                      >
                        Répondre
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET RESPONSE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Répondre au Ticket d'Assistance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Boutique : <strong>{selectedTicket.shopName}</strong> ({selectedTicket.contactPhone})
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="font-bold text-slate-700 block mb-1">{selectedTicket.subject}</span>
                <p className="text-slate-600">{selectedTicket.message}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Votre réponse administrateur</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Expliquez la solution apportée..."
                  value={ticketResponse}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTicket(selectedTicket.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Résoudre & Clôturer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
