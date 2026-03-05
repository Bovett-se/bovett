<script lang="ts">
  import { t } from 'svelte-i18n';
  import { untrack } from 'svelte';
  import { appState } from '$lib/property.svelte';
  import Properties from '$lib/components/Properties.svelte';
  import MyProperty from '$lib/components/MyProperty.svelte';
  import Income from '$lib/components/Income.svelte';
  import Comparison from '$lib/components/Comparison.svelte';
  import Scenarios from '$lib/components/Scenarios.svelte';
  import SettingsMenu from '$lib/components/SettingsMenu.svelte';
  import PlayStoreBanner from '$lib/components/PlayStoreBanner.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { offlineState } from '$lib/offline.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  import { fade } from 'svelte/transition';

  const isNative = $derived(
    browser &&
      !!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } })
        .Capacitor &&
      (!!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
        ?.isNative ||
        (window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
          ?.platform !== 'web')
  );

  const activeTabFromUrl = $derived(
    $page.url.searchParams.get('tab') || appState.activeTab || 'properties'
  );
  const currentViewFromUrl = $derived($page.url.searchParams.get('view') || 'list');
  const selectedIdFromUrl = $derived($page.url.searchParams.get('id'));

  let showServiceNotice = $state(false);

  $effect(() => {
    if (browser) {
      const hasSeenNotice = sessionStorage.getItem('hasSeenServiceNotice');
      if (!hasSeenNotice) {
        showServiceNotice = true;
      }
    }
  });

  function handleCloseServiceNotice() {
    showServiceNotice = false;
    sessionStorage.setItem('hasSeenServiceNotice', 'true');
  }

  // Sync appState with URL for components that still rely on it
  $effect(() => {
    if (!browser) {
      return;
    }

    // Access reactive variables outside untrack to register them as dependencies
    const currentTab = activeTabFromUrl;
    const currentId = selectedIdFromUrl;

    untrack(() => {
      if (
        currentTab &&
        ['properties', 'my-property', 'income', 'comparison'].includes(currentTab)
      ) {
        if (appState.activeTab !== currentTab) {
          appState.activeTab = currentTab as typeof appState.activeTab;
        }
      }
      if (appState.selectedPropertyId !== currentId) {
        appState.selectedPropertyId = currentId;
      }
    });
  });

  $effect(() => {
    if (browser && !appState.hasCompletedOnboarding) {
      goto('/onboarding');
    }
  });

  function goToScenarios(id: string) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams($page.url.searchParams);
    params.set('tab', 'properties');
    params.set('view', 'scenarios');
    params.set('id', id);
    goto(`?${params.toString()}`, { noScroll: true, keepFocus: true });
  }

  function goBackToList() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams($page.url.searchParams);
    params.set('tab', 'properties');
    params.set('view', 'list');
    params.delete('id');
    goto(`?${params.toString()}`, { noScroll: true, keepFocus: true });
  }

  function switchTab(tab: string) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams($page.url.searchParams);
    params.set('tab', tab);
    if (tab !== 'properties') {
      params.delete('view');
      params.delete('id');
    }
    goto(`?${params.toString()}`, { noScroll: true, keepFocus: true });
  }

  $effect(() => {
    const _ = {
      p: appState.properties,
      mp: appState.myProperty,
      h: appState.household,
      at: appState.activeTab,
      sp: appState.selectedPropertyId,
      ac: appState.additionalCash
    };

    untrack(() => {
      appState.persist();
    });
  });
</script>

{#if browser}
  <div class="relative flex min-h-screen flex-col bg-stone-50 dark:bg-stone-900">
    <!-- Top Header -->
    <header
      class="fixed left-0 right-0 top-0 z-[60] border-b border-stone-200 bg-stone-50/95 backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/95"
    >
      <div
        class="mx-auto flex max-w-6xl items-center px-4"
        style="height: calc(4rem + env(safe-area-inset-top)); padding-top: env(safe-area-inset-top);"
      >
        <!-- Left: Logo -->
        {#if isNative}
          <div class="flex flex-none items-center gap-2 md:gap-3">
            <div class="relative h-8 w-8 flex-shrink-0 md:h-12 md:w-12" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                fill="none"
                stroke="#24978F"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-label={$t('app.title')}
              >
                <path
                  d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
                />
              </svg>
            </div>
            <div
              class="flex flex-col border-l border-stone-200 pl-3 text-[10px] font-medium tracking-wider text-stone-400 dark:border-stone-700 dark:text-stone-500"
            >
              <span aria-label={$t('app.subtitle')}>{$t('app.subtitle').split('. ')[0]}.</span>
              <span aria-hidden="true">{$t('app.subtitle').split('. ')[1]}</span>
            </div>
          </div>
        {:else}
          <a
            href="/"
            class="flex flex-none items-center gap-2 transition-opacity hover:opacity-80 md:gap-3"
          >
            <div class="relative h-8 w-8 flex-shrink-0 md:h-12 md:w-12" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                fill="none"
                stroke="#24978F"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-label={$t('app.title')}
              >
                <path
                  d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
                />
              </svg>
            </div>
            <div
              class="flex flex-col border-l border-stone-200 pl-3 text-[10px] font-medium tracking-wider text-stone-400 dark:border-stone-700 dark:text-stone-500"
            >
              <span aria-label={$t('app.subtitle')}>{$t('app.subtitle').split('. ')[0]}.</span>
              <span aria-hidden="true">{$t('app.subtitle').split('. ')[1]}</span>
            </div>
          </a>
        {/if}

        <!-- Desktop Navigation -->
        <div class="mx-4 hidden flex-1 justify-center md:flex">
          <div
            class="flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-800"
            role="tablist"
            aria-label={$t('actions.settings')}
          >
            <button
              class="relative whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-medium transition-all duration-300 {activeTabFromUrl ===
              'properties'
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-stone-200/50 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600/50'
                : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'}"
              role="tab"
              aria-selected={activeTabFromUrl === 'properties'}
              onclick={() => switchTab('properties')}
            >
              {$t('nav.properties')}
              {#if activeTabFromUrl === 'properties'}
                <div
                  class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500"
                  aria-hidden="true"
                ></div>
              {/if}
            </button>
            <button
              class="relative whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-medium transition-all duration-300 {activeTabFromUrl ===
              'my-property'
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-stone-200/50 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600/50'
                : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'}"
              role="tab"
              aria-selected={activeTabFromUrl === 'my-property'}
              onclick={() => switchTab('my-property')}
            >
              {$t('nav.myProperty')}
              {#if activeTabFromUrl === 'my-property'}
                <div
                  class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500"
                  aria-hidden="true"
                ></div>
              {/if}
            </button>
            <button
              class="relative whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-medium transition-all duration-300 {activeTabFromUrl ===
              'income'
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-stone-200/50 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600/50'
                : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'}"
              role="tab"
              aria-selected={activeTabFromUrl === 'income'}
              onclick={() => switchTab('income')}
            >
              {$t('nav.income')}
              {#if activeTabFromUrl === 'income'}
                <div
                  class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500"
                  aria-hidden="true"
                ></div>
              {/if}
            </button>
            <button
              class="relative whitespace-nowrap rounded-xl px-4 py-1.5 text-xs font-medium transition-all duration-300 {activeTabFromUrl ===
              'comparison'
                ? 'bg-white text-stone-800 shadow-sm ring-1 ring-stone-200/50 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600/50'
                : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'}"
              role="tab"
              aria-selected={activeTabFromUrl === 'comparison'}
              onclick={() => switchTab('comparison')}
            >
              {$t('nav.comparison')}
              {#if activeTabFromUrl === 'comparison'}
                <div
                  class="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500"
                  aria-hidden="true"
                ></div>
              {/if}
            </button>
          </div>
        </div>

        <!-- Right: Settings -->
        <div class="flex flex-1 items-center justify-end gap-2 md:flex-none">
          <div class="flex min-w-[24px] items-center justify-center">
            {#if offlineState.isOffline}
              <div class="flex items-center text-amber-500" in:fade>
                <Tooltip text={$t('offline.message')} position="bottom">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-5 w-5"
                  >
                    <path d="M1 1l22 22" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 16 0 0 1 6.95 0" />
                    <path d="M12 20h.01" />
                  </svg>
                </Tooltip>
              </div>
            {/if}
          </div>
          <SettingsMenu />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main
      class="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-[calc(4rem+env(safe-area-inset-top))] md:p-5 md:pb-8 md:pt-[calc(6rem+env(safe-area-inset-top))]"
    >
      <div
        id="{activeTabFromUrl}-panel"
        role="tabpanel"
        aria-labelledby="{activeTabFromUrl}-tab"
        class="w-full"
      >
        {#if activeTabFromUrl === 'properties'}
          {#if currentViewFromUrl === 'list'}
            <div in:fade={{ duration: 200 }}>
              <Properties onPropertyClick={goToScenarios} />
            </div>
          {:else}
            <div in:fade={{ duration: 200 }}>
              <Scenarios onBack={goBackToList} />
            </div>
          {/if}
        {:else}
          <div in:fade={{ duration: 200 }}>
            {#if activeTabFromUrl === 'my-property'}
              <MyProperty />
            {:else if activeTabFromUrl === 'income'}
              <Income />
            {:else if activeTabFromUrl === 'comparison'}
              <Comparison />
            {/if}
          </div>
        {/if}
      </div>
    </main>

    <!-- Mobile Navigation Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 z-[60] border-t border-stone-200 bg-stone-50/95 backdrop-blur-md md:hidden dark:border-stone-700/60 dark:bg-stone-900/95"
      style="padding-bottom: env(safe-area-inset-bottom);"
      role="tablist"
    >
      <div class="flex h-16 items-start justify-around px-2 pt-1">
        <button
          class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors {activeTabFromUrl ===
          'properties'
            ? 'text-teal-600 dark:text-teal-400'
            : 'text-stone-400 dark:text-stone-500'}"
          onclick={() => switchTab('properties')}
          role="tab"
          aria-selected={activeTabFromUrl === 'properties'}
        >
          {#if activeTabFromUrl === 'properties'}
            <div class="absolute top-0 h-1 w-8 rounded-b-full bg-teal-500" aria-hidden="true"></div>
          {/if}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
            />
          </svg>
          <span class="text-[10px] font-bold uppercase tracking-tight">{$t('nav.properties')}</span>
        </button>
        <button
          class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors {activeTabFromUrl ===
          'my-property'
            ? 'text-teal-600 dark:text-teal-400'
            : 'text-stone-400 dark:text-stone-500'}"
          onclick={() => switchTab('my-property')}
          role="tab"
          aria-selected={activeTabFromUrl === 'my-property'}
        >
          {#if activeTabFromUrl === 'my-property'}
            <div class="absolute top-0 h-1 w-8 rounded-b-full bg-teal-500" aria-hidden="true"></div>
          {/if}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 6a1 1 0 100 2 1 1 0 000-2zm13 1a1 1 0 11-2 0 1 1 0 012 0zM4 10a1 1 0 100 2 1 1 0 000-2zm13 1a1 1 0 11-2 0 1 1 0 012 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-[10px] font-bold uppercase tracking-tight">{$t('nav.myProperty')}</span>
        </button>
        <button
          class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors {activeTabFromUrl ===
          'income'
            ? 'text-teal-600 dark:text-teal-400'
            : 'text-stone-400 dark:text-stone-500'}"
          onclick={() => switchTab('income')}
          role="tab"
          aria-selected={activeTabFromUrl === 'income'}
        >
          {#if activeTabFromUrl === 'income'}
            <div class="absolute top-0 h-1 w-8 rounded-b-full bg-teal-500" aria-hidden="true"></div>
          {/if}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"
            />
          </svg>
          <span class="text-[10px] font-bold uppercase tracking-tight">{$t('nav.income')}</span>
        </button>
        <button
          class="relative flex flex-1 flex-col items-center gap-1 py-1 transition-colors {activeTabFromUrl ===
          'comparison'
            ? 'text-teal-600 dark:text-teal-400'
            : 'text-stone-400 dark:text-stone-500'}"
          onclick={() => switchTab('comparison')}
          role="tab"
          aria-selected={activeTabFromUrl === 'comparison'}
        >
          {#if activeTabFromUrl === 'comparison'}
            <div class="absolute top-0 h-1 w-8 rounded-b-full bg-teal-500" aria-hidden="true"></div>
          {/if}
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
            />
          </svg>
          <span class="text-[10px] font-bold uppercase tracking-tight">{$t('nav.comparison')}</span>
        </button>
      </div>
    </div>

    <PlayStoreBanner />

    <ConfirmModal
      bind:isOpen={showServiceNotice}
      title={$t('serviceNotice.title')}
      message={$t('serviceNotice.message')}
      confirmText={$t('actions.confirm')}
      showCancel={false}
      onConfirm={handleCloseServiceNotice}
      onCancel={handleCloseServiceNotice}
    />
  </div>
{:else}
  <div class="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
    <div class="animate-pulse font-bold text-stone-700 dark:text-stone-300">
      {$t('app.loading')}
    </div>
  </div>
{/if}
