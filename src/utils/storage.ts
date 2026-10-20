import { BusinessProfile, DocumentRecord, PredefinedService, TradeCategory } from '../types';
import { PREDEFINED_SERVICES } from '../data/tradeCatalog';

const STORAGE_KEYS = {
  PROFILE: 'tradequote_business_profile_v1',
  DOCUMENTS: 'tradequote_documents_v1',
  RATE_CARDS: 'tradequote_rate_cards_v1',
  SETTINGS: 'tradequote_app_settings_v1',
};

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'Apex Multi-Trade Services & Contractors',
  address: 'Shop No. 14, Commercial Plaza, Link Road, Mumbai 400053',
  contact: '9820123456',
  email: 'apexcontractors.in@gmail.com',
  gstin: '27AABCA1234F1Z8',
  bankName: 'HDFC Bank',
  accountNumber: '50200088991122',
  ifsc: 'HDFC0000240',
  upiId: 'apexcontractors@hdfcbank',
  upiHolderName: 'Apex Multi-Trade Services',
};

export function getSavedBusinessProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading business profile from storage', e);
  }
  return DEFAULT_BUSINESS_PROFILE;
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving business profile to storage', e);
  }
}

export function getAllDocuments(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading documents from storage', e);
  }

  // If no saved documents, seed with realistic contractor initial sample records
  const sampleDocs = getInitialSampleDocuments();
  saveAllDocuments(sampleDocs);
  return sampleDocs;
}

export function saveAllDocuments(docs: DocumentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving documents to storage', e);
  }
}

export function saveDocument(doc: DocumentRecord): void {
  const currentDocs = getAllDocuments();
  const index = currentDocs.findIndex((d) => d.id === doc.id);
  if (index >= 0) {
    currentDocs[index] = { ...doc, updatedAt: Date.now() };
  } else {
    currentDocs.unshift({ ...doc, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveAllDocuments(currentDocs);
}

export function deleteDocument(docId: string): void {
  const currentDocs = getAllDocuments();
  const filtered = currentDocs.filter((d) => d.id !== docId);
  saveAllDocuments(filtered);
}

export function getNextDocumentNumber(docType: 'QUOTATION' | 'ESTIMATE' | 'INVOICE'): string {
  const docs = getAllDocuments();
  const currentYear = new Date().getFullYear();
  const prefix = docType === 'QUOTATION' ? 'QT' : docType === 'ESTIMATE' ? 'EST' : 'INV';
  const matching = docs.filter((d) => d.docType === docType);
  const nextSeq = (matching.length + 1).toString().padStart(3, '0');
  return `${prefix}-${currentYear}-${nextSeq}`;
}

// Rate card customization persistence
export function getSavedRateCards(): PredefinedService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATE_CARDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom rate cards', e);
  }
  return PREDEFINED_SERVICES;
}

export function saveRateCards(services: PredefinedService[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RATE_CARDS, JSON.stringify(services));
  } catch (e) {
    console.error('Error saving rate cards', e);
  }
}

// Backup Export & Restore
export function exportBackupJSON(): string {
  const data = {
    app: 'TradeQuote',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: getSavedBusinessProfile(),
    documents: getAllDocuments(),
    rateCards: getSavedRateCards(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.documents)) {
      return { success: false, count: 0, error: 'Invalid backup file format' };
    }
    if (data.profile) {
      saveBusinessProfile(data.profile);
    }
    if (Array.isArray(data.rateCards)) {
      saveRateCards(data.rateCards);
    }
    saveAllDocuments(data.documents);
    return { success: true, count: data.documents.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JSON parse error';
    return { success: false, count: 0, error: message };
  }
}

// Initial realistic samples for demonstration
function getInitialSampleDocuments(): DocumentRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const profile = DEFAULT_BUSINESS_PROFILE;

  return [
    {
      id: 'doc-sample-1',
      docNumber: 'QT-2026-001',
      docType: 'QUOTATION',
      tradeCategory: 'electrical',
      date: today,
      validUntil: '2026-11-05',
      businessProfile: profile,
      clientDetails: {
        clientName: 'Rajesh Sharma',
        phone: '9821456789',
        siteAddress: 'Flat 402, Sunshine Heights, Andheri West, Mumbai',
        email: 'rajesh.sharma@example.com',
      },
      items: [
        {
          id: 'item-1',
          description: 'Point Wiring (Concealed with PVC conduit & 1.5 sq.mm copper wire)',
          tradeCategory: 'electrical',
          unit: 'Point',
          quantity: 24,
          rate: 450,
          amount: 10800,
        },
        {
          id: 'item-2',
          description: 'LED Profile Light with Driver & Diffuser Channel',
          tradeCategory: 'electrical',
          unit: 'Rft',
          quantity: 35,
          rate: 280,
          amount: 9800,
        },
        {
          id: 'item-3',
          description: 'AC Isolator & Power Point Wiring (4.0 sq.mm dedicated line)',
          tradeCategory: 'electrical',
          unit: 'Point',
          quantity: 3,
          rate: 850,
          amount: 2550,
        },
        {
          id: 'item-4',
          description: 'MCB DB Dressing & Load Balancing (12-Way Double Door DB)',
          tradeCategory: 'electrical',
          unit: 'Job',
          quantity: 1,
          rate: 1500,
          amount: 1500,
        },
      ],
      subtotal: 24650,
      discountType: 'flat',
      discountValue: 650,
      discountAmount: 650,
      taxRate: 18,
      taxAmount: 4320,
      grandTotal: 28320,
      terms: [
        '50% advance along with confirmed order; balance upon completion / supply.',
        'Rates valid for 15 days from issue date.',
        'Material warranty as per OEM manufacturer standards.',
        'Concealed chiseling & civil touch-up by contractor team.',
      ],
      status: 'sent',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'doc-sample-2',
      docNumber: 'INV-2026-001',
      docType: 'INVOICE',
      tradeCategory: 'ac_hvac',
      date: today,
      businessProfile: profile,
      clientDetails: {
        clientName: 'Sunil Verma (Green Valley Villas)',
        phone: '9819123890',
        siteAddress: 'Villa 12, Green Valley Enclave, Powai, Mumbai',
        email: 'sunil.verma@example.com',
      },
      items: [
        {
          id: 'item-inv-1',
          description: 'Split AC Installation (Indoor & Outdoor Unit with vacuum test)',
          tradeCategory: 'ac_hvac',
          unit: 'Nos',
          quantity: 2,
          rate: 1400,
          amount: 2800,
        },
        {
          id: 'item-inv-2',
          description: 'Copper Piping with Nitrile Insulation per running foot',
          tradeCategory: 'ac_hvac',
          unit: 'Rft',
          quantity: 28,
          rate: 280,
          amount: 7840,
        },
        {
          id: 'item-inv-3',
          description: 'Heavy Duty Outdoor Unit Stand (Powder Coated)',
          tradeCategory: 'ac_hvac',
          unit: 'Set',
          quantity: 2,
          rate: 950,
          amount: 1900,
        },
      ],
      subtotal: 12540,
      discountType: 'none',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 2257.2,
      grandTotal: 14797.2,
      terms: [
        'Payment due upon receipt of invoice.',
        'Material warranty as per OEM standards.',
        'Computer-generated invoice. No physical signature required if signed digitally.',
      ],
      status: 'paid',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
  ];
}
