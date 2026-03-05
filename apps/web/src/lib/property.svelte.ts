import { SvelteDate } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { t } from 'svelte-i18n';
import { calculateNetInterest } from './utils';

export type EnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | '?';
export type PropertyType = 'bostadsratt' | 'villa';

export interface PersonJSON {
  name: string;
  bruttoIncome: number;
}

export interface ScenarioJSON {
  id: string;
  name: string;
  price: number;
  interestRate: number;
  downpayment: number;
  amortizationRate: number;
  isSelected: boolean;
  useMandatoryAmortization: boolean;
  customAmortizationAmount: number;
  additionalInterestRates: number[];
  use2026Rules: boolean;
  use2026TentativeRules?: boolean;
  reasoning?: string;
  loanMode?: 'simple' | 'advanced';
  loanTranches?: {
    id: string;
    percentage: number;
    rate: number;
    period: string;
    amortization: number;
  }[];
}

export interface PropertyJSON {
  id: string;
  type: PropertyType;
  name: string;
  address: string;
  surfaceArea: number;
  biarea: number;
  rooms: number;
  plotArea: number;
  monthlyFee: number;
  operatingCosts: number;
  constructionYear: number | null;
  taxValue: number;
  sourceUrl: string | null;
  energyClass: EnergyClass;
  isFavorite: boolean;
  existingPantbrev: number;
  associationName: string | null;
  associationUrl: string | null;
  scenarios: ScenarioJSON[];
}

export interface SaleDetailsJSON {
  type: PropertyType;
  originalValue: number;
  improvementCosts: number;
  saleValue: number;
  saleCosts: number;
  currentLoan: number;
  currentLoanCosts: number;
  useTaxDeferral: boolean;
  operatingCosts: number;
  monthlyFee: number;
}

export interface AppStateJSON {
  properties: PropertyJSON[];
  myProperty: SaleDetailsJSON;
  household: PersonJSON[];
  additionalCash: number;
  childrenCount: number;
  activeTab: 'properties' | 'my-property' | 'income' | 'comparison';
  selectedPropertyId: string | null;
  hasCompletedOnboarding: boolean;
}

function generateLocalId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function calculateNetIncome(brutto: number) {
  if (brutto <= 0) {
    return 0;
  }

  const stateTaxThreshold = 51000;
  if (brutto <= stateTaxThreshold) {
    return brutto * 0.77; // ~23% effective tax
  } else {
    const baseNet = stateTaxThreshold * 0.77;
    const surplus = brutto - stateTaxThreshold;
    return baseNet + surplus * 0.57; // ~43% marginal tax
  }
}

export class Person {
  name = $state('');
  bruttoIncome = $state(0);

  constructor(name = '', bruttoIncome = 0) {
    this.name = name;
    this.bruttoIncome = bruttoIncome;
  }

  get netIncome() {
    return calculateNetIncome(this.bruttoIncome);
  }

  toJSON() {
    return {
      name: this.name,
      bruttoIncome: this.bruttoIncome
    };
  }

  static fromJSON(data: { name: string; bruttoIncome: number }) {
    return new Person(data.name, data.bruttoIncome);
  }
}

export class Scenario {
  id = generateLocalId();
  name = $state('');
  price = $state(0);
  #interestRate = $state(4.0);
  get interestRate() {
    return this.loanTranches[0]?.rate ?? this.#interestRate;
  }
  set interestRate(val: number) {
    this.#interestRate = val;
    if (this.loanTranches && this.loanTranches.length > 0) {
      this.loanTranches[0].rate = val;
    }
  }
  downpayment = $state(0);
  amortizationRate = $state(1.0);
  isSelected = $state(false);
  useMandatoryAmortization = $state(true);
  customAmortizationAmount = $state(0);
  additionalInterestRates = $state<number[]>([]);
  use2026Rules = $state(true);
  reasoning = $state<string | undefined>(undefined);
  loanMode = $state<'simple' | 'advanced'>('simple');
  loanTranches = $state<
    { id: string; percentage: number; rate: number; period: string; amortization: number }[]
  >([]);

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
    this.downpayment = price * 0.15;
    this.loanTranches = [
      { id: generateLocalId(), percentage: 100, rate: 4.0, period: '3mo', amortization: 0 }
    ];
  }

  get loanAmount() {
    return Math.max(0, this.price - this.downpayment);
  }

  get effectiveInterestRate() {
    if (this.loanMode === 'simple' || !this.loanTranches || this.loanTranches.length === 0) {
      return this.interestRate;
    }
    let totalRate = 0;
    let totalPercentage = 0;
    for (const tranche of this.loanTranches) {
      totalRate += tranche.rate * (tranche.percentage / 100);
      totalPercentage += tranche.percentage;
    }
    return totalPercentage > 0 ? totalRate / (totalPercentage / 100) : 0;
  }

  get monthlyInterest() {
    return (this.loanAmount * (this.effectiveInterestRate / 100)) / 12;
  }

  getNetMonthlyInterestForRate(rate: number) {
    return calculateNetInterest(this.loanAmount, rate, appState.household.length);
  }

  get netMonthlyInterest() {
    return this.getNetMonthlyInterestForRate(this.effectiveInterestRate);
  }

  getInterestForRate(rate: number) {
    return (this.loanAmount * (rate / 100)) / 12;
  }

  get mandatoryAmortizationRate() {
    const ltv = this.price > 0 ? this.loanAmount / this.price : 0;
    const ltvAmortization = ltv > 0.7 ? 2 : ltv > 0.5 ? 1 : 0;

    if (this.use2026Rules) {
      return ltvAmortization;
    }

    const annualIncome = appState.totalMonthlyIncome * 12;
    const debtToIncomeAmortization = this.loanAmount > annualIncome * 4.5 ? 1 : 0;

    return ltvAmortization + debtToIncomeAmortization;
  }

  get mandatoryMonthlyAmortization() {
    return (this.loanAmount * (this.mandatoryAmortizationRate / 100)) / 12;
  }

  get monthlyAmortization() {
    const mandatory = this.mandatoryMonthlyAmortization;
    if (this.loanMode === 'advanced') {
      const trancheTotal = this.loanTranches.reduce((sum, t) => sum + (t.amortization || 0), 0);
      return Math.max(mandatory, trancheTotal);
    }
    if (this.useMandatoryAmortization) {
      return mandatory;
    }
    return Math.max(mandatory, this.customAmortizationAmount);
  }

  get lagfart() {
    // 1.5% of purchase price + 825 SEK fee
    return this.price * 0.015 + 825;
  }

  get pantbrev() {
    // 2% of NEW loan amount + 375 SEK fee
    const parentProperty = appState.properties.find((p) =>
      p.scenarios.some((s) => s.id === this.id)
    );
    const existing = parentProperty?.existingPantbrev || 0;
    const newLoanAmountNeeded = Math.max(0, this.loanAmount - existing);
    return newLoanAmountNeeded > 0 ? newLoanAmountNeeded * 0.02 + 375 : 0;
  }

  get totalInitialCost() {
    return this.downpayment + this.lagfart + this.pantbrev;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      interestRate: this.interestRate,
      downpayment: this.downpayment,
      amortizationRate: this.amortizationRate,
      isSelected: this.isSelected,
      useMandatoryAmortization: this.useMandatoryAmortization,
      customAmortizationAmount: this.customAmortizationAmount,
      additionalInterestRates: $state.snapshot(this.additionalInterestRates),
      use2026Rules: this.use2026Rules,
      reasoning: this.reasoning,
      loanMode: this.loanMode,
      loanTranches: $state.snapshot(this.loanTranches)
    };
  }

  static fromJSON(data: Partial<ScenarioJSON>) {
    const s = new Scenario(data.name || 'Default', data.price || 0);
    s.id = (data.id as typeof s.id) || s.id;
    s.interestRate = data.interestRate ?? 4.0;
    s.downpayment = data.downpayment ?? (data.price ? data.price * 0.15 : 0);
    s.amortizationRate = data.amortizationRate ?? 1.0;
    s.isSelected = data.isSelected ?? false;
    s.useMandatoryAmortization = data.useMandatoryAmortization ?? true;
    s.customAmortizationAmount = data.customAmortizationAmount ?? 0;
    s.additionalInterestRates = [...(data.additionalInterestRates || [])];
    s.use2026Rules = data.use2026Rules ?? data.use2026TentativeRules ?? true;
    s.reasoning = data.reasoning;
    s.loanMode = data.loanMode || 'simple';
    s.loanTranches =
      data.loanTranches && data.loanTranches.length > 0
        ? data.loanTranches.map((t) => ({
            id: t.id || generateLocalId(),
            percentage: t.percentage || 0,
            rate: t.rate || 0,
            period: t.period || '3mo',
            amortization: t.amortization || 0
          }))
        : [
            {
              id: generateLocalId(),
              percentage: 100,
              rate: s.interestRate,
              period: '3mo',
              amortization: 0
            }
          ];
    return s;
  }
}

export class Property {
  id = generateLocalId();
  type = $state<PropertyType>('bostadsratt');
  name = $state('');
  address = $state('');
  surfaceArea = $state(0);
  biarea = $state(0);
  rooms = $state(0);
  plotArea = $state(0);
  monthlyFee = $state(0);
  operatingCosts = $state(0);
  constructionYear = $state<number | null>(null);
  taxValue = $state(0);
  sourceUrl = $state<string | null>(null);
  energyClass = $state<EnergyClass>('?');
  isFavorite = $state(false);
  existingPantbrev = $state(0);
  scenarios = $state<Scenario[]>([]);
  associationName = $state<string | null>(null);
  associationUrl = $state<string | null>(null);

  constructor(name: string, type: PropertyType = 'bostadsratt') {
    this.name = name;
    this.type = type;
  }

  get propertyTax() {
    if (this.type !== 'villa') {
      return 0;
    }
    const currentYear = new SvelteDate().getFullYear();
    if (this.constructionYear && currentYear - this.constructionYear <= 15) {
      return 0;
    }
    const maxTax = 9525;
    const calculated = this.taxValue * 0.0075;
    return Math.min(calculated || maxTax, maxTax);
  }

  get monthlyPropertyTax() {
    return this.propertyTax / 12;
  }

  addScenario(name: string, price = 0, isSelected = true) {
    const s = new Scenario(name, price);
    s.isSelected = isSelected;
    this.scenarios.push(s);
    return s;
  }

  duplicateScenario(id: string) {
    const original = this.scenarios.find((s) => s.id === id);
    if (!original) {
      return null;
    }

    const _t = get(t);
    const clone = Scenario.fromJSON(original.toJSON());
    clone.id = generateLocalId();
    const baseName =
      original.name === '__ASKING_PRICE__' ? _t('scenario.askingPrice') : original.name;
    clone.name = `${baseName} (${_t('scenario.duplicate')})`;
    this.scenarios.push(clone);
    return clone;
  }

  deleteScenario(id: string) {
    this.scenarios = this.scenarios.filter((s) => s.id !== id);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      address: this.address,
      surfaceArea: this.surfaceArea,
      biarea: this.biarea,
      rooms: this.rooms,
      plotArea: this.plotArea,
      monthlyFee: this.monthlyFee,
      operatingCosts: this.operatingCosts,
      constructionYear: this.constructionYear,
      taxValue: this.taxValue,
      sourceUrl: this.sourceUrl,
      energyClass: this.energyClass,
      isFavorite: this.isFavorite,
      existingPantbrev: this.existingPantbrev,
      associationName: this.associationName,
      associationUrl: this.associationUrl,
      scenarios: this.scenarios.map((s) => s.toJSON())
    };
  }

  static fromJSON(data: Partial<PropertyJSON>) {
    const p = new Property(data.name || 'Unnamed', data.type || 'bostadsratt');
    p.id = (data.id as typeof p.id) || p.id;
    p.address = data.address || '';
    p.surfaceArea = data.surfaceArea || 0;
    p.biarea = data.biarea || 0;
    p.rooms = data.rooms || 0;
    p.plotArea = data.plotArea || 0;
    p.monthlyFee = data.monthlyFee || 0;
    p.operatingCosts = data.operatingCosts || 0;
    p.constructionYear = data.constructionYear || null;
    p.taxValue = data.taxValue || 0;
    p.sourceUrl = data.sourceUrl || null;
    p.energyClass = data.energyClass || '?';
    p.isFavorite = data.isFavorite || false;
    p.existingPantbrev = data.existingPantbrev || 0;
    p.associationName = data.associationName || null;
    p.associationUrl = data.associationUrl || null;
    p.scenarios = (data.scenarios || [])
      .filter((s) => s !== null && typeof s === 'object')
      .map((s) => Scenario.fromJSON(s as ScenarioJSON));
    return p;
  }
}

export class SaleDetails {
  type = $state<PropertyType>('bostadsratt');
  originalValue = $state(0);
  improvementCosts = $state(0);
  saleValue = $state(0);
  saleCosts = $state(0);
  currentLoan = $state(0);
  currentLoanCosts = $state(0);
  useTaxDeferral = $state(false);
  operatingCosts = $state(0);
  monthlyFee = $state(0);

  get profit() {
    return this.saleValue - this.originalValue - this.improvementCosts - this.saleCosts;
  }

  get tax() {
    return Math.max(0, this.profit * 0.22);
  }

  get netProceeds() {
    const taxToPay = this.useTaxDeferral ? 0 : this.tax;
    return this.saleValue - this.saleCosts - this.currentLoan - taxToPay;
  }

  toJSON() {
    return {
      type: this.type,
      originalValue: this.originalValue,
      improvementCosts: this.improvementCosts,
      saleValue: this.saleValue,
      saleCosts: this.saleCosts,
      currentLoan: this.currentLoan,
      currentLoanCosts: this.currentLoanCosts,
      useTaxDeferral: this.useTaxDeferral,
      operatingCosts: this.operatingCosts,
      monthlyFee: this.monthlyFee
    };
  }

  static fromJSON(data: Partial<SaleDetailsJSON>) {
    const s = new SaleDetails();
    s.type = data.type || 'bostadsratt';
    s.originalValue = data.originalValue || 0;
    s.improvementCosts = data.improvementCosts || 0;
    s.saleValue = data.saleValue || 0;
    s.saleCosts = data.saleCosts || 0;
    s.currentLoan = data.currentLoan || 0;
    s.currentLoanCosts = data.currentLoanCosts || 0;
    s.useTaxDeferral = data.useTaxDeferral || false;
    s.operatingCosts = data.operatingCosts || 0;
    s.monthlyFee = data.monthlyFee || 0;
    return s;
  }
}

export class AppState {
  properties = $state<Property[]>([]);
  myProperty = new SaleDetails();
  household = $state<Person[]>([]);
  additionalCash = $state(0);
  childrenCount = $state(0);
  activeTab = $state<'properties' | 'my-property' | 'income' | 'comparison'>('properties');
  selectedPropertyId = $state<string | null>(null);
  hasCompletedOnboarding = $state(false);
  toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

  constructor() {
    this.loadFromLocalStorage();
  }

  completeOnboarding() {
    this.hasCompletedOnboarding = true;
    this.persist();
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
    }, 3000);
  }

  get totalMonthlyIncome() {
    return this.household.reduce((sum, p) => sum + p.bruttoIncome, 0);
  }

  get totalNetMonthlyIncome() {
    return this.household.reduce((sum, p) => sum + p.netIncome, 0);
  }

  get selectedProperty() {
    return this.properties.find((p) => p.id === this.selectedPropertyId) || null;
  }

  addProperty(name: string, type: PropertyType = 'bostadsratt') {
    const p = new Property(name, type);
    this.properties.push(p);
    return p;
  }

  removeProperty(id: string) {
    this.properties = this.properties.filter((p) => p.id !== id);
    if (this.selectedPropertyId === id) {
      this.selectedPropertyId = null;
    }
  }

  resetState() {
    this.properties = [];
    this.myProperty = new SaleDetails();
    this.household = [];
    this.additionalCash = 0;
    this.childrenCount = 0;
    this.activeTab = 'properties';
    this.selectedPropertyId = null;
    this.hasCompletedOnboarding = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bovett_state');
    }
  }

  loadFromLocalStorage() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const saved = localStorage.getItem('bovett_state');
      if (saved) {
        const data = JSON.parse(saved);
        this.hydrate(data);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
  }

  persist() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const data = {
        properties: this.properties.map((p) => p.toJSON()),
        myProperty: this.myProperty.toJSON(),
        household: this.household.map((p) => p.toJSON()),
        additionalCash: this.additionalCash,
        childrenCount: this.childrenCount,
        activeTab: this.activeTab,
        selectedPropertyId: this.selectedPropertyId,
        hasCompletedOnboarding: this.hasCompletedOnboarding
      };
      localStorage.setItem('bovett_state', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  hydrate(data: AppStateJSON) {
    this.properties = (data.properties || []).map((p: PropertyJSON) => Property.fromJSON(p));
    this.myProperty = SaleDetails.fromJSON(data.myProperty || {});
    this.household = (data.household || []).map((p: PersonJSON) => Person.fromJSON(p));
    this.additionalCash = data.additionalCash || 0;
    this.childrenCount = data.childrenCount || 0;
    this.activeTab = (data.activeTab as AppStateJSON['activeTab']) || 'properties';
    this.selectedPropertyId = data.selectedPropertyId || null;
    this.hasCompletedOnboarding = data.hasCompletedOnboarding || false;
  }
}

export const appState = new AppState();

export async function fetchBooliData(url: string) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Use absolute URL if we have an origin, otherwise fallback to relative
    const apiUrl = `${origin}/api/import?url=${encodeURIComponent(url)}`;

    console.log(`Importing from: ${apiUrl}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error(`API Error (${response.status}): ${errorText}`);

      let message = 'Failed to fetch from internal API';
      try {
        const errorData = JSON.parse(errorText);
        message = errorData.message || message;
      } catch {
        // Not JSON
      }
      const err = new Error(message);
      (err as Error & { status: number }).status = response.status;
      throw err;
    }

    return await response.json();
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    // eslint-disable-next-line no-console
    console.error('Import error:', err);
    throw new Error(err instanceof Error ? err.message : 'Error importing from Booli');
  }
}
