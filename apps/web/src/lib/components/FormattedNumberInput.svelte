<script lang="ts">
  let {
    value = $bindable(0),
    class: className = '',
    placeholder = '',
    disabled = false,
    currency = '',
    prefix = '',
    suffix = '',
    onblur,
    ...rest
  } = $props<{
    value: number;
    class?: string;
    placeholder?: string;
    disabled?: boolean;
    currency?: string;
    prefix?: string;
    suffix?: string;
    onblur?: (event: FocusEvent) => void;
    [key: string]: unknown;
  }>();

  let inputEl: HTMLInputElement;
  let focused = $state(false);

  function handleBlur(e: FocusEvent) {
    focused = false;
    if (onblur) {
      onblur(e);
    }
  }

  // Format with spaces (sv-SE locale)
  let displayValue = $derived(
    focused
      ? value === 0
        ? '0'
        : value.toString()
      : new Intl.NumberFormat('sv-SE').format(value || 0)
  );

  function handleInput(e: Event) {
    const raw = (e.currentTarget as HTMLInputElement).value.replace(/\s/g, '');
    const parsed = parseInt(raw, 10);
    value = isNaN(parsed) ? 0 : parsed;
  }
</script>

<div class="relative w-full">
  {#if currency || prefix}
    <span
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-stone-400 md:text-[10px] dark:text-stone-500"
      aria-hidden="true"
    >
      {currency || prefix}
    </span>
  {/if}
  {#if suffix}
    <span
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-stone-400 md:text-[10px] dark:text-stone-500"
      aria-hidden="true"
    >
      {suffix}
    </span>
  {/if}
  <input
    bind:this={inputEl}
    type="text"
    inputmode="numeric"
    class="text-right {className} {(currency || prefix).length > 3
      ? 'pl-14 md:pl-16'
      : currency || prefix
        ? 'pl-10 md:pl-12'
        : ''} {suffix ? 'pr-10 md:pr-12' : ''}"
    {placeholder}
    {disabled}
    value={displayValue}
    oninput={handleInput}
    onfocus={() => (focused = true)}
    onblur={handleBlur}
    {...rest}
  />
</div>
