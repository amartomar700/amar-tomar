import React, { useState, useEffect, useMemo } from 'react';
import {
  DocumentRecord,
  DocumentType,
  TradeCategory,
  LineItem,
  BusinessProfile,
  ClientDetails,
  PredefinedService,
} from '../types';
import { TRADE_CATEGORIES, PREDEFINED_SERVICES, STANDARD_UNITS, DEFAULT_TERMS } from '../data/tradeCatalog';
import { formatINR, sanitizePhoneForWhatsApp, isValid10DigitPhone, generateWhatsAppMessage, getWhatsAppShareUrl, getWhatsAppAppScheme } from '../utils/formatters';
import { getSavedBusinessProfile, saveBusinessProfile, getNextDocumentNumber, saveDocument } from '../utils/storage';
import { SignaturePad } from './SignaturePad';
import { TradeCatalogModal } from './TradeCatalogModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { downloadPDF } from '../utils/pdfGenerator';
import {
  FileText,
  Calculator,
  Plus,
  Trash2,
  Share2,
  Printer,
  Save,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  CreditCard,
  Percent,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface DocumentCreatorProps {
  initialDocument?: DocumentRecord | null;
  onSavedSuccess?: (doc: DocumentRecord) => void;
  onViewHistory?: () => void;
}

export const DocumentCreator: React.FC<DocumentCreatorProps> = ({
  initialDocument,
  onSavedSuccess,
  onViewHistory,
}) => {
  // Document Type & Trade
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.docType || 'QUOTATION');
  const [tradeCategory, setTradeCategory] = useState<TradeCategory>(initialDocument?.tradeCategory || 'electrical');
  const [docNumber, setDocNumber] = useState<string>(
    initialDocument?.docNumber || getNextDocumentNumber('QUOTATION')
  );
  const [date, setDate] = useState<string>(
    initialDocument?.date || new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState<string>(
    initialDocument?.validUntil ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // Business Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    return initialDocument?.businessProfile || getSavedBusinessProfile();
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Client Details
  const [clientDetails, setClientDetails] = useState<ClientDetails>(
    initialDocument?.clientDetails || {
      clientName: '',
      phone: '',
      siteAddress: '',
      email: '',
    }
  );

  // Items
  const [items, setItems] = useState<LineItem[]>(initialDocument?.items || []);

  // Tax & Discount
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'flat'>(
    initialDocument?.discountType || 'none'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialDocument?.discountValue || 0);
  const [taxRate, setTaxRate] = useState<number>(initialDocument?.taxRate ?? 18);

  // Terms & Conditions
  const [terms, setTerms] = useState<string[]>(
    initialDocument?.terms || DEFAULT_TERMS['QUOTATION']
  );

  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(
    initialDocument?.signatureDataUrl
  );

  // Modals & Feedback
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // When initialDocument changes (e.g. loaded from history)
  useEffect(() => {
    if (initialDocument) {
      setDocType(initialDocument.docType);
      setTradeCategory(initialDocument.tradeCategory);
      setDocNumber(initialDocument.docNumber);
      setDate(initialDocument.date);
      setValidUntil(initialDocument.validUntil || '');
      setBusinessProfile(initialDocument.businessProfile);
      setClientDetails(initialDocument.clientDetails);
      setItems(initialDocument.items);
      setDiscountType(initialDocument.discountType);
      setDiscountValue(initialDocument.discountValue);
      setTaxRate(initialDocument.taxRate);
      setTerms(initialDocument.terms);
      setSignatureDataUrl(initialDocument.signatureDataUrl);
    }
  }, [initialDocument]);

  // Handle doc type change -> update prefix number & terms automatically
  const handleDocTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    if (!initialDocument) {
      setDocNumber(getNextDocumentNumber(newType));
      setTerms(DEFAULT_TERMS[newType] || DEFAULT_TERMS['QUOTATION']);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * (discountValue || 0)) / 100;
    }
    if (discountType === 'flat') {
      return Math.min(discountValue || 0, subtotal);
    }
    return 0;
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (!taxRate || taxRate <= 0) return 0;
    return (taxableAmount * taxRate) / 100;
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Items manipulation
  const handleAddCustomItem = () => {
    const newItem: LineItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      description: '',
      tradeCategory: tradeCategory,
      unit: 'Nos',
      quantity: 1,
      rate: 500,
      amount: 500,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleSelectFromCatalog = (service: PredefinedService) => {
    const newItem: LineItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      description: service.name,
      tradeCategory: service.category,
      unit: service.defaultUnit,
      quantity: 1,
      rate: service.defaultRate,
      amount: service.defaultRate,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const qty = Number(updated.quantity) || 0;
          const rate = Number(updated.rate) || 0;
          updated.amount = qty * rate;
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save profile default
  const handleSaveProfileDefault = () => {
    saveBusinessProfile(businessProfile);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2000);
  };

  // Compile active document object
  const currentDocument: DocumentRecord = useMemo(() => {
    return {
      id: initialDocument?.id || 'doc-' + Date.now(),
      docNumber,
      docType,
      tradeCategory,
      date,
      validUntil: docType !== 'INVOICE' ? validUntil : undefined,
      businessProfile,
      clientDetails,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxRate,
      taxAmount,
      grandTotal,
      terms,
      signatureDataUrl,
      status: initialDocument?.status || 'draft',
      createdAt: initialDocument?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  }, [
    initialDocument,
    docNumber,
    docType,
    tradeCategory,
    date,
    validUntil,
    businessProfile,
    clientDetails,
    items,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxRate,
    taxAmount,
    grandTotal,
    terms,
    signatureDataUrl,
  ]);

  // Save Document to Local Offline DB
  const handleSaveToDatabase = () => {
    if (items.length === 0) {
      alert('Please add at least one line item before saving.');
      return;
    }
    saveDocument(currentDocument);
    setSaveSuccessMessage('Saved to device storage offline!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
    if (onSavedSuccess) {
      onSavedSuccess(currentDocument);
    }
  };

  // Direct WhatsApp Launch
  const handleWhatsAppSend = () => {
    if (items.length === 0) {
      alert('Please add items to your document before sending.');
      return;
    }
    // Also auto-save to history
    saveDocument(currentDocument);

    const message = generateWhatsAppMessage(currentDocument);
    const webUrl = getWhatsAppShareUrl(clientDetails.phone, message);
    const appScheme = getWhatsAppAppScheme(clientDetails.phone, message);

    // Try scheme then window.open
    try {
      window.open(webUrl, '_blank');
    } catch {
      window.location.href = appScheme;
    }
  };

  const handleDownloadPDF = () => {
    if (items.length === 0) {
      alert('Please add line items before generating PDF.');
      return;
    }
    saveDocument(currentDocument);
    downloadPDF(currentDocument);
  };

  const activeTradeInfo = TRADE_CATEGORIES.find((c) => c.id === tradeCategory) || TRADE_CATEGORIES[0];

  return (
    <div className="pb-36 sm:pb-28 max-w-4xl mx-auto px-3 sm:px-6 pt-4">
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle className="w-4 h-4" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4">
        {/* Document Type Selector Segmented Control */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
          {(['QUOTATION', 'ESTIMATE', 'INVOICE'] as DocumentType[]).map((type) => {
            const isActive = docType === type;
            let activeColor = 'bg-sky-600 text-white shadow-xs';
            if (type === 'ESTIMATE') activeColor = 'bg-teal-600 text-white shadow-xs';
            if (type === 'INVOICE') activeColor = 'bg-blue-800 text-white shadow-xs';

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleDocTypeChange(type)}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all text-center ${
                  isActive ? activeColor : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Trade Selector & Document Meta Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Trade Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Trade Category
            </label>
            <div className="relative">
              <select
                value={tradeCategory}
                onChange={(e) => setTradeCategory(e.target.value as TradeCategory)}
                className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500 cursor-pointer"
              >
                {TRADE_CATEGORIES.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {trade.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Doc Number */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Document No.
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-mono font-bold text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Issue Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 font-medium text-xs sm:text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. BUSINESS PROFILE CARD (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{businessProfile.businessName || 'Business Profile'}</span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.2 rounded-full font-semibold border border-blue-100">
                  Default
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {businessProfile.contact ? `+91 ${businessProfile.contact}` : 'Set phone, address & GST'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-semibold hidden sm:inline">
              {isProfileOpen ? 'Collapse' : 'Edit Profile'}
            </span>
            {isProfileOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isProfileOpen && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Business / Contractor Name *
                </label>
                <input
                  type="text"
                  value={businessProfile.businessName}
                  onChange={(e) =>
                    setBusinessProfile({ ...businessProfile, businessName: e.target.value })
                  }
                  placeholder="e.g. Sharma Electricals & AC Services"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Contact Phone (10 digits) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs bg-slate-100 text-slate-600 rounded-l-xl border border-r-0 border-slate-200 font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={businessProfile.contact}
                    onChange={(e) =>
                      setBusinessProfile({ ...businessProfile, contact: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="9820012345"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-r-xl border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={businessProfile.email}
                  onChange={(e) =>
                    setBusinessProfile({ ...businessProfile, email: e.target.value })
                  }
                  placeholder="contact@business.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  GSTIN / PAN (Optional)
                </label>
                <input
                  type="text"
                  value={businessProfile.gstin}
                  onChange={(e) =>
                    setBusinessProfile({ ...businessProfile, gstin: e.target.value.toUpperCase() })
                  }
                  placeholder="27ABCDE1234F1Z5"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white font-mono uppercase rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Shop / Office Address
              </label>
              <textarea
                rows={2}
                value={businessProfile.address}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, address: e.target.value })
                }
                placeholder="Shop no, street, city, pin code..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSaveProfileDefault}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save as Default Profile
              </button>

              {profileSavedToast && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved to local device!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. CLIENT DETAILS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Client & Site Details
            </h3>
            <p className="text-[11px] text-slate-500">
              For WhatsApp sharing and document generation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Client Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Client / Customer Name *
            </label>
            <input
              type="text"
              value={clientDetails.clientName}
              onChange={(e) =>
                setClientDetails({ ...clientDetails, clientName: e.target.value })
              }
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Client Phone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 block">
                Mobile Number (for WhatsApp) *
              </label>
              {clientDetails.phone && (
                <span
                  className={`text-[10px] font-semibold ${
                    isValid10DigitPhone(clientDetails.phone)
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {isValid10DigitPhone(clientDetails.phone)
                    ? '✓ Valid WhatsApp Mobile'
                    : 'Enter 10 digits'}
                </span>
              )}
            </div>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-xs bg-slate-100 text-slate-700 rounded-l-xl border border-r-0 border-slate-200 font-bold">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={clientDetails.phone}
                onChange={(e) =>
                  setClientDetails({
                    ...clientDetails,
                    phone: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white font-mono font-medium rounded-r-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Site Address */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Site / Work Location Address
          </label>
          <input
            type="text"
            value={clientDetails.siteAddress}
            onChange={(e) =>
              setClientDetails({ ...clientDetails, siteAddress: e.target.value })
            }
            placeholder="Flat 302, Building A, Palm Avenue, Sector 15"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. ITEMS TABLE / CARD LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-4">
        {/* Table Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Scope of Work & Items</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-calculates quantity × unit rate
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCatalogModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl flex items-center gap-1.5 border border-blue-200 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Pick from {activeTradeInfo.shortName} Catalog
            </button>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Custom Item
            </button>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Calculator className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No items added yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select pre-priced items from the {activeTradeInfo.name} offline catalog or add a custom row.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Open Trade Catalog
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Add Blank Row
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                {/* Row Header: Item number & delete button */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Item #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Total: {formatINR(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description input */}
                <div className="mb-2.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { description: e.target.value })
                    }
                    placeholder="Work description / material name / specification"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold bg-white rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Numerical columns: Unit, Qty, Rate, Line Total */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {/* Unit */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { unit: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-white rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs text-right font-bold bg-white rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.rate || ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs text-right font-bold bg-white rounded-lg border border-slate-200 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Line Total (Hidden on small, visible on sm) */}
                  <div className="hidden sm:block">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Amount (₹)
                    </label>
                    <div className="px-2 py-1.5 text-xs text-right font-bold text-slate-900 bg-slate-100/80 rounded-lg border border-slate-200 font-mono truncate">
                      {formatINR(item.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. TAX & DISCOUNT SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-slate-500" />
          Discount & Taxes (GST)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Discount */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Discount
            </label>
            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'none' | 'percent' | 'flat')
                }
                className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              >
                <option value="none">No Discount</option>
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>

              {discountType !== 'none' && (
                <input
                  type="number"
                  min={0}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percent' ? 'e.g. 10%' : 'e.g. 500'}
                  className="flex-1 px-3 py-2 text-xs font-bold text-right bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-mono"
                />
              )}
            </div>
          </div>

          {/* GST */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Goods & Services Tax (GST)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 5, 12, 18].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setTaxRate(rate)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    taxRate === rate
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {rate === 0 ? '0% (Exempt)' : `${rate}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. BANK DETAILS SECTION (Visible when Doc Type == 'INVOICE') */}
      {docType === 'INVOICE' && (
        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-xs mb-4 bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Payment & Bank Details (Invoice Mode)
              </h3>
              <p className="text-[11px] text-blue-600">
                Direct client transfer info shown on invoice & WhatsApp
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={businessProfile.bankName}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, bankName: e.target.value })
                }
                placeholder="e.g. State Bank of India / HDFC"
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={businessProfile.accountNumber}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, accountNumber: e.target.value })
                }
                placeholder="A/C Number"
                className="w-full px-3 py-2 text-xs bg-white font-mono rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={businessProfile.ifsc}
                onChange={(e) =>
                  setBusinessProfile({
                    ...businessProfile,
                    ifsc: e.target.value.toUpperCase(),
                  })
                }
                placeholder="HDFC0000123"
                className="w-full px-3 py-2 text-xs bg-white font-mono uppercase rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                UPI ID (Google Pay / PhonePe)
              </label>
              <input
                type="text"
                value={businessProfile.upiId}
                onChange={(e) =>
                  setBusinessProfile({ ...businessProfile, upiId: e.target.value })
                }
                placeholder="username@okhdfcbank"
                className="w-full px-3 py-2 text-xs bg-white font-mono rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. TERMS & CONDITIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Terms & Conditions ({docType})
          </h3>
          <button
            type="button"
            onClick={() => setTerms(DEFAULT_TERMS[docType] || [])}
            className="text-[11px] text-blue-600 hover:underline font-semibold"
          >
            Reset to Standard Terms
          </button>
        </div>

        <div className="space-y-2">
          {terms.map((term, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono w-4">{i + 1}.</span>
              <input
                type="text"
                value={term}
                onChange={(e) => {
                  const updated = [...terms];
                  updated[i] = e.target.value;
                  setTerms(updated);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-lg border border-slate-200 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setTerms(terms.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setTerms([...terms, ''])}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Term
          </button>
        </div>
      </div>

      {/* 8. INTERACTIVE SIGNATURE CANVAS */}
      <div className="mb-6">
        <SignaturePad
          initialSignature={signatureDataUrl}
          onSignatureChange={setSignatureDataUrl}
          title="Technician / Contractor Signature"
        />
      </div>

      {/* 9. STICKY BOTTOM ACTION BAR (Positioned directly above the navigation bar) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Summary Totals */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Grand Total ({items.length} items)
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight font-mono">
                {formatINR(grandTotal)}
              </div>
            </div>

            {subtotal > 0 && (
              <div className="text-right sm:text-left text-[11px] text-slate-500 hidden xs:block">
                <span>Subtotal: {formatINR(subtotal)}</span>
                {taxAmount > 0 && <span> • GST: +{formatINR(taxAmount)}</span>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              Preview
            </button>

            {/* Print / Save PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              Save PDF
            </button>

            {/* WhatsApp Send */}
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>

            {/* Save to History */}
            <button
              type="button"
              onClick={handleSaveToDatabase}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      <TradeCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        catalog={PREDEFINED_SERVICES}
        activeTradeCategory={tradeCategory}
        onSelectItem={handleSelectFromCatalog}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={currentDocument}
      />
    </div>
  );
};
