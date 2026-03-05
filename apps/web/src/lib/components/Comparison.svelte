<script lang="ts">
  import { t } from 'svelte-i18n';
  import { appState, Property, Scenario } from '$lib/property.svelte';
  import Tooltip from './Tooltip.svelte';
  import { calculateKalp, formatCurrency } from '$lib/utils';
  import { browser } from '$app/environment';

  let selectedScenarios = $derived(
    appState.properties.flatMap((p) =>
      p.scenarios.filter((s) => s.isSelected).map((s) => ({ property: p, scenario: s }))
    )
  );

  const isNative = $derived(
    browser &&
      !!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } })
        .Capacitor &&
      (!!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
        ?.isNative ||
        (window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
          ?.platform !== 'web')
  );

  let sortKey = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let manualOrder = $state<string[]>([]);

  let displayScenarios = $derived.by(() => {
    let items = [...selectedScenarios];

    if (sortKey) {
      items.sort((a, b) => {
        let valA: number = 0;
        let valB: number = 0;
        if (sortKey === 'price') {
          valA = a.scenario.price || 0;
          valB = b.scenario.price || 0;
        } else if (sortKey === 'loan') {
          valA = a.scenario.loanAmount || 0;
          valB = b.scenario.loanAmount || 0;
        } else if (sortKey === 'rate') {
          valA = a.scenario.effectiveInterestRate || 0;
          valB = b.scenario.effectiveInterestRate || 0;
        } else if (sortKey === 'total') {
          valA = getTotalMonthly(a) || 0;
          valB = getTotalMonthly(b) || 0;
        } else if (sortKey === 'kalp') {
          valA = getKalp(a) || 0;
          valB = getKalp(b) || 0;
        } else if (sortKey === 'remaining') {
          valA = getRemainingCash(a.scenario.price, a.scenario.downpayment) || 0;
          valB = getRemainingCash(b.scenario.price, b.scenario.downpayment) || 0;
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    } else if (manualOrder.length > 0) {
      items.sort((a, b) => {
        let idxA = manualOrder.indexOf(a.scenario.id);
        let idxB = manualOrder.indexOf(b.scenario.id);
        if (idxA === -1) {
          idxA = 999;
        }
        if (idxB === -1) {
          idxB = 999;
        }
        return idxA - idxB;
      });
    }
    return items;
  });

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = 'asc';
    }
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    sortKey = null;
    const items = [...displayScenarios];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) {
      return;
    }
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    manualOrder = items.map((it) => it.scenario.id);
  }

  let expandedRows = $state<Record<string, boolean>>({});

  function toggleRow(id: string) {
    expandedRows[id] = !expandedRows[id];
  }

  function getTotalMonthly(item: { property: Property; scenario: Scenario }) {
    return (
      item.scenario.monthlyInterest +
      item.scenario.monthlyAmortization +
      (item.property.operatingCosts || 0) +
      (item.property.monthlyFee || 0) +
      item.property.monthlyPropertyTax
    );
  }

  function getDeferredTax(scenarioPrice: number) {
    const mp = appState.myProperty;
    if (!mp.useTaxDeferral || mp.profit <= 0) {
      return 0;
    }
    if (scenarioPrice >= mp.saleValue) {
      return mp.tax;
    }
    const deferrableProfit = mp.profit * (scenarioPrice / mp.saleValue);
    return deferrableProfit * 0.22;
  }

  function getRemainingCash(scenarioPrice: number, downpayment: number) {
    const mp = appState.myProperty;
    const baseProceeds = mp.saleValue - mp.saleCosts - mp.currentLoan;
    const taxToPay = mp.tax - getDeferredTax(scenarioPrice);
    return baseProceeds - taxToPay - downpayment + appState.additionalCash;
  }

  function getKalp(item: { property: Property; scenario: Scenario }) {
    return calculateKalp({
      netIncome: appState.totalNetMonthlyIncome,
      loanAmount: item.scenario.loanAmount,
      interestRate: item.scenario.effectiveInterestRate,
      monthlyAmortization: item.scenario.monthlyAmortization,
      monthlyFee: item.property.monthlyFee || 0,
      operatingCosts: item.property.operatingCosts || 0,
      monthlyPropertyTax: item.property.monthlyPropertyTax,
      adults: appState.household.length,
      children: appState.childrenCount
    });
  }

  function getKalpColor(val: number) {
    if (val < 0) {
      return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md px-2 py-0.5';
    }
    if (val < 5000) {
      return 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 rounded-md px-2 py-0.5';
    }
    return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-md px-2 py-0.5';
  }

  let currentMonthlyTotal = $derived(
    appState.myProperty.operatingCosts +
      appState.myProperty.monthlyFee +
      appState.myProperty.currentLoanCosts
  );
</script>

<div class="w-full space-y-4 md:space-y-5">
  <div class="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
    <div
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h3
        class="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
      >
        {$t('income.title')}
      </h3>
      <div class="space-y-1">
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">{$t('finance.gross')}</span><span
            class="text-xs font-bold md:text-sm">{formatCurrency(appState.totalMonthlyIncome)}</span
          >
        </div>
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">{$t('finance.net')}</span><span
            class="text-xs font-bold md:text-sm"
            >{formatCurrency(appState.totalNetMonthlyIncome)}</span
          >
        </div>
      </div>
    </div>

    <div
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h3
        class="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
      >
        {$t('comparison.currentCosts')}
      </h3>
      <div class="space-y-1">
        <div class="flex items-start justify-between">
          <span class="text-[11px] md:text-xs">{$t('comparison.table.total')}</span>
          <div class="flex flex-col items-end">
            <span class="text-xs font-bold md:text-sm">{formatCurrency(currentMonthlyTotal)}</span>
            {#if appState.household.length > 1}
              <span class="text-[9px] text-stone-400"
                >{formatCurrency(currentMonthlyTotal / appState.household.length)} / {$t(
                  'comparison.totalMonthlyPerPerson'
                )}</span
              >
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h3
        class="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
      >
        {$t('myProperty.title')}
      </h3>
      <div class="space-y-1">
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">{$t('myProperty.netProceeds')}</span><span
            class="text-xs font-bold text-teal-600 md:text-sm"
            >{formatCurrency(appState.myProperty.netProceeds)}</span
          >
        </div>
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">{$t('myProperty.totalProfit')}</span><span
            class="text-xs font-semibold md:text-sm"
            >{formatCurrency(appState.myProperty.profit)}</span
          >
        </div>
      </div>
    </div>
    <div
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h3
        class="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
      >
        {$t('income.loanCapacity')}
      </h3>
      <div class="space-y-1">
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">4.5x</span><span class="text-xs font-bold md:text-sm"
            >{formatCurrency(appState.totalMonthlyIncome * 12 * 4.5)}</span
          >
        </div>
        <div class="flex items-end justify-between">
          <span class="text-[11px] md:text-xs">5.5x</span><span class="text-xs font-bold md:text-sm"
            >{formatCurrency(appState.totalMonthlyIncome * 12 * 5.5)}</span
          >
        </div>
      </div>
    </div>
  </div>

  <div
    class="w-full overflow-hidden rounded-3xl border border-stone-100 bg-white p-4 shadow-sm md:p-5 dark:border-stone-700/50 dark:bg-stone-800"
  >
    <h2 class="mb-4 text-xs font-bold text-stone-900 dark:text-stone-100">
      {$t('comparison.title')}
    </h2>

    {#if selectedScenarios.length === 0}
      <div
        class="rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 py-12 text-center dark:border-stone-700 dark:bg-stone-900"
      >
        <p class="text-xs text-stone-400">{$t('comparison.noSelection')}</p>
      </div>
    {:else}
      <div class="w-full overflow-x-auto overflow-y-hidden">
        <table class="w-full min-w-[850px] table-fixed border-collapse text-left md:min-w-[900px]">
          <thead>
            <tr
              class="border-b border-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:border-stone-700/50 dark:text-stone-500"
            >
              <th class="w-8 py-2 md:w-10"></th>
              <th class="w-8 py-2 md:w-10"></th>
              <th class="w-[200px] py-2 pr-4 md:w-auto md:pr-6">{$t('comparison.table.header')}</th>
              <th class="w-28 cursor-pointer px-2 py-2" onclick={() => toggleSort('price')}
                >{$t('comparison.table.price')}</th
              >
              <th class="w-28 cursor-pointer px-2 py-2" onclick={() => toggleSort('loan')}
                >{$t('comparison.table.loan')}</th
              >
              <th class="w-16 cursor-pointer px-2 py-2" onclick={() => toggleSort('rate')}
                >{$t('comparison.table.interestRate')}</th
              >
              <th class="w-28 cursor-pointer px-2 py-2" onclick={() => toggleSort('total')}
                >{$t('comparison.table.total')}</th
              >
              <th class="w-28 cursor-pointer px-2 py-2" onclick={() => toggleSort('kalp')}
                >{$t('comparison.table.kalp')}</th
              >
              <th
                class="w-36 cursor-pointer py-2 pl-4 text-right"
                onclick={() => toggleSort('remaining')}>{$t('comparison.remainingCash')}</th
              >
              {#if !isNative}
                <th class="w-10 py-2"></th>
              {/if}
              <th class="w-8 py-2 md:w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-50 dark:divide-stone-700/50">
            {#each displayScenarios as item, i (item.scenario.id)}
              <tr
                class="group cursor-pointer transition-colors hover:bg-stone-50/50 dark:hover:bg-stone-800/50"
                onclick={() => toggleRow(item.scenario.id)}
              >
                <td class="py-3 pr-2 align-middle">
                  <svg
                    class="h-3.5 w-3.5 transform transition-transform duration-200 {expandedRows[
                      item.scenario.id
                    ]
                      ? 'rotate-90'
                      : ''}"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    /></svg
                  >
                </td>
                <td class="py-3 pr-2 align-middle" onclick={(e) => e.stopPropagation()}>
                  <div class="flex flex-col">
                    <button
                      onclick={() => moveItem(i, 'up')}
                      disabled={i === 0}
                      class="disabled:opacity-0">▲</button
                    >
                    <button
                      onclick={() => moveItem(i, 'down')}
                      disabled={i === displayScenarios.length - 1}
                      class="disabled:opacity-0">▼</button
                    >
                  </div>
                </td>
                <td class="w-[200px] py-3 pr-4 align-middle md:w-auto md:pr-6">
                  <div
                    class="truncate text-[11px] font-bold text-stone-900 md:text-xs dark:text-stone-100"
                  >
                    {item.property.name}
                  </div>
                  <div class="truncate text-[10px] text-stone-500">
                    {item.scenario.name === '__ASKING_PRICE__'
                      ? $t('scenario.askingPrice')
                      : item.scenario.name}
                  </div>
                </td>
                <td class="px-2 py-3 text-[11px] md:text-xs"
                  >{formatCurrency(item.scenario.price)}</td
                >
                <td class="px-2 py-3 text-[11px] md:text-xs"
                  >{formatCurrency(item.scenario.loanAmount)}</td
                >
                <td class="px-2 py-3 text-[11px] md:text-xs">
                  <div class="flex items-center gap-1">
                    {item.scenario.effectiveInterestRate.toFixed(2)}%
                    {#if item.property.energyClass === 'A' || item.property.energyClass === 'B'}
                      <Tooltip text={$t('scenario.greenDiscount')}>
                        <svg
                          class="h-3 w-3 text-teal-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          ><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg
                        >
                      </Tooltip>
                    {/if}
                  </div>
                </td>
                <td class="px-2 py-3 text-[11px] font-black md:text-xs"
                  >{formatCurrency(getTotalMonthly(item))}</td
                >
                <td
                  class="px-2 py-3 text-[11px] font-black md:text-xs {getKalpColor(getKalp(item))}"
                >
                  <div class="flex flex-col items-center gap-0.5">
                    <span>{formatCurrency(getKalp(item))}</span>
                    <Tooltip
                      text={getKalp(item) < 0
                        ? $t('scenario.kalpRejected')
                        : getKalp(item) < 5000
                          ? $t('scenario.kalpMarginal')
                          : $t('scenario.kalpApproved')}
                    >
                      <span class="rounded px-1 py-0.5 text-[8px] font-bold uppercase"
                        >{getKalp(item) < 0
                          ? $t('scenario.kalpRejectedTitle')
                          : getKalp(item) < 5000
                            ? $t('scenario.kalpMarginalTitle')
                            : $t('scenario.kalpApprovedTitle')}</span
                      >
                    </Tooltip>
                  </div>
                </td>
                <td class="py-3 pl-4 text-right text-[11px] font-black md:text-xs"
                  >{formatCurrency(
                    getRemainingCash(item.scenario.price, item.scenario.downpayment)
                  )}</td
                >
                {#if !isNative}
                  <td class="py-3 pl-2 text-right" onclick={(e) => e.stopPropagation()}>
                    <Tooltip text={$t('actions.planMove')} position="left">
                      <a
                        href="/finance-planning?type={item.property.type === 'villa'
                          ? 'house'
                          : 'apartment'}&purchasePriceNew={item.scenario.price}&downpayment={item
                          .scenario.downpayment}&existingPantbrev={item.property
                          .existingPantbrev}&additionalSavings={appState.additionalSavings}&salePrice={appState
                          .myProperty.saleValue}&purchasePriceOld={appState.myProperty
                          .originalValue}&saleCosts={appState.myProperty
                          .saleCosts}&renovationCosts={appState.myProperty
                          .improvementCosts}&currentMortgage={appState.myProperty.currentLoan}"
                        class="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-500 transition-colors hover:bg-teal-50 hover:text-teal-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-teal-900/30 dark:hover:text-teal-400"
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
                      </a>
                    </Tooltip>
                  </td>
                {/if}
                <td class="py-3 pl-2 text-right" onclick={(e) => e.stopPropagation()}>
                  <button
                    class="text-stone-300 hover:text-red-500"
                    onclick={() => (item.scenario.isSelected = false)}>×</button
                  >
                </td>
              </tr>
              {#if expandedRows[item.scenario.id]}
                <tr class="bg-stone-50/50 dark:bg-stone-900/50">
                  <td colspan="10" class="p-3 md:p-4">
                    <div class="grid grid-cols-2 gap-3 text-[10px] md:grid-cols-5 md:text-xs">
                      <div>
                        <span class="block font-bold uppercase text-stone-400"
                          >{$t('comparison.breakdown.loan')}</span
                        >{formatCurrency(
                          item.scenario.monthlyInterest + item.scenario.monthlyAmortization
                        )}
                      </div>
                      <div>
                        <span class="block font-bold uppercase text-stone-400"
                          >{$t('comparison.breakdown.operating')}</span
                        >{formatCurrency(item.property.operatingCosts)}
                      </div>
                      {#if item.property.type === 'bostadsratt'}
                        <div>
                          <span class="block font-bold uppercase text-stone-400"
                            >{$t('comparison.breakdown.fee')}</span
                          >{formatCurrency(item.property.monthlyFee)}
                        </div>
                      {/if}
                      <div>
                        <span class="block font-bold uppercase text-stone-400"
                          >{$t('comparison.breakdown.tax')}</span
                        >{formatCurrency(getDeferredTax(item.scenario.price))}
                      </div>
                      {#if item.property.type === 'villa'}
                        <div>
                          <span class="block font-bold uppercase text-stone-400"
                            >{$t('properties.propertyTax')}</span
                          >{formatCurrency(item.property.monthlyPropertyTax)}
                        </div>
                      {/if}
                      <div class="border-l border-stone-200 pl-3 dark:border-stone-700">
                        <span class="block font-bold uppercase text-stone-400"
                          >{$t('comparison.costDifference')}</span
                        >

                        <span
                          class="font-bold {getTotalMonthly(item) - currentMonthlyTotal > 0
                            ? 'text-red-500'
                            : 'text-teal-500'}"
                        >
                          {getTotalMonthly(item) - currentMonthlyTotal > 0
                            ? '+'
                            : ''}{formatCurrency(getTotalMonthly(item) - currentMonthlyTotal)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
