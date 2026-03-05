<script lang="ts">
  import { t } from 'svelte-i18n';
  import { trackEvent } from '$lib/analytics';
  import BrandHeader from '$lib/components/BrandHeader.svelte';
</script>

<svelte:head>
  <title>{$t('app.title')} - {$t('kunskap.title')}</title>
  <meta name="description" content={$t('kunskap.subtitle')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-12 px-6 py-12 sm:px-12 md:py-20">
  <div class="space-y-6">
    <BrandHeader />

    <div class="space-y-4">
      <h1 class="text-3xl font-extrabold tracking-tight text-stone-900 md:text-5xl dark:text-white">
        {$t('kunskap.title')}
      </h1>
      <p class="text-lg leading-relaxed text-stone-600 dark:text-stone-400">
        {$t('kunskap.subtitle')}
      </p>
    </div>
  </div>

  <div class="space-y-8">
    <article
      class="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h2 class="text-xl font-bold text-stone-900 md:text-2xl dark:text-white">
        {$t('kunskap.faq1_q')}
      </h2>
      <p class="leading-relaxed text-stone-600 dark:text-stone-300">
        {$t('kunskap.faq1_a')}
      </p>
    </article>

    <article
      class="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h2 class="text-xl font-bold text-stone-900 md:text-2xl dark:text-white">
        {$t('kunskap.faq2_q')}
      </h2>
      <p class="leading-relaxed text-stone-600 dark:text-stone-300">
        {$t('kunskap.faq2_a')}
      </p>
    </article>

    <article
      class="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h2 class="text-xl font-bold text-stone-900 md:text-2xl dark:text-white">
        {$t('kunskap.faq3_q')}
      </h2>
      <p class="leading-relaxed text-stone-600 dark:text-stone-300">
        {$t('kunskap.faq3_a')}
      </p>
    </article>

    <article
      class="space-y-3 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
    >
      <h2 class="text-xl font-bold text-stone-900 md:text-2xl dark:text-white">
        {$t('kunskap.faq4_q')}
      </h2>
      <p class="leading-relaxed text-stone-600 dark:text-stone-300">
        {$t('kunskap.faq4_a')}
      </p>
    </article>

    <div
      class="mt-8 rounded-3xl bg-teal-50 p-6 text-center shadow-inner sm:p-10 dark:bg-teal-900/20"
    >
      <h2 class="mb-2 text-2xl font-extrabold text-teal-900 dark:text-teal-100">
        {$t('kunskap.cta_kalp_title')}
      </h2>
      <p class="mb-6 text-teal-700 dark:text-teal-300">
        {$t('kunskap.cta_kalp_desc')}
      </p>
      <a
        href="/kalp"
        onclick={() => trackEvent('knowledge_to_kalp_click')}
        class="inline-block rounded-xl bg-teal-600 px-6 py-3 font-bold text-white transition-colors hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95 dark:focus:ring-offset-stone-900"
      >
        {$t('kunskap.cta_kalp_btn')}
      </a>
    </div>
  </div>
</div>
