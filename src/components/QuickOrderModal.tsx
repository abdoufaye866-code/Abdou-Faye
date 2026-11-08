import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Share2,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  User,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { apiRequest, formatFCFA } from '../lib/api.ts';
import { Product, DeliveryAgent, OrderItem } from '../types/index.ts';
import confetti from 'canvas-confetti';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: any) => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available data from shop
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Dakar');

  // Items selection
  const [selectedItems, setSelectedItems] = useState<
    { productId: number; productName: string; purchasePrice: number; unitPrice: number; quantity: number }[]
  >([]);

  const [deliveryFee, setDeliveryFee] = useState<number>(2000);
  const [discount, setDiscount] = useState<number>(0);
  const [source, setSource] = useState<'whatsapp' | 'tiktok' | 'facebook' | 'instagram' | 'autre'>('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange_money' | 'cash' | 'transfer' | 'other'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [assignedDeliveryId, setAssignedDeliveryId] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [merchantNotes, setMerchantNotes] = useState('');

  // Quick product add selector
  const [currentSelectedProductId, setCurrentSelectedProductId] = useState<string>('');

  // Load products & drivers on open
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [prods, agents] = await Promise.all([
        apiRequest<Product[]>('/api/products'),
        apiRequest<DeliveryAgent[]>('/api/delivery-agents'),
      ]);
      setProducts(prods);
      setDeliveryAgents(agents);
      if (prods.length > 0 && selectedItems.length === 0) {
        // default select first product
        setSelectedItems([
          {
            productId: prods[0].id,
            productName: prods[0].name,
            purchasePrice: prods[0].purchasePrice,
            unitPrice: prods[0].salePrice,
            quantity: 1,
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = (prodId: number) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existingIndex = selectedItems.findIndex((i) => i.productId === prodId);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          productName: prod.name,
          purchasePrice: prod.purchasePrice,
          unitPrice: prod.salePrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...selectedItems];
    updated[index].quantity = newQty;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updated);
  };

  // Calculations
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedItems.length === 0) {
      setError('Veuillez ajouter au moins un article à la commande');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        clientName,
        clientPhone,
        deliveryAddress: deliveryAddress || `${neighborhood}, ${city}`,
        neighborhood,
        city,
        items: selectedItems.map((i) => ({
          ...i,
          totalPrice: i.unitPrice * i.quantity,
        })),
        deliveryFee: Number(deliveryFee),
        discount: Number(discount),
        source,
        paymentMethod,
        paymentStatus,
        amountPaid: paymentStatus === 'paid' ? totalAmount : Number(amountPaid),
        assignedDeliveryId: assignedDeliveryId ? Number(assignedDeliveryId) : null,
        customerNotes,
        merchantNotes,
      };

      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      // Confetti burst on successful order!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      onOrderCreated(res);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-7 shadow-2xl my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Enregistrer une Commande Rapide
              </h2>
              <p className="text-xs text-slate-500">
                Saisie express en 20 secondes • Calcul automatique des stocks et totaux
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* SECTION 1: CLIENT DETAILS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              1. Informations Client & Livraison
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nom du client *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aminata Diop"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Téléphone / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 77 123 45 67"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quartier (Dakar)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Almadies, Sacré-Cœur"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Adresse précise / Repère *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Près de la Brioche Dorée, Immeuble blanc"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCTS SELECTION */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                2. Articles commandés ({selectedItems.length})
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={currentSelectedProductId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) {
                      handleAddItem(id);
                      setCurrentSelectedProductId('');
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-emerald-400 bg-white font-medium text-emerald-800 outline-none"
                >
                  <option value="">+ Ajouter un produit...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatFCFA(p.salePrice)} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Aucun produit sélectionné. Choisissez un produit ci-dessus.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    <div className="flex-1 font-medium text-slate-800 truncate pr-2">
                      {item.productName}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-mono">
                        {formatFCFA(item.unitPrice)}
                      </span>

                      <div className="flex items-center border border-slate-300 rounded-md">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, item.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-slate-100 font-bold text-slate-600"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(index, item.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-slate-100 font-bold text-slate-600"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 w-20 text-right font-mono">
                        {formatFCFA(item.unitPrice * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
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

          {/* SECTION 3: SOURCE, DELIVERY & PAYMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Canal d'origine
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-medium"
              >
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="instagram">📸 Instagram</option>
                <option value="facebook">👥 Facebook</option>
                <option value="autre">🌐 Autre canal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Frais de livraison (FCFA)
              </label>
              <input
                type="number"
                step="500"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Réduction offerte (FCFA)
              </label>
              <input
                type="number"
                step="500"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Moyen de paiement
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-medium"
              >
                <option value="cash">💵 Espèces à la livraison</option>
                <option value="wave">💙 Wave Mobile Money</option>
                <option value="orange_money">🧡 Orange Money</option>
                <option value="transfer">🏦 Virement bancaire</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Statut du paiement
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-medium"
              >
                <option value="unpaid">⏳ Non payé (à la livraison)</option>
                <option value="paid">✅ Déjà payé (Wave/OM)</option>
                <option value="partial">⚠️ Acompte / Partiel</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Affecter un livreur moto
              </label>
              <select
                value={assignedDeliveryId}
                onChange={(e) => setAssignedDeliveryId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:border-emerald-500 outline-none bg-white font-medium"
              >
                <option value="">Pas encore affecté</option>
                {deliveryAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    🛵 {ag.fullName} ({ag.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TOTAL & SUBMIT BAR */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Total à encaisser :</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {formatFCFA(totalAmount)}
                </span>
                <span className="text-xs text-slate-400">
                  (Articles: {formatFCFA(subtotal)} + Liv: {formatFCFA(deliveryFee)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Enregistrement...' : 'Valider la commande'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
