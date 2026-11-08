import React from 'react';
import {
  ShoppingBag,
  PlusCircle,
  LogOut,
  Truck,
  ShieldAlert,
  HelpCircle,
  CreditCard,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { User, Shop } from '../types/index.ts';

interface NavbarProps {
  user: User;
  shop: Shop | null;
  currentSpace: 'merchant' | 'driver' | 'superadmin';
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSwitchSpace: (space: 'merchant' | 'driver' | 'superadmin') => void;
  onOpenNewOrder: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  shop,
  currentSpace,
  activeTab,
  onSelectTab,
  onSwitchSpace,
  onOpenNewOrder,
  onOpenSupport,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Banner if Trial active */}
      {shop && shop.subscriptionStatus === 'trial' && currentSpace === 'merchant' && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
          <span>✨ Période d'essai gratuit active (14 jours)</span>
          <button
            onClick={() => onSelectTab('subscription')}
            className="underline font-bold hover:text-emerald-200"
          >
            Choisir un forfait
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand / Shop Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                {shop ? shop.name : 'SOCIALCOM'}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                {shop ? shop.city : 'Sénégal'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{user.fullName}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-emerald-700">
                {user.role === 'superadmin' ? 'Super Admin' : user.role === 'delivery' ? 'Livreur' : 'Commerçant'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Space switcher for evaluator & user */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => onSwitchSpace('merchant')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              currentSpace === 'merchant'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Commerçant</span>
          </button>
          <button
            onClick={() => onSwitchSpace('driver')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              currentSpace === 'driver'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Livreur</span>
          </button>
          <button
            onClick={() => onSwitchSpace('superadmin')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              currentSpace === 'superadmin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentSpace === 'merchant' && (
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Commande</span>
              <span className="sm:hidden">+ Commande</span>
            </button>
          )}

          <PWAInstallButton />

          <button
            onClick={onOpenSupport}
            className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition hidden sm:block"
            title="Besoin d'aide ou assistance"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sub-bar on mobile for Space switching */}
      <div className="lg:hidden flex border-t border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold justify-around">
        <button
          onClick={() => onSwitchSpace('merchant')}
          className={`px-3 py-1 rounded-lg ${
            currentSpace === 'merchant' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          🛍️ Commerçant
        </button>
        <button
          onClick={() => onSwitchSpace('driver')}
          className={`px-3 py-1 rounded-lg ${
            currentSpace === 'driver' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          🛵 Livreur
        </button>
        <button
          onClick={() => onSwitchSpace('superadmin')}
          className={`px-3 py-1 rounded-lg ${
            currentSpace === 'superadmin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          👑 Admin
        </button>
      </div>
    </header>
  );
};
