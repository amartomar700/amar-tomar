import { DocumentRecord } from '../types';

/**
 * Format amount into Indian Rupee format (e.g., ₹ 1,25,000 or ₹ 850)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹ 0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * Clean & normalize phone number for WhatsApp (+91 prefix)
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  // strip all non-digits
  let clean = phone.replace(/\D/g, '');
  // if starts with 0 and length is 11 (e.g., 09876543210), strip 0
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  }
  // if 10 digits, prepend 91
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

/**
 * Validate 10-digit Indian phone number
 */
export function isValid10DigitPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return true;
  if (digits.length === 12 && digits.startsWith('91')) return true;
  return false;
}

/**
 * Format date string (YYYY-MM-DD) into readable DD MMM YYYY
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Convert number to words in Indian numbering system (Lakhs, Crores)
 */
export function numberToWordsINR(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const t = tens[Math.floor(n / 10)];
    const u = units[n % 10];
    return u ? `${t} ${u}` : t;
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let res = '';
    if (h > 0) {
      res += `${units[h]} Hundred`;
      if (r > 0) res += ' ';
    }
    if (r > 0) {
      res += convertTwoDigits(r);
    }
    return res;
  }

  const intPart = Math.floor(Math.abs(amount));
  let n = intPart;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remaining = n;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${convertThreeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertThreeDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertThreeDigits(thousand)} Thousand`);
  if (remaining > 0) parts.push(convertThreeDigits(remaining));

  return `${parts.join(' ')} Rupees Only`.trim();
}

/**
 * Build structured WhatsApp text for quotes & invoices
 */
export function generateWhatsAppMessage(doc: DocumentRecord): string {
  const docTitle = doc.docType === 'INVOICE' ? 'TAX INVOICE' : doc.docType === 'ESTIMATE' ? 'WORK ESTIMATE' : 'QUOTATION';
  const profile = doc.businessProfile;
  const client = doc.clientDetails;

  const lines: string[] = [
    `*${docTitle}*`,
    `*Doc No:* ${doc.docNumber}`,
    `*Date:* ${formatDate(doc.date)}`,
    `*From:* ${profile.businessName || 'Contractor'}`,
    `*To:* ${client.clientName || 'Valued Customer'}`,
    client.siteAddress ? `*Site:* ${client.siteAddress}` : '',
    '',
    `*--- ITEM DETAILS ---*`,
  ];

  doc.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.description}* (${item.quantity} ${item.unit} @ ${formatINR(item.rate)}) = ${formatINR(item.amount)}`
    );
  });

  lines.push('');
  lines.push(`*Subtotal:* ${formatINR(doc.subtotal)}`);
  if (doc.discountAmount > 0) {
    lines.push(`*Discount:* -${formatINR(doc.discountAmount)}`);
  }
  if (doc.taxAmount > 0) {
    lines.push(`*GST (${doc.taxRate}%):* +${formatINR(doc.taxAmount)}`);
  }
  lines.push(`*GRAND TOTAL: ${formatINR(doc.grandTotal)}*`);
  lines.push(`_(${numberToWordsINR(doc.grandTotal)})_`);

  if (doc.docType === 'INVOICE' && (profile.upiId || profile.bankName)) {
    lines.push('');
    lines.push(`*--- PAYMENT DETAILS ---*`);
    if (profile.upiId) lines.push(`UPI ID: *${profile.upiId}*`);
    if (profile.bankName) {
      lines.push(`Bank: ${profile.bankName}`);
      if (profile.accountNumber) lines.push(`A/C: ${profile.accountNumber}`);
      if (profile.ifsc) lines.push(`IFSC: ${profile.ifsc}`);
    }
  }

  if (doc.terms && doc.terms.length > 0) {
    lines.push('');
    lines.push(`*Terms:*`);
    doc.terms.slice(0, 3).forEach((term, i) => {
      lines.push(`${i + 1}. ${term}`);
    });
  }

  lines.push('');
  lines.push(`For queries contact: ${profile.contact || ''}`);
  lines.push(`_Generated via TradeQuote Mobile App_`);

  return lines.filter(Boolean).join('\n');
}

/**
 * Generate native direct WhatsApp launcher URL
 */
export function getWhatsAppShareUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Fallback app URL scheme for native Android / iOS
 */
export function getWhatsAppAppScheme(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `whatsapp://send?phone=+${cleanPhone}&text=${encodedText}`;
  }
  return `whatsapp://send?text=${encodedText}`;
}
