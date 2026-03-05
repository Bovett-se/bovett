import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSDOM } from 'jsdom';
import { energyCache } from '$lib/server/cache';

interface ApolloRef {
  __ref: string;
}

interface FormattedValue {
  raw: number;
  formatted?: string;
}

interface InfoPoint {
  key: string;
  displayText?: {
    markdown?: string;
  };
}

interface InfoSection {
  content?: {
    infoPoints?: InfoPoint[];
  };
}

interface Breadcrumb {
  label?: string;
  url?: string;
}

interface ApolloProperty {
  streetAddress?: string;
  address?: {
    streetAddress?: string;
  };
  area?: ApolloRef;
  areaName?: string;
  location?: {
    areaName?: string;
    municipalityName?: string;
    addressLocality?: string;
    municipality?: { name?: string };
    area?: { municipality?: { name?: string } };
  };
  municipality?: ApolloRef;
  municipalityName?: string;
  listPrice?: FormattedValue | number;
  livingArea?: FormattedValue | number;
  livingSpace?: FormattedValue | number;
  supplementaryArea?: FormattedValue | number;
  sideArea?: FormattedValue | number;
  additionalArea?: FormattedValue | number;
  otherArea?: FormattedValue | number;
  biarea?: FormattedValue | number;
  rooms?: FormattedValue | number;
  numberOfRooms?: FormattedValue | number;
  rent?: FormattedValue | number;
  plotArea?: FormattedValue | number;
  operatingCost?: FormattedValue | number;
  constructionYear?: FormattedValue | number;
  taxationValue?: FormattedValue | number;
  adTargetingProperties?: Array<{ key: string; value?: string }>;
  isVilla?: boolean;
  objectType?: string;
  energyClass?: string;
  infoSections?: InfoSection[];
  housingCoop?: ApolloRef;
  breadcrumbs?: Breadcrumb[];
  associationName?: string;
}

interface ApolloState {
  [key: string]: Record<string, unknown> | undefined;
}

export const GET: RequestHandler = async ({ url }) => {
  const booliUrl = url.searchParams.get('url');

  if (!booliUrl) {
    console.warn('[Import API] No URL provided');
    throw error(400, 'Invalid Booli URL');
  }

  console.log(`[Import API] Starting import for: ${booliUrl}`);

  try {
    const parsedUrl = new URL(booliUrl);
    const domain = parsedUrl.hostname;
    const isBooliDomain = domain === 'booli.se' || domain.endsWith('.booli.se');

    if (!isBooliDomain) {
      console.warn(`[Import API] Blocked non-Booli domain: ${domain}`);
      throw error(400, 'Invalid Booli URL');
    }
  } catch (e) {
    console.warn(`[Import API] URL parsing failed for: ${booliUrl}`);
    throw error(400, 'Invalid Booli URL');
  }

  try {
    const response = await fetch(booliUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      console.error(`[Import API] Fetch failed with status ${response.status} for ${booliUrl}`);
      const status = response.status === 403 || response.status === 429 ? response.status : 502;
      throw error(status, `Failed to fetch from Booli: ${response.status}`);
    }

    console.log(`[Import API] Successfully fetched HTML for ${booliUrl}`);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    let address = '';
    let type = 'bostadsratt';
    let price = 0;
    let surfaceArea = 0;
    let biarea = 0;
    let rooms = 0;
    let monthlyFee = 0;
    let plotArea = 0;
    let operatingCosts = 0;
    let constructionYear: number | null = null;
    let taxValue = 0;
    let energyClass = '?';
    let associationName: string | null = null;
    let associationUrl: string | null = null;

    // 1. Parse __NEXT_DATA__ to get Apollo State (primary source)
    let apolloState: ApolloState | null = null;
    const nextDataScript = doc.querySelector('#__NEXT_DATA__');
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript.textContent || '{}');
        apolloState =
          nextData?.props?.pageProps?.__APOLLO_STATE__ ||
          nextData?.props?.pageProps?.initialApolloState;

        if (apolloState) {
          console.log('[Import API] Found Apollo state in __NEXT_DATA__');
          // Find the main Property or Listing object
          const propertyKey = Object.keys(apolloState).find(
            (k) => k.startsWith('Property:') || k.startsWith('Listing:')
          );
          if (propertyKey) {
            console.log(`[Import API] Found main property key: ${propertyKey}`);
            const p = apolloState[propertyKey] as ApolloProperty;

            // Safe extraction of FormattedValue objects or raw strings
            const getRaw = (val: unknown): number | null => {
              if (val === null || val === undefined) {
                return null;
              }
              if (typeof val === 'object' && 'raw' in val) {
                return typeof (val as { raw: number }).raw === 'number'
                  ? (val as { raw: number }).raw
                  : null;
              }
              if (typeof val === 'number') {
                return val;
              }
              if (typeof val === 'string') {
                const parsed = parseInt(val.replace(/[^0-9]/g, ''));
                return isNaN(parsed) ? null : parsed;
              }
              return null;
            };

            const streetAddress = p.streetAddress || p.address?.streetAddress || '';

            // Helper to resolve Apollo references or direct objects
            const resolveField = (field: unknown, subfield: string): unknown => {
              if (!field || typeof field !== 'object') {
                return null;
              }
              const f = field as Record<string, unknown>;
              if (subfield in f) {
                return f[subfield];
              }
              if ('__ref' in f && typeof f.__ref === 'string' && apolloState) {
                const ref = apolloState[f.__ref];
                if (ref && typeof ref === 'object' && subfield in ref) {
                  return ref[subfield as keyof typeof ref];
                }
              }
              return null;
            };

            let areaName = (resolveField(p.area, 'name') ||
              p.areaName ||
              resolveField(p.location, 'areaName')) as string | null;
            const municipalityName = (resolveField(p.municipality, 'name') ||
              p.municipalityName ||
              resolveField(p.location, 'municipalityName')) as string | null;

            // Global search for municipality name in Apollo state
            let foundMunicipality = municipalityName;

            if (!foundMunicipality) {
              const municipalityKey = Object.keys(apolloState).find((k) =>
                k.startsWith('Municipality:')
              );
              if (municipalityKey) {
                const m = apolloState[municipalityKey];
                if (m && typeof m === 'object' && 'name' in m && typeof m.name === 'string') {
                  foundMunicipality = m.name;
                }
              }
            }

            if (!foundMunicipality && p.location) {
              foundMunicipality =
                p.location.municipalityName ||
                p.location.municipality?.name ||
                p.location.area?.municipality?.name ||
                null;
            }

            if (!foundMunicipality && areaName && areaName.includes(',')) {
              const parts = areaName.split(',').map((part: string) => part.trim());
              if (parts.length > 1) {
                foundMunicipality = parts[1];
                areaName = parts[0];
              }
            }

            const addressParts = [];
            if (streetAddress) {
              addressParts.push(streetAddress);
            }
            if (areaName && areaName !== streetAddress) {
              addressParts.push(areaName);
            }
            if (
              foundMunicipality &&
              foundMunicipality !== areaName &&
              foundMunicipality !== streetAddress
            ) {
              addressParts.push(foundMunicipality);
            }

            if (addressParts.length > 0) {
              address = addressParts.join(', ');
            }

            price = getRaw(p.listPrice) ?? price;
            surfaceArea = getRaw(p.livingArea) ?? getRaw(p.livingSpace) ?? surfaceArea;

            // Comprehensive biarea search
            biarea =
              getRaw(p.supplementaryArea) ??
              getRaw(p.sideArea) ??
              getRaw(p.additionalArea) ??
              getRaw(p.otherArea) ??
              getRaw(p.biarea) ??
              0;

            rooms = getRaw(p.rooms) ?? getRaw(p.numberOfRooms) ?? rooms;
            monthlyFee = getRaw(p.rent) ?? monthlyFee;
            plotArea = getRaw(p.plotArea) ?? plotArea;
            operatingCosts = getRaw(p.operatingCost) ?? operatingCosts;
            constructionYear = getRaw(p.constructionYear) ?? constructionYear;
            taxValue = getRaw(p.taxationValue) ?? taxValue;

            // Extract energy class from adTargetingProperties if available
            if (p.adTargetingProperties && Array.isArray(p.adTargetingProperties)) {
              const energyProp = p.adTargetingProperties.find(
                (prop: unknown) =>
                  prop && typeof prop === 'object' && 'key' in prop && prop.key === 'energyClass'
              );
              if (
                energyProp &&
                (energyProp as { value?: string }).value &&
                /^[A-G]$/i.test((energyProp as { value: string }).value)
              ) {
                energyClass = (energyProp as { value: string }).value.toUpperCase();
              }
            }

            if (p.isVilla || p.objectType === 'VILLA' || p.objectType === 'FRILIGGANDE_VILLA') {
              type = 'villa';
            } else {
              type = 'bostadsratt';
            }

            if (p.energyClass) {
              energyClass = p.energyClass;
            }

            // More aggressive energy class search in infoPoints
            if (energyClass === '?' && p.infoSections) {
              try {
                for (const section of p.infoSections) {
                  const points = section.content?.infoPoints || [];
                  for (const point of points) {
                    if (point.key === 'energyScore' || point.key === 'energyClass') {
                      const markdown = point.displayText?.markdown || '';
                      const match = markdown.match(/energiklass\s+\*\*?([A-G])\*\*?/i);
                      if (match) {
                        energyClass = match[1].toUpperCase();
                        break;
                      }
                    }
                  }
                  if (energyClass !== '?') {
                    break;
                  }
                }
              } catch {
                // Ignore errors in infoSection traversal
              }
            }

            // Extract housing association info for apartments
            if (type === 'bostadsratt') {
              const housingCoopRef = p.housingCoop;
              if (housingCoopRef && housingCoopRef.__ref && apolloState[housingCoopRef.__ref]) {
                const coop = apolloState[housingCoopRef.__ref] as Record<string, unknown>;
                associationName = (coop.name as string) || null;
                associationUrl = (coop.website as string) || (coop.url as string) || null;
              }

              if (!associationName && p.breadcrumbs && Array.isArray(p.breadcrumbs)) {
                const lastBreadcrumb = p.breadcrumbs[p.breadcrumbs.length - 1];
                if (
                  lastBreadcrumb &&
                  (lastBreadcrumb.label?.startsWith('BRF') ||
                    lastBreadcrumb.url?.includes('/bostadsrattsforening/'))
                ) {
                  associationName = lastBreadcrumb.label || null;
                  if (!associationUrl && lastBreadcrumb.url) {
                    associationUrl = lastBreadcrumb.url.startsWith('http')
                      ? lastBreadcrumb.url
                      : `https://www.booli.se${lastBreadcrumb.url}`;
                  }
                }
              }

              if (!associationName && p.associationName) {
                associationName = p.associationName;
              }
            }
          }
        }
      } catch (e) {
        console.error(
          `[Import API] Error parsing Apollo state: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // fallback logic
    if (!address || energyClass === '?') {
      console.log(
        `[Import API] Address or energy class missing after Apollo parse. Address: "${address}", Energy: "${energyClass}". Trying fallbacks...`
      );
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const jsonLd = JSON.parse(script.textContent || '{}');

          // Energy Class search in JSON-LD
          if (energyClass === '?') {
            const findEnergy = (obj: unknown): string | null => {
              if (!obj || typeof obj !== 'object') {
                return null;
              }
              const o = obj as Record<string, unknown>;
              if (
                o.energyScore &&
                typeof o.energyScore === 'string' &&
                /^[A-G]$/i.test(o.energyScore)
              ) {
                return o.energyScore;
              }
              if (
                o.hasEnergyEfficiencyRating &&
                typeof o.hasEnergyEfficiencyRating === 'object' &&
                'energyEfficiencyCategory' in o.hasEnergyEfficiencyRating
              ) {
                const cat = o.hasEnergyEfficiencyRating.energyEfficiencyCategory;
                if (typeof cat === 'string') {
                  const match = cat.match(/[A-G]/i);
                  if (match) {
                    return match[0];
                  }
                }
              }
              for (const k in o) {
                const res = findEnergy(o[k]);
                if (res) {
                  return res;
                }
              }
              return null;
            };
            const foundEnergy = findEnergy(jsonLd);
            if (foundEnergy) {
              energyClass = foundEnergy.toUpperCase();
              console.log(`[Import API] Found energy class in JSON-LD: ${energyClass}`);
            }
          }

          // Address Extraction
          if (!address) {
            let postalAddress = null;
            if (jsonLd['@type'] === 'PostalAddress') {
              postalAddress = jsonLd;
            } else if (Array.isArray(jsonLd['@graph'])) {
              postalAddress = jsonLd['@graph'].find(
                (item: { '@type'?: string }) => item['@type'] === 'PostalAddress'
              );
            }

            if (postalAddress) {
              const addressParts = [];
              if (postalAddress.streetAddress) {
                addressParts.push(postalAddress.streetAddress);
              }
              if (postalAddress.addressLocality) {
                addressParts.push(postalAddress.addressLocality);
              }
              if (addressParts.length > 0) {
                address = addressParts.join(', ');
                console.log(`[Import API] Found address in JSON-LD: ${address}`);
              }
            }
          }
        } catch (e) {
          console.error(
            `[Import API] JSON-LD parse error: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }
    }

    if (price === 0) {
      const priceText = doc.querySelector('[data-testid="price"]')?.textContent || '';
      price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
      if (price > 0) {
        console.log(`[Import API] Extracted price from DOM: ${price}`);
      }
    }

    // Final checks
    if (html.toLowerCase().includes('bostadsrätt') && type !== 'bostadsratt') {
      type = 'bostadsratt';
    }
    if (
      (html.toLowerCase().includes('villa') || html.toLowerCase().includes('friliggande')) &&
      type !== 'villa'
    ) {
      type = 'villa';
    }

    // Ultimate GraphQL fallback for energy class
    if (energyClass === '?') {
      try {
        const urlIdMatch = booliUrl.match(/\/bostad\/(\d+)/) || booliUrl.match(/\/annons\/(\d+)/);
        const propertyId = urlIdMatch ? urlIdMatch[1] : null;

        if (propertyId) {
          const cachedClass = await energyCache.get(propertyId);
          if (cachedClass) {
            energyClass = cachedClass;
            console.log(`[Import API] Using cached energy class: ${energyClass}`);
          } else {
            console.log(`[Import API] Attempting GraphQL energy class fetch for ID: ${propertyId}`);
            const variables = JSON.stringify({
              input: {
                isResidence: true,
                propertyId: String(propertyId),
                sectionKey: 'energyDataInfo',
                housingCoopId: ''
              }
            });
            const extensions = JSON.stringify({
              persistedQuery: {
                version: 1,
                sha256Hash: '309f04b663dea26b9a55b899e14316580971b7154eb881547175f65eb127cc9e'
              }
            });
            const gqlUrl = `https://www.booli.se/graphql?operationName=propertyInfoSectionContent&variables=${encodeURIComponent(variables)}&extensions=${encodeURIComponent(extensions)}`;

            const gqlResponse = await fetch(gqlUrl, {
              headers: { 'content-type': 'application/json' }
            });

            if (gqlResponse.ok) {
              const gqlData = await gqlResponse.json();
              const infoPoints = gqlData?.data?.propertyInfoSectionContent?.infoPoints || [];
              for (const point of infoPoints) {
                if (point.key === 'energyScore' || point.key === 'energyClass') {
                  const markdown = point.displayText?.markdown || '';
                  const match = markdown.match(/energiklass\s*\*?\*?\s*([A-G])\b/i);
                  if (match) {
                    energyClass = match[1].toUpperCase();
                    await energyCache.set(propertyId, energyClass);
                    console.log(`[Import API] Found energy class via GraphQL: ${energyClass}`);
                    break;
                  }
                }
              }
            } else {
              console.error(`[Import API] GraphQL fetch failed with status: ${gqlResponse.status}`);
            }
          }
        }
      } catch (e) {
        console.error(
          `[Import API] GraphQL fallback failed: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    console.log(
      `[Import API] Finished extraction for ${booliUrl}. Address: "${address}", Type: ${type}, Price: ${price}, Area: ${surfaceArea}/${biarea}`
    );

    return json({
      address,
      type,
      price,
      surfaceArea,
      biarea,
      rooms,
      monthlyFee,
      plotArea,
      operatingCosts,
      constructionYear,
      taxValue,
      energyClass,
      associationName,
      associationUrl
    });
  } catch (e) {
    console.error(
      `[Import API] UNCAUGHT ERROR for ${booliUrl}: ${e instanceof Error ? e.message : String(e)}`
    );
    throw error(500, 'Internal error during import');
  }
};
