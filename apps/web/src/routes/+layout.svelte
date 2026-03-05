<script lang="ts">
  import '../app.css';
  import '../bovett-theme.css';
  import favicon from '$lib/assets/favicon.svg';
  import '$lib/i18n';
  import { browser, dev } from '$app/environment';
  import { page, updated } from '$app/stores';
  import { locale, t } from 'svelte-i18n';
  import Toast from '$lib/components/Toast.svelte';
  import { trackPageview } from '$lib/analytics';

  let { children } = $props();

  $effect(() => {
    if ($locale) {
      document.documentElement.lang = $locale;
    }
  });

  // Check for app updates
  $effect(() => {
    if ($updated) {
      location.reload();
    }
  });

  // Track pageviews manually via Plausible
  $effect(() => {
    // Access $page.url.pathname and 'tab' to trigger the effect on meaningful navigation
    const _pathname = $page.url.pathname;
    const _tab = $page.url.searchParams.get('tab');

    if (browser && !dev) {
      // trackPageview will handle stripping other query params
      trackPageview();
    }
  });
</script>

<svelte:head>
  <title>{$t('app.title')}</title>
  <link rel="icon" href={favicon} />
  <link rel="manifest" href="/manifest.json" />
</svelte:head>

<Toast />

<div
  class="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-800 selection:bg-teal-100 selection:text-stone-900 dark:bg-stone-900 dark:text-stone-100 dark:text-stone-200"
>
  <main class="flex-1">
    {@render children?.()}
  </main>
  <footer class="mt-auto flex flex-col items-end gap-2 px-4 py-6 text-right">
    <a href="/kunskap" class="text-xs font-medium text-teal-600 hover:underline dark:text-teal-400">
      {$t('footer.kunskap')}
    </a>
    <div class="text-[10px] text-stone-400 dark:text-stone-600">
      <p>{$t('footer.trademark')}</p>
      <p class="mt-1">{$t('footer.booli_trademark')}</p>
    </div>
  </footer>
</div>
