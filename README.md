# Bovett: Swedish Property & Mortgage Calculator

Bovett is a modern, privacy-first property and mortgage comparison tool designed specifically for the Swedish real estate market. It helps users analyze properties from Booli, model different mortgage scenarios, and compare the financial impact of moving between properties.

![Bovett Logo](logo.svg)

## Key Features

- **Booli Importer:** Seamlessly import property data (price, size, monthly fee, operating costs, etc.) directly from Booli.se URLs using server-side scraping.
- **Scenario Modeling:** Create multiple mortgage scenarios for each property, adjusting interest rates, downpayments, and amortization strategies.
- **Swedish Market-Specific Logic:**
  - Automated calculation of mandatory amortization based on LTV (Loan-to-Value) and DTI (Debt-to-Income) rules.
  - Tentative 2026 mortgage rule support.
  - Precise tax deduction calculations for interest payments (30% up to 100k, 21% above).
  - Villa-specific calculations: *Lagfart*, *Pantbrev*, and municipal property tax (*Fastighetsavgift*).
- **Comprehensive Comparison:** Compare multiple properties side-by-side to see the true monthly cost difference.
- **Privacy-First:** All property and personal financial data is stored locally in your browser's `localStorage`. No data is sent to a backend database.
- **Internationalization:** Fully localized in Swedish and English.

## Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (powered by **Svelte 5** Runes)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts:** [Chart.js](https://www.chartjs.org/) for visualizing scenario comparisons.
- **Scraping:** [jsdom](https://github.com/jsdom/jsdom) on a Node.js API endpoint.
- **I18n:** [svelte-i18n](https://github.com/kaisermann/svelte-i18n) for multi-language support.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bovett.git
   cd bovett
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Build for production:
   ```bash
   pnpm build
   ```

## Deployment

The application is configured to use `@sveltejs/adapter-node` by default, but it is fully compatible with serverless environments (Vercel, Netlify) by switching to `@sveltejs/adapter-auto`.

See the [Documentation](./docs/architecture.md) for more details on deployment.

## Documentation

For a deeper dive into how Bovett works, check the `docs/` directory:
- [Architecture & Inner Workings](./docs/architecture.md)
- [Caveats & Gotchas](./docs/caveats-and-gotchas.md)
- [Future Improvements](./docs/improvements.md)
