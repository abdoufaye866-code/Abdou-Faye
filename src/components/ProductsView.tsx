import React, { useState, useEffect } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  TrendingUp,
  X,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { apiRequest, formatFCFA } from '../lib/api.ts';
import { Product } from '../types/index.ts';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Réapprovisionnement fournisseur');

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vêtements');
  const [imageUrl, setImageUrl] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(5000);
  const [salePrice, setSalePrice] = useState<number>(12000);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Product[]>('/api/products');
      setProducts(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Vêtements');
    setImageUrl('');
    setPurchasePrice(5000);
    setSalePrice(12000);
    setStockQuantity(10);
    setLowStockThreshold(5);
    setDescription('');
    setIsAvailable(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setImageUrl(p.imageUrl || '');
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setStockQuantity(p.stockQuantity);
    setLowStockThreshold(p.lowStockThreshold);
    setDescription(p.description || '');
    setIsAvailable(p.isAvailable);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        category,
        imageUrl,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        description,
        isAvailable,
      };

      if (editingProduct) {
        await apiRequest(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsAddModalOpen(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur enregistrement produit');
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Voulez-vous vraiment archiver ce produit ?')) return;
    try {
      await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur archivage produit');
    }
  };

  const handleApplyStockAdjustment = async () => {
    if (!adjustingProduct) return;
    try {
      await apiRequest(`/api/products/${adjustingProduct.id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({
          delta: adjustDelta,
          reason: adjustReason,
        }),
      });
      setAdjustingProduct(null);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erreur ajustement stock');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Catalogue & Gestion des Stocks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi des prix d'achat, prix de vente, alertes de stock faible et marges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher un produit ou une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-emerald-500 outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white outline-none"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Chargement des produits...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Aucun produit trouvé. Cliquez sur « Ajouter un Produit » pour commencer.
          </div>
        ) : (
          filtered.map((prod) => {
            const margin = prod.salePrice - prod.purchasePrice;
            const marginPercent = prod.salePrice > 0 ? Math.round((margin / prod.salePrice) * 100) : 0;
            const isLowStock = prod.stockQuantity <= prod.lowStockThreshold;

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border ${
                  isLowStock ? 'border-amber-300 shadow-amber-500/5' : 'border-slate-200'
                } shadow-2xs hover:shadow-sm transition flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  {/* Image & Category Pill */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {prod.category}
                    </span>

                    {isLowStock && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Stock faible ({prod.stockQuantity})</span>
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{prod.name}</h3>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                    )}

                    {/* Price & Margin Details */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-500">Prix de vente :</span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatFCFA(prod.salePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Prix d'achat :</span>
                        <span className="font-mono text-slate-600">{formatFCFA(prod.purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Marge brute :</span>
                        <span className="font-mono font-bold text-emerald-700">
                          +{formatFCFA(margin)} ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Stock Count and Quick Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        prod.stockQuantity === 0
                          ? 'bg-rose-500'
                          : isLowStock
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Stock: {prod.stockQuantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAdjustingProduct(prod);
                        setAdjustDelta(5);
                        setAdjustReason('Réapprovisionnement fournisseur');
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-white transition text-xs font-semibold"
                      title="Ajuster le stock (+/-)"
                    >
                      +/- Stock
                    </button>
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(prod.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition"
                      title="Archiver"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robe Soie Wax Royale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vêtements, Chaussures..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lien Image (URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix d'achat (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Pour calcul de marge exacte</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix de vente (FCFA) *</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Marge: {formatFCFA(salePrice - purchasePrice)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantité initiale en stock</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seuil d'alerte stock faible</label>
                  <input
                    type="number"
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Détails, tailles disponibles, conseils..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 outline-none"
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

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Ajuster le stock
            </h3>
            <p className="text-xs text-slate-500 mb-4">{adjustingProduct.name}</p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span>Stock actuel :</span>
                <span className="font-mono font-bold text-base">{adjustingProduct.stockQuantity}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Variation (+ pour ajout, - pour retrait)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => d - 1)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(Number(e.target.value))}
                    className="flex-1 text-center py-2 rounded-xl border border-slate-300 font-mono font-bold text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => d + 1)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                  Nouveau stock : {Math.max(0, adjustingProduct.stockQuantity + adjustDelta)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Réapprovisionnement fournisseur">Réapprovisionnement fournisseur</option>
                  <option value="Inventaire physique / Correction">Inventaire physique / Correction</option>
                  <option value="Article endommagé ou défectueux">Article endommagé ou défectueux</option>
                  <option value="Vente directe en boutique">Vente directe en boutique</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApplyStockAdjustment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
