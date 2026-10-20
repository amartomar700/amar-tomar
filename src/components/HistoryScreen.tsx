import React, { useState, useMemo } from 'react';
import { DocumentRecord, DocumentType } from '../types';
import { formatINR, formatDate, getWhatsAppShareUrl, generateWhatsAppMessage } from '../utils/formatters';
import { deleteDocument, exportBackupJSON, importBackupJSON, getAllDocuments } from '../utils/storage';
import { downloadPDF } from '../utils/pdfGenerator';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import {
  Search,
  Filter,
  Share2,
  Download,
  Edit,
  Trash2,
  FileText,
  Upload,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface HistoryScreenProps {
  onLoadDocument: (doc: DocumentRecord) => void;
  onNewDocument: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onLoadDocument,
  onNewDocument,
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => getAllDocuments());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | DocumentType>('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const reloadDocs = () => {
    setDocuments(getAllDocuments());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = typeFilter === 'ALL' || doc.docType === typeFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        search.trim() === '' ||
        doc.docNumber.toLowerCase().includes(q) ||
        doc.clientDetails.clientName.toLowerCase().includes(q) ||
        (doc.clientDetails.phone && doc.clientDetails.phone.includes(q)) ||
        (doc.clientDetails.siteAddress && doc.clientDetails.siteAddress.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [documents, typeFilter, search]);

  const handleDelete = (docId: string, docNum: string) => {
    if (window.confirm(`Are you sure you want to delete ${docNum}? This cannot be undone.`)) {
      deleteDocument(docId);
      reloadDocs();
      showToast('Document deleted');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `tradequote_backup_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Offline backup exported as JSON');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importBackupJSON(content);
      if (result.success) {
        reloadDocs();
        showToast(`Successfully restored ${result.count} documents!`);
      } else {
        alert('Failed to restore backup: ' + (result.error || 'Invalid file'));
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleWhatsAppShare = (doc: DocumentRecord) => {
    const msg = generateWhatsAppMessage(doc);
    const url = getWhatsAppShareUrl(doc.clientDetails.phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="pb-28 max-w-4xl mx-auto px-3 sm:px-6 pt-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar with Backup & Restore actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Documents Archive</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {documents.length} Saved
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fully persisted offline on this device (Zero paid backend required)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Export JSON Backup */}
          <button
            onClick={handleExportBackup}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            title="Download offline JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup
          </button>

          {/* Import JSON Backup */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            title="Restore from JSON backup"
          >
            <Upload className="w-3.5 h-3.5" />
            Restore
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />

          {/* New Document Button */}
          <button
            onClick={onNewDocument}
            className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            + New Quote
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs mb-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, mobile (+91), or doc number..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors"
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

        {/* Type Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(['ALL', 'QUOTATION', 'ESTIMATE', 'INVOICE'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                typeFilter === type
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || typeFilter !== 'ALL'
              ? 'Try modifying your search or filter criteria.'
              : 'Create your first professional quotation or invoice in seconds.'}
          </p>
          <button
            onClick={onNewDocument}
            className="mt-4 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            Create New Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isInvoice = doc.docType === 'INVOICE';
            const isEstimate = doc.docType === 'ESTIMATE';

            const badgeColor = isInvoice
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : isEstimate
              ? 'bg-teal-100 text-teal-800 border-teal-200'
              : 'bg-sky-100 text-sky-800 border-sky-200';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Top Row: Badge, Doc Number & Date */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeColor}`}
                    >
                      {doc.docType}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {doc.docNumber}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(doc.date)}
                  </span>
                </div>

                {/* Middle Row: Client info & Amount */}
                <div className="flex items-start justify-between gap-3 my-2.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                      {doc.clientDetails.clientName || 'Unnamed Client'}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      {doc.clientDetails.phone && <span>+91 {doc.clientDetails.phone}</span>}
                      {doc.clientDetails.siteAddress && (
                        <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400">
                          • {doc.clientDetails.siteAddress}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {doc.items.length} items • Trade: {doc.tradeCategory.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono block">
                      {formatINR(doc.grandTotal)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      Grand Total
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Left: Load & Edit */}
                  <button
                    onClick={() => onLoadDocument(doc)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Load / Edit
                  </button>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => downloadPDF(doc)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleWhatsAppShare(doc)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                      title="Share directly via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden xs:inline">WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleDelete(doc.id, doc.docNumber)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
        />
      )}
    </div>
  );
};
