<script lang="ts">
  import { t } from 'svelte-i18n';
  import type { EnergyClass, PropertyType } from '$lib/property.svelte';
  import FormattedNumberInput from './FormattedNumberInput.svelte';

  let {
    isOpen = $bindable(false),
    propertyName = $bindable(''),
    onConfirm
  } = $props<{
    isOpen: boolean;
    propertyName: string;
    onConfirm: (data: {
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
      energyClass: EnergyClass;
    }) => void;
  }>();

  let dialog = $state<HTMLDialogElement | null>(null);
  let type = $state<PropertyType>('bostadsratt');
  let price = $state(0);
  let address = $state('');
  let surfaceArea = $state(0);
  let biarea = $state(0);
  let rooms = $state(0);
  let plotArea = $state(0);
  let monthlyFee = $state(0);
  let operatingCosts = $state(0);
  let constructionYear = $state<number | null>(null);
  let taxValue = $state(0);
  let energyClass = $state<EnergyClass>('?');

  $effect(() => {
    if (dialog) {
      if (isOpen && !dialog.open) {
        dialog.showModal();
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    }
  });

  function handleConfirm() {
    onConfirm({
      name: propertyName,
      type,
      price,
      address,
      surfaceArea,
      biarea,
      rooms,
      plotArea,
      monthlyFee,
      operatingCosts,
      constructionYear,
      taxValue,
      energyClass
    });
    isOpen = false;
    // Reset for next time
    propertyName = '';
    price = 0;
    type = 'bostadsratt';
    address = '';
    surfaceArea = 0;
    biarea = 0;
    rooms = 0;
    plotArea = 0;
    monthlyFee = 0;
    operatingCosts = 0;
    constructionYear = null;
    taxValue = 0;
    energyClass = '?';
  }

  function handleCancel() {
    isOpen = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) {
      handleCancel();
    }
  }
</script>

<dialog
  bind:this={dialog}
  onclose={handleCancel}
  onclick={handleBackdropClick}
  aria-labelledby="details-modal-title"
  class="open:animate-in open:fade-in open:zoom-in-95 m-auto border-none bg-transparent p-0 outline-none backdrop:bg-stone-900/50 backdrop:backdrop-blur-sm"
>
  <div
    class="relative z-50 w-full max-w-[90vw] rounded-3xl border border-stone-100 bg-white p-5 shadow-xl shadow-stone-900/20 sm:max-w-lg md:w-full md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
  >
    <h3
      id="details-modal-title"
      class="mb-4 text-lg font-bold text-stone-900 md:mb-6 md:text-xl dark:text-stone-100"
    >
      {$t('properties.addManual')}
    </h3>

    <div class="mb-6 space-y-3 md:mb-8 md:space-y-4">
      <label class="block">
        <span
          class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
          aria-hidden="true">{$t('properties.placeholderName')}</span
        >
        <input
          type="text"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
          bind:value={propertyName}
          placeholder="e.g. Dream House"
          aria-label={$t('properties.placeholderName')}
        />
      </label>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <label class="block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
            aria-hidden="true">{$t('properties.type')}</span
          >
          <select
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            bind:value={type}
            aria-label={$t('properties.type')}
          >
            <option value="bostadsratt">{$t('types.bostadsratt')}</option>
            <option value="villa">{$t('types.villa')}</option>
          </select>
        </label>

        <label class="block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
            aria-hidden="true">{$t('scenario.price')}</span
          >
          <FormattedNumberInput
            currency="SEK"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
            bind:value={price}
            aria-label={$t('scenario.price')}
          />
        </label>
      </div>

      <label class="block">
        <span
          class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
          aria-hidden="true">{$t('properties.address')}</span
        >
        <input
          type="text"
          class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
          bind:value={address}
          aria-label={$t('properties.address')}
        />
      </label>

      <div class="grid grid-cols-3 items-end gap-2">
        <label class="block">
          <span
            class="mb-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 md:text-[10px] dark:text-stone-500"
            aria-hidden="true">{$t('properties.rooms')}</span
          >
          <input
            type="number"
            step="0.5"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-2 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-stone-400 md:px-3 dark:border-stone-700 dark:bg-stone-900"
            bind:value={rooms}
            aria-label={$t('properties.rooms')}
          />
        </label>
        <label class="block">
          <span
            class="mb-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 md:text-[10px] dark:text-stone-500"
            aria-hidden="true">{$t('properties.surfaceArea').split('(')[0].trim()}</span
          >
          <FormattedNumberInput
            prefix={$t('unit.m2')}
            class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
            bind:value={surfaceArea}
            aria-label={$t('properties.surfaceArea')}
          />
        </label>
        <label class="block">
          <span
            class="mb-1 block text-[9px] font-bold uppercase tracking-wider text-stone-400 md:text-[10px] dark:text-stone-500"
            aria-hidden="true">{$t('properties.biarea').split('(')[0].trim()}</span
          >
          <FormattedNumberInput
            prefix={$t('unit.m2')}
            class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
            bind:value={biarea}
            aria-label={$t('properties.biarea')}
          />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        {#if type === 'bostadsratt'}
          <label class="block">
            <span
              class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
              aria-hidden="true">{$t('properties.monthlyFee').split('(')[0].trim()}</span
            >
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
              bind:value={monthlyFee}
              aria-label={$t('properties.monthlyFee')}
            />
          </label>
        {:else}
          <label class="block">
            <span
              class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
              aria-hidden="true">{$t('properties.plotArea').split('(')[0].trim()}</span
            >
            <FormattedNumberInput
              prefix={$t('unit.m2')}
              class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
              bind:value={plotArea}
              aria-label={$t('properties.plotArea')}
            />
          </label>
        {/if}
        <label class="block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
            aria-hidden="true">{$t('properties.operatingCosts').split('(')[0].trim()}</span
          >
          <FormattedNumberInput
            currency="SEK"
            class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
            bind:value={operatingCosts}
            aria-label={$t('properties.operatingCosts')}
          />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <label class="block">
          <span
            class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
            aria-hidden="true">{$t('properties.energyClass')}</span
          >
          <select
            class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            bind:value={energyClass}
            aria-label={$t('properties.energyClass')}
          >
            <option value="?">?</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
          </select>
        </label>
      </div>

      {#if type === 'villa'}
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          <label class="block">
            <span
              class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
              aria-hidden="true">{$t('properties.constructionYear')}</span
            >
            <input
              type="number"
              class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
              bind:value={constructionYear}
              aria-label={$t('properties.constructionYear')}
            />
          </label>
          <label class="block">
            <span
              class="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500"
              aria-hidden="true">{$t('properties.taxValue')}</span
            >
            <FormattedNumberInput
              currency="SEK"
              class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-900"
              bind:value={taxValue}
              aria-label={$t('properties.taxValue')}
            />
          </label>
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-end gap-2 md:gap-3">
      <button
        class="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 md:px-5 md:py-2.5 dark:text-stone-400 dark:hover:bg-stone-700"
        onclick={handleCancel}
      >
        {$t('actions.cancel')}
      </button>
      <button
        class="rounded-xl bg-stone-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-stone-700 md:px-5 md:py-2.5 dark:bg-stone-700 dark:hover:bg-stone-600"
        onclick={handleConfirm}
      >
        {$t('properties.add')}
      </button>
    </div>
  </div>
</dialog>
