<script lang="ts">
  import { locale, t } from 'svelte-i18n';
  import { trackEvent } from '$lib/analytics';

  let {
    showBack = true,
    backHref = '/',
    backText = $t('kunskap.back')
  } = $props<{
    showBack?: boolean;
    backHref?: string;
    backText?: string;
  }>();

  function toggleLocale() {
    locale.update((l) => (l === 'sv' ? 'en' : 'sv'));
    trackEvent('theme_changed', { context: 'BrandHeader' }); // Reusing event or adding new
  }
</script>

<header class="flex items-center justify-between">
  <div class="flex items-center gap-4">
    {#if showBack}
      <a
        href={backHref}
        class="inline-flex items-center text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
      >
        &larr; {backText}
      </a>
    {/if}

    <a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-80">
      <div class="relative h-8 w-8 flex-shrink-0" aria-hidden="true">
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
        >
          <path
            d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
          />
        </svg>
      </div>
      <span class="font-bold tracking-tight text-teal-600 dark:text-teal-400">BOVETT</span>
    </a>
  </div>

  <button
    onclick={toggleLocale}
    class="min-h-[36px] rounded-lg bg-stone-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-stone-300 focus:ring-2 focus:ring-teal-500 dark:bg-stone-800 dark:hover:bg-stone-700"
    aria-label={$locale === 'sv' ? 'Switch to English' : 'Byt till Svenska'}
  >
    {$locale === 'sv' ? 'English' : 'Svenska'}
  </button>
</header>
