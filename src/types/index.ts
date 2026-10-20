/**
 * TradeQuote - Multi-Trade Quotation, Estimate & Invoice Maker
 * Types & Domain Models
 */

export type DocumentType = 'QUOTATION' | 'ESTIMATE' | 'INVOICE';

export type TradeCategory =
  | 'electrical'
  | 'cctv_networking'
  | 'home_appliances'
  | 'ac_hvac'
  | 'plumbing'
  | 'waterproofing'
  | 'painting'
  | 'carpentry'
  | 'solar_power'
  | 'fire_safety'
  | 'general_custom';

export interface PredefinedService {
  id: string;
  name: string;
  category: TradeCategory;
  defaultUnit: string;
  defaultRate: number;
  description?: string;
}

export interface LineItem {
  id: string;
  description: string;
  tradeCategory?: TradeCategory;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BusinessProfile {
  businessName: string;
  address: string;
  contact: string;
  email: string;
  gstin: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  upiHolderName: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
}

export interface ClientDetails {
  clientName: string;
  phone: string; // 10-digit phone
  siteAddress: string;
  email?: string;
  clientGst?: string;
}

export interface DocumentRecord {
  id: string;
  docNumber: string;
  docType: DocumentType;
  tradeCategory: TradeCategory;
  date: string; // YYYY-MM-DD
  validUntil?: string;
  businessProfile: BusinessProfile;
  clientDetails: ClientDetails;
  items: LineItem[];
  subtotal: number;
  discountType: 'none' | 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxRate: number; // e.g., 0 or 18%
  taxAmount: number;
  grandTotal: number;
  terms: string[];
  signatureDataUrl?: string;
  signatureCapturedAt?: string;
  status: 'draft' | 'sent' | 'accepted' | 'paid';
  createdAt: number;
  updatedAt: number;
}

export interface TradeMeta {
  id: TradeCategory;
  name: string;
  shortName: string;
  icon: string;
  badgeColor: string;
  lightBg: string;
}
