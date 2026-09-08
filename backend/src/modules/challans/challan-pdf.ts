import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function streamChallanPdf(challan: any, res: Response): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Challan-${challan.challanNumber}.pdf"`
  );

  doc.pipe(res);

  // Colors
  const primaryColor = '#0f172a'; // Deep slate
  const accentColor = '#d97706'; // Industrial amber
  const mutedColor = '#64748b'; // Slate 500

  // 1. Header Banner
  doc
    .fillColor(primaryColor)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('METRO INDUSTRIAL & WHOLESALE SUPPLIES', 40, 40);

  doc
    .fillColor(mutedColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Central Distribution Depot, Bay Area 4, Industrial Corridor, Mumbai 400072', 40, 65)
    .text('GSTIN: 27AAAAA0000A1Z5 | Phone: +91 22 8899 7766 | Email: logistics@metro-ops.local', 40, 78);

  doc
    .strokeColor(accentColor)
    .lineWidth(2)
    .moveTo(40, 95)
    .lineTo(555, 95)
    .stroke();

  // 2. Document Title & Metadata
  doc
    .fillColor(primaryColor)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('DELIVERY CHALLAN & TAX INVOICE', 40, 110);

  // Status Badge
  const statusColor =
    challan.status === 'CONFIRMED'
      ? '#16a34a'
      : challan.status === 'CANCELLED'
      ? '#dc2626'
      : '#d97706';

  doc
    .fillColor(statusColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`STATUS: ${challan.status}`, 420, 112, { align: 'right' });

  // Metadata Box
  doc
    .fillColor('#f8fafc')
    .rect(40, 135, 515, 75)
    .fill();

  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .rect(40, 135, 515, 75)
    .stroke();

  // Customer Details (Left)
  doc
    .fillColor(mutedColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('CONSIGNEE / BILLED TO:', 55, 145);

  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(challan.customer?.businessName || 'N/A', 55, 158);

  doc
    .fillColor('#334155')
    .fontSize(8)
    .font('Helvetica')
    .text(`Attn: ${challan.customer?.name || 'N/A'} | Mobile: ${challan.customer?.mobile || 'N/A'}`, 55, 172)
    .text(`Address: ${challan.customer?.address || 'N/A'}`, 55, 184, { width: 250 })
    .text(`GSTIN: ${challan.customer?.gstNumber || 'Unregistered'}`, 55, 196);

  // Challan Info (Right)
  doc
    .fillColor(mutedColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('CHALLAN DETAILS:', 340, 145);

  doc
    .fillColor(primaryColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`Challan Number:`, 340, 158)
    .font('Helvetica')
    .text(challan.challanNumber, 440, 158);

  doc
    .font('Helvetica-Bold')
    .text(`Date Issued:`, 340, 172)
    .font('Helvetica')
    .text(new Date(challan.createdAt).toLocaleDateString('en-GB'), 440, 172);

  doc
    .font('Helvetica-Bold')
    .text(`Prepared By:`, 340, 186)
    .font('Helvetica')
    .text(challan.createdBy?.name || 'Authorized Staff', 440, 186);

  // 3. Items Table Header
  const tableTop = 230;
  doc
    .fillColor('#1e293b')
    .rect(40, tableTop, 515, 20)
    .fill();

  doc
    .fillColor('#ffffff')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('SR', 48, tableTop + 6)
    .text('SKU CODE', 75, tableTop + 6)
    .text('DESCRIPTION / ITEM SNAPSHOT', 160, tableTop + 6)
    .text('QTY', 360, tableTop + 6, { width: 40, align: 'right' })
    .text('UNIT PRICE', 420, tableTop + 6, { width: 55, align: 'right' })
    .text('TOTAL (INR)', 485, tableTop + 6, { width: 60, align: 'right' });

  // 4. Items Rows
  let y = tableTop + 24;
  let sr = 1;

  for (const item of challan.items) {
    const itemTotal = (item.quantity * item.unitPriceSnapshot).toFixed(2);

    if (sr % 2 === 0) {
      doc.fillColor('#f8fafc').rect(40, y - 2, 515, 18).fill();
    }

    doc
      .fillColor(primaryColor)
      .fontSize(8)
      .font('Helvetica')
      .text(String(sr), 48, y)
      .font('Helvetica-Bold')
      .text(item.productSkuSnapshot, 75, y)
      .font('Helvetica')
      .text(item.productNameSnapshot, 160, y, { width: 190, lineBreak: false })
      .text(String(item.quantity), 360, y, { width: 40, align: 'right' })
      .text(`₹${item.unitPriceSnapshot.toFixed(2)}`, 420, y, { width: 55, align: 'right' })
      .font('Helvetica-Bold')
      .text(`₹${itemTotal}`, 485, y, { width: 60, align: 'right' });

    y += 18;
    sr++;
  }

  // 5. Summary Section
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(40, y + 5)
    .lineTo(555, y + 5)
    .stroke();

  y += 12;

  doc
    .fillColor(primaryColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('TOTAL DISPATCH QUANTITY:', 250, y)
    .text(`${challan.totalQuantity} Units`, 360, y, { width: 40, align: 'right' });

  doc
    .text('GRAND TOTAL AMOUNT:', 380, y + 16)
    .fontSize(11)
    .fillColor(accentColor)
    .text(`₹${Number(challan.totalAmount).toFixed(2)}`, 485, y + 15, { width: 60, align: 'right' });

  // 6. Sign-off / Terms
  const footerY = 680;
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .stroke();

  doc
    .fillColor(mutedColor)
    .fontSize(7)
    .font('Helvetica')
    .text('TERMS & CONDITIONS:', 40, footerY + 10)
    .text('1. Goods once sold and dispatched will not be taken back without prior written RMA authorization.', 40, footerY + 20)
    .text('2. Please check package seal integrity and quantity at the time of delivery before signing receiving memo.', 40, footerY + 30);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text("Receiver's Stamp & Signature", 80, footerY + 70)
    .text('For METRO INDUSTRIAL SUPPLIES', 390, footerY + 70)
    .font('Helvetica')
    .fontSize(7)
    .text('Authorized Signatory', 430, footerY + 82);

  doc.end();
}
