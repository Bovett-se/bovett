// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    plausible: (
      eventName: string,
      options?: {
        u?: string;
        props?: Record<string, string | number | boolean>;
      }
    ) => void;
  }
}

export {};
