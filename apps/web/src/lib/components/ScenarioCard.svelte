<script lang="ts">
  import { t } from 'svelte-i18n';
  import { appState, type Property, type Scenario } from '$lib/property.svelte';
  import FormattedNumberInput from './FormattedNumberInput.svelte';
  import ScenarioChart from './ScenarioChart.svelte';
  import Tooltip from './Tooltip.svelte';
  import { calculateKalp, formatCurrency } from '$lib/utils';
  import { slide, fade } from 'svelte/transition';

  import { browser } from '$app/environment';

  let { property, scenario, onToggle } = $props<{
    property: Property;
    scenario: Scenario;
    onToggle: () => void;
  }>();

  const isNative = $derived(
    browser &&
      !!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } })
        .Capacitor &&
      (!!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
        ?.isNative ||
        (window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
          ?.platform !== 'web')
  );

  let minDownpaymentPercent = $derived(scenario.use2026Rules ? 10 : 15);
  let minDownpayment = $derived(scenario.price * (minDownpaymentPercent / 100));

  $effect(() => {
    if (scenario.downpayment < minDownpayment) {
      scenario.downpayment = minDownpayment;
    }
  });

  let loanToValue = $derived(scenario.price > 0 ? scenario.loanAmount / scenario.price : 0);
  let vtlAmortization = $derived(loanToValue > 0.7 ? 2 : loanToValue > 0.5 ? 1 : 0);

  let annualIncome = $derived(appState.totalMonthlyIncome * 12);
  let debtToIncomeAmortization = $derived(scenario.loanAmount > annualIncome * 4.5 ? 1 : 0);

  let minAmortizationRate = $derived(
    vtlAmortization + (scenario.use2026Rules ? 0 : debtToIncomeAmortization)
  );

  let minAmortizationAmount = $derived(Math.ceil(scenario.mandatoryMonthlyAmortization));

  function handleAmortizationBlur() {
    if (!scenario.useMandatoryAmortization) {
      // Round to nearest SEK
      scenario.customAmortizationAmount = Math.round(scenario.customAmortizationAmount);
      // Clamp to minimum required
      if (scenario.customAmortizationAmount < minAmortizationAmount) {
        scenario.customAmortizationAmount = minAmortizationAmount;
      }
    }
  }

  // KALP Calculation using unified logic
  let kalp = $derived(
    calculateKalp({
      netIncome: appState.totalNetMonthlyIncome,
      loanAmount: scenario.loanAmount,
      interestRate: scenario.effectiveInterestRate,
      monthlyAmortization: scenario.monthlyAmortization,
      monthlyFee: property.monthlyFee || 0,
      operatingCosts: property.operatingCosts || 0,
      monthlyPropertyTax: property.monthlyPropertyTax,
      adults: appState.household.length,
      children: appState.childrenCount
    })
  );

  function getKalpColor(val: number) {
    if (val < 0) {
      return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50';
    }
    if (val < 5000) {
      return 'text-amber-600/80 dark:text-amber-500/70 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30';
    }
    return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-900/50';
  }

  function createScenarioFromRate(rate: number, index: number) {
    if (!property) {
      return;
    }
    const newSc = property.duplicateScenario(scenario.id);
    if (newSc) {
      newSc.interestRate = rate;
      newSc.name = `${rate}% Interest`;
      newSc.additionalInterestRates = [];
      scenario.additionalInterestRates.splice(index, 1);
    }
  }

  let totalInitialCost = $derived(
    scenario.downpayment + (property.type === 'villa' ? scenario.lagfart + scenario.pantbrev : 0)
  );

  let pricePerSqm = $derived(property.surfaceArea > 0 ? scenario.price / property.surfaceArea : 0);

  let downpaymentPercentage = $derived(
    scenario.price > 0 ? (scenario.downpayment / scenario.price) * 100 : 0
  );

  let dpColorClass = $derived(
    downpaymentPercentage < 30
      ? 'accent-amber-500'
      : downpaymentPercentage < 50
        ? 'accent-teal-500'
        : 'accent-green-500'
  );

  let dpColorHex = $derived(
    downpaymentPercentage < 30 ? '#f59e0b' : downpaymentPercentage < 50 ? '#14b8a6' : '#22c55e'
  );

  let isEditingScenarioName = $state(false);

  // Confetti Easter Egg
  let showConfetti = $state(false);
  let hasPlayedConfetti = $state(false);
  let confettiTimeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    // Explicitly read deep properties to track changes for persistence
    const _ = {
      price: scenario.price,
      downpayment: scenario.downpayment,
      interestRate: scenario.interestRate,
      amortizationRate: scenario.amortizationRate,
      useMandatoryAmortization: scenario.useMandatoryAmortization,
      customAmortizationAmount: scenario.customAmortizationAmount,
      use2026Rules: scenario.use2026Rules,
      loanMode: scenario.loanMode,
      name: scenario.name,
      isSelected: scenario.isSelected,
      tranches: scenario.loanTranches
        ? scenario.loanTranches.map((t) => t.percentage + t.rate + t.period + (t.amortization || 0))
        : []
    };
    appState.persist();
  });

  // Advanced Loan State
  let lockPeriods = $derived([
    { value: '3mo', label: $t('scenario.periods.3mo') },
    { value: '1y', label: $t('scenario.periods.1y') },
    { value: '2y', label: $t('scenario.periods.2y') },
    { value: '3y', label: $t('scenario.periods.3y') },
    { value: '4y', label: $t('scenario.periods.4y') },
    { value: '5y', label: $t('scenario.periods.5y') },
    { value: '7y', label: $t('scenario.periods.7y') },
    { value: '10y', label: $t('scenario.periods.10y') }
  ]);

  function addTranche() {
    if (!scenario.loanTranches || scenario.loanTranches.length >= 4) return;
    // Attempt to split the remaining percentage
    const currentTotal = scenario.loanTranches.reduce((sum, t) => sum + t.percentage, 0);
    const remaining = Math.max(0, 100 - currentTotal);

    // If we're already at 100%, steal from the largest tranche
    if (remaining === 0 && scenario.loanTranches.length > 0) {
      let largestIdx = 0;
      for (let i = 1; i < scenario.loanTranches.length; i++) {
        if (scenario.loanTranches[i].percentage > scenario.loanTranches[largestIdx].percentage) {
          largestIdx = i;
        }
      }
      const splitAmount = Math.floor(scenario.loanTranches[largestIdx].percentage / 2);
      scenario.loanTranches[largestIdx].percentage -= splitAmount;
      scenario.loanTranches.push({
        id: Math.random().toString(36).substring(2, 11),
        percentage: splitAmount,
        rate: scenario.interestRate,
        period: '3mo',
        amortization: 0
      });
    } else {
      scenario.loanTranches.push({
        id: Math.random().toString(36).substring(2, 11),
        percentage: remaining,
        rate: scenario.interestRate,
        period: '3mo',
        amortization: 0
      });
    }
    appState.persist();
  }

  function removeTranche(index: number) {
    if (!scenario.loanTranches || scenario.loanTranches.length <= 1) return;
    const removedPercentage = scenario.loanTranches[index].percentage;
    scenario.loanTranches.splice(index, 1);
    // Give percentage back to the first available tranche
    if (scenario.loanTranches.length > 0) {
      scenario.loanTranches[0].percentage += removedPercentage;
    }
    appState.persist();
  }

  $effect(() => {
    if (downpaymentPercentage >= 100) {
      if (!hasPlayedConfetti) {
        showConfetti = true;
        hasPlayedConfetti = true;
        if (confettiTimeout) {
          clearTimeout(confettiTimeout);
        }
        confettiTimeout = setTimeout(() => {
          showConfetti = false;
        }, 3000);
      }
    } else {
      hasPlayedConfetti = false;
      showConfetti = false;
    }
  });

  function focus(el: HTMLInputElement) {
    el.focus();
  }
</script>

<div
  class="relative rounded-3xl border bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:bg-stone-800 dark:shadow-stone-950/50 {scenario.isSelected
    ? 'border-teal-400 ring-2 ring-teal-200 dark:border-teal-500 dark:ring-teal-900/50'
    : 'border-stone-100 dark:border-stone-700/50'} transition-all duration-300"
>
  {#if showConfetti}
    <div
      class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden rounded-3xl"
    >
      {#each Array(100) as _, i (i)}
        <div
          class="confetti absolute h-2 w-2"
          style="
            background-color: {['#f59e0b', '#14b8a6', '#22c55e', '#ef4444', '#3b82f6'][i % 5]};
            left: {Math.random() * 100}%;
            top: -10%;
            transform: rotate({Math.random() * 360}deg);
            --drift: {(Math.random() - 0.5) * 150}px;
            --duration: {1.5 + Math.random() * 2.5}s;
            --delay: {Math.random() * 1}s;
          "
        ></div>
      {/each}
    </div>
  {/if}

  <div class="mb-4 flex items-center justify-between">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      {#if isEditingScenarioName}
        <input
          type="text"
          class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-teal-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          bind:value={scenario.name}
          onblur={() => (isEditingScenarioName = false)}
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              isEditingScenarioName = false;
            }
            if (e.key === 'Escape') {
              isEditingScenarioName = false;
            }
          }}
          use:focus
          aria-label={$t('properties.scenarioPlaceholder')}
        />
      {:else}
        <h3 class="truncate text-xs font-bold text-stone-900 md:text-sm dark:text-stone-100">
          {scenario.name === '__ASKING_PRICE__' ? $t('scenario.askingPrice') : scenario.name}
        </h3>
      {/if}
      <button
        class="shrink-0 text-stone-300 transition-colors hover:text-stone-500"
        onclick={() => {
          if (scenario.name === '__ASKING_PRICE__') {
            scenario.name = $t('scenario.askingPrice');
          }
          isEditingScenarioName = !isEditingScenarioName;
        }}
        title="Edit Scenario Name"
        aria-label="Edit Scenario Name"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
          />
        </svg>
      </button>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-2">
      <div class="flex items-center gap-2 md:gap-3">
        <span
          class="hidden text-[10px] font-medium text-stone-400 sm:inline dark:text-stone-500"
          aria-hidden="true">{$t('properties.compareHelp')}</span
        >
        <button
          class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors {scenario.isSelected
            ? 'border-teal-500 bg-white dark:border-teal-400 dark:bg-stone-900'
            : 'border-stone-200 hover:border-stone-400 dark:border-stone-700'}"
          onclick={onToggle}
          aria-label="{$t('properties.compareHelp')}: {scenario.name === '__ASKING_PRICE__'
            ? $t('scenario.askingPrice')
            : scenario.name}"
          aria-pressed={scenario.isSelected}
        >
          {#if scenario.isSelected}
            <svg
              class="h-4 w-4 text-teal-500 dark:text-teal-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}
        </button>
      </div>
      {#if !isNative}
        <a
          href="/finance-planning?type={property.type === 'villa'
            ? 'house'
            : 'apartment'}&purchasePriceNew={scenario.price}&downpayment={scenario.downpayment}&existingPantbrev={property.existingPantbrev}&additionalSavings={appState.additionalSavings}&salePrice={appState
            .myProperty.saleValue}&purchasePriceOld={appState.myProperty
            .originalValue}&saleCosts={appState.myProperty.saleCosts}&renovationCosts={appState
            .myProperty.improvementCosts}&currentMortgage={appState.myProperty.currentLoan}"
          class="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700 transition-all hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30"
          title={$t('actions.planMove')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{$t('actions.planMove')}</span>
        </a>
      {/if}
    </div>
  </div>

  <div class="mb-4 space-y-4">
    <div class="grid grid-cols-1 items-start gap-x-6 gap-y-4 text-xs sm:grid-cols-2">
      <!-- Left Column: Price, Loan, Upfront Costs -->
      <div class="contents sm:block sm:space-y-4">
        <!-- Purchase Price -->
        <label class="order-1 block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
            >{$t('scenario.price')}</span
          >
          <FormattedNumberInput
            currency="SEK"
            class="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200"
            bind:value={scenario.price}
          />
          {#if pricePerSqm > 0}
            <div
              class="mt-1 px-1 text-[9px] font-medium text-stone-400 md:text-[10px] dark:text-stone-500"
            >
              {$t('scenario.pricePerSqm')}: {formatCurrency(pricePerSqm)}
            </div>
          {/if}
        </label>

        <!-- Loan Amount (Calculated) -->
        <div class="order-3 block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
            >{$t('scenario.loanAmount')}</span
          >
          <div
            class="w-full rounded-xl border border-stone-100 bg-stone-100/30 px-3 py-2 text-right text-xs font-bold text-stone-500 dark:border-stone-700/50 dark:bg-stone-900/50 dark:text-stone-400"
          >
            {formatCurrency(scenario.loanAmount)}
          </div>
        </div>

        {#if property.type === 'villa'}
          <div class="order-4 block">
            <span
              class="mb-1 block text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
              >{$t('scenario.upfrontCosts')}</span
            >
            <div
              class="space-y-1.5 rounded-xl border border-stone-100 bg-stone-100/50 p-3 dark:border-stone-700/50 dark:bg-stone-900/50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <span
                    class="text-[9px] font-bold uppercase tracking-tight text-stone-400 dark:text-stone-500"
                    >{$t('scenario.lagfart')}</span
                  >
                  <Tooltip text={$t('scenario.lagfartTooltip')} />
                </div>
                <span class="text-[10px] font-bold text-stone-600 dark:text-stone-400"
                  >{formatCurrency(scenario.lagfart)}</span
                >
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <span
                    class="text-[9px] font-bold uppercase tracking-tight text-stone-400 dark:text-stone-500"
                    >{$t('scenario.pantbrev')}</span
                  >
                  <Tooltip text={$t('scenario.pantbrevTooltip')} />
                </div>
                <span class="text-[10px] font-bold text-stone-600 dark:text-stone-400"
                  >{formatCurrency(scenario.pantbrev)}</span
                >
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column: Downpayment, Interest -->
      <div class="contents sm:block sm:space-y-4">
        <!-- Downpayment -->
        <label class="order-2 block">
          <div class="mb-1 flex items-end justify-between">
            <span
              class="block text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
              >{$t('scenario.downpayment')}</span
            >
            <span class="text-[10px] font-semibold text-stone-700 md:text-xs dark:text-stone-300"
              >{scenario.price > 0
                ? Math.round((scenario.downpayment / scenario.price) * 100)
                : minDownpaymentPercent}%</span
            >
          </div>
          <input
            type="range"
            min={minDownpaymentPercent}
            max="100"
            step="1"
            class="mb-2 h-2 w-full cursor-pointer appearance-none rounded-xl transition-all {dpColorClass}"
            style="background-color: {dpColorHex}44;"
            value={scenario.price > 0
              ? (scenario.downpayment / scenario.price) * 100
              : minDownpaymentPercent}
            oninput={(e) => {
              scenario.downpayment = scenario.price * (parseInt(e.currentTarget.value) / 100);
            }}
          />
          <FormattedNumberInput
            currency="SEK"
            class="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200"
            bind:value={scenario.downpayment}
          />
        </label>

        <!-- Interest Rate & Loan Mode Toggle -->
        <div class="order-5 block">
          <div class="mb-1 flex items-center justify-between">
            <span
              class="text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
              >{$t('scenario.interest')}</span
            >
            <div class="flex gap-1 rounded-md bg-stone-100 p-0.5 dark:bg-stone-800">
              <button
                class="rounded px-2 py-0.5 text-[9px] font-bold uppercase transition-colors {scenario.loanMode ===
                'simple'
                  ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}"
                onclick={() => {
                  scenario.loanMode = 'simple';
                  appState.persist();
                }}
              >
                {$t('scenario.simpleLoan')}
              </button>
              <button
                class="rounded px-2 py-0.5 text-[9px] font-bold uppercase transition-colors {scenario.loanMode ===
                'advanced'
                  ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}"
                onclick={() => {
                  scenario.loanMode = 'advanced';
                  appState.persist();
                }}
              >
                {$t('scenario.advancedLoan')}
              </button>
            </div>
          </div>

          {#if scenario.loanMode === 'simple'}
            <div class="space-y-1.5" in:fade={{ duration: 150 }}>
              <div class="flex items-center gap-1.5">
                <div class="relative w-24">
                  <input
                    type="number"
                    step="0.01"
                    class="w-full rounded-lg border border-stone-100 bg-stone-50 py-1.5 pl-2 pr-6 text-right text-xs text-stone-800 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200"
                    value={scenario.interestRate}
                    oninput={(e) => {
                      scenario.interestRate = parseFloat(e.currentTarget.value) || 0;
                      appState.persist();
                    }}
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                    >%</span
                  >
                </div>
                <button
                  class="rounded-lg border border-stone-200 bg-stone-100 px-2 py-1.5 text-[10px] font-bold uppercase text-stone-600 transition-colors hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400"
                  onclick={() =>
                    scenario.additionalInterestRates.push(
                      parseFloat((scenario.interestRate + 1).toFixed(2))
                    )}
                >
                  +
                </button>
              </div>

              {#each scenario.additionalInterestRates as rate, i (i)}
                <div class="animate-in slide-in-from-left-2 flex items-center gap-1.5 duration-200">
                  <div class="relative w-24">
                    <input
                      type="number"
                      step="0.01"
                      class="w-full rounded-lg border border-stone-100 bg-stone-50/50 py-1.5 pl-2 pr-6 text-right text-xs text-stone-800 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700/50 dark:bg-stone-900/50 dark:text-stone-200"
                      value={scenario.additionalInterestRates[i]}
                      oninput={(e) =>
                        (scenario.additionalInterestRates[i] =
                          parseFloat(e.currentTarget.value) || 0)}
                    />
                    <span
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                      >%</span
                    >
                  </div>
                  <button
                    class="p-1 text-red-400/80 transition-colors hover:text-red-600 dark:text-red-400/60"
                    onclick={() => scenario.additionalInterestRates.splice(i, 1)}
                    aria-label={$t('scenario.removeRate')}
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    class="p-1 text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
                    onclick={() => createScenarioFromRate(rate, i)}
                    title="Create Scenario from this rate"
                    aria-label={$t('scenario.createScenarioFromRate')}
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.183a1 1 0 01-.633-.633l-.183-.551z"
                      />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {:else}
            <div
              class="space-y-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3 dark:border-stone-700/50 dark:bg-stone-900/30"
              in:fade={{ duration: 150 }}
            >
              <div
                class="hidden grid-cols-12 gap-2 text-[9px] font-bold uppercase tracking-wider text-stone-500 sm:grid"
              >
                <div class="col-span-2">{$t('scenario.percentage')}</div>
                <div class="col-span-3">{$t('scenario.lockPeriod')}</div>
                <div class="col-span-3">{$t('scenario.interestLabel')}</div>
                <div class="col-span-3">{$t('scenario.amortizationLabel')}</div>
                <div class="col-span-1"></div>
              </div>

              <div class="space-y-6 sm:space-y-2">
                {#each scenario.loanTranches as tranche, i (tranche.id)}
                  <div
                    class="flex flex-col gap-3 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2"
                    transition:slide={{ duration: 200 }}
                  >
                    <!-- Share & Period Row -->
                    <div class="grid grid-cols-2 gap-2 sm:col-span-5 sm:grid-cols-5">
                      <div class="flex flex-col sm:col-span-2">
                        <span
                          class="mb-1 block text-[8px] font-bold uppercase text-stone-400 sm:hidden"
                          >{$t('scenario.percentage')}</span
                        >
                        <div class="relative">
                          <input
                            type="number"
                            class="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-stone-600 dark:bg-stone-800"
                            value={tranche.percentage}
                            oninput={(e) => {
                              scenario.loanTranches[i].percentage =
                                parseFloat(e.currentTarget.value) || 0;
                              appState.persist();
                            }}
                          />
                          <span
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                            >%</span
                          >
                        </div>
                      </div>

                      <div class="flex flex-col sm:col-span-3">
                        <span
                          class="mb-1 block text-[8px] font-bold uppercase text-stone-400 sm:hidden"
                          >{$t('scenario.lockPeriod')}</span
                        >
                        <select
                          class="w-full rounded-lg border border-stone-200 bg-white px-1 py-1.5 text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-stone-600 dark:bg-stone-800"
                          bind:value={scenario.loanTranches[i].period}
                          onchange={() => appState.persist()}
                        >
                          {#each lockPeriods as period}
                            <option value={period.value}>{period.label}</option>
                          {/each}
                        </select>
                      </div>
                    </div>

                    <!-- Rate & Amort Row -->
                    <div
                      class="grid grid-cols-2 gap-2 sm:col-span-6 sm:grid-cols-6 sm:items-center"
                    >
                      <div class="flex flex-col sm:col-span-3">
                        <span
                          class="mb-1 block text-[8px] font-bold uppercase text-stone-400 sm:hidden"
                          >{$t('scenario.interestLabel')}</span
                        >
                        <div class="relative">
                          <input
                            type="number"
                            step="0.01"
                            class="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-stone-600 dark:bg-stone-800"
                            value={tranche.rate}
                            oninput={(e) => {
                              scenario.loanTranches[i].rate =
                                parseFloat(e.currentTarget.value) || 0;
                              appState.persist();
                            }}
                          />
                          <span
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                            >%</span
                          >
                        </div>
                      </div>

                      <div class="flex flex-col sm:col-span-3">
                        <span
                          class="mb-1 block text-[8px] font-bold uppercase text-stone-400 sm:hidden"
                          >{$t('scenario.amortizationLabel')}</span
                        >
                        <FormattedNumberInput
                          currency="SEK/m"
                          class="w-full rounded-lg border border-stone-200 bg-white py-1.5 pr-2 text-right text-xs outline-none focus:ring-1 focus:ring-teal-500 dark:border-stone-600 dark:bg-stone-800"
                          bind:value={scenario.loanTranches[i].amortization}
                        />
                      </div>
                    </div>

                    <!-- Delete Button -->
                    <div class="flex justify-end sm:col-span-1">
                      <button
                        class="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 p-1.5 text-stone-400 transition-colors hover:text-red-500 disabled:opacity-30 sm:w-auto sm:border-0 sm:p-1"
                        onclick={() => removeTranche(i)}
                        disabled={scenario.loanTranches.length <= 1}
                      >
                        <svg
                          class="h-4 w-4 sm:h-3.5 sm:w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <span class="text-[10px] font-bold uppercase sm:hidden"
                          >{$t('scenario.delete')}</span
                        >
                      </button>
                    </div>
                  </div>
                {/each}
              </div>

              <div class="flex items-center justify-between border-t border-stone-200 pt-3">
                <button
                  class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase text-teal-600 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-400 hover:dark:bg-teal-900/30"
                  onclick={addTranche}
                  disabled={scenario.loanTranches.length >= 4}
                >
                  <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {$t('scenario.addSplit')}
                </button>

                <div class="flex flex-col items-end gap-0.5">
                  <div class="text-[10px] font-bold text-stone-500">
                    {$t('scenario.effectiveRate')}:
                    <span class="text-stone-900 dark:text-stone-100"
                      >{scenario.effectiveInterestRate.toFixed(2)}%</span
                    >
                  </div>
                  <div class="text-[9px] font-bold text-stone-400">
                    Total Amort: <span class="text-stone-700 dark:text-stone-300"
                      >{formatCurrency(
                        scenario.loanTranches.reduce((sum, t) => sum + (t.amortization || 0), 0)
                      )}</span
                    >
                  </div>
                </div>
              </div>

              {#if scenario.loanTranches.reduce((sum, t) => sum + (t.amortization || 0), 0) < minAmortizationAmount}
                <div
                  class="mt-2 text-[9px] font-medium leading-tight text-amber-600 dark:text-amber-500"
                >
                  ⚠️ {$t('scenario.amortizationLowWarning', {
                    values: { amount: formatCurrency(minAmortizationAmount) }
                  })}
                </div>
              {/if}

              {#if scenario.loanTranches.reduce((sum, t) => sum + t.percentage, 0) !== 100}
                <div
                  class="mt-2 rounded-lg bg-red-50 p-2 text-[10px] text-red-500 dark:bg-red-900/20"
                >
                  ⚠️ Summan av andelarna är {scenario.loanTranches.reduce(
                    (sum, t) => sum + t.percentage,
                    0
                  )}% (ska vara 100%).
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Spanning items -->
      <div
        class="order-6 col-span-1 mt-2 border-t border-stone-100 pt-3 sm:col-span-2 dark:border-stone-700/50"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <span
              class="text-[10px] font-bold uppercase text-stone-900 md:text-xs dark:text-stone-100"
              >{$t('scenario.totalInitialCost')}</span
            >
            <Tooltip text={$t('scenario.totalInitialCostTooltip')} />
          </div>
          <span class="text-xs font-black text-teal-600 md:text-sm dark:text-teal-400"
            >{formatCurrency(totalInitialCost)}</span
          >
        </div>
      </div>
      <div class="order-7 col-span-1 mt-2 block space-y-2 sm:col-span-2">
        <label
          class="flex cursor-pointer items-center justify-between rounded-xl border border-teal-200 bg-teal-50/30 p-3 transition-colors hover:bg-teal-50 dark:border-teal-900/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20"
        >
          <div class="flex min-w-0 flex-1 flex-col pr-2">
            <span
              class="select-none truncate text-[10px] font-bold text-teal-900 md:text-xs dark:text-teal-100"
              >{$t('scenario.use2026Rules')}</span
            >
            <span
              class="select-none truncate text-[9px] text-teal-700/70 md:text-[10px] dark:text-teal-400/70"
              >{$t('scenario.use2026RulesSub')}</span
            >
          </div>
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
            bind:checked={scenario.use2026Rules}
          />
        </label>

        {#if scenario.loanMode !== 'advanced'}
          <label
            class="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 bg-stone-100/50 p-3 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800/50"
          >
            <span
              class="select-none text-[10px] font-bold text-stone-900 md:text-xs dark:text-stone-100"
              >{$t('scenario.useMandatory')}</span
            >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
              bind:checked={scenario.useMandatoryAmortization}
            />
          </label>
        {/if}

        <div class="animate-in fade-in slide-in-from-top-1 mt-3 space-y-3 duration-300">
          {#if scenario.loanMode !== 'advanced' && !scenario.useMandatoryAmortization}
            <label class="block">
              <span
                class="mb-1 block text-[10px] font-bold uppercase text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('scenario.customAmortization')}
              </span>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div class="w-full shrink-0 sm:w-32">
                  <FormattedNumberInput
                    currency="SEK/m"
                    class="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-800 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200"
                    bind:value={scenario.customAmortizationAmount}
                    onblur={handleAmortizationBlur}
                  />
                </div>
              </div>
            </label>
            <p
              class="text-[9px] font-medium leading-tight text-amber-600 md:text-[10px] dark:text-amber-500"
            >
              {$t('scenario.clampedNote', {
                values: {
                  amount: formatCurrency(minAmortizationAmount),
                  rate: minAmortizationRate,
                  dti: debtToIncomeAmortization > 0 ? $t('scenario.clampedDti') : ''
                }
              })}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="space-y-2 rounded-2xl bg-stone-50 p-3 text-xs md:p-4 dark:bg-stone-900">
    <div
      class="flex flex-col gap-1 border-b border-stone-100 pb-2 text-stone-500 dark:border-stone-700/50 dark:text-stone-400"
    >
      <div class="flex items-center justify-between">
        <span class="font-semibold text-stone-700 dark:text-stone-300"
          >{$t('scenario.minAmortizationReq')}</span
        >
        <span class="font-bold text-stone-700 dark:text-stone-300">{minAmortizationRate}%</span>
      </div>
      <div
        class="flex items-center justify-between border-l-2 border-stone-200 pl-2 dark:border-stone-700"
      >
        <div class="flex items-center gap-1">
          <span class="text-[11px] md:text-xs">{$t('scenario.vtlReq')}</span>
          <Tooltip text={$t('scenario.vtlTooltip')} />
        </div>
        <span class="text-[11px] md:text-xs">{vtlAmortization}%</span>
      </div>
      <div
        class="flex items-center justify-between border-l-2 border-stone-200 pl-2 dark:border-stone-700"
      >
        <div
          class="flex items-center gap-1 {scenario.use2026Rules ? 'line-through opacity-50' : ''}"
        >
          <span class="text-[11px] md:text-xs">{$t('scenario.incomeReq')}</span>
          <Tooltip text={$t('scenario.dtiTooltip')} />
        </div>
        <span
          class="text-[11px] md:text-xs {scenario.use2026Rules ? 'line-through opacity-50' : ''}"
          >{debtToIncomeAmortization}%</span
        >
      </div>
      {#if scenario.use2026Rules}
        <div
          class="mt-0.5 border-l-2 border-teal-200 pl-2 text-[9px] font-medium text-teal-600 dark:border-teal-900/50 dark:text-teal-400"
        >
          {$t('scenario.dtiRemoved2026')}
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-between text-stone-500 dark:text-stone-400">
      <span class="text-[11px] md:text-xs">{$t('scenario.loanAmount')}</span>
      <span class="text-[11px] font-semibold text-stone-800 md:text-xs dark:text-stone-200"
        >{formatCurrency(scenario.loanAmount)}</span
      >
    </div>
    <div class="flex items-center justify-between text-stone-500 dark:text-stone-400">
      <div class="flex items-center gap-1">
        <span class="text-[11px] md:text-xs">{$t('scenario.monthlyInterest')}</span>
        {#if property.energyClass === 'A' || property.energyClass === 'B'}
          <Tooltip text={$t('scenario.greenDiscount')}>
            <svg
              class="h-3 w-3 cursor-help text-teal-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </Tooltip>
        {/if}
      </div>
      <span class="font-semibold text-stone-800 dark:text-stone-200"
        >{formatCurrency(scenario.monthlyInterest)}</span
      >
    </div>
    <div
      class="flex items-center justify-between border-l-2 border-stone-200 pl-2 text-stone-500 dark:border-stone-700 dark:text-stone-400"
    >
      <span class="text-[9px] font-bold uppercase tracking-tight md:text-[10px]"
        >{$t('scenario.netInterest')}</span
      >
      <span class="text-[9px] font-medium text-stone-700 md:text-[10px] dark:text-stone-300"
        >{formatCurrency(scenario.netMonthlyInterest)}</span
      >
    </div>
    <div class="flex items-center justify-between text-stone-500 dark:text-stone-400">
      <span class="text-[11px] md:text-xs">{$t('scenario.monthlyAmortization')}</span>
      <span class="text-[11px] font-semibold text-stone-800 md:text-xs dark:text-stone-200"
        >{formatCurrency(scenario.monthlyAmortization)}</span
      >
    </div>
    {#if property.type === 'villa'}
      <div class="flex items-center justify-between text-stone-500 dark:text-stone-400">
        <div class="flex items-center gap-1">
          <span class="text-[11px] md:text-xs">{$t('properties.propertyTaxPaidAnnually')}</span>
          <Tooltip text={$t('scenario.propertyTaxTooltip')} />
        </div>
        <span class="font-semibold text-stone-800 dark:text-stone-200"
          >{formatCurrency(property.monthlyPropertyTax)}</span
        >
      </div>
    {/if}
    <div
      class="flex items-center justify-between border-t border-stone-100 pt-2 text-xs font-bold text-stone-800 md:text-sm dark:border-stone-700/50 dark:text-stone-200"
    >
      <span>{$t('scenario.totalMonthly')}</span>
      <span
        >{formatCurrency(
          scenario.monthlyInterest +
            scenario.monthlyAmortization +
            property.monthlyPropertyTax +
            (property.monthlyFee || 0) +
            (property.operatingCosts || 0)
        )}</span
      >
    </div>

    <div class="mt-2 border-t-2 border-stone-100 pt-4 dark:border-stone-700/50">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200"
          >{$t('scenario.kalpTitle')}</span
        >
        <span class="rounded-md px-2 py-1 text-xs font-black {getKalpColor(kalp)}"
          >{formatCurrency(kalp)}</span
        >
      </div>
      <div class="rounded-lg {getKalpColor(kalp)} p-3">
        {#if kalp < 0}
          <div class="text-[11px] leading-snug md:text-xs">
            <p class="font-bold">{$t('scenario.kalpRejectedTitle')}</p>
            <p>{$t('scenario.kalpRejected')}</p>
          </div>
        {:else if kalp < 5000}
          <div class="text-[11px] leading-snug md:text-xs">
            <p class="font-bold">{$t('scenario.kalpMarginalTitle')}</p>
            <p>{$t('scenario.kalpMarginal')}</p>
          </div>
        {:else}
          <div class="text-[11px] leading-snug md:text-xs">
            <p class="font-bold">{$t('scenario.kalpApprovedTitle')}</p>
            <p>{$t('scenario.kalpApproved')}</p>
          </div>
        {/if}
      </div>
      <p class="mt-2 text-[10px] leading-tight text-stone-400 md:text-[11px] dark:text-stone-500">
        {$t('scenario.kalpNote')}
      </p>
    </div>

    <div class="mt-4 w-full">
      <ScenarioChart
        loanAmount={scenario.loanAmount}
        interestRate={scenario.effectiveInterestRate}
        loanTranches={scenario.loanTranches}
        additionalInterestRates={scenario.loanMode === 'advanced'
          ? []
          : scenario.additionalInterestRates}
        monthlyAmortization={scenario.monthlyAmortization}
        monthlyOperating={property.operatingCosts || 0}
        monthlyFee={property.monthlyFee || 0}
        monthlyPropertyTax={property.monthlyPropertyTax}
      />
    </div>
  </div>
</div>

<style>
  @keyframes fall {
    0% {
      top: -10%;
      transform: translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      top: 110%;
      transform: translateX(var(--drift)) rotate(720deg);
      opacity: 0;
    }
  }

  .confetti {
    border-radius: 2px;
    animation: fall var(--duration) ease-in forwards;
    animation-delay: var(--delay);
  }
</style>
