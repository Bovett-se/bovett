# Future Improvements

Bovett is a functional prototype, but there are several areas where it could be improved for better performance and a more complete user experience.

## 1. Enhanced Importer
- **Image Support:** Scraping and displaying property images from Booli.se.
- **Hemnet Support:** Expanding the importer to work with [Hemnet.se](https://www.hemnet.se/), which remains a primary source for property listings in Sweden.
- **Robustness:** Implementing a fallback mechanism for scraping using a more powerful tool like [Puppeteer](https://pptr.dev/) or [ScraperAPI](https://www.scraperapi.com/) for harder-to-scrape pages.

## 2. Dynamic Financial Data
- **Live Interest Rates:** Fetching real-time average mortgage rates from major Swedish banks (SEB, Swedbank, Handelsbanken, Nordea) to provide more accurate scenario defaults.
- **Municipal Tax API:** Using an API or lookup table to get the *exact* municipal tax rate based on the property's location.

## 3. Advanced Comparison
- **Visual Comparison:** Improved charts (using Chart.js or D3.js) to compare not just monthly cost, but also total cost over 5, 10, or 25 years (including inflation and expected property value growth).
- **Rental Comparison:** A feature to compare buying a property vs. renting a similar one in the same area.

## 4. User Experience & Persistence
- **Export/Import:** Allowing users to export their `localStorage` state to a JSON file and import it on another device.
- **Mobile App:** Packaging the SvelteKit app as a mobile application using [Capacitor](https://capacitorjs.com/) or [Tauri](https://tauri.app/).
- **PWA:** Turning Bovett into a Progressive Web App (PWA) so it can be installed on home screens and work offline.

## 5. Better Tax Logic
- **Grönt Bolån:** Automatically applying interest rate discounts for Energy Class A and B properties.
- **Uppskov Support:** A more detailed calculator for capital gains tax deferral (*Uppskov*) when selling your current home.
