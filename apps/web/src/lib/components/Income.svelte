<script lang="ts">
  import { t } from 'svelte-i18n';
  import { appState, Person } from '$lib/property.svelte';
  import FormattedNumberInput from './FormattedNumberInput.svelte';
  import { formatCurrency } from '$lib/utils';

  function addPerson() {
    appState.household.push(
      new Person(`${$t('income.personLabel')} ${appState.household.length + 1}`, 45000)
    );
  }

  // Ensure first person has a name if it's empty
  $effect(() => {
    if (appState.household.length > 0 && !appState.household[0].name) {
      appState.household[0].name = `${$t('income.personLabel')} 1`;
    }
  });

  function removePerson(index: number) {
    appState.household.splice(index, 1);
  }
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500 md:space-y-5">
  <section
    class="mx-auto max-w-4xl rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
    aria-labelledby="household-income-heading"
  >
    <div class="mb-4 flex items-center justify-between md:mb-5">
      <div class="min-w-0 flex-1">
        <h2
          id="household-income-heading"
          class="truncate text-[10px] font-bold uppercase tracking-widest text-stone-900 md:text-xs dark:text-stone-100"
        >
          {$t('income.title')}
        </h2>
        <p class="text-[10px] text-stone-400 md:text-xs dark:text-stone-500">
          {$t('income.subtitle')}
          {$t('income.variableIncomeNote')}
        </p>
      </div>
      <button
        class="flex shrink-0 items-center gap-1.5 rounded-xl bg-stone-800 px-3 py-2 text-xs font-medium text-stone-100 transition-colors hover:bg-stone-700 md:gap-2 md:text-sm dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
        onclick={addPerson}
      >
        <svg
          class="h-4 w-4 md:h-5 md:w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="hidden sm:inline">{$t('income.addPerson')}</span>
        <span class="sm:hidden">{$t('properties.add')}</span>
      </button>
    </div>

    <div class="mb-5 space-y-3 md:space-y-4" role="list">
      {#each appState.household as person, i (i)}
        <div
          class="group relative flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 transition-all duration-200 hover:bg-white hover:ring-2 hover:ring-teal-100 md:flex-row md:items-center md:gap-4 dark:bg-stone-900 hover:dark:bg-stone-800"
          role="listitem"
        >
          <div class="min-w-0 flex-1">
            <input
              type="text"
              class="w-full border-none bg-transparent p-0 text-xs font-bold text-stone-800 placeholder-stone-300 focus:ring-0 dark:text-stone-200"
              bind:value={person.name}
              placeholder={$t('income.namePlaceholder')}
              aria-label="{$t('income.personLabel')} {i + 1} {$t('income.namePlaceholder')}"
            />
          </div>
          <div class="flex flex-1 items-center gap-3 md:gap-4">
            <div class="flex-1">
              <span
                class="mb-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 md:text-[10px] dark:text-stone-500"
                aria-hidden="true">{$t('finance.gross')}</span
              >
              <FormattedNumberInput
                class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                bind:value={person.bruttoIncome}
                currency="SEK/m"
                aria-label="{person.name || $t('income.personLabel') + (i + 1)} {$t(
                  'finance.gross'
                )}"
              />
            </div>
            <div class="flex-1">
              <span
                class="mb-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 md:text-[10px] dark:text-stone-500"
                aria-hidden="true">{$t('finance.net')}</span
              >
              <div class="relative w-full">
                <div
                  class="w-full rounded-xl border border-stone-100 bg-stone-50/50 px-3 py-2 text-right text-xs font-medium text-stone-500 md:px-4 dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-400"
                  aria-label="{person.name || $t('income.personLabel') + (i + 1)} {$t(
                    'finance.net'
                  )}"
                >
                  {formatCurrency(person.netIncome)}
                </div>
              </div>
            </div>
          </div>
          <button
            class="absolute right-2 top-2 p-2 text-stone-300 transition-colors hover:text-red-500 md:static md:p-1 dark:text-stone-400"
            onclick={() => removePerson(i)}
            aria-label="{$t('properties.remove')} {person.name ||
              $t('income.personLabel') + (i + 1)}"
          >
            <svg
              class="h-4 w-4 md:h-5 md:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      {/each}
    </div>

    <div
      class="grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 md:grid-cols-4 md:pt-8 dark:border-stone-700/50"
    >
      <div class="flex flex-col gap-0.5">
        <h3
          class="text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
        >
          {$t('finance.gross')}
        </h3>
        <p class="text-xs font-bold text-stone-600 md:text-sm dark:text-stone-400">
          {formatCurrency(appState.totalMonthlyIncome)}
        </p>
      </div>
      <div class="flex flex-col gap-0.5">
        <h3
          class="text-[9px] font-bold uppercase tracking-widest text-stone-400 md:text-[10px] dark:text-stone-500"
        >
          {$t('finance.annual_gross')}
        </h3>
        <p class="text-xs font-bold text-stone-600 md:text-sm dark:text-stone-400">
          {formatCurrency(appState.totalMonthlyIncome * 12)}
        </p>
      </div>
      <div class="flex flex-col gap-0.5">
        <h3
          class="text-[9px] font-bold uppercase tracking-widest text-stone-900 md:text-[10px] dark:text-stone-100"
        >
          {$t('finance.net')}
        </h3>
        <p
          class="text-xs font-black text-teal-600 md:text-sm dark:text-teal-400"
          aria-live="polite"
        >
          {formatCurrency(appState.totalNetMonthlyIncome)}
        </p>
      </div>
      <div class="flex flex-col gap-0.5">
        <h3
          class="text-[9px] font-bold uppercase tracking-widest text-stone-900 md:text-[10px] dark:text-stone-100"
        >
          {$t('finance.annual_net')}
        </h3>
        <p
          class="text-xs font-black text-teal-600 md:text-sm dark:text-teal-400"
          aria-live="polite"
        >
          {formatCurrency(appState.totalNetMonthlyIncome * 12)}
        </p>
      </div>
    </div>
  </section>

  <!-- Additional Savings & Children Section -->
  <div class="mx-auto grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
    <section
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm md:p-5 dark:border-stone-700/50 dark:bg-stone-800"
      aria-labelledby="additional-cash-heading"
    >
      <h2
        id="additional-cash-heading"
        class="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-900 md:text-xs dark:text-stone-100"
      >
        {$t('income.additionalCash')}
      </h2>
      <FormattedNumberInput
        class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        bind:value={appState.additionalCash}
        currency="SEK"
        aria-label={$t('income.additionalCash')}
      />
      <p class="mt-2 text-[10px] text-stone-400 md:text-xs dark:text-stone-500">
        {$t('income.additionalCashSubtitle')}
      </p>
    </section>

    <section
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm md:p-5 dark:border-stone-700/50 dark:bg-stone-800"
      aria-labelledby="children-count-heading"
    >
      <h2
        id="children-count-heading"
        class="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-900 md:text-xs dark:text-stone-100"
      >
        {$t('income.childrenCount')}
      </h2>
      <input
        type="number"
        min="0"
        max="10"
        class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-right text-xs font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        value={appState.childrenCount}
        oninput={(e) => (appState.childrenCount = parseInt(e.currentTarget.value) || 0)}
        aria-label={$t('income.childrenCount')}
      />
      <p class="mt-2 text-[10px] text-stone-400 md:text-xs dark:text-stone-500">
        {$t('income.childrenSubtitle')}
      </p>
    </section>
  </div>

  <div class="mx-auto grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
    <section
      class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm md:p-5 dark:border-stone-700/50 dark:bg-stone-800"
      aria-labelledby="net-income-basis-heading"
    >
      <h4
        id="net-income-basis-heading"
        class="mb-2 flex items-center gap-2 text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200"
      >
        <svg
          class="h-4 w-4 text-teal-500 md:h-5 md:w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {$t('income.netIncomeBasis')}
      </h4>
      <p class="text-[11px] leading-relaxed text-stone-500 md:text-xs dark:text-stone-400">
        {$t('income.netIncomeNote')}
      </p>
    </section>

    <section
      class="rounded-3xl border border-blue-100 bg-blue-50 p-4 md:p-5"
      aria-labelledby="loan-capacity-heading"
    >
      <h4
        id="loan-capacity-heading"
        class="mb-2 flex items-center gap-2 text-xs font-bold text-blue-900 md:text-sm"
      >
        <svg
          class="h-4 w-4 text-blue-500 md:h-5 md:w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"
          />
        </svg>
        {$t('income.loanCapacity')}
      </h4>
      <p class="mb-3 text-[11px] leading-relaxed text-blue-800 md:text-xs">
        {$t('income.capacityNote')}
      </p>
      <div
        class="text-xs font-black text-blue-900 md:text-sm"
        aria-label="{$t('income.loanCapacity')}: {formatCurrency(
          appState.totalMonthlyIncome * 12 * 4.5
        )} - {formatCurrency(appState.totalMonthlyIncome * 12 * 5.5)}"
      >
        {formatCurrency(appState.totalMonthlyIncome * 12 * 4.5)} - {formatCurrency(
          appState.totalMonthlyIncome * 12 * 5.5
        )}
      </div>
    </section>

    <section
      class="rounded-3xl border border-stone-100 bg-stone-50 p-4 md:p-5 dark:border-stone-700/50 dark:bg-stone-900"
      aria-labelledby="amortization-rules-heading"
    >
      <h4
        id="amortization-rules-heading"
        class="mb-2 flex items-center gap-2 text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200"
      >
        <svg
          class="h-4 w-4 text-teal-400 md:h-5 md:w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        {$t('income.amortizationRules')}
      </h4>
      <div class="space-y-1 text-[11px] text-stone-500 md:text-xs dark:text-stone-400">
        <p>{$t('income.rule1')}</p>
        <p>{$t('income.rule2')}</p>
        <p>{$t('income.rule3')}</p>
      </div>
    </section>
  </div>
</div>
