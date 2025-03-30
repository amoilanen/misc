import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument, StandardFonts, rgb } from '@pdf-lib/core';
import { format } from 'date-fns';

interface InvoiceData {
  email: string;
  licensePlate: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, licensePlate } = req.body as InvoiceData;

  if (!email || !licensePlate) {
    return res.status(400).json({ message: 'Email and license plate are required' });
  }

  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Company information
    const companyName = process.env.COMPANY_NAME || 'Your Company Name';
    const companyId = process.env.COMPANY_ID || '1234567-8';
    const companyVatId = process.env.COMPANY_VAT_ID || 'FI12345678';
    const companyBankAccount = process.env.COMPANY_BANK_ACCOUNT || 'FI12 3456 7890 1234 56';

    // Invoice details
    const invoiceNumber = `INV-${Date.now()}`;
    const date = format(new Date(), 'yyyy-MM-dd');
    const amount = 29.99;
    const vatRate = 0.24;
    const vatAmount = amount * vatRate;
    const totalAmount = amount + vatAmount;

    // Draw invoice content
    page.drawText(companyName, {
      x: 50,
      y: height - 50,
      size: 20,
      font,
    });

    page.drawText(`Business ID: ${companyId}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font,
    });

    page.drawText(`VAT ID: ${companyVatId}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font,
    });

    page.drawText(`Bank Account: ${companyBankAccount}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font,
    });

    page.drawText('INVOICE', {
      x: width - 150,
      y: height - 50,
      size: 20,
      font,
    });

    page.drawText(`Invoice Number: ${invoiceNumber}`, {
      x: width - 150,
      y: height - 80,
      size: 12,
      font,
    });

    page.drawText(`Date: ${date}`, {
      x: width - 150,
      y: height - 100,
      size: 12,
      font,
    });

    // Customer information
    page.drawText('Customer Information:', {
      x: 50,
      y: height - 160,
      size: 14,
      font,
    });

    page.drawText(`Email: ${email}`, {
      x: 50,
      y: height - 180,
      size: 12,
      font,
    });

    page.drawText(`License Plate: ${licensePlate}`, {
      x: 50,
      y: height - 200,
      size: 12,
      font,
    });

    // Invoice items
    const startY = height - 260;
    page.drawText('Description', {
      x: 50,
      y: startY,
      size: 12,
      font,
    });

    page.drawText('Amount', {
      x: width - 150,
      y: startY,
      size: 12,
      font,
    });

    page.drawText(`Detailed car information for ${licensePlate}`, {
      x: 50,
      y: startY - 30,
      size: 12,
      font,
    });

    page.drawText(`€${amount.toFixed(2)}`, {
      x: width - 150,
      y: startY - 30,
      size: 12,
      font,
    });

    // VAT and total
    const totalY = startY - 80;
    page.drawText(`VAT (${(vatRate * 100).toFixed(0)}%):`, {
      x: 50,
      y: totalY,
      size: 12,
      font,
    });

    page.drawText(`€${vatAmount.toFixed(2)}`, {
      x: width - 150,
      y: totalY,
      size: 12,
      font,
    });

    page.drawText('Total:', {
      x: 50,
      y: totalY - 30,
      size: 14,
      font,
    });

    page.drawText(`€${totalAmount.toFixed(2)}`, {
      x: width - 150,
      y: totalY - 30,
      size: 14,
      font,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // TODO: Store the invoice in cloud storage
    // const storage = new Storage();
    // const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
    // await bucket.file(`invoices/${invoiceNumber}.pdf`).save(pdfBytes);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${licensePlate}.pdf`);

    // Send the PDF
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 