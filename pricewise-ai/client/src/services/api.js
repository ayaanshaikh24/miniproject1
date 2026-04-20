export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const SEARCH_TIMEOUT_MS = 30000;

function getSearchCacheKey(query) {
  return `pricewise:last-search:${String(query || '').trim().toLowerCase()}`;
}

function getCachedSearchPayload(query) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(getSearchCacheKey(query));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.retailers) || parsed.retailers.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedSearchPayload(query, payload) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!payload || !Array.isArray(payload.retailers) || payload.retailers.length === 0) return;
    window.localStorage.setItem(getSearchCacheKey(query), JSON.stringify(payload));
  } catch {
    // ignore localStorage write errors
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for a product across all retailers via the backend scrapers.
 * By default we request fresh results to avoid stale mismatched cache entries.
 */
export async function searchProductsLive(query, { fresh = true } = {}) {
  let lastError;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const url = `${API_BASE}/search?q=${encodeURIComponent(query)}${fresh ? '&fresh=1' : ''}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        let payload = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }

        const message = String(payload?.error || '').trim() || `API error ${res.status}`;
        const error = new Error(message);
        error.status = res.status;
        error.payload = payload;
        throw error;
      }
      const payload = await res.json();

      // If backend is up but temporarily returns no live results, prefer last-good data.
      const isTemporaryOutage =
        Array.isArray(payload?.retailers)
        && payload.retailers.length === 0
        && String(payload?.warning || '').toLowerCase().includes('temporarily unavailable');

      if (isTemporaryOutage) {
        const cached = getCachedSearchPayload(query);
        if (cached) {
          return {
            ...cached,
            warning: 'Showing last good results. Live search is temporarily unavailable.',
            stale: true,
          };
        }
      }

      setCachedSearchPayload(query, payload);
      return payload;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;

      const status = Number(error?.status) || 0;
      const message = String(error?.message || '').toLowerCase();
      const isAbort = error?.name === 'AbortError';
      const isNetwork = message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network error');
      const isRetryableStatus = status === 408 || status === 429 || status >= 500;
      const shouldRetry = attempt < maxAttempts && (isAbort || isNetwork || isRetryableStatus || status === 0);

      if (shouldRetry) {
        await delay(800 * attempt);
        continue;
      }

      break;
    }
  }

  console.warn('[search] live request failed:', lastError?.message);
  const cached = getCachedSearchPayload(query);
  if (cached) {
    return {
      ...cached,
      warning: 'Showing last good results. Could not reach live search right now.',
      stale: true,
    };
  }

  throw lastError || new Error('Live search is temporarily unavailable.');
}

/**
 * Fetch price history for a product (last 30 days).
 */
export async function fetchPriceHistory(query, days = 30, productId = '') {
  try {
    const productIdParam = String(productId || '').trim()
      ? `&product_id=${encodeURIComponent(String(productId || '').trim())}`
      : '';
    const res = await fetch(`${API_BASE}/price-history?q=${encodeURIComponent(query)}&days=${days}${productIdParam}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch {
    return [];
  }
}

/**
 * Fetch real-time product reviews from multiple retailers.
 */
export async function fetchProductReviews(query) {
  try {
    const res = await fetch(`${API_BASE}/reviews?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { reviews: [], stats: null };
    return await res.json();
  } catch {
    return { reviews: [], stats: null };
  }
}

/**
 * Create a price alert (stored in Supabase via backend).
 */
export async function createPriceAlertAPI({ email, productQuery, productName, targetPrice, currentPrice }) {
  const res = await fetch(`${API_BASE}/price-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, productQuery, productName, targetPrice, currentPrice }),
  });
  if (!res.ok) throw new Error(`Alert API error ${res.status}`);
  return res.json();
}

/**
 * Get price alerts by email.
 */
export async function getPriceAlerts(email) {
  const res = await fetch(`${API_BASE}/price-alerts?email=${encodeURIComponent(email || '')}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.alerts || [];
}

/**
 * Delete a price alert.
 */
export async function deletePriceAlert(id) {
  const res = await fetch(`${API_BASE}/price-alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete alert error ${res.status}`);
  return res.json();
}
