import React from 'react';
import { DocumentRecord } from '../types';
import { formatINR, formatDate, numberToWordsINR, getWhatsAppShareUrl, generateWhatsAppMessage } from '../utils/formatters';
import { downloadPDF } from '../utils/pdfGenerator';
import { X, Printer, Download, MessageCircle, Building2, MapPin, Phone, Mail } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadPDF(doc);
  };

  const handleWhatsApp = () => {
    const msg = generateWhatsAppMessage(doc);
    const url = getWhatsAppShareUrl(doc.clientDetails.phone, msg);
    window.open(url, '_blank');
  };

  const isInvoice = doc.docType === 'INVOICE';
  const isEstimate = doc.docType === 'ESTIMATE';
  const badgeTitle = isInvoice ? 'TAX INVOICE' : isEstimate ? 'WORK ESTIMATE' : 'QUOTATION';
  const headerColorClass = isInvoice
    ? 'bg-blue-900 text-white'
    : isEstimate
    ? 'bg-teal-800 text-white'
    : 'bg-sky-800 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* Action Toolbar (no-print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">Document Preview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {doc.docNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          {/* Printable A4 Sheet */}
          <div
            id="printable-document"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 sm:p-10 shadow-lg rounded-xl border border-slate-200 flex flex-col justify-between"
          >
            <div>
              {/* Header Bar */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
                    {doc.businessProfile.businessName || 'CONTRACTOR SERVICES'}
                  </h1>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    {doc.businessProfile.address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {doc.businessProfile.address}
                      </p>
                    )}
                    {doc.businessProfile.contact && (
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +91 {doc.businessProfile.contact}
                      </p>
                    )}
                    {doc.businessProfile.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {doc.businessProfile.email}
                      </p>
                    )}
                    {doc.businessProfile.gstin && (
                      <p className="font-bold text-slate-800">
                        GSTIN: {doc.businessProfile.gstin}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded font-black text-sm tracking-wider uppercase mb-2 ${headerColorClass}`}>
                    {badgeTitle}
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900">
                      Doc No: <span className="font-mono">{doc.docNumber}</span>
                    </p>
                    <p className="text-slate-600">Date: {formatDate(doc.date)}</p>
                    {doc.validUntil && !isInvoice && (
                      <p className="text-slate-600">Valid Till: {formatDate(doc.validUntil)}</p>
                    )}
                    <p className="text-xs font-semibold text-slate-700 uppercase">
                      Trade: {doc.tradeCategory.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Site Details Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-1">
                    Client Details / Billed To:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {doc.clientDetails.clientName || 'Valued Customer'}
                  </p>
                  {doc.clientDetails.phone && (
                    <p className="text-slate-600 mt-0.5">Phone: +91 {doc.clientDetails.phone}</p>
                  )}
                  {doc.clientDetails.email && (
                    <p className="text-slate-600">{doc.clientDetails.email}</p>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-1">
                    Site Location & Scope:
                  </span>
                  <p className="text-slate-700">
                    {doc.clientDetails.siteAddress || 'Site address as per client work order'}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-xs text-left mb-6 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3 rounded-l-md w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Description / Work Scope</th>
                    <th className="py-2.5 px-3 text-center w-20">Unit</th>
                    <th className="py-2.5 px-3 text-right w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right w-28 rounded-r-md">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doc.items.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {formatINR(item.rate).replace('₹', '').trim()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatINR(item.amount).replace('₹', '').trim()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations Block */}
              <div className="flex justify-end mb-6">
                <div className="w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatINR(doc.subtotal)}</span>
                  </div>

                  {doc.discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-rose-600">
                      <span>Discount:</span>
                      <span className="font-semibold">- {formatINR(doc.discountAmount)}</span>
                    </div>
                  )}

                  {doc.taxAmount > 0 && (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>GST ({doc.taxRate}%):</span>
                      <span className="font-semibold text-slate-900">+ {formatINR(doc.taxAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white rounded-md font-bold text-sm mt-2">
                    <span>Grand Total:</span>
                    <span className="text-base">{formatINR(doc.grandTotal)}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 italic text-right mt-1">
                    {numberToWordsINR(doc.grandTotal)}
                  </p>
                </div>
              </div>

              {/* Bank & Payment Details (For Invoices or available info) */}
              {(doc.businessProfile.upiId || doc.businessProfile.bankName) && (
                <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Bank & Payment Transfer:
                    </span>
                    {doc.businessProfile.bankName && (
                      <p className="text-slate-700">Bank: {doc.businessProfile.bankName}</p>
                    )}
                    {doc.businessProfile.accountNumber && (
                      <p className="text-slate-700">A/C No: {doc.businessProfile.accountNumber}</p>
                    )}
                    {doc.businessProfile.ifsc && (
                      <p className="text-slate-700">IFSC Code: {doc.businessProfile.ifsc}</p>
                    )}
                    {doc.businessProfile.upiHolderName && (
                      <p className="text-slate-700">A/C Name: {doc.businessProfile.upiHolderName}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">UPI Direct Payment:</span>
                    {doc.businessProfile.upiId && (
                      <p className="font-bold text-blue-700 font-mono text-sm bg-white inline-block px-2 py-1 rounded border border-blue-200">
                        {doc.businessProfile.upiId}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      Scan or pay directly via Google Pay, PhonePe, Paytm, or BHIM.
                    </p>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              {doc.terms && doc.terms.length > 0 && (
                <div className="mb-6 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Terms & Conditions:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {doc.terms.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Bottom Signature Area */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
              <div className="text-[10px] text-slate-400">
                <p>Thank you for choosing {doc.businessProfile.businessName || 'our services'}!</p>
                <p>Generated via TradeQuote Offline Mobile App</p>
              </div>

              <div className="text-center w-52">
                {doc.signatureDataUrl ? (
                  <div className="mb-1 h-14 flex items-center justify-center">
                    <img
                      src={doc.signatureDataUrl}
                      alt="Signature"
                      className="max-h-14 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-14 border border-dashed border-slate-300 rounded mb-1 flex items-center justify-center text-[10px] text-slate-400">
                    Digitally Authorized
                  </div>
                )}
                <div className="border-t border-slate-800 pt-1">
                  <p className="text-xs font-bold text-slate-900">
                    {doc.businessProfile.businessName || 'Authorized Signatory'}
                  </p>
                  <p className="text-[10px] text-slate-500">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
