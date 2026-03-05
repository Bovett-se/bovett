<script lang="ts">
  import { appState } from '$lib/property.svelte';
  import { fade, fly } from 'svelte/transition';
</script>

{#if appState.toast}
  <div
    class="pointer-events-none fixed left-1/2 top-24 z-[100] -translate-x-1/2 px-4"
    in:fly={{ y: -20, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md {appState
        .toast.type === 'error'
        ? 'border-red-100 bg-red-50/90 text-red-800 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-200'
        : 'border-teal-100 bg-teal-50/90 text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/90 dark:text-teal-200'}"
      role="status"
      aria-live="polite"
    >
      {#if appState.toast.type === 'error'}
        <svg
          class="h-5 w-5 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      {:else}
        <svg
          class="h-5 w-5 text-teal-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
      <span class="text-xs font-bold tracking-tight">{appState.toast.message}</span>
    </div>
  </div>
{/if}
