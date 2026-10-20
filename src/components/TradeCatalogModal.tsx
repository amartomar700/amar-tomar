import React, { useState, useMemo } from 'react';
import { PredefinedService, TradeCategory } from '../types';
import { TRADE_CATEGORIES } from '../data/tradeCatalog';
import { formatINR } from '../utils/formatters';
import { Search, Plus, Check, X, Filter } from 'lucide-react';

interface TradeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: PredefinedService[];
  activeTradeCategory: TradeCategory;
  onSelectItem: (item: PredefinedService) => void;
}

export const TradeCatalogModal: React.FC<TradeCatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  activeTradeCategory,
  onSelectItem,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TradeCategory | 'all'>(activeTradeCategory);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});

  // Reset category to active when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedCategory(activeTradeCategory);
      setSearch('');
    }
  }, [isOpen, activeTradeCategory]);

  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [catalog, selectedCategory, search]);

  if (!isOpen) return null;

  const handleAdd = (item: PredefinedService) => {
    onSelectItem(item);
    setRecentlyAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setRecentlyAddedIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span>Trade Service Catalog</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Offline Catalog
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tap any item to instantly add to your document with standard rate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wire, fittings, AC gas, plumbing, pipe..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-blue-500 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Trade Category Horizontal Slider */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Trades ({catalog.length})
            </button>
            {TRADE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No matching services found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search term or switch trade category</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isAdded = recentlyAddedIds[item.id];
              return (
                <div
                  key={item.id}
                  className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 leading-snug">
                        {item.name}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {formatINR(item.defaultRate)}
                      </span>
                      <span className="text-xs text-slate-500">
                        per {item.defaultUnit}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(item)}
                    className={`shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-xs scale-95'
                        : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredItems.length} items available offline</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
