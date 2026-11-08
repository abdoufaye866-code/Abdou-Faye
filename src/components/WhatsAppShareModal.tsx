import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';

interface WhatsAppShareModalProps {
  orderId: number | null;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  orderId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ message: string; whatsappUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadMessage();
    }
  }, [orderId]);

  const loadMessage = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ message: string; whatsappUrl: string }>(
        `/api/orders/${orderId}/share-whatsapp`
      );
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  const handleCopy = async () => {
    if (!data?.message) return;
    await navigator.clipboard.writeText(data.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Partage WhatsApp de la Commande
            </h3>
            <p className="text-xs text-slate-500">
              Envoyez le récapitulatif complet au client en 1 clic
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Génération du récapitulatif...
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="relative">
              <pre className="w-full p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
                {data.message}
              </pre>

              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <a
                href={data.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir dans WhatsApp</span>
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
