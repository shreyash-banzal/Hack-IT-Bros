import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Minus, 
  Sparkles, 
  X,
  CheckCircle,
  Tag
} from 'lucide-react';
import { Product } from '../types';

interface InventoryViewProps {
  products: Product[];
  onRefresh: () => void;
  onQuickRestock: (productId: string, addQuantity: number) => Promise<void>;
  onCreateProduct: (productData: Partial<Product>) => Promise<boolean>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onRefresh,
  onQuickRestock,
  onCreateProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State for Add Product
  const [newProductName, setNewProductName] = useState('');
  const [newHindiName, setNewHindiName] = useState('');
  const [newCategory, setNewCategory] = useState('Staples');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('pack');
  const [newStock, setNewStock] = useState('50');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newAliases, setNewAliases] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
        (p.aliases && p.aliases.some((a) => a.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleStockAdjust = async (productId: string, delta: number) => {
    setActionLoadingId(productId);
    try {
      await onQuickRestock(productId, delta);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newPrice) return;

    setIsSubmitting(true);
    try {
      const aliasArray = newAliases
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      const success = await onCreateProduct({
        name: newProductName.trim(),
        hindiName: newHindiName.trim() || undefined,
        category: newCategory,
        price: Number(newPrice),
        unit: newUnit.trim() || 'piece',
        stock: Number(newStock) || 0,
        lowStockThreshold: Number(newThreshold) || 5,
        aliases: aliasArray,
      });

      if (success) {
        setIsAddModalOpen(false);
        // Reset form
        setNewProductName('');
        setNewHindiName('');
        setNewPrice('');
        setNewStock('50');
        setNewAliases('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-stone-700" />
            MongoDB Product Catalog & Live Inventory
          </h2>
          <p className="text-xs text-stone-500">
            Real-time stock synced directly with autonomous tool-calling order execution.
          </p>
        </div>

        <button
          id="add-product-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, Hindi, or alias (e.g. atta, doodh)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price / Unit</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Stock Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No products found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{p.name}</div>
                        {p.hindiName && (
                          <div className="text-[11px] text-stone-500 font-medium">
                            {p.hindiName}
                          </div>
                        )}
                        {p.aliases && p.aliases.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-stone-400 flex-wrap">
                            <Tag className="w-2.5 h-2.5" />
                            {p.aliases.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700 border border-stone-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-stone-900">
                        ₹{p.price} <span className="text-[10px] text-stone-400">/ {p.unit}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-stone-900'}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleStockAdjust(p.id, -1)}
                            disabled={actionLoadingId === p.id || p.stock <= 0}
                            className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 disabled:opacity-40"
                            title="Decrease Stock by 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStockAdjust(p.id, 5)}
                            disabled={actionLoadingId === p.id}
                            className="px-2 py-1 rounded text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 disabled:opacity-40"
                            title="Restock +5"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleStockAdjust(p.id, 10)}
                            disabled={actionLoadingId === p.id}
                            className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 disabled:opacity-40"
                            title="Restock +10"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" /> Add Kirana Product
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Haldiram Bhujia Sev"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Hindi Name</label>
                  <input
                    type="text"
                    value={newHindiName}
                    onChange={(e) => setNewHindiName(e.target.value)}
                    placeholder="उदा. भुजिया सेव"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  >
                    <option value="Staples">Staples</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Oils">Oils</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="45"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="200g pack"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Colloquial Aliases (comma-separated for AI matching)
                </label>
                <input
                  type="text"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="bhujia, sev, haldiram namkeen"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
