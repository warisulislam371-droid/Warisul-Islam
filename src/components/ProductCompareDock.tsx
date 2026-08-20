import React from 'react';
import { Product } from '../types';
import { Scale, X, ArrowRight, Trash2, Sparkles, Plus } from 'lucide-react';

interface ProductCompareDockProps {
  compareList: Product[];
  onOpenCompareModal: () => void;
  onRemoveFromCompare: (productId: string) => void;
  onClearCompare: () => void;
  isDarkMode?: boolean;
}

export const ProductCompareDock: React.FC<ProductCompareDockProps> = ({
  compareList,
  onOpenCompareModal,
  onRemoveFromCompare,
  onClearCompare,
  isDarkMode = false
}) => {
  if (compareList.length === 0) return null;

  return (
    <div
      id="product-compare-dock"
      className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl md:rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 sm:gap-4 animate-slide-up font-sans"
    >
      {/* Left Item Thumbnails */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 max-w-[65%] scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-700">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider font-mono">
              Compare Dock
            </p>
            <p className="text-xs font-black text-white">{compareList.length} / 4 Items</p>
          </div>
        </div>

        {/* Thumbnail list */}
        <div className="flex items-center gap-2">
          {compareList.map((product) => (
            <div
              key={product.id}
              className="relative group shrink-0 bg-slate-800 rounded-xl p-1 border border-slate-700 hover:border-teal-400 transition"
              title={`${product.name} (₹${product.salePrice.toLocaleString('en-IN')})`}
            >
              <img
                src={
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=100'
                }
                alt={product.name}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg bg-white/10"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromCompare(product.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-sm transition cursor-pointer"
                title="Remove from compare"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Empty slot indicator */}
          {compareList.length < 4 && (
            <div
              onClick={onOpenCompareModal}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-400 transition cursor-pointer shrink-0"
              title={`Add ${4 - compareList.length} more item(s)`}
            >
              <Plus className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onClearCompare}
          className="text-slate-400 hover:text-slate-200 text-[10px] font-bold py-2 px-2 rounded-xl transition hidden sm:inline-flex items-center gap-1 cursor-pointer"
          title="Clear all compared items"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          id="btn-open-compare-dock"
          onClick={onOpenCompareModal}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs px-3 sm:px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-1.5 uppercase tracking-wider transform active:scale-95 cursor-pointer"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Compare ({compareList.length})</span>
          <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
        </button>
      </div>
    </div>
  );
};
