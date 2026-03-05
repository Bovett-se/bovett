<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { decryptData } from '$lib/security';
  import { appState } from '$lib/property.svelte';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import { trackEvent } from '$lib/analytics';

  let error = $state<string | null>(null);
  let isDecrypting = $state(true);

  onMount(async () => {
    const id = page.params.id;
    const key = window.location.hash.substring(1); // Remove '#'

    if (!id || !key) {
      error = 'Invalid share link';
      isDecrypting = false;
      return;
    }

    try {
      const response = await fetch(`/api/share?id=${id}`);
      if (!response.ok) {
        throw new Error('Share not found or expired');
      }

      const { encryptedData } = await response.json();
      const decrypted = await decryptData(encryptedData, key);
      const data = JSON.parse(decrypted);

      appState.hydrate(data);
      appState.completeOnboarding();
      trackEvent('share_data_opened');
      appState.showToast($t('actions.importSuccess'));
      goto('/app');
    } catch (err) {
      console.error('Decryption failed:', err);
      error = err instanceof Error ? err.message : 'Failed to load share data';
      isDecrypting = false;
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-stone-50 p-6 dark:bg-stone-900">
  <div
    class="w-full max-w-md rounded-3xl border border-stone-100 bg-white p-8 text-center shadow-xl dark:border-stone-700/50 dark:bg-stone-800"
  >
    <div class="mb-6 flex justify-center">
      <svg
        class="h-12 w-12 text-teal-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        {#if error}
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        {:else}
          <polyline points="16 12 12 8 8 12" />
          <line x1="12" y1="16" x2="12" y2="8" />
        {/if}
      </svg>
    </div>

    {#if error}
      <h1 class="mb-2 text-xl font-bold text-red-600 dark:text-red-400">Import Failed</h1>
      <p class="mb-6 text-stone-600 dark:text-stone-400">{error}</p>
      <button
        onclick={() => goto('/')}
        class="rounded-xl bg-stone-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-700 dark:hover:bg-stone-600"
      >
        Go Home
      </button>
    {:else}
      <h1 class="mb-2 text-xl font-bold text-stone-900 dark:text-stone-100">
        {isDecrypting ? 'Decrypting Secure Share...' : 'Importing Data...'}
      </h1>
      <p class="text-stone-600 dark:text-stone-400">
        Please wait while we securely process your shared Bovett data.
      </p>
      <div class="mt-8 flex justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"
        ></div>
      </div>
    {/if}
  </div>
</div>
