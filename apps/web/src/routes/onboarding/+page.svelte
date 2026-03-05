<script lang="ts">
  import { locale, t } from 'svelte-i18n';
  import { appState, fetchBooliData, Person } from '$lib/property.svelte';
  import { offlineState } from '$lib/offline.svelte';
  import { browser } from '$app/environment';
  import { fade, fly } from 'svelte/transition';
  import FormattedNumberInput from '$lib/components/FormattedNumberInput.svelte';
  import { goto } from '$app/navigation';
  import { trackEvent } from '$lib/analytics';

  let step = $state(1);
  let isImporting = $state(false);
  let booliUrl = $state('');
  let hasHomeToSell = $state(false);

  function nextStep() {
    if (step < 4) {
      step += 1;
    } else {
      finish();
    }
  }

  function prevStep() {
    if (step > 1) {
      step -= 1;
    }
  }

  function finish() {
    appState.completeOnboarding();
    goto('/app');
  }

  function handleAlone() {
    appState.household = [new Person($t('income.personLabel') + ' 1', 45000)];
    nextStep();
  }

  function handleTogether() {
    appState.household = [
      new Person($t('income.personLabel') + ' 1', 45000),
      new Person($t('income.personLabel') + ' 2', 45000)
    ];
    nextStep();
  }

  async function handleImport() {
    if (booliUrl.includes('booli.se') && !isImporting) {
      isImporting = true;
      try {
        const data = await fetchBooliData(booliUrl);
        const p = appState.addProperty(data.address || 'Dream Home', data.type);
        p.address = data.address;
        p.surfaceArea = data.surfaceArea;
        p.biarea = data.biarea || 0;
        p.rooms = data.rooms;
        p.monthlyFee = data.monthlyFee;
        p.plotArea = data.plotArea;
        p.operatingCosts = data.operatingCosts;
        p.constructionYear = data.constructionYear;
        p.taxValue = data.taxValue;
        p.sourceUrl = booliUrl;
        p.energyClass = data.energyClass;

        if (data.price > 0) {
          p.addScenario('__ASKING_PRICE__', data.price);
        }
        trackEvent('booli_import_success', { context: 'onboarding', type: data.type });
        appState.persist();
        finish();
      } catch (err) {
        trackEvent('booli_import_error', { context: 'onboarding' });
        if (err && typeof err === 'object' && 'status' in err) {
          const status = (err as { status: number }).status;
          if (status === 403 || status === 429) {
            alert($t('actions.importBlocked'));
            return;
          }
        }
        alert($t('actions.importError'));
      } finally {
        isImporting = false;
      }
    } else {
      finish();
    }
  }

  function toggleLocale() {
    locale.update((l) => (l === 'sv' ? 'en' : 'sv'));
  }
</script>

{#if browser}
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6 transition-colors duration-300 dark:bg-stone-900"
  >
    <div class="mb-8 flex w-full max-w-md items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="h-8 w-8">
          <path
            d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
            fill="none"
            stroke="#24978F"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="font-bold tracking-tight text-teal-600 dark:text-teal-400">BOVETT</span>
      </div>
      <button
        onclick={toggleLocale}
        class="text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
      >
        {$locale === 'sv' ? 'EN' : 'SV'}
      </button>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Progress Bar -->
      <div
        class="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin="1"
        aria-valuemax="4"
        aria-label="Onboarding Progress"
      >
        <div
          class="h-full bg-teal-500 transition-all duration-500"
          style="width: {(step / 4) * 100}%"
        ></div>
      </div>

      {#key step}
        {#if step === 1}
          <div in:fly={{ x: 20, duration: 300 }} out:fade={{ duration: 200 }} class="space-y-8">
            <div class="text-center">
              <h1 class="mb-2 text-2xl font-black text-stone-900 dark:text-white">
                {$t('onboarding.step1_title')}
              </h1>
              <p class="text-stone-500">{$t('onboarding.step1_question')}</p>
            </div>

            <div class="grid gap-4" role="group" aria-label="Purchase Type">
              <button
                onclick={handleAlone}
                class="flex flex-col items-center gap-4 rounded-2xl border-2 border-stone-100 bg-white p-8 transition-all hover:border-teal-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-800 dark:bg-stone-800/50"
              >
                <span class="text-4xl" role="img" aria-label="Person">👤</span>
                <span class="font-bold text-stone-900 dark:text-white"
                  >{$t('onboarding.alone')}</span
                >
              </button>
              <button
                onclick={handleTogether}
                class="flex flex-col items-center gap-4 rounded-2xl border-2 border-stone-100 bg-white p-8 transition-all hover:border-teal-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-stone-800 dark:bg-stone-800/50"
              >
                <span class="text-4xl" role="img" aria-label="People">👥</span>
                <span class="font-bold text-stone-900 dark:text-white"
                  >{$t('onboarding.together')}</span
                >
              </button>
            </div>

            <div class="pt-4 text-center">
              <button
                onclick={finish}
                class="text-sm font-bold text-stone-400 transition-colors hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
              >
                {$t('onboarding.skip')}
              </button>
            </div>
          </div>
        {:else if step === 2}
          <div in:fly={{ x: 20, duration: 300 }} out:fade={{ duration: 200 }} class="space-y-8">
            <div class="text-center">
              <h1 class="mb-2 text-2xl font-black text-stone-900 dark:text-white">
                {$t('onboarding.step2_title')}
              </h1>
              <p class="text-stone-500">{$t('onboarding.step2_question')}</p>
            </div>

            <div class="space-y-6">
              {#each appState.household as person, i (i)}
                <div class="space-y-2">
                  <label
                    for="income-{i}"
                    class="text-xs font-bold uppercase tracking-wider text-stone-400"
                  >
                    {person.name || $t('income.personLabel') + ' ' + (i + 1)}
                  </label>
                  <FormattedNumberInput
                    id="income-{i}"
                    class="w-full rounded-xl border-2 border-stone-100 bg-white py-4 pr-4 text-lg font-bold text-stone-900 outline-none focus:border-teal-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-white"
                    bind:value={person.bruttoIncome}
                    currency="SEK"
                  />
                </div>
              {/each}
              <p class="text-center text-sm text-stone-400">
                {$t('onboarding.step2_desc')}
              </p>
            </div>

            <div class="flex gap-4">
              <button
                onclick={prevStep}
                class="min-h-[44px] flex-1 rounded-xl bg-stone-200 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-300 focus:ring-2 focus:ring-teal-500 dark:bg-stone-800 dark:text-stone-400"
              >
                {$t('onboarding.back')}
              </button>
              <button
                onclick={nextStep}
                class="min-h-[44px] flex-1 rounded-xl bg-teal-500 py-4 font-bold text-white shadow-lg transition-all hover:bg-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95"
              >
                {$t('onboarding.next')}
              </button>
            </div>
          </div>
        {:else if step === 3}
          <div in:fly={{ x: 20, duration: 300 }} out:fade={{ duration: 200 }} class="space-y-8">
            <div class="text-center">
              <h1 class="mb-2 text-2xl font-black text-stone-900 dark:text-white">
                {$t('onboarding.step3_title')}
              </h1>
              <p class="text-stone-500">{$t('onboarding.step3_question')}</p>
            </div>

            <div class="space-y-6">
              <div class="flex gap-4" role="group" aria-label="Home to sell">
                <button
                  onclick={() => (hasHomeToSell = true)}
                  class="min-h-[44px] flex-1 rounded-xl border-2 py-4 font-bold transition-all focus:ring-2 focus:ring-teal-500 {hasHomeToSell
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20'
                    : 'border-stone-100 bg-white text-stone-500 dark:border-stone-800 dark:bg-stone-800/50'}"
                  aria-pressed={hasHomeToSell}
                >
                  {$t('onboarding.yes')}
                </button>
                <button
                  onclick={() => (hasHomeToSell = false)}
                  class="min-h-[44px] flex-1 rounded-xl border-2 py-4 font-bold transition-all focus:ring-2 focus:ring-teal-500 {!hasHomeToSell
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20'
                    : 'border-stone-100 bg-white text-stone-500 dark:border-stone-800 dark:bg-stone-800/50'}"
                  aria-pressed={!hasHomeToSell}
                >
                  {$t('onboarding.no')}
                </button>
              </div>

              {#if hasHomeToSell}
                <div in:fade class="space-y-4 rounded-2xl bg-stone-100 p-4 dark:bg-stone-800/50">
                  <div class="space-y-2">
                    <label
                      for="original-value"
                      class="text-[10px] font-bold uppercase text-stone-400"
                    >
                      {$t('myProperty.originalValue')}
                    </label>
                    <FormattedNumberInput
                      currency="SEK"
                      id="original-value"
                      class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 font-bold dark:border-stone-700 dark:bg-stone-900"
                      bind:value={appState.myProperty.originalValue}
                    />
                  </div>
                  <div class="space-y-2">
                    <label for="sale-value" class="text-[10px] font-bold uppercase text-stone-400">
                      {$t('myProperty.saleValue')}
                    </label>
                    <FormattedNumberInput
                      currency="SEK"
                      id="sale-value"
                      class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 font-bold dark:border-stone-700 dark:bg-stone-900"
                      bind:value={appState.myProperty.saleValue}
                    />
                  </div>
                  <div class="space-y-2">
                    <label
                      for="remaining-loan"
                      class="text-[10px] font-bold uppercase text-stone-400"
                    >
                      {$t('myProperty.remainingLoan')}
                    </label>
                    <FormattedNumberInput
                      currency="SEK"
                      id="remaining-loan"
                      class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 font-bold dark:border-stone-700 dark:bg-stone-900"
                      bind:value={appState.myProperty.currentLoan}
                    />
                  </div>
                </div>
              {/if}

              <div class="space-y-2">
                <label
                  for="additional-cash"
                  class="text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {$t('onboarding.step3_savings')}
                </label>
                <FormattedNumberInput
                  id="additional-cash"
                  class="w-full rounded-xl border-2 border-stone-100 bg-white py-4 pr-4 text-lg font-bold text-stone-900 outline-none focus:border-teal-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-white"
                  bind:value={appState.additionalCash}
                  currency="SEK"
                />
              </div>
            </div>

            <div class="flex gap-4">
              <button
                onclick={prevStep}
                class="min-h-[44px] flex-1 rounded-xl bg-stone-200 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-300 focus:ring-2 focus:ring-teal-500 dark:bg-stone-800 dark:text-stone-400"
              >
                {$t('onboarding.back')}
              </button>
              <button
                onclick={nextStep}
                class="min-h-[44px] flex-1 rounded-xl bg-teal-500 py-4 font-bold text-white shadow-lg transition-all hover:bg-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95"
              >
                {$t('onboarding.next')}
              </button>
            </div>
          </div>
        {:else if step === 4}
          <div in:fly={{ x: 20, duration: 300 }} out:fade={{ duration: 200 }} class="space-y-8">
            <div class="text-center">
              <h1 class="mb-2 text-2xl font-black text-stone-900 dark:text-white">
                {$t('onboarding.step4_title')}
              </h1>
              <p class="text-stone-500">{$t('onboarding.step4_question')}</p>
            </div>

            <div class="space-y-4">
              <div class="relative">
                <input
                  type="text"
                  id="booli-url"
                  bind:value={booliUrl}
                  disabled={isImporting || offlineState.isOffline}
                  placeholder={offlineState.isOffline
                    ? $t('offline.title')
                    : 'https://www.booli.se/annons/...'}
                  class="w-full rounded-xl border-2 border-stone-100 bg-white p-4 text-sm outline-none focus:border-teal-500 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-800/50 dark:text-white"
                  aria-label="Booli Link"
                />
              </div>
              <p class="text-center text-xs text-stone-400">
                {offlineState.isOffline ? $t('offline.message') : $t('onboarding.step4_desc')}
              </p>
            </div>

            <div class="flex gap-4">
              <button
                onclick={prevStep}
                disabled={isImporting}
                class="min-h-[44px] flex-1 rounded-xl bg-stone-200 py-4 font-bold text-stone-600 transition-colors hover:bg-stone-300 focus:ring-2 focus:ring-teal-500 disabled:opacity-50 dark:bg-stone-800 dark:text-stone-400"
              >
                {$t('onboarding.back')}
              </button>
              <button
                onclick={handleImport}
                disabled={isImporting}
                class="min-h-[44px] flex-1 rounded-xl bg-teal-500 py-4 font-bold text-white shadow-lg transition-all hover:bg-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50"
                aria-live="polite"
              >
                {isImporting
                  ? $t('properties.importing')
                  : booliUrl
                    ? $t('properties.import')
                    : $t('onboarding.finish')}
              </button>
            </div>
          </div>
        {/if}
      {/key}
    </div>
  </div>
{:else}
  <div class="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
    <div class="animate-pulse font-bold text-stone-700 dark:text-stone-300">
      {$t('app.loading')}
    </div>
  </div>
{/if}
