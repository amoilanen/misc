/*
 * Generating the report:
 *  clear && ts-node src/index.ts 80.0 25.5
 */
import { computePrices } from './pricing';
import { generateReport } from './report';

const hourlyPrice = parseFloat(process.argv[2]);
const vatRate = parseFloat(process.argv[3]);
let prices = computePrices(hourlyPrice, vatRate);
generateReport(hourlyPrice, vatRate, prices, 'hinnoittelu.pdf');
