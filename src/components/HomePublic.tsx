import React from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Smartphone,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HomePublicProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onQuickDemo: (role: 'merchant' | 'delivery' | 'superadmin') => void;
}

export const HomePublic: React.FC<HomePublicProps> = ({ onOpenAuth, onQuickDemo }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Demo Bar for immediate testing */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-2.5 px-4 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tester les 3 espaces instantanément (sans saisie) :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onQuickDemo('merchant')}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
            >
              🛍️ Espace Commerçant
            </button>
            <button
              onClick={() => onQuickDemo('delivery')}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition"
            >
              🛵 Espace Livreur
            </button>
            <button
              onClick={() => onQuickDemo('superadmin')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition"
            >
              👑 Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent">
                SOCIALCOM
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                Sénégal & UEMOA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition"
            >
              Connexion
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              Essai Gratuit 14 Jours
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Conçu pour les vendeurs WhatsApp, TikTok, Instagram & Facebook</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Toutes vos commandes, vos livraisons et{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                votre argent
              </span>{' '}
              au même endroit.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Ne perdez plus aucune vente dans vos discussions WhatsApp. Suivez vos stocks,
              assignez vos livreurs motos en 1 clic, encaissez par Wave & Orange Money et
              connaissez votre bénéfice net en FCFA.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Créer ma boutique gratuitement</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onQuickDemo('merchant')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-semibold text-base transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Voir la démo en direct</span>
              </button>
            </div>

            {/* Social channels badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Direct
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-black" /> TikTok Shop Dakar
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-pink-500" /> Instagram Reels
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> Facebook Ads & Groupes
              </span>
            </div>
          </div>

          {/* Interactive mockup preview banner */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl bg-slate-900 p-2 sm:p-4 shadow-2xl shadow-emerald-900/10 border border-slate-800">
            <div className="bg-slate-950 rounded-xl p-4 sm:p-6 text-white">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono text-slate-400">tableau-de-bord / dakar-mode-beaute</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                  En direct — FCFA
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Ventes du jour</span>
                  <span className="text-xl sm:text-2xl font-black text-white mt-1 block">142 500 FCFA</span>
                  <span className="text-[10px] text-emerald-400 mt-1 block font-medium">↑ +18% vs hier</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Encaissé Wave / Cash</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">115 000 FCFA</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Reste à livrer : 27 500 F</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Espèces chez livreurs</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block">45 000 FCFA</span>
                  <span className="text-[10px] text-amber-300/80 mt-1 block">À reverser ce soir</span>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Bénéfice net estimé</span>
                  <span className="text-xl sm:text-2xl font-black text-teal-300 mt-1 block">58 200 FCFA</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Marge nette ~41%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Pourquoi les meilleurs commerçants sénégalais choisissent SOCIALCOM ?
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Fini le désordre des messages non lus et les livreurs qui égarent l’argent des encaissements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Saisie de commande en 20 secondes</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Nom du client, quartier de Dakar, articles et prix. Générez instantanément un récapitulatif
                professionnel prêt à être envoyé sur WhatsApp d'un simple clic.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Espace livreurs & contrôle des espèces</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Vos livreurs disposent de leur propre interface sur mobile. Ils valident les livraisons
                et SOCIALCOM calcule exactement la somme en espèces qu'ils doivent vous reverser.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Bénéfices réels et marge nette en FCFA</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Le chiffre d'affaires n'est pas votre bénéfice. Déduisez vos prix d'achat, frais de livraison
                et dépenses de publicité TikTok/Facebook pour savoir exactement ce que vous gagnez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 bg-slate-100 border-t border-slate-200" id="tarifs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Tarification simple & transparente
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-900">
              Des forfaits adaptés aux commerçants africains
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Commencez avec <strong>14 jours d'essai gratuit</strong> sans carte bancaire. Payez ensuite par Wave ou Orange Money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">Pour les commerçants qui débutent seuls</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">5 000</span>
                  <span className="text-sm font-semibold text-slate-500">FCFA / mois</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1 boutique & 1 utilisateur</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Produits & commandes illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fiches clients & historique</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Partage récapitulatif WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Statistiques simples de ventes</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm transition"
              >
                Tester le forfait Starter
              </button>
            </div>

            {/* Business (Popular) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-emerald-600 shadow-xl relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Le Plus Choisi
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Business</h3>
                <p className="text-xs text-slate-500 mt-1">Pour les boutiques avec livreurs et équipe</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">10 000</span>
                  <span className="text-sm font-semibold text-slate-500">FCFA / mois</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Jusqu'à 5 utilisateurs</strong> (gérants, agents)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Espace livreurs dédié</strong> sur mobile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Suivi des espèces & versements livreurs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Calcul marge brute & dépenses pub</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Alertes stock faible automatiques</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
              >
                Commencer l'essai Business
              </button>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pro</h3>
                <p className="text-xs text-slate-500 mt-1">Pour les grandes enseignes et multi-vendeurs</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">15 000</span>
                  <span className="text-sm font-semibold text-slate-500">FCFA / mois</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Collaborateurs & livreurs illimités</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Rapports financiers complets & P&L</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Export des commandes en Excel / CSV</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Support prioritaire VIP WhatsApp 7j/7</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 rounded-xl border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 font-bold text-sm transition"
              >
                Tester le forfait Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
            <span className="font-extrabold tracking-wider">SOCIALCOM</span>
            <span className="text-slate-500">— Dakar, Sénégal</span>
          </div>
          <p>© {new Date().getFullYear()} SOCIALCOM SaaS. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Devise : FCFA (XOF)</span>
            <span>•</span>
            <button onClick={() => onQuickDemo('superadmin')} className="hover:text-white">
              Espace Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
