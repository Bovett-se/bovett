<script lang="ts">
  import { t } from 'svelte-i18n';
  import { appState } from '$lib/property.svelte';
  import FormattedNumberInput from './FormattedNumberInput.svelte';
  import Tooltip from './Tooltip.svelte';
  import { formatCurrency } from '$lib/utils';

  let myProperty = $derived(appState.myProperty);
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500 md:space-y-5">
  <div class="flex flex-col gap-4 lg:flex-row lg:gap-5">
    <!-- Main Details Card -->
    <div class="flex-1 space-y-4 md:space-y-5">
      <!-- Sales Section -->
      <section
        class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
        aria-labelledby="sale-details-heading"
      >
        <h2
          id="sale-details-heading"
          class="mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-900 md:text-xs dark:text-stone-100"
        >
          {$t('myProperty.saleTitle')}
        </h2>

        <!-- Explanation integrated inside the card -->
        <p class="mb-5 text-[11px] leading-relaxed text-stone-500 md:text-xs dark:text-stone-400">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html $t('myProperty.usageNote')}
        </p>

        <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
          <!-- Original Value -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.originalValue')}
              </span>
              <Tooltip text={$t('myProperty.originalValueTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              bind:value={myProperty.originalValue}
              aria-label={$t('myProperty.originalValue')}
            />
          </label>

          <!-- Improvement Costs -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.improvementCosts')}
              </span>
              <Tooltip text={$t('myProperty.improvementCostsTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              bind:value={myProperty.improvementCosts}
              aria-label={$t('myProperty.improvementCosts')}
            />
          </label>

          <!-- Sale Value -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.saleValue')}
              </span>
              <Tooltip text={$t('myProperty.saleValueTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-2xl border border-teal-200 bg-teal-50 py-2.5 pr-4 text-xs font-bold text-teal-700 outline-none focus:ring-2 focus:ring-teal-500 md:py-3 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
              bind:value={myProperty.saleValue}
              aria-label={$t('myProperty.saleValue')}
            />
          </label>

          <!-- Sale Costs -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.saleCosts')}
              </span>
              <Tooltip text={$t('myProperty.saleCostsTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              bind:value={myProperty.saleCosts}
              aria-label={$t('myProperty.saleCosts')}
            />
          </label>

          <!-- Remaining Loan -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.remainingLoan')}
              </span>
              <Tooltip text={$t('myProperty.remainingLoanTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              bind:value={myProperty.currentLoan}
              aria-label={$t('myProperty.remainingLoan')}
            />
          </label>
        </div>

        <!-- Tax Deferral -->
        <div
          class="mb-5 flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-100 p-4 dark:border-stone-700 dark:bg-stone-800"
        >
          <div class="min-w-0 pr-4">
            <h4 class="text-xs font-bold text-stone-900 md:text-sm dark:text-stone-100">
              {$t('myProperty.useDeferral')}
            </h4>
            <p class="mt-0.5 text-[10px] text-stone-800 md:text-xs dark:text-stone-200">
              {$t('myProperty.deferralNote')}
            </p>
          </div>
          <label class="relative inline-flex flex-shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              bind:checked={myProperty.useTaxDeferral}
              class="peer sr-only"
              aria-label={$t('myProperty.useDeferral')}
            />
            <div
              class="peer h-5 w-9 rounded-full bg-stone-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-stone-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 md:h-6 md:w-11 md:after:h-5 md:after:w-5 dark:bg-stone-700 dark:after:border-stone-600 dark:after:bg-stone-300"
            ></div>
          </label>
        </div>

        <p
          class="rounded-xl border border-stone-100 bg-stone-50 p-3 text-[10px] italic text-stone-400 md:p-4 md:text-xs dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-500"
        >
          {$t('myProperty.taxNote')}
        </p>
      </section>

      <!-- Costs Section -->
      <section
        class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
        aria-labelledby="cost-details-heading"
      >
        <h2
          id="cost-details-heading"
          class="mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-900 md:text-xs dark:text-stone-100"
        >
          {$t('myProperty.costsTitle')}
        </h2>

        <div class="mb-6">
          <div class="mb-2 flex items-center gap-1.5">
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
            >
              {$t('properties.type')}
            </span>
          </div>
          <div class="flex gap-2">
            <button
              class="flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all {myProperty.type ===
              'bostadsratt'
                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20'
                : 'border-stone-100 bg-stone-50 text-stone-500 dark:border-stone-800 dark:bg-stone-900'}"
              onclick={() => (myProperty.type = 'bostadsratt')}
            >
              {$t('types.bostadsratt')}
            </button>
            <button
              class="flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all {myProperty.type ===
              'villa'
                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20'
                : 'border-stone-100 bg-stone-50 text-stone-500 dark:border-stone-800 dark:bg-stone-900'}"
              onclick={() => {
                myProperty.type = 'villa';
                myProperty.monthlyFee = 0;
              }}
            >
              {$t('types.villa')}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5">
          <!-- Current Loan Costs -->
          {#if myProperty.currentLoan > 0}
            <label class="block">
              <div class="mb-1.5 flex items-center gap-1.5">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
                >
                  {$t('myProperty.currentLoanCosts')}
                </span>
                <Tooltip text={$t('myProperty.currentLoanCostsTooltip')} />
              </div>
              <FormattedNumberInput
                currency="SEK/m"
                class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                bind:value={myProperty.currentLoanCosts}
                aria-label={$t('myProperty.currentLoanCosts')}
              />
            </label>
          {/if}

          <!-- Current Operating Costs -->
          <label class="block">
            <div class="mb-1.5 flex items-center gap-1.5">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
              >
                {$t('myProperty.currentOperatingCosts')}
              </span>
              <Tooltip text={$t('myProperty.currentOperatingCostsTooltip')} />
            </div>
            <FormattedNumberInput
              currency="SEK/m"
              class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              bind:value={myProperty.operatingCosts}
              aria-label={$t('myProperty.currentOperatingCosts')}
            />
          </label>

          <!-- Current Monthly Fee -->
          {#if myProperty.type === 'bostadsratt'}
            <label class="block">
              <div class="mb-1.5 flex items-center gap-1.5">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
                >
                  {$t('myProperty.currentMonthlyFee')}
                </span>
                <Tooltip text={$t('myProperty.currentMonthlyFeeTooltip')} />
              </div>
              <FormattedNumberInput
                currency="SEK/m"
                class="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pr-4 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 md:py-3 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                bind:value={myProperty.monthlyFee}
                aria-label={$t('myProperty.currentMonthlyFee')}
              />
            </label>
          {/if}
        </div>
      </section>
    </div>

    <!-- Summary Sidebar -->
    <div class="space-y-4 md:space-y-6 lg:w-96">
      <section
        class="transform rounded-3xl bg-stone-800 p-5 text-white shadow-xl shadow-stone-200/50 transition-all duration-300 hover:scale-[1.02] md:p-6 dark:bg-stone-900 dark:shadow-stone-950/50"
        aria-labelledby="net-proceeds-heading"
      >
        <h3
          id="net-proceeds-heading"
          class="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
        >
          {$t('myProperty.netProceeds')}
        </h3>
        <p class="mb-2 text-xl font-black tracking-tight md:text-2xl" aria-live="polite">
          {formatCurrency(myProperty.netProceeds)}
        </p>
        <p class="text-[10px] text-stone-400 dark:text-stone-500">
          {$t('myProperty.availableNote')}
        </p>

        <div
          class="mt-6 space-y-3 border-t border-stone-700 pt-6 text-[11px] md:text-xs"
          role="region"
          aria-label="{$t('income.totalMonthly')} breakdown"
        >
          <div class="flex items-center justify-between text-stone-300 dark:text-stone-400">
            <span>{$t('myProperty.totalProfit')}</span>
            <span class="font-bold text-white">{formatCurrency(myProperty.profit)}</span>
          </div>
          <div class="flex items-center justify-between text-stone-300 dark:text-stone-400">
            <span>{$t('myProperty.profitTax')}</span>
            <span class="font-bold text-white">{formatCurrency(myProperty.tax)}</span>
          </div>
          <div class="flex items-center justify-between text-stone-300 dark:text-stone-400">
            <span>{$t('myProperty.totalCosts')}</span>
            <span class="font-bold text-white">{formatCurrency(myProperty.saleCosts)}</span>
          </div>
        </div>
      </section>

      <section
        class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
        aria-labelledby="pro-tip-heading"
      >
        <h4
          id="pro-tip-heading"
          class="mb-3 flex items-center gap-2 text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200"
        >
          <svg
            class="h-4 w-4 text-orange-400 md:h-5 md:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          {$t('myProperty.proTip')}
        </h4>
        <p class="text-[11px] leading-relaxed text-stone-500 md:text-xs dark:text-stone-400">
          {$t('myProperty.uppskovNote')}
        </p>
      </section>
    </div>
  </div>
</div>
