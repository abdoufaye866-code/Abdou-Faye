import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { apiRequest, formatFCFA } from '../lib/api.ts';
import { Shop, Plan } from '../types/index.ts';
import confetti from 'canvas-confetti';

interface SubscriptionViewProps {
  shop: Shop | null;
  onRefreshShop: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  shop,
  onRefreshShop,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [paymentPhone, setPaymentPhone] = useState('77 450 12 34');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Plan[]>('/api/subscriptions/plans');
      setPlans(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      await apiRequest('/api/subscriptions/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          paymentMethod: 'wave',
          paymentReference: `WAVE-SN-${Date.now().toString().slice(-6)}`,
        }),
      });

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });

      alert(`Félicitations ! Votre abonnement pour le forfait ${planId.toUpperCase()} est maintenant actif.`);
      setUpgradingPlanId(null);
      onRefreshShop();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de forfait');
    }
  };

  const isTrial = shop?.subscriptionStatus === 'trial';
  const currentPlanId = shop?.planId || 'starter';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Current Subscription Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              {isTrial ? 'Période d’essai gratuit (14 jours)' : `Forfait ${shop?.planId?.toUpperCase()} Actif`}
            </span>
            <span className="text-xs text-emerald-200">
              Statut : <strong className="capitalize">{shop?.subscriptionStatus}</strong>
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black">
            Boutique : {shop?.name}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-emerald-100 max-w-xl">
            {isTrial
              ? 'Vous profitez actuellement de toutes les fonctionnalités de SOCIALCOM. Vous pouvez activer votre abonnement mensuel à tout moment par Wave ou Orange Money.'
              : 'Votre boutique bénéficie de l’ensemble des fonctionnalités de gestion de commandes, livreurs et comptabilité.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-100">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Essai sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Données isolées et sécurisées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            Forfaits Mensuels SOCIALCOM
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Payez facilement par Wave ou Orange Money au Sénégal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlanId === p.id;
            let featuresList: string[] = [];
            try {
              featuresList = JSON.parse(p.features);
            } catch {
              featuresList = [p.features];
            }

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-6 border-2 flex flex-col justify-between transition ${
                  isCurrent
                    ? 'border-emerald-600 shadow-lg relative'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                    Forfait Actuel
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {formatFCFA(p.priceMonth)}
                    </span>
                    <span className="text-xs text-slate-500">/ mois</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                    {featuresList.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs"
                    >
                      Votre Forfait Actuel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(p.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                    >
                      Activer avec Wave / OM
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment methods badge */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Paiements Mobile Money au Sénégal</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Wave, Orange Money et Free Money acceptés pour le règlement de vos abonnements.
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          Support WhatsApp : +221 77 450 12 34
        </span>
      </div>
    </div>
  );
};
