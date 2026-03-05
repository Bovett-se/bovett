<script lang="ts">
  import { t } from 'svelte-i18n';
  import {
    appState,
    type EnergyClass,
    fetchBooliData,
    type PropertyType
  } from '$lib/property.svelte';
  import { offlineState } from '$lib/offline.svelte';
  import PropertyCard from './PropertyCard.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import PropertyDetailsModal from './PropertyDetailsModal.svelte';
  import { trackEvent } from '$lib/analytics';

  let { onPropertyClick } = $props<{ onPropertyClick: (id: string) => void }>();

  let newPropertyName = $state('');
  let booliUrl = $state('');
  let isImporting = $state(false);
  let propertyToDelete = $state<string | null>(null);
  let showDetailsModal = $state(false);

  let sortedProperties = $derived(
    [...appState.properties].sort((a, b) => {
      if (a.isFavorite === b.isFavorite) {
        return 0;
      }
      return a.isFavorite ? -1 : 1;
    })
  );

  function openDetailsModal() {
    showDetailsModal = true;
  }

  function handleAddProperty(data: {
    name: string;
    type: PropertyType;
    price: number;
    address: string;
    surfaceArea: number;
    biarea: number;
    rooms: number;
    plotArea: number;
    monthlyFee: number;
    operatingCosts: number;
    constructionYear: number | null;
    taxValue: number;
    energyClass: string;
  }) {
    const p = appState.addProperty(data.name || $t('properties.untitled'), data.type);
    p.address = data.address;
    p.surfaceArea = data.surfaceArea;
    p.biarea = data.biarea;
    p.rooms = data.rooms;
    p.plotArea = data.plotArea;
    p.monthlyFee = data.monthlyFee;
    p.operatingCosts = data.operatingCosts;
    p.constructionYear = data.constructionYear;
    p.taxValue = data.taxValue;
    p.energyClass = data.energyClass as EnergyClass;

    if (data.price > 0) {
      p.addScenario('__ASKING_PRICE__', data.price);
    }

    appState.persist();
  }

  async function importFromBooli() {
    if (booliUrl.includes('booli.se') && !isImporting) {
      isImporting = true;
      try {
        const data = await fetchBooliData(booliUrl);
        const p = appState.addProperty(data.address || 'Imported Property', data.type);
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
        p.associationName = data.associationName || null;
        p.associationUrl = data.associationUrl || null;

        if (data.price > 0) {
          p.addScenario('__ASKING_PRICE__', data.price);
        }

        trackEvent('booli_import_success', { type: data.type });
        appState.persist();
        booliUrl = '';
      } catch (err) {
        trackEvent('booli_import_error');
        if (err && typeof err === 'object' && 'status' in err) {
          const status = (err as { status: number }).status;
          if (status === 403 || status === 429) {
            appState.showToast($t('actions.importBlocked'), 'error');
            return;
          }
        }
        const msg = err instanceof Error ? err.message : $t('actions.importError');
        alert(`${$t('actions.importError')}\n\n${msg}`);
      } finally {
        isImporting = false;
      }
    }
  }
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500 md:space-y-5">
  <div class="flex flex-col gap-3 md:flex-row md:gap-4">
    <section
      class="flex-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
      aria-labelledby="add-manual-heading"
    >
      <h2
        id="add-manual-heading"
        class="mb-3 text-[10px] font-semibold text-stone-800 md:mb-4 md:text-xs dark:text-stone-200"
      >
        {$t('properties.addManual')}
      </h2>
      <button
        class="w-full rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-stone-700 md:py-2 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
        onclick={openDetailsModal}
      >
        {$t('properties.add')}
      </button>
    </section>

    <section
      class="flex-1 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm shadow-stone-200/50 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
      aria-labelledby="import-booli-heading"
    >
      <h2
        id="import-booli-heading"
        class="mb-3 text-[10px] font-semibold text-stone-800 md:mb-4 md:text-xs dark:text-stone-200"
      >
        {$t('properties.importBooli')}
      </h2>
      <div class="flex gap-2">
        <input
          type="text"
          placeholder={$t('properties.placeholderUrl')}
          class="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-50 disabled:text-stone-400 md:px-4 md:py-2 dark:border-stone-700 dark:bg-stone-900/50 dark:focus:ring-stone-600 dark:disabled:bg-stone-900/20"
          bind:value={booliUrl}
          disabled={isImporting || offlineState.isOffline}
          aria-label={$t('properties.placeholderUrl')}
        />
        <button
          class="rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-stone-700 disabled:opacity-50 md:px-3 md:py-2 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
          onclick={importFromBooli}
          disabled={isImporting || offlineState.isOffline}
          aria-live="polite"
        >
          {isImporting ? $t('properties.importing') : $t('properties.import')}
        </button>
      </div>
    </section>
  </div>

  <section aria-labelledby="your-properties-heading">
    <h2
      id="your-properties-heading"
      class="mb-3 flex items-center gap-2 text-[10px] font-bold text-stone-900 md:mb-4 md:text-xs dark:text-stone-100"
    >
      {$t('properties.yourProperties')}
      <span
        class="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-normal text-stone-400 md:text-xs dark:bg-stone-800 dark:text-stone-500"
        aria-live="polite"
        aria-label="{appState.properties.length} {$t('properties.yourProperties').toLowerCase()}"
        >{appState.properties.length}</span
      >
    </h2>

    {#if appState.properties.length === 0}
      <div
        class="rounded-3xl border-2 border-dashed border-stone-200 bg-white py-12 text-center md:py-20 dark:border-stone-700 dark:bg-stone-800"
      >
        <p class="text-xs text-stone-400 md:text-sm dark:text-stone-500">
          {$t('properties.noProperties')}
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3" role="list">
        {#each sortedProperties as property (property.id)}
          <div role="listitem">
            <PropertyCard
              {property}
              onClick={() => onPropertyClick(property.id)}
              onRemove={() => (propertyToDelete = property.id)}
            />
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<ConfirmModal
  isOpen={!!propertyToDelete}
  title={$t('actions.confirm')}
  message={$t('properties.confirmRemove')}
  confirmText={$t('actions.confirm')}
  onConfirm={() => {
    if (propertyToDelete) {
      appState.removeProperty(propertyToDelete);
    }
    propertyToDelete = null;
  }}
  onCancel={() => (propertyToDelete = null)}
/>

<PropertyDetailsModal
  bind:isOpen={showDetailsModal}
  bind:propertyName={newPropertyName}
  onConfirm={handleAddProperty}
/>
