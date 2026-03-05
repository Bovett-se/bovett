<script lang="ts">
  import { t } from 'svelte-i18n';
  import type { EnergyClass, Property } from '$lib/property.svelte';
  import Tooltip from './Tooltip.svelte';
  import { sanitizeUrl } from '$lib/security';
  import { formatCurrency } from '$lib/utils';

  let { property, onClick, onRemove } = $props<{
    property: Property;
    onClick: () => void;
    onRemove: () => void;
  }>();

  function getEnergyTextColor(energy: EnergyClass) {
    const colors = {
      A: 'text-teal-600 dark:text-teal-400',
      B: 'text-teal-500 dark:text-teal-400',
      C: 'text-stone-400 dark:text-stone-500',
      D: 'text-amber-500 dark:text-amber-400',
      E: 'text-orange-500 dark:text-orange-400',
      F: 'text-red-500 dark:text-red-400',
      G: 'text-red-600 dark:text-red-500',
      '?': 'text-stone-300 dark:text-stone-600'
    };
    return colors[energy] || 'text-stone-400';
  }
</script>

<div
  role="button"
  tabindex="0"
  class="group flex h-full cursor-pointer flex-col rounded-3xl border border-stone-100 bg-white p-4 text-left shadow-sm shadow-stone-200/50 transition-all duration-200 hover:border-stone-200 hover:shadow-xl active:scale-[0.98] md:p-5 dark:border-stone-700/50 dark:bg-stone-800 dark:shadow-stone-950/50"
  onclick={onClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }}
  aria-label="{$t('properties.analyze')} {property.name || 'Unnamed Property'}"
>
  <div class="min-w-0 flex-1">
    <div class="mb-3 flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h3
          class="truncate text-xs font-bold text-stone-900 transition-colors group-hover:text-stone-700 md:text-sm dark:text-stone-100 dark:group-hover:text-stone-300"
        >
          {property.name || 'Unnamed Property'}
        </h3>
      </div>
      <div class="flex shrink-0 items-center gap-1 md:gap-2">
        <button
          class="flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:bg-stone-100 md:h-9 md:w-9 dark:hover:bg-stone-700/50 {property.isFavorite
            ? 'text-amber-400'
            : 'text-stone-300 hover:text-stone-400'}"
          onclick={(e) => {
            e.stopPropagation();
            property.isFavorite = !property.isFavorite;
          }}
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
        <button
          class="flex h-8 w-8 items-center justify-center rounded-xl text-stone-300 transition-all hover:bg-red-50 hover:text-red-500 md:h-9 md:w-9 dark:text-stone-400 dark:hover:bg-red-950/30"
          onclick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={$t('properties.remove')}
          title={$t('properties.remove')}
        >
          <svg
            class="h-5 w-5 md:h-6 md:w-6"
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
    </div>

    <div class="mb-3 md:mb-4">
      <span
        class="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600 md:text-[10px] dark:bg-stone-800 dark:text-stone-400"
      >
        {$t(`types.${property.type}`)}
      </span>
    </div>

    <div
      class="mb-4 space-y-2 text-[11px] text-stone-500 md:space-y-3 md:text-xs dark:text-stone-400"
    >
      <p class="flex items-center gap-1.5 truncate">
        <svg
          class="h-3.5 w-3.5 shrink-0 text-stone-400 md:h-4 md:w-4 dark:text-stone-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clip-rule="evenodd"
          />
        </svg>
        <a
          href="https://www.openstreetmap.org/search?query={encodeURIComponent(property.address)}"
          target="_blank"
          rel="noopener noreferrer"
          class="truncate transition-colors hover:text-teal-600 hover:underline dark:hover:text-teal-400"
          onclick={(e) => e.stopPropagation()}
          aria-label="{$t('properties.address')}: {property.address || 'No address set'}, {$t(
            'properties.viewOnMap'
          )}"
        >
          {property.address || 'No address set'}
        </a>
      </p>

      {#if property.associationName}
        <p class="flex items-center gap-1.5 truncate">
          <svg
            class="h-3.5 w-3.5 shrink-0 text-stone-400 md:h-4 md:w-4 dark:text-stone-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
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
              class="truncate transition-colors hover:text-teal-600 hover:underline dark:hover:text-teal-400"
              onclick={(e) => e.stopPropagation()}
              aria-label="{$t('scenario.kalpApprovedTitle')}: {property.associationName}"
            >
              {property.associationName}
            </a>
          {:else}
            <span
              class="truncate"
              aria-label="{$t('scenario.kalpApprovedTitle')}: {property.associationName}"
              >{property.associationName}</span
            >
          {/if}
        </p>
      {/if}

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2">
        <p class="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
          <svg
            class="h-3.5 w-3.5 text-stone-400 md:h-4 md:w-4 dark:text-stone-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
            />
          </svg>
          <span aria-label="{$t('properties.surfaceArea')}: {property.surfaceArea} {$t('unit.m2')}">
            {property.surfaceArea}
            {$t('unit.m2')}
          </span>
          {#if property.biarea > 0}
            <span class="mx-0.5 text-stone-300 dark:text-stone-600" aria-hidden="true">+</span>
            <span aria-label="{$t('properties.biarea')}: {property.biarea} {$t('unit.m2')}">
              {property.biarea}
              <span class="text-[9px] text-stone-400 md:text-[10px] dark:text-stone-500"
                >{$t('unit.m2')} (bi)</span
              >
            </span>
          {/if}
        </p>

        {#if property.type === 'villa' && property.plotArea > 0}
          <p class="flex items-center gap-1.5 font-semibold text-stone-400 dark:text-stone-500">
            <svg
              class="h-3.5 w-3.5 text-stone-400 md:h-4 md:w-4 dark:text-stone-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                clip-rule="evenodd"
              />
            </svg>
            <span aria-label="{$t('properties.plotArea')}: {property.plotArea} {$t('unit.m2')}">
              {property.plotArea}
              {$t('unit.m2')}
              <span class="text-[9px] font-normal lowercase md:text-[10px]" aria-hidden="true"
                >({$t('properties.plotArea').split('(')[0].trim()})</span
              >
            </span>
          </p>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2">
        <p class="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
          <svg
            class="h-3.5 w-3.5 text-stone-400 md:h-4 md:w-4 dark:text-stone-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="16" height="16" rx="1" />
            <rect x="10" y="2" width="1" height="16" fill="white" class="dark:fill-stone-800" />
            <rect x="2" y="10" width="16" height="1" fill="white" class="dark:fill-stone-800" />
          </svg>
          <span aria-label="{$t('properties.rooms')}: {property.rooms || 0}">
            {property.rooms || 0}
            {$t('properties.rooms')}
          </span>
        </p>

        <div class="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
          <Tooltip
            text={property.energyClass === '?'
              ? $t('properties.energyClassUnknown')
              : "{$t('properties.energyClass')}: {property.energyClass}"}
          >
            <svg
              class="h-3.5 w-3.5 {getEnergyTextColor(property.energyClass || '?')} md:h-4 md:w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
                clip-rule="evenodd"
              />
            </svg>
          </Tooltip>
          <span aria-label="{$t('properties.energyClass')}: {property.energyClass || '?'}">
            {$t('properties.energyClass')}
            {property.energyClass || '?'}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2">
        {#if property.type === 'bostadsratt'}
          <div class="flex items-center gap-1.5 font-semibold text-stone-400 dark:text-stone-500">
            <Tooltip text={$t('properties.monthlyFeeTooltip')} />
            <span
              aria-label="{$t('properties.monthlyFee')}: {formatCurrency(
                property.monthlyFee
              )} / {$t('properties.month')}"
            >
              {formatCurrency(property.monthlyFee)} / {$t('properties.month')}
            </span>
          </div>
        {/if}

        {#if property.operatingCosts > 0}
          <div class="flex items-center gap-1.5 font-semibold text-stone-400 dark:text-stone-500">
            <Tooltip text={$t('properties.operatingCostsTooltip')}>
              <svg
                class="h-3.5 w-3.5 cursor-help md:h-4 md:w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clip-rule="evenodd"
                />
              </svg>
            </Tooltip>
            <span
              aria-label="{$t('properties.operatingCosts')}: {formatCurrency(
                property.operatingCosts
              )} / {$t('properties.month')}"
            >
              {formatCurrency(property.operatingCosts)} / {$t('properties.month')}
            </span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="mt-auto pt-3 md:pt-4">
    {#if property.sourceUrl}
      <div class="mb-3 md:mb-4">
        <a
          href={sanitizeUrl(property.sourceUrl)}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 transition-colors hover:text-teal-700 md:text-[10px] dark:text-teal-400 dark:hover:text-teal-300"
          onclick={(e) => e.stopPropagation()}
        >
          <svg
            class="h-3 w-3 md:h-3.5 md:w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {$t('properties.viewOnBooli')}
        </a>
      </div>
    {/if}

    <div
      class="flex items-center justify-between border-t border-stone-100/50 pt-3 md:pt-4 dark:border-stone-700/50"
    >
      <span
        class="text-[10px] font-semibold uppercase tracking-wider text-stone-400 md:text-xs dark:text-stone-500"
      >
        {property.scenarios.length}
        {property.scenarios.length === 1 ? $t('properties.scenario') : $t('properties.scenarios')}
      </span>
      <div
        class="flex items-center gap-1 text-[10px] font-semibold text-stone-700 transition-transform group-hover:translate-x-1 md:text-xs dark:text-stone-300"
        aria-hidden="true"
      >
        {$t('properties.analyze')}
        <svg class="h-3.5 w-3.5 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>
  </div>
</div>
