import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Shield,
  Mail,
  Phone,
  UserCheck,
  X,
  Key,
} from 'lucide-react';
import { apiRequest, formatDateFR } from '../lib/api.ts';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'manager' | 'order_agent' | 'delivery'>('manager');
  const [password, setPassword] = useState('Collab2026!');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any[]>('/api/employees');
      setEmployees(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
          password,
        }),
      });
      setIsInviteOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Erreur invitation collaborateur');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Équipe & Rôles des Collaborateurs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Invitez des gestionnaires ou agents de saisie avec des accès adaptés.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Inviter un Collaborateur</span>
        </button>
      </div>

      {/* Roles explanation card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 block mb-1">Propriétaire / Gérant</span>
          <p className="text-slate-500">Accès total : finances, commandes, produits, équipe et abonnement.</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 block mb-1">Agent de Commandes</span>
          <p className="text-slate-500">Saisie des commandes clients, partage WhatsApp et suivi des stocks.</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 block mb-1">Livreur Moto</span>
          <p className="text-slate-500">Accès restreint à ses livraisons uniquement via code PIN rapide.</p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Collaborateur</th>
                <th className="py-3.5 px-4 font-bold">Contact</th>
                <th className="py-3.5 px-4 font-bold">Rôle & Permissions</th>
                <th className="py-3.5 px-4 font-bold">Statut</th>
                <th className="py-3.5 px-4 font-bold">Date d'ajout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Chargement de l'équipe...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Aucun collaborateur invité.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {emp.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{emp.email}</div>
                      {emp.phone && <div className="text-[10px] text-slate-400">{emp.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {emp.role === 'owner'
                          ? 'Propriétaire'
                          : emp.role === 'manager'
                          ? 'Gestionnaire'
                          : emp.role === 'order_agent'
                          ? 'Agent Commandes'
                          : 'Livreur'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Actif</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDateFR(emp.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              Inviter un Nouveau Collaborateur
            </h3>

            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ibrahima Diallo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email de connexion *</label>
                <input
                  type="email"
                  required
                  placeholder="ibrahima@dakarmode.sn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="manager">Gestionnaire</option>
                    <option value="order_agent">Agent de commandes</option>
                    <option value="delivery">Livreur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de passe temporaire</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Ajouter à l'équipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
