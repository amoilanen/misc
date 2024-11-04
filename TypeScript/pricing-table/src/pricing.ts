import Price from './price';
import { range, roundToDecimalPoints } from './util';

const minimumTimeMinutes = 15;
const maximumTimeMinutes = 600;
const stepMinutes = 15;

export function computePrices(hourlyPrice: number, vatRate: number): Array<Price> {
  const times = range(minimumTimeMinutes, maximumTimeMinutes, stepMinutes);
  return times.map(time => {
    const totalPrice = roundToDecimalPoints(hourlyPrice * (time / 60), 2);
    const priceWithoutVat = roundToDecimalPoints(totalPrice / ( 1 + vatRate / 100), 2);
    const vatAmount = roundToDecimalPoints(totalPrice - priceWithoutVat, 2);
    return new Price(time, totalPrice, priceWithoutVat, vatAmount)
  });
}