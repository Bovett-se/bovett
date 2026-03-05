# Caveats & Gotchas

While Bovett is a powerful tool for analyzing your property purchase, there are several known caveats and gotchas that users and developers should be aware of.

## 1. Scraping Fragility
The Booli importer relies on server-side scraping using `jsdom`.

- **HTML Structure:** Booli.se regularly updates its website. If Booli changes their CSS classes, `__NEXT_DATA__` structure, or `JSON-LD` schemas, the importer will break.
- **Scraping Block:** Large cloud providers (like AWS, which Vercel uses) are often blocked by Booli. If the importer works locally but fails after deployment, it's likely a scraping block.
- **Data Inaccuracy:** Sometimes property data on Booli isn't fully filled out (e.g., missing energy class or operating costs). Bovett defaults to sensible Swedish averages (e.g., Energy Class C) in these cases.

## 2. Privacy & Persistence
Bovett is a **local-only** tool.

- **Storage Limit:** All data is saved to `localStorage`. `localStorage` typically has a limit of ~5MB. If you add hundreds of properties with large images (though Bovett currently doesn't store images), you might hit this limit.
- **Incognito Mode:** Data will **not** persist between sessions in Incognito/Private tabs.
- **Browser Clearing:** Clearing your browser cache or "site data" will **delete all your properties and scenarios**.

## 3. Simplified Financial Modeling
- **Marginal Tax Rate:** The income calculator uses an *approximated* municipal tax rate (32%) and Jobbskatteavdrag (Earned Income Tax Credit) logic. Real-world tax rates vary by municipality (e.g., higher in Stockholm than in Linköping).
- **Interest Rate Tiers:** Many Swedish banks offer interest rate discounts based on energy class (Grönt Bolån) or amortization. Bovett's model is simplified and doesn't automatically apply these discounts yet.
- **Maintenance Costs:** The operating costs (*Driftskostnad*) imported from Booli are often historical or based on the previous owner's usage. Your actual costs (especially for heating and electricity) may differ significantly.

## 4. Multiple Households
The `AppState.household` logic assumes a shared economy. Interest tax deductions are split equally between all members of the household. If you have a more complex ownership structure, the deduction calculations might not be 100% accurate.
