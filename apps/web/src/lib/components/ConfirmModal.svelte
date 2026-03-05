<script lang="ts">
  import { t } from 'svelte-i18n';

  let {
    isOpen = $bindable(false),
    title = '',
    message = '',
    confirmText,
    cancelText,
    showCancel = true,
    onConfirm,
    onCancel
  } = $props<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }>();

  let dialog = $state<HTMLDialogElement | null>(null);

  const displayConfirmText = $derived(confirmText || $t('actions.confirm'));
  const displayCancelText = $derived(cancelText || $t('actions.cancel'));

  $effect(() => {
    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  });

  function handleConfirm() {
    isOpen = false;
    onConfirm();
  }

  function handleCancel() {
    isOpen = false;
    if (onCancel) {
      onCancel();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) {
      handleCancel();
    }
  }

  function handleClose() {
    // This handles the 'Esc' key and other ways the browser might close the dialog
    if (isOpen) {
      isOpen = false;
      if (onCancel) {
        onCancel();
      }
    }
  }
</script>

<dialog
  bind:this={dialog}
  onclose={handleClose}
  onclick={handleBackdropClick}
  aria-labelledby="modal-title"
  class="open:animate-in open:fade-in open:zoom-in-95 m-auto border-none bg-transparent p-0 outline-none backdrop:bg-stone-900/50 backdrop:backdrop-blur-sm"
>
  <div
    class="relative z-50 w-full max-w-md rounded-3xl border border-stone-100 bg-white p-6 shadow-xl shadow-stone-900/20 md:p-8 dark:border-stone-700/50 dark:bg-stone-800"
  >
    <h3 id="modal-title" class="mb-2 text-xl font-bold text-stone-900 dark:text-stone-100">
      {title}
    </h3>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-8 text-stone-600 dark:text-stone-400">{@html message}</p>

    <div class="flex items-center justify-end gap-3">
      {#if showCancel}
        <button
          type="button"
          class="rounded-xl px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
          onclick={handleCancel}
        >
          {displayCancelText}
        </button>
      {/if}
      <button
        type="button"
        class="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
        onclick={handleConfirm}
      >
        {displayConfirmText}
      </button>
    </div>
  </div>
</dialog>
