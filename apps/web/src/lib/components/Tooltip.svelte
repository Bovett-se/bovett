<script lang="ts">
  import { onMount } from 'svelte';

  let {
    text,
    children,
    position = 'top'
  } = $props<{
    text: string;
    children?: import('svelte').Snippet;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>();

  let isVisible = $state(false);
  let container: HTMLDivElement | null = $state(null);

  function toggle() {
    isVisible = !isVisible;
  }

  function show() {
    isVisible = true;
  }

  function hide() {
    isVisible = false;
  }

  function handlePointerEnter(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      show();
    }
  }

  function handlePointerLeave(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      hide();
    }
  }

  // Handle clicking outside to close on mobile
  function handleClickOutside(event: MouseEvent) {
    if (container && !container.contains(event.target as Node)) {
      isVisible = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  });

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-stone-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-stone-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-stone-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-stone-800'
  };
</script>

<div bind:this={container} class="relative inline-block" role="group">
  <button
    type="button"
    class="flex items-center justify-center rounded-full outline-none focus:ring-2 focus:ring-teal-500"
    onpointerenter={handlePointerEnter}
    onpointerleave={handlePointerLeave}
    onclick={(e) => {
      e.stopPropagation();
      toggle();
    }}
    aria-label="Information"
  >
    {#if children}
      {@render children()}
    {:else}
      <svg
        class="h-3.5 w-3.5 cursor-help text-stone-300 md:h-4 md:w-4 dark:text-stone-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  </button>

  {#if isVisible}
    <div
      class="animate-in fade-in zoom-in-95 pointer-events-none absolute z-[100] w-48 rounded-lg bg-stone-800 p-2 text-[10px] font-normal leading-tight text-white shadow-xl transition-all duration-200 md:w-64 md:text-xs {positionClasses[
        position
      ]}"
      role="tooltip"
    >
      {text}
      <!-- Triangle Arrow -->
      <div class="absolute border-8 border-transparent {arrowClasses[position]}"></div>
    </div>
  {/if}
</div>
