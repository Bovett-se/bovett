import { browser, dev } from '$app/environment';

/**
 * Analytics utility for tracking custom events via Plausible.
 * Following instructions from: https://www.npmjs.com/package/@plausible-analytics/tracker
 */

type EventName =
  | 'share_data_generated'
  | 'share_data_opened'
  | 'booli_import_success'
  | 'booli_import_error'
  | 'theme_changed'
  | 'app_reset'
  | 'knowledge_to_kalp_click'
  | 'kalp_calculated'
  | 'finance_planner_viewed'
  | 'finance_planner_calculated'
  | 'finance_planner_ics_exported';

let tracker: unknown = null;

async function getTracker() {
  if (!browser) {
    return null;
  }
  if (tracker) {
    return tracker;
  }

  const { init, track } = await import('@plausible-analytics/tracker');

  // Initialize Plausible tracker
  // We use window.location.hostname to support bovett.se, bovett.eu, bovett.com, bovett.nu
  init({
    domain: window.location.hostname,
    // Enable outbound link tracking as per documentation
    outboundLinks: true,
    // We disable autoCapturePageviews because SvelteKit is an SPA
    // and we want precise control over when the pageview is tracked (after navigation/title update)
    autoCapturePageviews: false,
    // bindToWindow is true by default, enabling window.plausible for verification
    bindToWindow: true
  });

  tracker = { track };
  return tracker;
}

// Initial call to set up the tracker if in browser
if (browser) {
  getTracker().catch((err) => console.error('Failed to initialize Plausible', err));
}

/**
 * Tracks a custom event in Plausible Analytics.
 * @param eventName The name of the event to track
 * @param props Optional custom properties to include with the event
 */
export async function trackEvent(
  eventName: EventName,
  props?: Record<string, string | number | boolean>
) {
  if (browser) {
    if (dev) {
      console.log(`[Plausible Event]: ${eventName}`, { props });
      return;
    }
    const t = await getTracker();
    if (t) {
      // The library handles localhost/opt-out automatically
      t.track(eventName, { props: props as Record<string, string> });
    }
  }
}

/**
 * Tracks a pageview in Plausible Analytics.
 * @param url Optional URL to track (defaults to window.location.href)
 */
export async function trackPageview(url?: string) {
  if (browser) {
    let trackingUrl = url || window.location.href;

    try {
      const urlObj = new URL(trackingUrl);
      const tab = urlObj.searchParams.get('tab');

      // UTM parameters to preserve
      const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const preservedParams: Record<string, string> = {};

      if (tab) {
        preservedParams['tab'] = tab;
      }

      for (const param of utmParams) {
        const value = urlObj.searchParams.get(param);
        if (value) {
          preservedParams[param] = value;
        }
      }

      // Clear all search parameters to avoid tracking local state like selected IDs
      urlObj.search = '';

      // Re-add preserved parameters
      for (const [key, value] of Object.entries(preservedParams)) {
        urlObj.searchParams.set(key, value);
      }

      trackingUrl = urlObj.toString();
    } catch {
      // Ignore URL parsing errors
    }

    if (dev) {
      console.log(`[Plausible Pageview]: ${trackingUrl}`);
      return;
    }
    const t = await getTracker();
    if (t) {
      // In @plausible-analytics/tracker, pageviews are tracked via 'pageview' event
      t.track('pageview', {
        url: trackingUrl
      });
    }
  }
}
