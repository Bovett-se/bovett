<script lang="ts">
  import { t } from 'svelte-i18n';
  import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
  import { calculateNetIncome } from '$lib/property.svelte';
  import {
    calculateKalp,
    calculateNetInterest,
    calculateStandardLivingCosts,
    formatCurrency
  } from '$lib/utils';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { trackEvent } from '$lib/analytics';
  import BrandHeader from '$lib/components/BrandHeader.svelte';

  // State
  let income = $state(45000);
  let adults = $state(1);
  let children = $state(0);
  let propertyType = $state<'bostadsratt' | 'villa'>('bostadsratt');

  let loanAmount = $state(2000000);
  let interestRate = $state(4.0);
  let amortizationRate = $state(2.0);

  let monthlyFee = $state(3000);
  let operatingCosts = $state(1500);
  let propertyTax = $state(0);

  // Track calculation usage with debounce
  let debounceTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    // Register dependencies for all inputs
    const _ = {
      income,
      adults,
      children,
      propertyType,
      loanAmount,
      interestRate,
      amortizationRate,
      monthlyFee,
      operatingCosts,
      propertyTax
    };

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      trackEvent('kalp_calculated');
    }, 2000);
  });

  // Derived calculations
  const netIncomePerAdult = $derived(calculateNetIncome(income));
  const totalNetIncome = $derived(netIncomePerAdult * adults);
  const stressInterestRate = $derived(Math.max(interestRate, 6.5));
  const monthlyAmortization = $derived((loanAmount * (amortizationRate / 100)) / 12);
  const standardLivingCosts = $derived(calculateStandardLivingCosts(adults, children));

  const kalp = $derived(
    calculateKalp({
      netIncome: totalNetIncome,
      loanAmount,
      interestRate,
      monthlyAmortization,
      monthlyFee: propertyType === 'bostadsratt' ? monthlyFee : 0,
      operatingCosts,
      monthlyPropertyTax: propertyType === 'villa' ? propertyTax : 0,
      adults,
      children
    })
  );

  const netStressMonthlyInterest = $derived(
    calculateNetInterest(loanAmount, stressInterestRate, adults)
  );

  function getKalpColor(val: number) {
    if (val < 0) {
      return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
    }
    if (val < 5000) {
      return 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20';
    }
    return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30';
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KALP Calculator by Bovett',
    description:
      'Calculate your Left To Live On (KALP) to understand Swedish mortgage requirements.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'SEK'
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Vad är KALP-kalkyl?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KALP står för Kvar Att Leva På och är bankernas modell för att beräkna om ett hushåll har råd med ett bolån efter att alla fasta kostnader och levnadskostnader är betalda.'
        }
      },
      {
        '@type': 'Question',
        name: 'Hur beräknas KALP?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KALP beräknas genom att ta hushållets nettoinkomst och dra av boendekostnader (inklusive en stressad ränta), amortering och schabloniserade levnadskostnader baserade på Konsumentverkets siffror.'
        }
      }
    ]
  };

  const appJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(appJsonLd)}<` + `/script>`;
  const faqJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}<` + `/script>`;
</script>

<svelte:head>
  <title>{$t('app.title')} - {$t('kalpCalc.title')}</title>
  <meta name="description" content={$t('kalpCalc.description')} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html appJsonLdString}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html faqJsonLdString}
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 px-6 py-12 sm:px-12 md:py-20">
  <div class="space-y-6">
    <BrandHeader />

    <div class="space-y-4">
      <h1 class="text-3xl font-extrabold tracking-tight text-stone-900 md:text-5xl dark:text-white">
        {$t('kalpCalc.title')}
      </h1>
      <p class="text-lg leading-relaxed text-stone-600 dark:text-stone-400">
        {$t('kalpCalc.description')}
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div class="space-y-6">
      <section
        class="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
      >
        <h2 class="mb-4 text-sm font-bold text-stone-900 dark:text-white">
          {$t('kalpCalc.household')}
        </h2>
        <div class="space-y-4">
          <label class="block">
            <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
              >{$t('kalpCalc.adults')}</span
            >
            <input
              type="number"
              min="1"
              class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
              value={adults}
              oninput={(e) => (adults = parseInt(e.currentTarget.value) || 0)}
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
              >{$t('kalpCalc.children')}</span
            >
            <input
              type="number"
              min="0"
              class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
              value={children}
              oninput={(e) => (children = parseInt(e.currentTarget.value) || 0)}
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
              >{$t('kalpCalc.avgIncome')}</span
            >
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
              bind:value={income}
            />
          </label>
        </div>
      </section>

      <section
        class="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
      >
        <h2 class="mb-4 text-sm font-bold text-stone-900 dark:text-white">{$t('kalpCalc.loan')}</h2>
        <div class="space-y-4">
          <label class="block">
            <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
              >{$t('scenario.loanAmount')}</span
            >
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
              bind:value={loanAmount}
            />
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="block">
              <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
                >{$t('scenario.interestLabel')}</span
              >
              <input
                type="number"
                step="0.1"
                class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
                value={interestRate}
                oninput={(e) => (interestRate = parseFloat(e.currentTarget.value) || 0)}
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
                >{$t('scenario.amortizationLabel')}</span
              >
              <input
                type="number"
                step="1"
                class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
                value={amortizationRate}
                oninput={(e) => (amortizationRate = parseFloat(e.currentTarget.value) || 0)}
              />
            </label>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-bold text-stone-900 dark:text-white">
            {$t('kalpCalc.propertyCosts')}
          </h2>
          <div class="flex gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-900">
            <button
              class="rounded-md px-2 py-1 text-[10px] font-bold transition-all {propertyType ===
              'bostadsratt'
                ? 'bg-white text-teal-600 shadow-sm dark:bg-stone-800'
                : 'text-stone-400'}"
              onclick={() => (propertyType = 'bostadsratt')}
            >
              {$t('types.bostadsratt')}
            </button>
            <button
              class="rounded-md px-2 py-1 text-[10px] font-bold transition-all {propertyType ===
              'villa'
                ? 'bg-white text-teal-600 shadow-sm dark:bg-stone-800'
                : 'text-stone-400'}"
              onclick={() => (propertyType = 'villa')}
            >
              {$t('types.villa')}
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            {#if propertyType === 'bostadsratt'}
              <label class="block">
                <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
                  >{$t('properties.monthlyFee')}</span
                >
                <FormattedNumberInput
                  currency="SEK"
                  class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
                  bind:value={monthlyFee}
                />
              </label>
            {/if}
            <label class="block {propertyType === 'villa' ? 'col-span-2' : ''}">
              <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
                >{$t('properties.operatingCosts')}</span
              >
              <FormattedNumberInput
                currency="SEK"
                class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
                bind:value={operatingCosts}
              />
            </label>
          </div>
          {#if propertyType === 'villa'}
            <label class="block">
              <span class="mb-1 block text-[10px] font-bold uppercase text-stone-400"
                >{$t('properties.propertyTax')}</span
              >
              <FormattedNumberInput
                currency="SEK"
                class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-700 dark:bg-stone-900/50"
                bind:value={propertyTax}
              />
            </label>
          {/if}
        </div>
      </section>
    </div>

    <div>
      <div
        class="sticky top-24 rounded-3xl bg-stone-900 p-6 text-white shadow-xl dark:bg-stone-800"
      >
        <h3 class="mb-6 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          {$t('kalpCalc.banksView')}
        </h3>

        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-stone-400">{$t('kalpCalc.netIncome')}</span>
            <span class="font-bold text-teal-400">+{formatCurrency(totalNetIncome)}</span>
          </div>

          <div class="h-px bg-stone-800"></div>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-1 text-stone-400">
              <span>{$t('kalpCalc.stressInterest')}</span>
              <Tooltip text={$t('kalpCalc.stressInterestTooltip')} />
            </div>
            <span class="font-bold text-red-400">-{formatCurrency(netStressMonthlyInterest)}</span>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-stone-400">{$t('scenario.amortizationLabel')}</span>
            <span class="font-bold text-red-400">-{formatCurrency(monthlyAmortization)}</span>
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-stone-400">{$t('kalpCalc.propertyCosts')}</span>
            <span class="font-bold text-red-400"
              >-{formatCurrency(
                (propertyType === 'bostadsratt' ? monthlyFee : 0) +
                  operatingCosts +
                  (propertyType === 'villa' ? propertyTax : 0)
              )}</span
            >
          </div>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-1 text-stone-400">
              <span>{$t('kalpCalc.livingStandard')}</span>
              <Tooltip text={$t('kalpCalc.livingStandardTooltip')} />
            </div>
            <span class="font-bold text-red-400">-{formatCurrency(standardLivingCosts)}</span>
          </div>

          <div class="h-px bg-stone-800"></div>

          <div class="pt-2">
            <div class="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
              {$t('kalpCalc.remaining')}
            </div>
            <div class="inline-block rounded-xl px-4 py-2 text-2xl font-black {getKalpColor(kalp)}">
              {formatCurrency(kalp)}
            </div>
          </div>

          <div
            class="mt-4 rounded-xl border border-stone-800 bg-stone-900/50 p-4 text-xs leading-relaxed text-stone-400"
          >
            {#if kalp < 0}
              <strong>{$t('kalpCalc.likelyRejected')}</strong> {$t('kalpCalc.rejectedDesc')}
            {:else if kalp < 5000}
              <strong>{$t('kalpCalc.marginal')}</strong> {$t('kalpCalc.marginalDesc')}
            {:else}
              <strong>{$t('kalpCalc.likelyApproved')}</strong> {$t('kalpCalc.approvedDesc')}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <section
    class="rounded-3xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-700/50 dark:bg-stone-900/30"
  >
    <h2 class="mb-4 text-xl font-bold text-stone-900 dark:text-white">
      {$t('kalpCalc.whatIsKalp')}
    </h2>
    <p class="leading-relaxed text-stone-600 dark:text-stone-400">
      {$t('kalpCalc.kalpDetail')}
    </p>
  </section>
</div>
