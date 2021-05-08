// Basic amortization formula https://mortgagecalculator.mes.fm/amortization-formula-proof
function getMonthlyPayment(loanValue: number, yearlyRate: number, years: number): number {
  const totalMonths = years * 12;
  const monthlyRate = yearlyRate / 12;
  return loanValue * monthlyRate * Math.pow((1 + monthlyRate), totalMonths) / (Math.pow((1 + monthlyRate), totalMonths) - 1);
}

function getTotalPayment(loanValue: number, yearlyRate: number, years: number): number {
  const monthlyPayment = getMonthlyPayment(loanValue, yearlyRate, years);
  return monthlyPayment * 12 * years;
}

const highestConsideredRatePercent = 100;
const rateIncrementPercent = 0.1
const numberOfConsideredRates = highestConsideredRatePercent * Math.ceil(1 / rateIncrementPercent);
const possibleRates = [...Array<number>(numberOfConsideredRates)].map((_, idx) =>
  rateIncrementPercent * idx * 0.01
);

/*
 * Inputs to compute the real interest rate for the suggested payment and the payment + extra costs.
 */

const loanValue = 250000;
const yearlyRate = 0.005;
const years = 20;

const suggestedMonthlyPayment = 1200;
// Insurance, protection from rising rates, etc.
const extraMonthlyCosts = 100;

const realMonthlyCosts = suggestedMonthlyPayment + extraMonthlyCosts;

const tableOfRates = possibleRates.reduce((table: {[key: string]: number}, rate) => {
  const monthlyPayment = getMonthlyPayment(loanValue, rate, years);
  table[Math.ceil(monthlyPayment).toString()] = rate * 100;
  return table;
}, {});
const sortedMonthlyPaymentKeys = Object.keys(tableOfRates).map(key => parseInt(key, 10)).sort((x, y) => x - y);

function estimateRealRate(monthlyPayment: number): number {
  const nearestComputedMonthlyPaymentIndex = sortedMonthlyPaymentKeys.findIndex(payment => payment > monthlyPayment) - 1;
  return tableOfRates[sortedMonthlyPaymentKeys[nearestComputedMonthlyPaymentIndex]];
}

console.log(`Loan value = ${loanValue}`);
console.log(`Yearly interest rate  = ${yearlyRate}`);
console.log(`Suggested monthly payment  = ${suggestedMonthlyPayment}`);
console.log(`Extra monthly costs  = ${extraMonthlyCosts}`);

console.log('\n');

console.log('Then real loan interest rate and monthly payment are:\n');

const pureMonthlyPayment = getMonthlyPayment(loanValue, yearlyRate, years);
console.log(`Pure monthly payment at the nominal loan interest rate of ${yearlyRate * 100} % = ${pureMonthlyPayment}`);

const realYearlyRate = estimateRealRate(suggestedMonthlyPayment);
console.log(`Real loan yearly rate with monthly payment of ${suggestedMonthlyPayment} = ${realYearlyRate} %`);

const realFullYearlyRate = estimateRealRate(realMonthlyCosts);
console.log(`Full real loan yearly rate with monthly payment of ${realMonthlyCosts} = ${realFullYearlyRate} %`);