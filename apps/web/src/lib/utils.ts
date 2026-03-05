import { browser } from '$app/environment';

/**
 * Formats a number as SEK currency.
 */
export function formatCurrency(val: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Detects if the app is running in a native Capacitor environment.
 */
export const isNative =
  browser &&
  (!!(window as Window & { Capacitor?: { isNative: boolean; platform: string } }).Capacitor
    ?.isNative ||
    (window as Window & { Capacitor?: { isNative: boolean; platform: string } }).Capacitor
      ?.platform !== 'web');

/**
 * Calculates net interest cost after tax deduction.
 * Standard Swedish deduction: 30% up to 100k SEK per person, 21% above.
 */
export function calculateNetInterest(
  loanAmount: number,
  interestRate: number,
  peopleCount: number
) {
  const totalYearlyInterest = loanAmount * (interestRate / 100);
  const yearlyInterestPerPerson = totalYearlyInterest / Math.max(1, peopleCount);

  const calculateDeduction = (amount: number) => {
    const tier1 = Math.min(amount, 100000);
    const tier2 = Math.max(0, amount - 100000);
    return tier1 * 0.3 + tier2 * 0.21;
  };

  const totalYearlyDeduction =
    calculateDeduction(yearlyInterestPerPerson) * Math.max(1, peopleCount);
  return (totalYearlyInterest - totalYearlyDeduction) / 12;
}

/**
 * Standard living costs according to Konsumentverket (simplified)
 */
export function calculateStandardLivingCosts(adults: number, children: number) {
  const baseCost = adults >= 2 ? 20000 : 12000;
  const childrenCost = children * 4000;
  return baseCost + childrenCost;
}

export interface KalpParams {
  netIncome: number;
  loanAmount: number;
  interestRate: number;
  monthlyAmortization: number;
  monthlyFee: number;
  operatingCosts: number;
  monthlyPropertyTax: number;
  adults: number;
  children: number;
}

/**
 * Unified KALP calculation
 */
export function calculateKalp(params: KalpParams) {
  const stressRate = Math.max(params.interestRate, 6.5);
  const netStressInterest = calculateNetInterest(params.loanAmount, stressRate, params.adults);
  const livingCosts = calculateStandardLivingCosts(params.adults, params.children);

  return (
    params.netIncome -
    netStressInterest -
    params.monthlyAmortization -
    params.monthlyFee -
    params.operatingCosts -
    params.monthlyPropertyTax -
    livingCosts
  );
}
