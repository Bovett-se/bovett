<script lang="ts">
  import { t } from 'svelte-i18n';
  import { fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let visible = $state(false);

  const isNative = $derived(
    browser &&
      !!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } })
        .Capacitor &&
      (!!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
        ?.isNative ||
        (window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
          ?.platform !== 'web')
  );

  onMount(() => {
    if (browser && !isNative) {
      const hasSeen = localStorage.getItem('play-store-banner-seen');
      if (!hasSeen) {
        // Show after a short delay to not overwhelm the user immediately
        setTimeout(() => {
          visible = true;
        }, 2000);
      }
    }
  });

  function dismiss() {
    visible = false;
    localStorage.setItem('play-store-banner-seen', 'true');
  }
</script>

{#if visible}
  <div
    class="fixed bottom-20 left-4 right-4 z-[70] md:bottom-8 md:left-auto md:right-8 md:w-96"
    in:fly={{ y: 50, duration: 500 }}
    out:fade={{ duration: 300 }}
  >
    <div
      class="relative overflow-hidden rounded-2xl border border-teal-100 bg-white p-5 shadow-2xl dark:border-teal-900/50 dark:bg-stone-800"
    >
      <!-- Background Decoration -->
      <div
        class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-50/50 dark:bg-teal-900/10"
      ></div>

      <div class="flex items-start gap-4">
        <div
          class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>

        <div class="flex-1 pr-6">
          <h3 class="text-sm font-bold text-stone-900 dark:text-white">
            {$t('playStore.notification')}
          </h3>
          <p class="mt-1 text-xs text-stone-600 dark:text-stone-400">
            {$t('playStore.description')}
          </p>
          <div class="mt-4 flex items-center gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=se.bovett.app"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-700 active:scale-95"
              onclick={dismiss}
            >
              {$t('playStore.download')}
            </a>
            <button
              class="text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              onclick={dismiss}
            >
              {$t('playStore.dismiss')}
            </button>
          </div>
        </div>

        <button
          class="absolute right-3 top-3 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
          onclick={dismiss}
          aria-label={$t('playStore.dismiss')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}
