import React, { useState, useMemo } from 'react';
import { PredefinedService, TradeCategory } from '../types';
import { TRADE_CATEGORIES, STANDARD_UNITS, PREDEFINED_SERVICES } from '../data/tradeCatalog';
import { getSavedRateCards, saveRateCards } from '../utils/storage';
import { formatINR } from '../utils/formatters';
import {
  Search,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle,
  Wrench,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';

export const RateCardScreen: React.FC = () => {
  const [services, setServices] = useState<PredefinedService[]>(() => getSavedRateCards());
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory | 'all'>('electrical');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<string>('Nos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New item form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTrade, setNewItemTrade] = useState<TradeCategory>('electrical');
  const [newItemUnit, setNewItemUnit] = useState('Nos');
  const [newItemRate, setNewItemRate] = useState<number>(500);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchTrade = selectedTrade === 'all' || item.category === selectedTrade;
      const q = search.toLowerCase();
      const matchSearch =
        search.trim() === '' ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchTrade && matchSearch;
    });
  }, [services, selectedTrade, search]);

  const handleStartEdit = (service: PredefinedService) => {
    setEditingId(service.id);
    setEditRate(service.defaultRate);
    setEditUnit(service.defaultUnit);
  };

  const handleSaveEdit = (id: string) => {
    const updated = services.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          defaultRate: editRate,
          defaultUnit: editUnit,
        };
      }
      return s;
    });
    setServices(updated);
    saveRateCards(updated);
    setEditingId(null);
    showToast('Rate updated in local database');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this item from your rate card?')) {
      const updated = services.filter((s) => s.id !== id);
      setServices(updated);
      saveRateCards(updated);
      showToast('Item removed from rate card');
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: PredefinedService = {
      id: 'custom-' + Date.now(),
      name: newItemName.trim(),
      category: newItemTrade,
      defaultUnit: newItemUnit,
      defaultRate: newItemRate,
    };

    const updated = [newItem, ...services];
    setServices(updated);
    saveRateCards(updated);
    setIsAddingNew(false);
    setNewItemName('');
    showToast('New service added to offline rate card!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all trade rates to standard market defaults?')) {
      setServices(PREDEFINED_SERVICES);
      saveRateCards(PREDEFINED_SERVICES);
      showToast('Rates reset to standard catalog defaults');
    }
  };

  return (
    <div className="pb-28 max-w-4xl mx-auto px-3 sm:px-6 pt-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Trade Catalog & Rate Cards</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your local standard rates and custom services across all 11 trades
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
        </div>
      </div>

      {/* Add New Service Form */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNew}
          className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 mb-4 space-y-3"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            Add New Service to Catalog
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Service Description / Item Name *
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Inverter Battery Descaling & Acid Top-up"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Trade Category
              </label>
              <select
                value={newItemTrade}
                onChange={(e) => setNewItemTrade(e.target.value as TradeCategory)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Default Unit
              </label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Default Rate (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={newItemRate}
                onChange={(e) => setNewItemRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold text-right font-mono bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Save to Catalog
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service name across trades..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
          />
        </div>

        {/* Trade Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedTrade('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
              selectedTrade === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Trades ({services.length})
          </button>
          {TRADE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedTrade(cat.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                selectedTrade === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No services match your search</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const isEditing = editingId === service.id;

            return (
              <div
                key={service.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {service.name}
                  </h4>
                  {service.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {service.description}
                    </p>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                    Trade: {service.category.replace('_', ' ')}
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-50 rounded-lg border border-slate-300"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-600">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={editRate}
                        onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs font-bold text-right font-mono bg-white rounded-lg border border-blue-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveEdit(service.id)}
                      className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      title="Save rate"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-blue-700 font-mono block">
                        {formatINR(service.defaultRate)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        per {service.defaultUnit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(service)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit rate"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete from catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
