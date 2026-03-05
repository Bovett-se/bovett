<script lang="ts">
  import { t, waitLocale } from 'svelte-i18n';
  import BrandHeader from '$lib/components/BrandHeader.svelte';
</script>

<svelte:head>
  <title>{$t('privacy.title')} - {$t('app.title')}</title>
</svelte:head>

{#await waitLocale()}
  <div class="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
    <div class="animate-pulse font-bold text-stone-700 dark:text-stone-300">Loading...</div>
  </div>
{:then}
  <div
    class="min-h-screen bg-stone-50 p-6 transition-colors duration-300 sm:p-12 dark:bg-stone-900"
  >
    <div class="mx-auto max-w-2xl space-y-12">
      <BrandHeader backText={$t('nav.properties')} backHref="/app" />

      <main class="space-y-10">
        <section class="space-y-4">
          <h1 class="text-4xl font-black text-stone-900 dark:text-white">
            {$t('privacy.title')}
          </h1>
          <p class="text-lg text-stone-600 dark:text-stone-400">
            {$t('privacy.intro')}
          </p>
        </section>

        <div class="grid gap-10">
          <section class="space-y-3">
            <h2 class="text-xl font-bold text-stone-900 dark:text-white">
              {$t('privacy.section1_title')}
            </h2>
            <p class="leading-relaxed text-stone-600 dark:text-stone-400">
              {$t('privacy.section1_desc')}
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="text-xl font-bold text-stone-900 dark:text-white">
              {$t('privacy.section2_title')}
            </h2>
            <p class="leading-relaxed text-stone-600 dark:text-stone-400">
              {$t('privacy.section2_desc')}
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="text-xl font-bold text-stone-900 dark:text-white">
              {$t('privacy.section3_title')}
            </h2>
            <p class="leading-relaxed text-stone-600 dark:text-stone-400">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html $t('privacy.section3_desc')}
            </p>
          </section>

          <section class="space-y-3">
            <h2 class="text-xl font-bold text-stone-900 dark:text-white">
              {$t('privacy.section4_title')}
            </h2>
            <p class="leading-relaxed text-stone-600 dark:text-stone-400">
              {$t('privacy.section4_desc')}
            </p>
          </section>
        </div>

        <footer class="border-t border-stone-200 pt-8 dark:border-stone-800">
          <p class="text-sm text-stone-500 dark:text-stone-500">
            {$t('privacy.contact')}
          </p>
        </footer>
      </main>
    </div>
  </div>
{/await}
