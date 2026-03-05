<script lang="ts">
  import { locale, t } from 'svelte-i18n';
  import { appState } from '$lib/property.svelte';
  import { type Theme, themeState } from '$lib/theme.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { encryptData } from '$lib/security';
  import QRCode from 'qrcode';
  import { trackEvent } from '$lib/analytics';
  import { offlineState } from '$lib/offline.svelte';

  let isOpen = $state(false);
  let showResetModal = $state(false);
  let showBugModal = $state(false);
  let showInfoModal = $state(false);
  let showShareModal = $state(false);
  let shareUrl = $state('');
  let qrCodeDataUrl = $state('');
  let isSharing = $state(false);
  let fileInput: HTMLInputElement;
  let shareDialog = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!shareDialog) {
      return;
    }
    if (showShareModal) {
      if (!shareDialog.open) {
        shareDialog.showModal();
      }
    } else {
      if (shareDialog.open) {
        shareDialog.close();
      }
    }
  });

  function handleReset() {
    appState.resetState();
    trackEvent('app_reset');
    goto('/app');
  }

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function closeMenu() {
    isOpen = false;
  }

  function handleOutsideClick(event: MouseEvent) {
    if (isOpen && !(event.target as HTMLElement).closest('.settings-menu-container')) {
      closeMenu();
    }
  }

  onMount(() => {
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  });

  function exportData() {
    const data = {
      properties: appState.properties,
      myProperty: appState.myProperty,
      household: appState.household
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bovett-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    closeMenu();
  }

  async function shareData() {
    if (isSharing) {
      return;
    }
    isSharing = true;

    try {
      const data = {
        properties: appState.properties.map((p) => p.toJSON()),
        myProperty: appState.myProperty.toJSON(),
        household: appState.household.map((p) => p.toJSON()),
        additionalCash: appState.additionalCash
      };

      const jsonStr = JSON.stringify(data);
      const { encryptedData, key } = await encryptData(jsonStr);

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const { id } = await response.json();
      shareUrl = `${window.location.origin}/share/${id}#${key}`;

      // Generate QR code with logo
      qrCodeDataUrl = await generateQRCodeWithLogo(shareUrl);

      trackEvent('share_data_generated');
      showShareModal = true;
      closeMenu();
    } catch (err) {
      console.error('Sharing failed:', err);
      appState.showToast($t('actions.shareError'), 'error');
    } finally {
      isSharing = false;
    }
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl);
    appState.showToast($t('actions.shareSuccess'));
    showShareModal = false;
  }

  async function generateQRCodeWithLogo(url: string) {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
      margin: 2,
      scale: 10,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#1c1917', // stone-900 (black)
        light: '#ffffff'
      }
    });

    const context = canvas.getContext('2d');
    if (!context) {
      return canvas.toDataURL();
    }

    const logoSize = canvas.width * 0.22;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Punch a circular hole in the middle of the QR code
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    // Slightly smaller hole for an outlined icon to feel more integrated
    context.arc(centerX, centerY, logoSize * 0.6, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';

    const logo = new Image();
    logo.src = '/icon.svg';
    await new Promise((resolve) => {
      logo.onload = resolve;
    });

    const x = centerX - logoSize / 2;
    const y = centerY - logoSize / 2;
    context.drawImage(logo, x, y, logoSize, logoSize);

    return canvas.toDataURL();
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          appState.hydrate(data);
          appState.showToast($t('actions.importSuccess'));
        } catch {
          appState.showToast($t('actions.importError'), 'error');
        }
      };
      reader.readAsText(input.files[0]);
    }
    closeMenu();
  }

  function toggleLocale() {
    locale.update((l) => (l === 'sv' ? 'en' : 'sv'));
  }
</script>

<div class="settings-menu-container relative">
  <button
    class="rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
    onclick={toggleMenu}
    aria-label={$t('actions.settings')}
    aria-expanded={isOpen}
    aria-haspopup="true"
  >
    <svg
      class="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" /><path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  </button>

  {#if isOpen}
    <div
      class="slide-in-from-right absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-900"
      role="menu"
      aria-label="{$t('actions.settings')} menu"
    >
      <div
        class="mb-1 border-b border-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:border-stone-800 dark:text-stone-500"
        aria-hidden="true"
      >
        {$t('actions.settings')}
      </div>

      <!-- Theme Switcher -->
      <div
        class="mb-2 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-800/50"
        role="group"
        aria-labelledby="theme-label"
      >
        <span id="theme-label" class="text-xs font-medium text-stone-600 dark:text-stone-400"
          >{$t('actions.theme')}</span
        >
        <div class="flex gap-1" role="radiogroup">
          {#each ['light', 'auto', 'dark', 'high-contrast'] as theme (theme)}
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg transition-all {themeState.theme ===
              theme
                ? 'high-contrast:bg-black high-contrast:text-white bg-white text-teal-500 shadow-sm dark:bg-stone-700'
                : 'high-contrast:text-stone-600 high-contrast:hover:text-black text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}"
              onclick={() => {
                themeState.setTheme(theme as Theme);
                trackEvent('theme_changed', { theme });
              }}
              title={$t(`actions.theme_${theme}`)}
              role="radio"
              aria-checked={themeState.theme === theme}
              aria-label={$t(`actions.theme_${theme}`)}
            >
              {#if theme === 'light'}
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                  ><circle cx="12" cy="12" r="5" /><path
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  /></svg
                >
              {:else if theme === 'auto'}
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                  ><rect x="2" y="3" width="20" height="14" rx="2" /><path
                    d="M8 21h8M12 17v4"
                  /></svg
                >
              {:else if theme === 'dark'}
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                  ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg
                >
              {:else}
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  aria-hidden="true"
                  ><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg
                >
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Language Switcher -->
      <button
        class="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={toggleLocale}
        role="menuitem"
      >
        <span class="text-xs font-medium">{$t('actions.language')}</span>
        <span
          class="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-400"
        >
          {$locale === 'sv' ? 'ENGLISH' : 'SVENSKA'}
        </span>
      </button>

      <div class="my-1 h-px bg-stone-100 dark:bg-stone-800" role="separator"></div>

      <!-- Data Actions -->
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={exportData}
        role="menuitem"
      >
        <svg
          class="h-4 w-4 text-stone-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
            points="7 10 12 15 17 10"
          /><line x1="12" y1="15" x2="12" y2="3" /></svg
        >
        <span class="text-xs font-medium">{$t('actions.export')}</span>
      </button>

      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={() => fileInput.click()}
        role="menuitem"
      >
        <svg
          class="h-4 w-4 text-stone-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
            points="17 8 12 3 7 8"
          /><line x1="12" y1="3" x2="12" y2="15" /></svg
        >
        <span class="text-xs font-medium">{$t('actions.import')}</span>
      </button>

      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={shareData}
        disabled={isSharing || offlineState.isOffline}
        role="menuitem"
      >
        {#if isSharing}
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-transparent"
          ></div>
        {:else}
          <svg
            class="h-4 w-4 text-stone-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            ><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            /></svg
          >
        {/if}
        <span class="text-xs font-medium">{$t('actions.share')}</span>
        {#if offlineState.isOffline}
          <svg
            class="ml-auto h-3 w-3 text-amber-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 16 0 0 1 6.95 0" />
            <path d="M12 20h.01" />
          </svg>
        {/if}
      </button>

      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        onclick={() => {
          showResetModal = true;
          // Use a small timeout to ensure the modal starts opening before the menu disappears
          setTimeout(closeMenu, 50);
        }}
        role="menuitem"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          ><path d="M3 6h18" /><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          /></svg
        >
        <span class="text-xs font-medium">{$t('actions.reset')}</span>
      </button>

      <div class="my-1 h-px bg-stone-100 dark:bg-stone-800" role="separator"></div>

      <!-- Support Actions -->
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={() => {
          showBugModal = true;
          setTimeout(closeMenu, 50);
        }}
        role="menuitem"
      >
        <svg
          class="h-4 w-4 text-stone-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M8 2v4M16 2v4M3.5 7h17M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M9 11v4M15 11v4M9 18h6"
          />
        </svg>
        <span class="text-xs font-medium">{$t('actions.bugReport')}</span>
      </button>

      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={() => {
          showInfoModal = true;
          setTimeout(closeMenu, 50);
        }}
        role="menuitem"
      >
        <svg
          class="h-4 w-4 text-stone-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          ><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line
            x1="12"
            y1="17"
            x2="12.01"
            y2="17"
          /></svg
        >
        <span class="text-xs font-medium">{$t('actions.moreInfo')}</span>
      </button>

      <a
        href="/privacy"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        onclick={() => setTimeout(closeMenu, 50)}
        role="menuitem"
      >
        <svg
          class="h-4 w-4 text-stone-400"
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
        <span class="text-xs font-medium">{$t('actions.privacyPolicy')}</span>
      </a>
    </div>
  {/if}
</div>

<input
  type="file"
  accept=".json"
  class="hidden"
  bind:this={fileInput}
  onchange={handleFileSelect}
/>

<ConfirmModal
  bind:isOpen={showResetModal}
  title={$t('actions.reset')}
  message={$t('actions.confirmReset')}
  confirmText={$t('actions.reset')}
  onConfirm={handleReset}
/>

<ConfirmModal
  bind:isOpen={showBugModal}
  title={$t('actions.bugReport')}
  message={$t('actions.bugMessage')}
  confirmText="OK"
  showCancel={false}
  onConfirm={() => (showBugModal = false)}
/>

<ConfirmModal
  bind:isOpen={showInfoModal}
  title={$t('actions.moreInfo')}
  message={$t('actions.infoMessage')}
  confirmText="OK"
  showCancel={false}
  onConfirm={() => (showInfoModal = false)}
/>

<dialog
  bind:this={shareDialog}
  onclose={() => (showShareModal = false)}
  onclick={(e) => e.target === shareDialog && (showShareModal = false)}
  class="open:animate-in open:fade-in open:zoom-in-95 m-auto border-none bg-transparent p-0 outline-none backdrop:bg-stone-900/50 backdrop:backdrop-blur-sm"
>
  <div
    class="w-full max-w-md rounded-3xl border border-stone-100 bg-white p-6 shadow-xl dark:border-stone-700/50 dark:bg-stone-800"
  >
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-xl font-bold text-stone-900 dark:text-stone-100">
        {$t('actions.share')}
      </h3>
      <button
        class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        onclick={() => (showShareModal = false)}
        aria-label="Close"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <p class="mb-6 text-sm text-stone-600 dark:text-stone-400">
      {$t('actions.shareDescription')}
    </p>

    {#if qrCodeDataUrl}
      <div class="mb-6 flex flex-col items-center justify-center gap-3">
        <div class="rounded-2xl border-4 border-white bg-white p-2 shadow-inner">
          <img src={qrCodeDataUrl} alt="QR Code" class="h-48 w-48 rounded-lg" />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400"
          >{$t('actions.scanToImport')}</span
        >
      </div>
    {/if}

    <div class="flex gap-2">
      <input
        type="text"
        readonly
        value={shareUrl}
        class="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs text-stone-500 outline-none dark:border-stone-700 dark:bg-stone-900/50"
      />
      <button
        onclick={copyShareUrl}
        class="flex shrink-0 items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-600"
      >
        {$t('actions.shareLink')}
      </button>
    </div>
  </div>
</dialog>
