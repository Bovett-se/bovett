<script lang="ts">
  import { t } from 'svelte-i18n';
  import { appState } from '$lib/property.svelte';
  import ScenarioCard from './ScenarioCard.svelte';
  import FormattedNumberInput from './FormattedNumberInput.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import { sanitizeUrl } from '$lib/security';

  let { onBack } = $props<{ onBack: () => void }>();

  let property = $derived(appState.selectedProperty);

  let newScenarioName = $state('');
  let activeScenarioId = $state<string | null>(null);
  let scenarioToDelete = $state<string | null>(null);
  let isEditingName = $state(false);

  $effect(() => {
    if (!activeScenarioId && property && property.scenarios && property.scenarios.length > 0) {
      activeScenarioId = property.scenarios[0].id;
    }
  });

  let activeScenario = $derived(
    property?.scenarios?.find((s) => s.id === activeScenarioId) || null
  );

  function addScenario() {
    if (newScenarioName.trim() && property) {
      const s = property.addScenario(newScenarioName.trim());
      activeScenarioId = s.id;
      newScenarioName = '';
    }
  }

  function duplicateScenario(id: string) {
    if (property) {
      const s = property.duplicateScenario(id);
      if (s) {
        activeScenarioId = s.id;
      }
    }
  }

  function deleteScenario(id: string) {
    if (property) {
      scenarioToDelete = id;
    }
  }

  function confirmDeleteScenario() {
    if (property && scenarioToDelete) {
      property.deleteScenario(scenarioToDelete);
      if (activeScenarioId === scenarioToDelete) {
        activeScenarioId = property.scenarios[0]?.id || null;
      }
      scenarioToDelete = null;
    }
  }

  function toggleScenarioSelection(id: string) {
    const scenario = property.scenarios.find((s) => s.id === id);
    if (scenario) {
      scenario.isSelected = !scenario.isSelected;
    }
  }

  function getEnergyClassStyles(energy: string) {
    switch (energy) {
      case 'A':
        return 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300';
      case 'B':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
      case 'C':
        return 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-300';
      case 'D':
        return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-500/70';
      case 'E':
        return 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-500/70';
      case 'F':
        return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-500/70';
      case 'G':
        return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
      case '?':
      default:
        return 'bg-stone-50 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-300';
    }
  }

  function focus(el: HTMLInputElement) {
    el.focus();
  }
</script>

{#if property}
  <div class="flex h-full flex-col space-y-4">
    <div class="flex flex-wrap items-center gap-3 md:gap-4">
      <button
        class="flex items-center gap-2 rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm shadow-stone-200/50 transition-colors hover:text-stone-800 md:px-4 dark:border-stone-700/50 dark:bg-stone-800 dark:text-stone-200 dark:shadow-stone-950/50"
        onclick={onBack}
      >
        <svg class="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        {$t('properties.back')}
      </button>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        {#if isEditingName}
          <input
            type="text"
            class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
            bind:value={property.name}
            onblur={() => (isEditingName = false)}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                isEditingName = false;
              }
              if (e.key === 'Escape') {
                isEditingName = false;
              }
            }}
            use:focus
          />
        {:else}
          <h2 class="truncate text-xs font-bold text-stone-900 md:text-sm dark:text-stone-100">
            {property.name}
          </h2>
        {/if}

        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-stone-300 transition-all hover:bg-stone-100 hover:text-stone-500 md:h-9 md:w-9 dark:hover:bg-stone-700/50"
          onclick={() => (isEditingName = !isEditingName)}
          title="Edit Name"
        >
          <svg class="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            />
          </svg>
        </button>

        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all hover:bg-stone-100 md:h-9 md:w-9 dark:hover:bg-stone-700/50 {property.isFavorite
            ? 'text-amber-400'
            : 'text-stone-300 hover:text-stone-400 dark:text-stone-600'}"
          onclick={() => (property.isFavorite = !property.isFavorite)}
          title={property.isFavorite
            ? $t('properties.removeFromFavorites')
            : $t('properties.addToFavorites')}
          aria-label={property.isFavorite
            ? $t('properties.removeFromFavorites')
            : $t('properties.addToFavorites')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 md:h-6 md:w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-col items-start gap-4 lg:flex-row">
      <!-- Sidebar -->
      <div class="flex w-full shrink-0 flex-col gap-4 lg:w-96">
        <!-- Property Info -->
        <div
          class="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200">
              {$t('properties.details')}
            </h3>
            <select
              class="rounded-xl border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-semibold text-stone-700 md:text-xs dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
              bind:value={property.type}
            >
              <option value="bostadsratt">{$t('types.bostadsratt')}</option>
              <option value="villa">{$t('types.villa')}</option>
            </select>
          </div>
          <div class="space-y-3">
            <label class="block">
              <span
                class="mb-1 flex min-h-0 items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                >{$t('properties.address')}</span
              >
              <input
                type="text"
                class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                bind:value={property.address}
              />
            </label>
            <div class="grid grid-cols-3 items-end gap-2">
              <label class="block">
                <span
                  class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                  >{$t('properties.rooms')}</span
                >
                <input
                  type="number"
                  step="0.5"
                  class="w-full rounded-xl border border-stone-200 px-3 py-2 text-right text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                  bind:value={property.rooms}
                />
              </label>
              <label class="block">
                <span
                  class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                  >{$t('properties.surfaceArea').split('(')[0].trim()}</span
                >
                <FormattedNumberInput
                  prefix={$t('unit.m2')}
                  class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                  bind:value={property.surfaceArea}
                />
              </label>
              <label class="block">
                <span
                  class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                  >{$t('properties.biarea').split('(')[0].trim()}</span
                >
                <FormattedNumberInput
                  prefix={$t('unit.m2')}
                  class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                  bind:value={property.biarea}
                />
              </label>
            </div>
            <div class="grid grid-cols-2 items-end gap-3 md:gap-4">
              {#if property.type === 'bostadsratt'}
                <label class="block">
                  <span
                    class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                    >{$t('properties.monthlyFee').split('(')[0].trim()}</span
                  >
                  <FormattedNumberInput
                    currency="SEK"
                    class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                    bind:value={property.monthlyFee}
                  />
                </label>
              {:else}
                <label class="block">
                  <span
                    class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                    >{$t('properties.plotArea').split('(')[0].trim()}</span
                  >
                  <FormattedNumberInput
                    prefix={$t('unit.m2')}
                    class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                    bind:value={property.plotArea}
                  />
                </label>
              {/if}
              <label class="block">
                <span
                  class="mb-1 flex min-h-[2rem] items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                  >{$t('properties.operatingCosts').split('(')[0].trim()}</span
                >
                <FormattedNumberInput
                  currency="SEK"
                  class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                  bind:value={property.operatingCosts}
                />
              </label>
            </div>
            <div class="grid grid-cols-2 items-end gap-3 md:gap-4">
              <label class="block">
                <span
                  class="mb-1 flex min-h-0 items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                  >{$t('properties.energyClass')}</span
                >
                <select
                  class="w-full rounded-xl border px-3 py-2 text-xs font-bold outline-none transition-colors focus:ring-2 focus:ring-stone-400 {getEnergyClassStyles(
                    property.energyClass
                  )}"
                  bind:value={property.energyClass}
                >
                  <option value="A">A</option><option value="B">B</option><option value="C"
                    >C</option
                  ><option value="D">D</option><option value="E">E</option><option value="F"
                    >F</option
                  ><option value="G">G</option><option value="?">?</option>
                </select>
              </label>
              {#if property.type === 'villa'}
                <label class="block">
                  <span
                    class="mb-1 flex min-h-0 items-end text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                    >{$t('properties.existingPantbrev').split('(')[0].trim()}</span
                  >
                  <FormattedNumberInput
                    currency="SEK"
                    class="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50"
                    bind:value={property.existingPantbrev}
                  />
                </label>
              {/if}
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
              {#if property.associationName}
                <div
                  class="flex w-full items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
                >
                  <svg
                    class="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {#if property.associationUrl}
                    <a
                      href={sanitizeUrl(property.associationUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="truncate text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {property.associationName}
                    </a>
                  {:else}
                    <span class="truncate">{property.associationName}</span>
                  {/if}
                </div>
              {/if}
              {#if property.sourceUrl}
                <a
                  href={sanitizeUrl(property.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 transition-colors hover:text-teal-700 md:text-[10px] dark:text-teal-400 dark:hover:text-teal-300"
                >
                  <svg
                    class="h-3 w-3 md:h-3.5 md:w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {$t('properties.viewOnBooli')}
                </a>
              {/if}
              {#if property.address}
                <a
                  href="https://www.openstreetmap.org/search?query={encodeURIComponent(
                    property.address
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 transition-colors hover:text-teal-700 md:text-[10px] dark:text-teal-400 dark:hover:text-teal-300"
                >
                  <svg class="h-3 w-3 md:h-3.5 md:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {$t('properties.viewOnMap')}
                </a>
              {/if}
            </div>
          </div>
        </div>

        <!-- Scenarios List -->
        <div
          class="flex flex-col rounded-3xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
        >
          <h3 class="mb-4 text-xs font-bold text-stone-800 md:text-sm dark:text-stone-200">
            {$t('properties.scenarios')}
          </h3>
          <div class="mb-4 max-h-[300px] space-y-2 overflow-y-auto pr-1 md:max-h-[400px]">
            {#if property.scenarios.length === 0}
              <p class="py-2 text-center text-xs italic text-stone-400 dark:text-stone-300">
                No scenarios yet.
              </p>
            {/if}
            {#each property.scenarios as sc (sc.id)}
              <div class="group flex items-center gap-2">
                <button
                  class="min-w-0 flex-1 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-200 {activeScenarioId ===
                  sc.id
                    ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800/50 dark:bg-teal-900/30 dark:text-teal-200'
                    : 'border-stone-100 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-700/50 dark:bg-stone-800 dark:text-stone-400 hover:dark:bg-stone-900'}"
                  onclick={() => (activeScenarioId = sc.id)}
                >
                  <span class="block truncate"
                    >{sc.name === '__ASKING_PRICE__' ? $t('scenario.askingPrice') : sc.name}</span
                  >
                </button>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    class="rounded-lg p-1.5 transition-colors {sc.isSelected
                      ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300'
                      : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:bg-stone-900 dark:text-stone-300 dark:text-stone-400'}"
                    onclick={() => toggleScenarioSelection(sc.id)}
                    title={$t('properties.compareHelp')}
                  >
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                    onclick={() => duplicateScenario(sc.id)}
                    title={$t('scenario.duplicate')}
                  >
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:bg-red-950/30 dark:bg-stone-800 dark:text-red-300 dark:text-red-400 dark:text-stone-200"
                    onclick={() => deleteScenario(sc.id)}
                    title={$t('scenario.delete')}
                  >
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <div class="mt-auto border-t border-stone-100 pt-4 dark:border-stone-700/50">
            <div class="flex gap-2">
              <input
                type="text"
                placeholder={$t('properties.scenarioPlaceholder')}
                class="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900/50 dark:focus:ring-stone-600"
                bind:value={newScenarioName}
              />
              <button
                class="shrink-0 rounded-xl bg-stone-800 px-4 py-2 text-xs font-medium text-stone-100 transition-colors hover:bg-stone-700 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
                onclick={addScenario}
              >
                {$t('properties.add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Scenario Area -->
      <div class="w-full min-w-0 flex-1">
        {#if activeScenario}
          <div class="animate-in fade-in slide-in-from-right-2 duration-300">
            <ScenarioCard
              {property}
              scenario={activeScenario}
              onToggle={() => toggleScenarioSelection(activeScenario.id)}
            />
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center text-stone-400 md:p-12 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
          >
            <svg
              class="mb-4 h-10 w-10 text-stone-300 md:h-12 md:w-12"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
              />
            </svg>
            <p class="text-sm">Select or create a scenario from the sidebar to view details.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <ConfirmModal
    isOpen={!!scenarioToDelete}
    title={$t('actions.confirm')}
    message={$t('scenario.confirmDelete')}
    confirmText={$t('actions.confirm')}
    onConfirm={confirmDeleteScenario}
    onCancel={() => (scenarioToDelete = null)}
  />
{/if}
