import React, { useState, useEffect } from 'react';
import {
  Truck,
  PlusCircle,
  Phone,
  DollarSign,
  CheckCircle,
  Clock,
  Key,
  X,
  CreditCard,
  ArrowDownLeft,
} from 'lucide-react';
import { apiRequest, formatFCFA } from '../lib/api.ts';
import { DeliveryAgent } from '../types/index.ts';

export const DeliveryView: React.FC = () => {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [remittingAgent, setRemittingAgent] = useState<DeliveryAgent | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<'moto' | 'voiture' | 'velo' | 'autre'>('moto');
  const [licensePlate, setLicensePlate] = useState('');
  const [pinCode, setPinCode] = useState('1234');

  // Remittance
  const [remitAmount, setRemitAmount] = useState<number>(0);
  const [remitMethod, setRemitMethod] = useState<'cash' | 'wave' | 'orange_money'>('cash');
  const [remitNotes, setRemitNotes] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DeliveryAgent[]>('/api/delivery-agents');
      setAgents(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/delivery-agents', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone,
          vehicleType,
          licensePlate,
          pinCode,
        }),
      });
      setIsAddModalOpen(false);
      setFullName('');
      setPhone('');
      setLicensePlate('');
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Erreur création livreur');
    }
  };

  const handleRecordRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittingAgent) return;
    try {
      await apiRequest(`/api/delivery-agents/${remittingAgent.id}/remit-cash`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(remitAmount),
          method: remitMethod,
          notes: remitNotes,
        }),
      });
      setRemittingAgent(null);
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement versement');
    }
  };

  const totalDueFromAllDrivers = agents.reduce(
    (sum, a) => sum + (a.remainingCashToRemit || 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestion des Livreurs & Encaissements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des courses en cours, espèces collectées et versements à effectuer.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Enregistrer un Livreur</span>
        </button>
      </div>

      {/* Global Cash in hand banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
              Total espèces restant chez les livreurs
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono">
              {formatFCFA(totalDueFromAllDrivers)}
            </span>
          </div>
        </div>
        <p className="text-xs text-amber-100 max-w-xs">
          Cette somme a été encaissée auprès des clients et doit être reversée à la boutique en fin de journée.
        </p>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Chargement des livreurs...
          </div>
        ) : agents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Aucun livreur enregistré. Cliquez sur « Enregistrer un Livreur » pour ajouter votre premier coursier.
          </div>
        ) : (
          agents.map((ag) => (
            <div
              key={ag.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{ag.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono">{ag.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                    {ag.vehicleType}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Code PIN d'accès mobile : <strong className="font-mono text-slate-800">{ag.pinCode}</strong></span>
                </div>

                {/* Financial balances */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Livraisons en cours :</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {ag.activeOrdersCount || 0} active(s)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total espèces encaissées :</span>
                    <span className="font-mono font-semibold text-slate-700">{formatFCFA(ag.cashCollected)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total déjà reversé :</span>
                    <span className="font-mono text-emerald-600">{formatFCFA(ag.cashRemitted)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold">
                    <span className="text-slate-900">Reste à vous reverser :</span>
                    <span className="font-mono text-amber-700 text-sm">
                      {formatFCFA(ag.remainingCashToRemit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setRemittingAgent(ag);
                    setRemitAmount(ag.remainingCashToRemit || 0);
                    setRemitNotes('');
                  }}
                  disabled={(ag.remainingCashToRemit || 0) <= 0}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Enregistrer un versement</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD AGENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              Enregistrer un Livreur
            </h3>

            <form onSubmit={handleAddAgent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom complet du livreur *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Moussa Ndiaye"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Numéro de téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 77 890 55 66"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type de véhicule</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="moto">Moto</option>
                    <option value="voiture">Voiture</option>
                    <option value="velo">Vélo</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code PIN (4 chiffres)</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plaque d'immatriculation (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: DK-4589-AF"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD CASH REMITTANCE MODAL */}
      {remittingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setRemittingAgent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Enregistrer un Versement d'Espèces
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Livreur : <strong>{remittingAgent.fullName}</strong>
            </p>

            <form onSubmit={handleRecordRemittance} className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                <span className="text-[10px] uppercase font-bold block">Somme restante due :</span>
                <span className="text-lg font-black font-mono">
                  {formatFCFA(remittingAgent.remainingCashToRemit)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Montant remis par le livreur (FCFA) *
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={remitAmount}
                  onChange={(e) => setRemitAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mode de remise</label>
                <select
                  value={remitMethod}
                  onChange={(e) => setRemitMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="cash">💵 Espèces en main propre</option>
                  <option value="wave">💙 Virement Wave du livreur</option>
                  <option value="orange_money">🧡 Virement Orange Money</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commentaires / Reçu</label>
                <input
                  type="text"
                  placeholder="Ex: Versement fin de journée courses Dakar"
                  value={remitNotes}
                  onChange={(e) => setRemitNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRemittingAgent(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md transition"
                >
                  Confirmer l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
