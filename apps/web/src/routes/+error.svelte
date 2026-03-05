<script lang="ts">
  import { page } from '$app/stores';
  import { t, waitLocale } from 'svelte-i18n';
</script>

<svelte:head>
  <title>{$page.status} - {$t('app.title')}</title>
</svelte:head>

{#await waitLocale()}
  <div class="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
    <div class="animate-pulse font-bold text-stone-700 dark:text-stone-300">Loading...</div>
  </div>
{:then}
  <div
    class="flex min-h-[80vh] flex-col items-center justify-center bg-stone-50 p-6 text-center transition-colors duration-300 dark:bg-stone-900"
  >
    <div class="space-y-8">
      <div class="flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="h-24 w-24">
          <path
            d="M 20 85 L 80 85 L 80 55 L 88 55 L 72 43 L 72 27 L 62 27 L 62 35.5 L 50 26.5 L 12 55 L 20 55 Z"
            fill="none"
            stroke="#24978F"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.2"
          />
          <text
            x="50"
            y="65"
            text-anchor="middle"
            font-family="system-ui"
            font-size="40"
            font-weight="900"
            fill="#24978F"
          >
            {$page.status}
          </text>
        </svg>
      </div>

      <div class="space-y-2">
        <h1 class="text-4xl font-black text-stone-900 dark:text-white">
          {$t('error.title')}
        </h1>
        <p class="mx-auto max-w-md text-lg text-stone-500">
          {$page.status === 404 ? $t('error.404_subtitle') : $t('error.general_subtitle')}
        </p>
        {#if $page.error?.message && $page.status !== 404}
          <p class="mt-4 font-mono text-xs text-stone-400">
            {$page.error.message}
          </p>
        {/if}
      </div>

      <div class="pt-4">
        <a
          href="/"
          class="shadow-card hover:shadow-card-hover inline-block rounded-xl bg-teal-500 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-teal-600 active:scale-95"
        >
          {$t('error.back_home')}
        </a>
      </div>
    </div>
  </div>
{/await}
