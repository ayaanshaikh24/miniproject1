const API_BASE = '/api';
const SEARCH_TIMEOUT_MS = 35000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for a product across all retailers via the backend scrapers.
 */
export async function searchProductsLive(query) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const payload = await res.json();
      return payload;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < 2) await delay(600);
    }
  }

  console.warn('[search] live request failed:', lastError?.message);
  return {
    query,
    name: query,
    retailers: [],
    unavailableOfficialRetailers: [],
    warning: 'Live search is temporarily unavailable. Please try again.',
  };
}

/**
 * Fetch price history for a product (last 30 days).
 */
export async function fetchPriceHistory(query, days = 30) {
  try {
    const res = await fetch(`${API_BASE}/price-history?q=${encodeURIComponent(query)}&days=${days}`);
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
