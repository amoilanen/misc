const monthsInOneYear = 12;

// Basic amortization formula https://mortgagecalculator.mes.fm/amortization-formula-proof
function getMonthlyPayment(loanValue: number, yearlyRate: number, years: number): number {
  const totalMonths = years * monthsInOneYear;
  const monthlyRate = yearlyRate / monthsInOneYear;
  return loanValue * monthlyRate * Math.pow((1 + monthlyRate), totalMonths) / (Math.pow((1 + monthlyRate), totalMonths) - 1);
}

function getTotalPayment(realMonthlyCosts: number, years: number): number {
  return realMonthlyCosts * monthsInOneYear * years;
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

const loanValue = 180000;
const yearlyRate = 0.005;
const years = 20;

const suggestedMonthlyPayment = 830;
// Insurance, protection from rising rates, etc.
const extraMonthlyCosts = 100;
const extraFixedLoanCosts = 5000;

const monthlyCostsWithExtraCosts = suggestedMonthlyPayment + extraMonthlyCosts;

const tableOfRates = possibleRates.reduce((table: {[key: string]: number}, rate) => {
  const monthlyPayment = getMonthlyPayment(loanValue, rate, years);
  table[Math.ceil(monthlyPayment).toString()] = rate * 100;
  return table;
}, {});
const sortedMonthlyPaymentKeys = Object.keys(tableOfRates).map(key => parseInt(key, 10)).sort((x, y) => x - y);

function estimateRealRate(monthlyPayment: number, years: number, fixedCosts: number = 0): number {
  const fixedCostsMonthly = fixedCosts / (years * monthsInOneYear);
  const fullMonthlyPayment = monthlyPayment + fixedCostsMonthly;
  const nearestComputedMonthlyPaymentIndex = sortedMonthlyPaymentKeys.findIndex(payment => payment > fullMonthlyPayment) - 1;
  return tableOfRates[sortedMonthlyPaymentKeys[nearestComputedMonthlyPaymentIndex]];
}

console.log(`Loan value =\n\n ${loanValue}\n`);
console.log(`Yearly interest rate =\n\n ${yearlyRate}\n`);
console.log(`Suggested monthly payment =\n\n ${suggestedMonthlyPayment}\n`);
console.log(`Extra monthly costs =\n\n ${extraMonthlyCosts}\n`);
console.log(`Loan fixed costs =\n\n ${extraFixedLoanCosts}\n`);

console.log('\n');

console.log('Then real loan interest rate and monthly payment are:\n');

const totalPayment = getTotalPayment(monthlyCostsWithExtraCosts, years) + extraFixedLoanCosts;
console.log(`Loan total value paid back =\n\n ${totalPayment}\n`)

const pureMonthlyPayment = getMonthlyPayment(loanValue, yearlyRate, years);
console.log(`Monthly payment at the nominal loan interest rate of ${yearlyRate * 100} % =\n\n ${pureMonthlyPayment}\n`);

const realYearlyRate = estimateRealRate(suggestedMonthlyPayment, years);
console.log(`Yearly rate with suggested monthly payment of ${suggestedMonthlyPayment} =\n\n ${realYearlyRate} %\n`);

const realYearlyRateExtraMonthlyCosts = estimateRealRate(monthlyCostsWithExtraCosts, years);
console.log(`Yearly rate with suggested monthly payment of ${suggestedMonthlyPayment}\n and extra monthly payments of ${extraMonthlyCosts} =\n\n ${realYearlyRateExtraMonthlyCosts} %\n`);

const fullYearlyRate = estimateRealRate(monthlyCostsWithExtraCosts, years, extraFixedLoanCosts);
console.log(`Yearly rate with suggested monthly payment of ${suggestedMonthlyPayment}\n and extra monthly payments of ${extraMonthlyCosts}\n and fixed costs of ${extraFixedLoanCosts} =\n\n ${fullYearlyRate} %\n`);
