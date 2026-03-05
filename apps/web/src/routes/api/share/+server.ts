import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { energyCache } from '$lib/server/cache';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { encryptedData } = await request.json();

    if (!encryptedData) {
      console.warn('[Share API] POST called with no data');
      throw error(400, 'No data provided');
    }

    // Generate a random ID for the share
    const id = crypto.randomUUID();
    console.log(
      `[Share API] Creating new share with ID: ${id} (Data size: ${encryptedData.length} chars)`
    );

    // Store in cache for 24 hours (86400 seconds)
    await energyCache.set(`share:${id}`, encryptedData, 86400);
    console.log(`[Share API] Successfully stored share: ${id}`);
    return json({ id });
  } catch (err) {
    console.error('[Share API] POST Error:', err);
    if ((err as { status?: number }).status === 400) throw err;
    throw error(500, 'Failed to store share data');
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    console.warn('[Share API] GET called without ID');
    throw error(400, 'Missing share ID');
  }

  console.log(`[Share API] Retrieving share data for ID: ${id}`);

  try {
    const encryptedData = await energyCache.get(`share:${id}`);

    if (!encryptedData) {
      console.warn(`[Share API] Share ID not found or expired: ${id}`);
      throw error(404, 'Share not found or expired');
    }

    console.log(`[Share API] Successfully retrieved share data for ID: ${id}`);
    return json({ encryptedData });
  } catch (err) {
    console.error(`[Share API] GET Error for ID ${id}:`, err);
    if ((err as { status?: number }).status === 404) throw err;
    throw error(500, 'Failed to retrieve share data');
  }
};
