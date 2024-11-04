const PDFDocument = require('pdfkit-table');
import * as fs from 'fs';
import Price from './price';

function formatTime(time: number): String {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  let result = '';
  if (hours > 0) {
    result += `${hours}t`
  }
  if (minutes > 0) {
    if (result.length > 0) {
        result += ' ';
    }
    result += `${minutes}min`
  }
  return result;
}

function formatCurrency(value: number): String {
    return value.toFixed(2) + '€';
}

function writeTable(vatRate: number, prices: Array<Price>, doc: typeof PDFDocument): void {
  const headers = ['Työaika', 'Hinta', 'Veroton hinta', 'Alv', 'Alv %'];
  const rows = prices.map(price =>
    [formatTime(price.time), formatCurrency(price.totalPrice), formatCurrency(price.priceWithoutVat), formatCurrency(price.vatAmount), vatRate.toFixed(2) + '%']
  )
  const table = {
    headers,
    rows,
    options: {
      width: doc.page.width - 80,
      columnWidth: 80,
      x: 20,
      y: 20,
      padding: 2,
    },
  };
  doc.table(table as any);
}

export function generateReport(hourlyPrice: number, vatRate: number, prices: Array<Price>, reportPath: string): void {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(reportPath));
  writeTable(vatRate, prices, doc);
  doc.end();
}