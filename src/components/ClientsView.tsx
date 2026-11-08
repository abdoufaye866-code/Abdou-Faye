import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';
import { apiRequest, formatFCFA, formatDateFR } from '../lib/api.ts';
import { Client, Order } from '../types/index.ts';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected client for history
  const [selectedClient, setSelectedClient] = useState<{ client: Client; orders: Order[] } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Client[]>('/api/clients');
      setClients(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientDetails = async (client: Client) => {
    try {
      setLoadingDetails(true);
      const res = await apiRequest<{ client: Client; orders: Order[] }>(`/api/clients/${client.id}`);
      setSelectedClient(res);
    } catch (err: any) {
      alert(err.message || 'Erreur détails client');
    } finally {
      setLoadingDetails(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.neighborhood && c.neighborhood.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fiches & Portefeuille Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Recherche par téléphone, historique d'achats et suivi des impayés à recouvrer.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par numéro de téléphone (ex: 77 123 45 67) ou par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Chargement des fiches clients...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Aucun client enregistré pour l'instant.
          </div>
        ) : (
          filtered.map((cl) => {
            const cleanPhone = cl.phone.replace(/[^0-9]/g, '');
            const phoneWithCode = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
            const waUrl = `https://wa.me/${phoneWithCode}`;

            return (
              <div
                key={cl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cl.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cl.phone}</span>
                      </div>
                    </div>

                    {cl.unpaidAmount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Impayé: {formatFCFA(cl.unpaidAmount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{cl.neighborhood ? `${cl.neighborhood}, ` : ''}{cl.address || cl.city}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Commandes</span>
                      <span className="font-bold text-slate-800 text-sm">{cl.totalOrders}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Dépenses totales</span>
                      <span className="font-bold text-emerald-700 text-sm font-mono">{formatFCFA(cl.totalSpent)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => handleOpenClientDetails(cl)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Historique</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CLIENT DETAILS MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedClient.client.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedClient.client.phone} • {selectedClient.client.neighborhood || selectedClient.client.city}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Total Dépensé</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {formatFCFA(selectedClient.client.totalSpent)}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Impayés Enregistrés</span>
                <span className="text-base font-black text-rose-600 font-mono">
                  {formatFCFA(selectedClient.client.unpaidAmount)}
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Historique des commandes ({selectedClient.orders.length})
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedClient.orders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Aucune commande enregistrée pour ce client.
                </div>
              ) : (
                selectedClient.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateFR(ord.createdAt)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        {formatFCFA(ord.totalAmount)}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600">
                        {ord.status === 'delivered' ? 'Livré' : ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
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
