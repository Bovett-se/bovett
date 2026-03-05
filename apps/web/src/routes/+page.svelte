<script lang="ts">
  import { locale, t } from 'svelte-i18n';
  import { browser } from '$app/environment';

  function toggleLocale() {
    locale.update((l) => (l === 'sv' ? 'en' : 'sv'));
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Nya bolåneregler 2026 - Vad innebär de nya reglerna från 1 april?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'De nya bolånereglerna träder i kraft den 1 april 2026. Det innebär ett höjt bolånetak till 90% (från 85%) och ett slopat inkomstbaserat amorteringskrav (det som tidigare sa att man måste amortera ytterligare 1% om lånet översteg 4.5 gånger inkomsten). Med Bovett kan du enkelt simulera hur dessa regler påverkar din månadskostnad.'
        }
      },
      {
        '@type': 'Question',
        name: 'Varför fick jag inte lån trots lånelöfte?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ett lånelöfte från banken baseras på schabloner. Innan köpet görs en slutgiltig KALP-kalkyl (Kvar Att Leva På) för den specifika bostaden. Om avgiften, driftskostnaden och bankens stressränta görat kalkylen går minus kan banken neka lånet. Bovett hjälper dig göra en egen detaljerad kalkyl i förväg.'
        }
      },
      {
        '@type': 'Question',
        name: 'Vad är KALP (Kvar Att Leva På)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KALP är bankernas modell för att bedöma din betalningsförmåga. De drar av din boendekostnad (med stressad ränta) och en schabloniserad levnadskostnad från din nettoinkomst. Kvarvarande belopp måste vara positivt för att få lån.'
        }
      }
    ]
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Bovett',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'SEK'
    }
  };

  const faqJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(faqJsonLd)}<` + `/script>`;
  const appJsonLdString =
    `<script type="application/ld+json">${JSON.stringify(appJsonLd)}<` + `/script>`;

  const isNative = $derived(
    browser &&
      !!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } })
        .Capacitor &&
      (!!(window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
        ?.isNative ||
        (window as unknown as { Capacitor?: { isNative?: boolean; platform?: string } }).Capacitor
          ?.platform !== 'web')
  );
</script>

<svelte:head>
  <title>{$t('app.title')} - {$t('landing.title')}</title>
  <meta name="description" content="{$t('landing.description')} {$t('landing.description_sub')}" />
  <!-- eslint-disable svelte/no-at-html-tags -->
  {@html faqJsonLdString}
  {@html appJsonLdString}
  <!-- eslint-enable svelte/no-at-html-tags -->
</svelte:head>

<div
  class="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6 transition-colors duration-300 sm:p-12 dark:bg-stone-900"
>
  <div class="mx-auto w-full max-w-3xl space-y-16">
    <header class="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
      <a
        href="/"
        class="flex w-full justify-center transition-opacity hover:opacity-80 sm:w-auto sm:justify-start"
        aria-label="Bovett Home"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 320 100"
          class="h-16 w-auto sm:h-20"
          aria-hidden="true"
        >
          <path
            d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
            fill="none"
            stroke="#24978F"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <text
            x="100"
            y="65"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="52"
            font-weight="800"
            fill="#24978F"
            letter-spacing="-1"
          >
            BOVETT
          </text>

          <text
            x="103"
            y="85"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="15"
            font-weight="500"
            class="fill-stone-700 dark:fill-stone-300"
          >
            {$t('app.subtitle')}
          </text>
        </svg>
      </a>

      <button
        onclick={toggleLocale}
        class="min-h-[44px] rounded-lg bg-stone-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-stone-300 focus:ring-2 focus:ring-teal-500 dark:bg-stone-800 dark:hover:bg-stone-700"
        aria-label={$locale === 'sv' ? 'Switch to English' : 'Byt till Svenska'}
      >
        {$locale === 'sv' ? 'English' : 'Svenska'}
      </button>
    </header>

    <main class="space-y-8 text-center sm:text-left">
      <h1
        class="text-4xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-6xl dark:text-white"
      >
        {$t('landing.title')}
      </h1>

      <div
        class="mx-auto max-w-2xl text-lg leading-relaxed text-stone-600 sm:mx-0 sm:text-xl dark:text-stone-400"
      >
        <p>{$t('landing.description')}</p>
        <p>{$t('landing.description_sub')}</p>
        <p class="mt-2 font-bold text-teal-600 dark:text-teal-400">{$t('landing.tagline')}</p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-4 pb-8 pt-4 sm:justify-start">
        <a
          href="/app"
          class="shadow-card hover:shadow-card-hover inline-block min-h-[44px] whitespace-nowrap rounded-xl bg-teal-500 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95"
        >
          {$t('landing.cta')}
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=se.bovett.app"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-all hover:scale-105 active:scale-95"
        >
          <img
            src={$locale === 'sv' ? '/google-play-badge-sv.png' : '/google-play-badge.png'}
            alt={$t('landing.googlePlay')}
            class="h-[64px] w-auto"
          />
        </a>
      </div>

      {#if !isNative}
        <div class="flex items-center justify-center gap-2 text-stone-500 sm:justify-start">
          <span class="text-sm">{$t('landing.dreamHome')}</span>
          <a
            href="/finance-planning"
            class="text-sm font-bold text-teal-600 hover:underline dark:text-teal-400"
          >
            {$t('landing.dreamHomeCta')} &rarr;
          </a>
        </div>
      {/if}
    </main>

    <section
      class="grid gap-8 border-t border-stone-200 pt-8 sm:grid-cols-2 dark:border-stone-700"
      aria-label="Key Features"
    >
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-stone-900 dark:text-white">
          {$t('landing.feature1_title')}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {$t('landing.feature1_desc')}
        </p>
      </div>
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-stone-900 dark:text-white">
          {$t('landing.feature2_title')}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {$t('landing.feature2_desc')}
        </p>
      </div>
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-stone-900 dark:text-white">
          {$t('landing.feature3_title')}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html $t('landing.feature3_desc')}
        </p>
      </div>
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-stone-900 dark:text-white">
          {$t('landing.feature4_title')}
        </h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {$t('landing.feature4_desc')}
        </p>
      </div>
    </section>
  </div>
</div>
