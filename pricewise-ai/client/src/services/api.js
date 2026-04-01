const API_BASE = '/api';
const SEARCH_TIMEOUT_MS = 35000;

const CORE_UNAVAILABLE_RETAILERS = [
  { store: 'Amazon', trustScore: 92, urlTemplate: 'https://www.amazon.in/s?k={query}' },
  { store: 'Flipkart', trustScore: 92, urlTemplate: 'https://www.flipkart.com/search?q={query}' },
  { store: 'Croma', trustScore: 88, urlTemplate: 'https://www.croma.com/searchB?q={query}%3Arelevance' },
  { store: 'Reliance Digital', trustScore: 88, urlTemplate: 'https://www.reliancedigital.in/search?q={query}' },
  { store: 'JioMart', trustScore: 85, urlTemplate: 'https://www.jiomart.com/search/{query}' },
  { store: 'Vijay Sales', trustScore: 90, urlTemplate: 'https://www.vijaysales.com/search/{query}' },
  { store: 'Tata Cliq', trustScore: 89, urlTemplate: 'https://www.tatacliq.com/search/?searchCategory=all&text={query}' },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachedSearchResult(query) {
  try {
    const raw = sessionStorage.getItem(`pw-search:${query.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedSearchResult(query, payload) {
  try {
    sessionStorage.setItem(`pw-search:${query.toLowerCase()}`, JSON.stringify(payload));
    localStorage.setItem(`pw-search:last:${query.toLowerCase()}`, JSON.stringify(payload));
  } catch {
    // Ignore storage issues.
  }
}

function getLastKnownSearchResult(query) {
  try {
    const raw = localStorage.getItem(`pw-search:last:${query.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildUnavailableRetailers(query) {
  const encoded = encodeURIComponent(query || '').replace(/%20/g, '+');
  return CORE_UNAVAILABLE_RETAILERS.map((item) => ({
    name: query,
    price: null,
    store: item.store,
    rating: 0,
    reviews: 0,
    url: item.urlTemplate.replace('{query}', encoded),
    image: '',
    source: 'fallback',
    trustScore: item.trustScore,
    trustLabel: item.trustScore >= 85 ? 'High' : item.trustScore >= 70 ? 'Good' : 'Medium',
    searchOnly: true,
    unavailableReason: 'Currently unavailable',
  }));
}

function buildOfflineFallbackPayload(query) {
  return {
    query,
    name: query,
    retailers: buildUnavailableRetailers(query),
    reviews: [],
    unavailableOfficialRetailers: CORE_UNAVAILABLE_RETAILERS.map((item) => ({
      store: item.store,
      reason: 'Currently unavailable',
    })),
    cached: true,
    warning: 'Live search is temporarily unavailable. Showing retailer availability placeholders.',
  };
}

/**
 * Search for a product across all retailers via the backend scrapers.
 * Returns { query, name, image, retailers[], scraped_at }
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
      setCachedSearchResult(query, payload);
      return payload;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < 2) {
        await delay(600);
      }
    }
  }

  const cached = getCachedSearchResult(query);
  if (cached) {
    return {
      ...cached,
      cached: true,
      warning: cached.warning || 'Showing cached results because live search is temporarily unavailable.',
    };
  }

  const lastKnown = getLastKnownSearchResult(query);
  if (lastKnown) {
    return {
      ...lastKnown,
      cached: true,
      warning: lastKnown.warning || 'Showing last known results because live search is temporarily unavailable.',
    };
  }

  console.warn('[search] live request failed, serving unavailable fallback payload:', lastError?.message || lastError);
  return buildOfflineFallbackPayload(query);
}

/**
 * Fetch real customer reviews for a product from a specific retailer.
 * Called after prices load so it never blocks the price display.
 * @param {{ retailer: string, url: string }} param
 */
export async function fetchRetailerReviews({ retailer, url }) {
  const res = await fetch(
    `${API_BASE}/reviews?retailer=${encodeURIComponent(retailer)}&url=${encodeURIComponent(url)}`
  );
  if (!res.ok) throw new Error(`Reviews API error ${res.status}`);
  return res.json(); // { reviews[], rating, reviewCount }
}
