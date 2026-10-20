import { jsPDF } from 'jspdf';
import { DocumentRecord } from '../types';
import { formatINR, formatDate, numberToWordsINR } from './formatters';

export function generateDocumentPDF(doc: DocumentRecord): jsPDF {
  // A4 dimensions: 210 x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  let y = margin;

  // Header Colors
  const primaryColor = doc.docType === 'INVOICE' ? [30, 58, 138] : doc.docType === 'ESTIMATE' ? [13, 148, 136] : [3, 105, 161]; // Dark Blue, Teal, Ocean Blue
  const darkTextColor = [15, 23, 42];
  const mutedTextColor = [100, 116, 139];

  // Top Accent Bar
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, pageWidth, 5, 'F');

  y += 4;

  // Header Row: Business Name & Document Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(doc.businessProfile.businessName || 'CONTRACTOR SERVICES', margin, y + 4);

  // Document Badge
  const badgeTitle = doc.docType === 'INVOICE' ? 'TAX INVOICE' : doc.docType === 'ESTIMATE' ? 'WORK ESTIMATE' : 'QUOTATION';
  pdf.setFontSize(14);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(badgeTitle, pageWidth - margin, y + 4, { align: 'right' });

  y += 8;

  // Contractor info (left) & Doc Meta (right)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  const leftX = margin;
  let leftY = y;
  if (doc.businessProfile.address) {
    const addressLines = pdf.splitTextToSize(doc.businessProfile.address, 95);
    pdf.text(addressLines, leftX, leftY);
    leftY += addressLines.length * 4;
  }
  if (doc.businessProfile.contact) {
    pdf.text(`Phone: +91 ${doc.businessProfile.contact}`, leftX, leftY);
    leftY += 4;
  }
  if (doc.businessProfile.email) {
    pdf.text(`Email: ${doc.businessProfile.email}`, leftX, leftY);
    leftY += 4;
  }
  if (doc.businessProfile.gstin) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`GSTIN: ${doc.businessProfile.gstin}`, leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    leftY += 4;
  }

  // Right Meta
  const rightX = pageWidth - margin;
  let rightY = y;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Doc #: ${doc.docNumber}`, rightX, rightY, { align: 'right' });
  rightY += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${formatDate(doc.date)}`, rightX, rightY, { align: 'right' });
  rightY += 4;
  if (doc.validUntil && doc.docType !== 'INVOICE') {
    pdf.text(`Valid Until: ${formatDate(doc.validUntil)}`, rightX, rightY, { align: 'right' });
    rightY += 4;
  }
  pdf.text(`Trade: ${doc.tradeCategory.replace('_', ' ').toUpperCase()}`, rightX, rightY, { align: 'right' });
  rightY += 4;

  y = Math.max(leftY, rightY) + 3;

  // Thin separator line
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Bill To Box / Site Address
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('BILLED TO / CLIENT DETAILS:', margin + 3, y + 4.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(doc.clientDetails.clientName || 'Valued Customer', margin + 3, y + 9.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  if (doc.clientDetails.phone) {
    pdf.text(`Mobile: +91 ${doc.clientDetails.phone}`, margin + 3, y + 14);
  }
  if (doc.clientDetails.siteAddress) {
    const siteLines = pdf.splitTextToSize(`Site: ${doc.clientDetails.siteAddress}`, contentWidth - 70);
    pdf.text(siteLines, margin + 65, y + 9.5);
  }

  y += 24;

  // TABLE HEADER
  const colX = {
    sno: margin + 2,
    desc: margin + 12,
    unit: margin + 105,
    qty: margin + 125,
    rate: margin + 148,
    amount: pageWidth - margin - 2,
  };

  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(margin, y, contentWidth, 7, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('#', colX.sno, y + 4.8);
  pdf.text('DESCRIPTION / SCOPE OF WORK', colX.desc, y + 4.8);
  pdf.text('UNIT', colX.unit, y + 4.8, { align: 'center' });
  pdf.text('QTY', colX.qty, y + 4.8, { align: 'right' });
  pdf.text('RATE (INR)', colX.rate, y + 4.8, { align: 'right' });
  pdf.text('AMOUNT (INR)', colX.amount, y + 4.8, { align: 'right' });

  y += 7;

  // TABLE ROWS
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  doc.items.forEach((item, index) => {
    // Check if new page needed
    if (y > pageHeight - 65) {
      pdf.addPage();
      y = margin;
    }

    const rowBg = index % 2 === 1;
    if (rowBg) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 6.5, 'F');
    }

    pdf.setDrawColor(241, 245, 249);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    pdf.text(String(index + 1), colX.sno, y + 4.5);

    const descLines = pdf.splitTextToSize(item.description, 90);
    pdf.text(descLines[0] || '', colX.desc, y + 4.5);

    pdf.text(item.unit || 'Nos', colX.unit, y + 4.5, { align: 'center' });
    pdf.text(String(item.quantity), colX.qty, y + 4.5, { align: 'right' });
    pdf.text(formatINR(item.rate).replace('₹', '').trim(), colX.rate, y + 4.5, { align: 'right' });
    pdf.text(formatINR(item.amount).replace('₹', '').trim(), colX.amount, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  y += 2;

  // TOTALS SECTION
  const totalsX = margin + 105;
  const totalsWidth = contentWidth - 105;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

  // Subtotal
  pdf.text('Subtotal:', totalsX, y + 4);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(formatINR(doc.subtotal), pageWidth - margin, y + 4, { align: 'right' });
  y += 5;

  // Discount (if any)
  if (doc.discountAmount > 0) {
    pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    pdf.text('Discount:', totalsX, y + 4);
    pdf.setTextColor(225, 29, 72); // Rose
    pdf.text(`- ${formatINR(doc.discountAmount)}`, pageWidth - margin, y + 4, { align: 'right' });
    y += 5;
  }

  // Tax / GST (if any)
  if (doc.taxAmount > 0) {
    pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    pdf.text(`GST (${doc.taxRate}%):`, totalsX, y + 4);
    pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    pdf.text(`+ ${formatINR(doc.taxAmount)}`, pageWidth - margin, y + 4, { align: 'right' });
    y += 5;
  }

  // Grand Total Box
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.roundedRect(totalsX - 2, y + 1, totalsWidth + 2, 7.5, 1, 1, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('GRAND TOTAL:', totalsX + 2, y + 5.8);
  pdf.text(formatINR(doc.grandTotal), pageWidth - margin - 2, y + 5.8, { align: 'right' });

  y += 12;

  // Amount in words
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text(`Amount in Words: ${numberToWordsINR(doc.grandTotal)}`, margin, y);

  y += 5;

  // BANK DETAILS & SIGNATURE (Side by side)
  const bankX = margin;
  const signX = pageWidth - margin - 60;
  const blockY = y;

  // Bank Info (Especially for Invoices or payments)
  if (doc.businessProfile.bankName || doc.businessProfile.upiId) {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(bankX, blockY, 85, 28, 1, 1, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(bankX, blockY, 85, 28, 1, 1, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('BANK & UPI PAYMENT DETAILS:', bankX + 3, blockY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    let bLineY = blockY + 8;
    if (doc.businessProfile.upiId) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`UPI ID: ${doc.businessProfile.upiId}`, bankX + 3, bLineY);
      pdf.setFont('helvetica', 'normal');
      bLineY += 3.8;
    }
    if (doc.businessProfile.bankName) {
      pdf.text(`Bank: ${doc.businessProfile.bankName}`, bankX + 3, bLineY);
      bLineY += 3.8;
    }
    if (doc.businessProfile.accountNumber) {
      pdf.text(`A/C: ${doc.businessProfile.accountNumber}`, bankX + 3, bLineY);
      bLineY += 3.8;
    }
    if (doc.businessProfile.ifsc) {
      pdf.text(`IFSC: ${doc.businessProfile.ifsc}`, bankX + 3, bLineY);
    }
  }

  // Signature Block
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  pdf.text(`For ${doc.businessProfile.businessName || 'Authorized Signatory'}`, signX + 30, blockY + 4, { align: 'center' });

  // If signature image data exists, embed it
  if (doc.signatureDataUrl) {
    try {
      pdf.addImage(doc.signatureDataUrl, 'PNG', signX + 5, blockY + 6, 50, 16);
    } catch (e) {
      console.warn('Could not embed signature in PDF', e);
    }
  }

  pdf.setDrawColor(148, 163, 184);
  pdf.setLineWidth(0.3);
  pdf.line(signX + 5, blockY + 23, signX + 55, blockY + 23);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  pdf.text('Authorized Signature', signX + 30, blockY + 26.5, { align: 'center' });

  y = blockY + 31;

  // TERMS AND CONDITIONS
  if (doc.terms && doc.terms.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    pdf.text('Terms & Conditions:', margin, y);
    y += 3.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

    doc.terms.forEach((term, i) => {
      pdf.text(`${i + 1}. ${term}`, margin, y);
      y += 3.2;
    });
  }

  // Bottom Footer
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('This is an authentic computer-generated document from TradeQuote Mobile App.', pageWidth / 2, pageHeight - 5, { align: 'center' });

  return pdf;
}

export function downloadPDF(doc: DocumentRecord): void {
  const pdf = generateDocumentPDF(doc);
  const cleanDocNum = (doc.docNumber || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`${cleanDocNum}_${doc.clientDetails.clientName || 'Client'}.pdf`);
}
