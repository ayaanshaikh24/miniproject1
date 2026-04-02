import { supabase, isSupabaseReady } from './supabase.js';

const CACHE_TTL_HOURS = 3;

export async function getCachedResult(query) {
  if (!isSupabaseReady()) return null;
  const key = String(query || '').trim().toLowerCase();
  if (!key) return null;

  try {
    const { data, error } = await supabase
      .from('product_cache')
      .select('response_payload, cached_at, expires_at')
      .eq('query_normalized', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    return {
      ...data.response_payload,
      cached: true,
      cachedAt: data.cached_at,
    };
  } catch (err) {
    console.warn('[cache] read error:', err.message);
    return null;
  }
}

export async function setCachedResult(query, payload) {
  if (!isSupabaseReady()) return;
  const key = String(query || '').trim().toLowerCase();
  if (!key) return;

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

    await supabase
      .from('product_cache')
      .upsert({
        query_normalized: key,
        response_payload: payload,
        retailer_count: Array.isArray(payload?.retailers) ? payload.retailers.length : 0,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'query_normalized' });
  } catch (err) {
    console.warn('[cache] write error:', err.message);
  }
}
