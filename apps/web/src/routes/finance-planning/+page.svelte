<script lang="ts">
  import { locale, t } from 'svelte-i18n';
  import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
  import { fade, slide } from 'svelte/transition';
  import BrandHeader from '$lib/components/BrandHeader.svelte';
  import { page } from '$app/stores';
  import { trackEvent, trackPageview } from '$lib/analytics';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatCurrency } from '$lib/utils';

  // State initialization from URL or defaults
  const query = $page.url.searchParams;

  let salePrice = $state(Number(query.get('salePrice')) || 0);
  let purchasePriceOld = $state(Number(query.get('purchasePriceOld')) || 0);
  let saleCosts = $state(Number(query.get('saleCosts')) || 0);
  let renovationCosts = $state(Number(query.get('renovationCosts')) || 0);
  let currentMortgage = $state(Number(query.get('currentMortgage')) || 0);

  // Initialize isSelling based on explicit param OR presence of data
  let isSelling = $state(
    query.get('isSelling') === 'true' ||
      (!query.has('isSelling') && (salePrice > 0 || purchasePriceOld > 0 || currentMortgage > 0))
  );

  let propertyType = $state<'apartment' | 'house'>(
    (query.get('type') as 'apartment' | 'house') || 'apartment'
  );
  let purchasePriceNew = $state(Number(query.get('purchasePriceNew')) || 0);
  let downpayment = $state(Number(query.get('downpayment')) || 0);
  let existingPantbrev = $state(Number(query.get('existingPantbrev')) || 0);
  let additionalSavings = $state(Number(query.get('additionalSavings')) || 0);

  // Dates
  const today = new Date();
  const threeMonthsDefault = new Date(today);
  threeMonthsDefault.setMonth(today.getMonth() + 3);

  let moveOutDate = $state(today.toISOString().split('T')[0]);
  let moveInDate = $state(threeMonthsDefault.toISOString().split('T')[0]);

  // Track initial pageview and interactions
  onMount(() => {
    trackPageview();
    trackEvent('finance_planner_viewed');
  });

  let debounceTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    // Track calculations
    const _deps = {
      isSelling,
      salePrice,
      purchasePriceNew,
      downpayment,
      moveInDate,
      moveOutDate
    };
    if (browser && purchasePriceNew > 0) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => trackEvent('finance_planner_calculated'), 3000);
    }
  });

  // Calculations
  const profit = $derived(Math.max(0, salePrice - purchasePriceOld - saleCosts - renovationCosts));
  const estimatedTax = $derived(profit * 0.22);
  const netProceeds = $derived(
    isSelling ? salePrice - saleCosts - estimatedTax - currentMortgage : 0
  );

  const handpenning = $derived(purchasePriceNew * 0.1);
  const finalDownpayment = $derived(downpayment - handpenning);

  const lagfart = $derived(
    propertyType === 'house' && purchasePriceNew > 0 ? purchasePriceNew * 0.015 + 825 : 0
  );
  const loanAmountNew = $derived(Math.max(0, purchasePriceNew - downpayment));
  const newPantbrevAmount = $derived(Math.max(0, loanAmountNew - existingPantbrev));
  const pantbrev = $derived(
    propertyType === 'house' && newPantbrevAmount > 0 ? newPantbrevAmount * 0.02 + 375 : 0
  );
  const extraFees = $derived(lagfart + pantbrev);

  const needsBridgeLoan = $derived(
    isSelling &&
      new Date(moveInDate) < new Date(moveOutDate) &&
      finalDownpayment + extraFees > additionalSavings
  );

  const bridgeLoanAmount = $derived(
    needsBridgeLoan ? Math.max(0, finalDownpayment + extraFees - additionalSavings) : 0
  );

  const totalUpfront = $derived(downpayment + extraFees);
  const dateFormatter = $derived(
    new Intl.DateTimeFormat($locale || 'sv-SE', { dateStyle: 'long' })
  );

  const timelineEvents = $derived.by(() => {
    const list = [];

    // 1. Contract Signing
    const signingDate = new Date(moveInDate);
    signingDate.setMonth(signingDate.getMonth() - 1);
    list.push({
      id: 'signing',
      type: 'payment',
      date: signingDate,
      label: $t('financePlanner.signing'),
      description: $t('financePlanner.signingDesc'),
      amount: handpenning,
      amountLabel: $t('financePlanner.payHandpenning'),
      icon: 'contract'
    });

    // 2. Move-in
    list.push({
      id: 'move-in',
      type: 'payment',
      date: new Date(moveInDate),
      label: $t('financePlanner.moveIn'),
      description: dateFormatter.format(new Date(moveInDate)),
      amount: finalDownpayment,
      amountLabel: $t('financePlanner.remainingDownpayment'),
      extraFees: extraFees,
      icon: 'home-in'
    });

    // 3. Move-out
    if (isSelling) {
      list.push({
        id: 'move-out',
        type: 'income',
        date: new Date(moveOutDate),
        label: $t('financePlanner.moveOut'),
        description: dateFormatter.format(new Date(moveOutDate)),
        amount: netProceeds,
        amountLabel: $t('financePlanner.moneyIn'),
        icon: 'home-out'
      });
    }

    const sorted = list.sort((a, b) => {
      if (a.id === 'signing') return -1;
      if (b.id === 'signing') return 1;
      return a.date.getTime() - b.date.getTime();
    });

    let runningBalance = additionalSavings;
    return sorted.map((e) => {
      if (e.type === 'income') {
        runningBalance += e.amount;
      } else {
        runningBalance -= e.amount + (e.extraFees || 0);
      }
      return { ...e, cumulative: runningBalance };
    });
  });

  function exportIcs() {
    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Bovett//Finance Planner//EN\r\n';
    for (const e of timelineEvents) {
      const dateStr = e.date.toISOString().split('T')[0].replace(/-/g, '');
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
      icsContent += `SUMMARY:${e.amountLabel}: ${formatCurrency(e.amount + (e.extraFees || 0))} kr\r\n`;
      icsContent += `DESCRIPTION:${e.label}\r\n`;
      icsContent += 'END:VEVENT\r\n';
    }
    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bovett-tidsplan.ics';
    link.click();
    trackEvent('finance_planner_ics_exported');
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Bovett Finance & Timeline Planner',
    description:
      'A tool for planning the financial flow and timeline of buying a new home in Sweden.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: $t('financePlanner.faq1_q'),
        acceptedAnswer: { '@type': 'Answer', text: $t('financePlanner.faq1_a') }
      },
      {
        '@type': 'Question',
        name: $t('financePlanner.faq2_q'),
        acceptedAnswer: { '@type': 'Answer', text: $t('financePlanner.faq2_a') }
      }
    ]
  };

  const appJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(appJsonLd)}<` + `/script>`;
  const faqJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}<` + `/script>`;
</script>

<svelte:head>
  <title>{$t('app.title')} - {$t('financePlanner.title')}</title>
  <meta name="description" content={$t('financePlanner.seoDescription')} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html appJsonLdString}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html faqJsonLdString}
</svelte:head>

<div class="mx-auto max-w-2xl space-y-12 p-6 pb-32 pt-24">
  <section class="space-y-6">
    <BrandHeader />
    <h1 class="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
      {$t('financePlanner.title')}
    </h1>
    <p class="text-stone-600 dark:text-stone-400">
      {$t('financePlanner.subtitle')}
    </p>
  </section>

  <!-- 1. Current Property -->
  <section
    class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
  >
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-bold">{$t('financePlanner.step1')}</h2>
      <button
        onclick={() => (isSelling = !isSelling)}
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isSelling
          ? 'bg-teal-500'
          : 'bg-stone-200 dark:bg-stone-700'}"
        aria-label={$t('financePlanner.step1')}
        aria-pressed={isSelling}
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {isSelling
            ? 'translate-x-6'
            : 'translate-x-1'}"
        ></span>
      </button>
    </div>

    {#if isSelling}
      <div transition:slide class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="purchasePriceOld"
            >{$t('financePlanner.purchasePrice')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={purchasePriceOld}
            id="purchasePriceOld"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="salePrice"
            >{$t('financePlanner.salePrice')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={salePrice}
            id="salePrice"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="saleCosts"
            >{$t('financePlanner.saleCosts')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={saleCosts}
            id="saleCosts"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="renovationCosts"
            >{$t('financePlanner.renovations')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={renovationCosts}
            id="renovationCosts"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="currentMortgage"
            >{$t('financePlanner.currentMortgage')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={currentMortgage}
            id="currentMortgage"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>

        <div
          class="mt-2 rounded-xl bg-teal-50 p-4 text-teal-900 sm:col-span-2 dark:bg-teal-900/20 dark:text-teal-400"
        >
          <div class="flex items-center justify-between text-sm">
            <span>{$t('financePlanner.estimatedTax')}:</span>
            <span class="text-right font-bold">{formatCurrency(estimatedTax)} kr</span>
          </div>
          <div class="mt-1 flex items-center justify-between text-base font-bold">
            <span>{$t('financePlanner.netProceeds')}:</span>
            <span class="text-right">{formatCurrency(netProceeds)} kr</span>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <!-- 2. New Property -->
  <section
    class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
  >
    <h2 class="mb-6 text-lg font-bold">{$t('financePlanner.step2')}</h2>
    <div class="mb-6 flex gap-2 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
      <button
        onclick={() => (propertyType = 'apartment')}
        class="flex-1 rounded-lg py-2 text-sm font-bold transition-all {propertyType === 'apartment'
          ? 'bg-white shadow-sm dark:bg-stone-700'
          : 'text-stone-500'}">{$t('types.bostadsratt')}</button
      >
      <button
        onclick={() => (propertyType = 'house')}
        class="flex-1 rounded-lg py-2 text-sm font-bold transition-all {propertyType === 'house'
          ? 'bg-white shadow-sm dark:bg-stone-700'
          : 'text-stone-500'}">{$t('types.villa')}</button
      >
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase text-stone-500" for="purchasePriceNew"
          >{$t('financePlanner.newPrice')}</label
        >
        <FormattedNumberInput
          currency="SEK"
          bind:value={purchasePriceNew}
          id="purchasePriceNew"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase text-stone-500" for="downpayment"
          >{$t('financePlanner.downpayment')} (min {formatCurrency(purchasePriceNew * 0.1)} kr)</label
        >
        <FormattedNumberInput
          currency="SEK"
          bind:value={downpayment}
          id="downpayment"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase text-stone-500" for="additionalSavings"
          >{$t('financePlanner.additionalSavings')}</label
        >
        <FormattedNumberInput
          currency="SEK"
          bind:value={additionalSavings}
          id="additionalSavings"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>
      {#if propertyType === 'house'}
        <div class="space-y-1.5" transition:slide>
          <label class="text-xs font-bold uppercase text-stone-500" for="existingPantbrev"
            >{$t('financePlanner.existingPantbrev')}</label
          >
          <FormattedNumberInput
            currency="SEK"
            bind:value={existingPantbrev}
            id="existingPantbrev"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
      {/if}
    </div>

    {#if propertyType === 'house' && purchasePriceNew > 0}
      <div
        transition:slide
        class="mt-4 space-y-1 rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-900/20 dark:text-amber-400"
      >
        <div class="flex items-center justify-between text-xs">
          <span>{$t('scenario.lagfart')} (1.5%):</span>
          <span class="text-right">{formatCurrency(lagfart)} kr</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span>{$t('scenario.pantbrev')} ({$t('finance.estimated').toLowerCase()}):</span>
          <span class="text-right">{formatCurrency(pantbrev)} kr</span>
        </div>
      </div>
    {/if}
  </section>

  <!-- 3. Dates -->
  <section
    class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/50"
  >
    <h2 class="mb-6 text-lg font-bold">{$t('financePlanner.step3')}</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      {#if isSelling}
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase text-stone-500" for="moveOutDate"
            >{$t('financePlanner.moveOut')}</label
          >
          <input
            type="date"
            bind:value={moveOutDate}
            id="moveOutDate"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
      {/if}
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase text-stone-500" for="moveInDate"
          >{$t('financePlanner.moveIn')}</label
        >
        <input
          type="date"
          bind:value={moveInDate}
          id="moveInDate"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>
    </div>
  </section>

  <!-- 4. Timeline -->
  {#if purchasePriceNew > 0}
    <section in:fade class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">{$t('financePlanner.step4')}</h2>
        <button
          onclick={exportIcs}
          class="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clip-rule="evenodd"
            />
          </svg>
          {$t('financePlanner.export')}
        </button>
      </div>

      <div class="relative">
        <div class="absolute bottom-3 left-4 top-3 w-0.5 bg-stone-200 dark:bg-stone-800"></div>
        {#each timelineEvents as event (event.id)}
          <div class="relative pb-12 pl-12 last:pb-0" in:fade>
            <div
              class="absolute left-[11px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white dark:ring-stone-900"
            ></div>
            <div class="space-y-1">
              <h3 class="font-bold text-stone-900 dark:text-white">{event.label}</h3>
              <p class="text-sm text-stone-500">{event.description}</p>
              <div class="mt-2 space-y-2">
                <div
                  class="flex items-center justify-between rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium dark:bg-stone-800"
                >
                  <span>{event.amountLabel}:</span>
                  <span
                    class="font-bold {event.type === 'income'
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-red-600 dark:text-red-400'}"
                  >
                    {event.type === 'payment' ? '-' : ''}{formatCurrency(event.amount)} kr
                  </span>
                </div>
                {#if event.id === 'move-in' && extraFees > 0}
                  <div
                    class="flex items-center justify-between rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium dark:bg-stone-800"
                  >
                    <span>{$t('financePlanner.fees')}:</span>
                    <span class="font-bold text-red-600 dark:text-red-400"
                      >-{formatCurrency(extraFees)} kr</span
                    >
                  </div>
                  <p class="px-1 text-[10px] italic leading-tight text-stone-500">
                    {$t('financePlanner.feesNote')}
                  </p>
                {/if}
              </div>

              {#if event.id === 'signing'}
                <div
                  class="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-[10px] text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400"
                >
                  <p class="flex items-center gap-1.5 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      ><path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      /></svg
                    >
                    {$t('financePlanner.bankWarning')}
                  </p>
                </div>
              {/if}

              <div
                class="mt-2 flex items-center justify-between text-xs font-medium {event.cumulative <
                0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-teal-600 dark:text-teal-400'}"
              >
                <span
                  >{event.cumulative < 0
                    ? '⚠️ ' + $t('financePlanner.liquidityShortfall')
                    : $t('financePlanner.remainingCapital')}:</span
                >
                <span class="font-bold">{formatCurrency(Math.abs(event.cumulative))} kr</span>
              </div>

              {#if event.id === 'move-out'}
                <div
                  class="mt-3 rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-[10px] text-teal-800 dark:border-teal-900/30 dark:bg-teal-900/10 dark:text-teal-400"
                >
                  <p class="flex items-center gap-1.5 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      ><path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      /></svg
                    >
                    {$t('financePlanner.cleaningNote')}
                  </p>
                </div>
              {/if}

              {#if event.id === 'move-in' && needsBridgeLoan}
                <div
                  class="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    ><path
                      fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    /></svg
                  >
                  <div>
                    <p class="font-bold">{$t('financePlanner.bridgeLoan')}</p>
                    <p class="mt-0.5 opacity-90">{$t('financePlanner.bridgeLoanDesc')}</p>
                    <div class="mt-2 flex items-center justify-between text-base font-extrabold">
                      <span>{$t('financePlanner.bridgeLoanAmount')}:</span>
                      <span>{formatCurrency(bridgeLoanAmount)} kr</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-8 border-t border-stone-200 pt-8 dark:border-stone-800">
        <div class="flex items-center justify-between text-lg font-bold">
          <span class="text-stone-600 dark:text-stone-400"
            >{$t('financePlanner.totalLiquidity')}:</span
          >
          <span class="text-2xl text-stone-900 dark:text-white"
            >{formatCurrency(totalUpfront)} kr</span
          >
        </div>
        <p class="mt-2 text-right text-xs italic text-stone-500">
          {$t('financePlanner.estimateNote')}
        </p>
      </div>
    </section>
  {/if}

  <section
    class="rounded-3xl border border-stone-200 bg-stone-50 p-8 dark:border-stone-700/50 dark:bg-stone-900/30"
  >
    <h2 class="mb-4 text-xl font-bold text-stone-900 dark:text-white">
      {$t('financePlanner.title')} - FAQ
    </h2>
    <div class="space-y-6">
      <div class="space-y-2">
        <h3 class="font-bold">{$t('financePlanner.faq1_q')}</h3>
        <p class="text-sm text-stone-600 dark:text-stone-400">{$t('financePlanner.faq1_a')}</p>
      </div>
      <div class="space-y-2">
        <h3 class="font-bold">{$t('financePlanner.faq2_q')}</h3>
        <p class="text-sm text-stone-600 dark:text-stone-400">{$t('financePlanner.faq2_a')}</p>
      </div>
    </div>
  </section>

  <section
    class="rounded-3xl border border-stone-200 bg-teal-50/30 p-8 dark:border-stone-700/50 dark:bg-teal-900/10"
  >
    <h2 class="mb-4 text-xl font-bold text-stone-900 dark:text-white">
      {$t('financePlanner.tipsTitle')}
    </h2>
    <div class="space-y-6">
      <div class="space-y-2">
        <h3 class="font-bold text-teal-900 dark:text-teal-100">{$t('financePlanner.tip1_q')}</h3>
        <p class="text-sm text-teal-800 dark:text-teal-300">{$t('financePlanner.tip1_a')}</p>
      </div>
      <div class="space-y-2">
        <h3 class="font-bold text-teal-900 dark:text-teal-100">{$t('financePlanner.tip2_q')}</h3>
        <p class="text-sm text-teal-800 dark:text-teal-300">{$t('financePlanner.tip2_a')}</p>
      </div>
    </div>
  </section>
</div>

<style>
  input[type='date']::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
  }
</style>
