import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { getSavedBusinessProfile, saveBusinessProfile, getAllDocuments } from '../utils/storage';
import { SignaturePad } from './SignaturePad';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
  CheckCircle,
  ShieldCheck,
  HardDrive,
  QrCode,
  FileText,
} from 'lucide-react';

export const ProfileSettingsScreen: React.FC = () => {
  const [profile, setProfile] = useState<BusinessProfile>(() => getSavedBusinessProfile());
  const [savedToast, setSavedToast] = useState(false);
  const docs = getAllDocuments();

  const handleSave = () => {
    saveBusinessProfile(profile);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-6 pt-4">
      {savedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>Profile changes saved permanently offline!</span>
        </div>
      )}

      {/* Screen Title */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Contractor Business Profile</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details are automatically printed on every Quotation, Estimate, and Tax Invoice.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </div>

      {/* Basic Business Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Company & Contact Information
        </h3>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Registered Business / Contractor Name *
          </label>
          <input
            type="text"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            placeholder="e.g. Apex Multi-Trade Services & Contractors"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Contact Phone (Primary WhatsApp) *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-xs bg-slate-100 text-slate-700 rounded-l-xl border border-r-0 border-slate-200 font-bold">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={profile.contact}
                onChange={(e) =>
                  setProfile({ ...profile, contact: e.target.value.replace(/\D/g, '') })
                }
                placeholder="9820123456"
                className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white font-mono rounded-r-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Business Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="billing@apexservices.in"
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Official Address / Workshop Location
          </label>
          <textarea
            rows={2}
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            placeholder="Shop / Unit number, street, landmark, city, state & pin code"
            className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            GSTIN / Tax ID (Optional)
          </label>
          <input
            type="text"
            value={profile.gstin}
            onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
            placeholder="27AABCA1234F1Z8"
            className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white font-mono uppercase rounded-xl border border-slate-200 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Bank & UPI Details */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Default Bank Account & UPI
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              UPI ID (Google Pay, PhonePe, Paytm)
            </label>
            <input
              type="text"
              value={profile.upiId}
              onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
              placeholder="contractor@okaxis"
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white font-mono rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-semibold text-blue-700"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={profile.upiHolderName}
              onChange={(e) => setProfile({ ...profile, upiHolderName: e.target.value })}
              placeholder="e.g. Apex Multi-Trade Services"
              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={profile.bankName}
              onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
              placeholder="e.g. HDFC Bank"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={profile.accountNumber}
              onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
              placeholder="50200088991122"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white font-mono rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              IFSC Code
            </label>
            <input
              type="text"
              value={profile.ifsc}
              onChange={(e) => setProfile({ ...profile, ifsc: e.target.value.toUpperCase() })}
              placeholder="HDFC0000240"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white font-mono uppercase rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Default Authorized Signature Pad */}
      <div className="mb-4">
        <SignaturePad
          initialSignature={profile.signatureDataUrl}
          onSignatureChange={(sig) => setProfile({ ...profile, signatureDataUrl: sig })}
          title="Default Contractor Authorized Signature"
        />
        <p className="text-[11px] text-slate-500 mt-1.5 px-2">
          This signature will be pre-filled on every newly created document.
        </p>
      </div>

      {/* Offline Storage Status */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span>Local Device Storage: <strong>{docs.length} documents stored offline</strong></span>
        </div>
        <span className="font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Zero Backend • Standalone
        </span>
      </div>

      {/* Big Save Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors inline-flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Business Profile
        </button>
      </div>
    </div>
  );
};
