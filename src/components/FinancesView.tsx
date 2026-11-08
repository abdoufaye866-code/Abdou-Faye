import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PlusCircle,
  Calendar,
  Tag,
  Trash2,
  X,
  CreditCard,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest, formatFCFA, formatDateFR } from '../lib/api.ts';
import { Expense } from '../types/index.ts';

export const FinancesView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add expense modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('pub_social');
  const [expenseAmount, setExpenseAmount] = useState<number>(10000);
  const [expenseNotes, setExpenseNotes] = useState('');

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    try {
      setLoading(true);
      const [statsRes, expensesRes, paymentsRes] = await Promise.all([
        apiRequest('/api/dashboard/stats?period=this_month'),
        apiRequest<Expense[]>('/api/expenses'),
        apiRequest<any[]>('/api/payments'),
      ]);
      setStats(statsRes);
      setExpenses(expensesRes);
      setPayments(paymentsRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: expenseTitle,
          category: expenseCategory,
          amount: Number(expenseAmount),
          notes: expenseNotes,
        }),
      });
      setIsAddExpenseOpen(false);
      setExpenseTitle('');
      setExpenseAmount(10000);
      setExpenseNotes('');
      loadFinances();
    } catch (err: any) {
      alert(err.message || 'Erreur ajout dépense');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await apiRequest(`/api/expenses/${id}`, { method: 'DELETE' });
      loadFinances();
    } catch (err: any) {
      alert(err.message || 'Erreur suppression dépense');
    }
  };

  const s = stats || {
    totalSales: 0,
    totalCollected: 0,
    totalUnpaid: 0,
    totalPurchaseCost: 0,
    grossMargin: 0,
    totalDeliveryFees: 0,
    totalExpenses: 0,
    netProfit: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Comptabilité, Dépenses & Résultat Net
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Calcul distinct du chiffre d'affaires, marge brute, charges publicitaires et bénéfice net (FCFA).
          </p>
        </div>

        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>+ Ajouter une Dépense</span>
        </button>
      </div>

      {/* COMPTE DE RÉSULTAT SIMPLIFIÉ (Income Statement) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-black tracking-tight">
              Calcul du Bénéfice Réel (Ce mois)
            </h2>
            <p className="text-xs text-slate-400">
              Formule comptable certifiée pour commerçants sur réseaux sociaux
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
            FCFA (XOF)
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm">
          {/* 1. CA */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-700">1. Chiffre d'Affaires Brut (Ventes livrées/confirmées) :</span>
            <span className="font-mono font-bold text-slate-900 text-base">{formatFCFA(s.totalSales)}</span>
          </div>

          {/* 2. Coût d'achat */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-rose-600">
            <span className="font-medium">2. Moins : Coût d'achat des produits vendus (Fournisseurs) :</span>
            <span className="font-mono font-bold">- {formatFCFA(s.totalPurchaseCost)}</span>
          </div>

          {/* 3. Marge brute */}
          <div className="flex items-center justify-between py-2.5 bg-emerald-50/60 px-3 rounded-xl border border-emerald-100 font-bold text-emerald-900">
            <span>= Marge Brute d'Exploitation :</span>
            <span className="font-mono text-base">{formatFCFA(s.grossMargin)}</span>
          </div>

          {/* 4. Dépenses opérationnelles */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-rose-600">
            <span className="font-medium">
              4. Moins : Dépenses opérationnelles (Pub TikTok/FB, Emballages, etc.) :
            </span>
            <span className="font-mono font-bold">- {formatFCFA(s.totalExpenses)}</span>
          </div>

          {/* 5. Résultat Net */}
          <div className="flex items-center justify-between py-4 bg-slate-900 text-white px-4 rounded-xl font-bold shadow-sm">
            <div>
              <span className="text-base sm:text-lg block">★ RÉSULTAT NET ESTIMÉ (Bénéfice en poche) :</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Ce montant représente votre gain net réel après déduction de toutes les charges.
              </span>
            </div>
            <span className="font-mono text-xl sm:text-2xl text-emerald-400 font-black">
              {formatFCFA(s.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: EXPENSES LIST & PAYMENTS LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Dépenses & Charges de la Boutique
            </h2>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              + Ajouter
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucune dépense enregistrée. Ajoutez vos frais de pub ou emballages.
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{exp.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {exp.expenseDate} •{' '}
                      <span className="capitalize">
                        {exp.category === 'pub_social'
                          ? 'Pub TikTok / Facebook'
                          : exp.category === 'packaging'
                          ? 'Emballage kraft'
                          : exp.category === 'transport'
                          ? 'Transport / Carburant'
                          : 'Autre charge'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-600">
                      -{formatFCFA(exp.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Historique des Encaissements
          </h2>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aucun paiement enregistré pour l'instant.
            </div>
          ) : (
            <div className="space-y-2.5">
              {payments.slice(0, 8).map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">
                      {pay.type === 'cash_remittance'
                        ? 'Versement espèces livreur'
                        : `Paiement Commande #${pay.orderId || ''}`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateFR(pay.createdAt)} • Par {pay.recordedBy || 'Commerçant'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 block">
                      +{formatFCFA(pay.amount)}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      {pay.method === 'wave' ? 'Wave' : pay.method === 'orange_money' ? 'Orange Money' : 'Espèces'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAddExpenseOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              Ajouter une Dépense de la Boutique
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intitulé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boost publicité TikTok & Instagram"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="pub_social">Publicité TikTok / Facebook</option>
                    <option value="packaging">Sacs & Emballage kraft</option>
                    <option value="transport">Transport & Carburant</option>
                    <option value="connexion">Internet / Forfait 4G</option>
                    <option value="loyer">Loyer local / Showroom</option>
                    <option value="salaire">Salaires collaborateurs</option>
                    <option value="autre">Autre dépense</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Détails</label>
                <input
                  type="text"
                  placeholder="Détails complémentaires..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition"
                >
                  Enregistrer la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
