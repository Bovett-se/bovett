# Architecture & Inner Workings

Bovett is a modern SvelteKit application built on **Svelte 5** and its latest **Runes** system for reactive state management.

## 1. State Management (`src/lib/property.svelte.ts`)

Bovett's state is entirely client-side. The core business logic resides in `AppState`, `Property`, `Scenario`, `Person`, and `MyProperty` classes.

### The Power of Svelte 5 Runes
- **`$state` & `$effect`:** Used for fine-grained reactivity.
- **`$state.snapshot`:** Essential for cloning data before persistence or serialization.
- **`toJSON` & `fromJSON`:** Each class has a serialization strategy for easy persistence to `localStorage`.

### LocalStorage Persistence
Whenever any tracked property in `appState` changes, a `$effect` in `+page.svelte` triggers `appState.persist()`. This ensures that if the browser refreshes or the tab is closed, your property comparisons are not lost.

## 2. Server-Side Scraping (`src/routes/api/import/+server.ts`)

The Booli importer is the only server-side requirement of Bovett.

- **Reasoning:** Modern browsers block requests to external sites like `booli.se` due to CORS (Cross-Origin Resource Sharing) policies.
- **Implementation:** When you paste a URL, the SvelteKit frontend calls our internal `/api/import` endpoint.
- **Library:** We use `jsdom` to parse the HTML and extract property details.
- **Source Selection:** We prioritize `__NEXT_DATA__` (Apollo State) and `JSON-LD` scripts before falling back to manual DOM selectors.

## 3. Localization (`src/lib/i18n/`)

We use `svelte-i18n` with JSON files in `src/lib/i18n/`.
- **`en.json`:** English translation.
- **`sv.json`:** Swedish translation.
- **`index.ts`:** Initialization and locale selection logic.

## 4. Calculations

- **Swedish Tax Deduction:** Logic follows standard rules: `30%` of interest costs up to 100k SEK per person, `21%` for anything above.
- **Amortization:** Logic dynamically checks:
  1. **LTV (Loan-to-Value):** 1% at 50% LTV, 2% at 70% LTV.
  2. **DTI (Debt-to-Income):** Additional 1% if loan is >4.5x annual gross income.
  3. **Tentative 2026 Rules:** Allows toggling to rules that eliminate the DTI surcharge.
- **Villa Costs:** Automatically calculates *Lagfart* (1.5% + fee) and *Pantbrev* (2% + fee) based on whether the property type is 'villa'.
