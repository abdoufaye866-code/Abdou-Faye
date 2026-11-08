import React, { useState } from 'react';
import { X, HelpCircle, Send, MessageCircle } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/api/support', {
        method: 'POST',
        body: JSON.stringify({ subject, message, priority }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Assistance & Support SOCIALCOM
            </h3>
            <p className="text-xs text-slate-500">
              Une question ? Notre équipe à Dakar vous répond rapidement.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center text-emerald-700 font-bold text-sm">
            ✓ Votre demande a été transmise avec succès ! Nous vous répondrons sous peu.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Objet de votre demande *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Question sur les versements livreurs ou Wave"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="normal">Normale</option>
                <option value="urgent">Urgente (blocage commandes)</option>
                <option value="low">Simple question</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Message détaillé *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Expliquez votre situation ou suggestion..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Assistance directe WhatsApp : <strong>+221 77 450 12 34</strong> (7j/7)</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
