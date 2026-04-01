/**
 * Shared HTTP headers that mimic a real Chrome browser on Windows.
 * Rotating a small pool of User-Agents helps avoid basic bot detection.
 */

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

export function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function browserHeaders(extra = {}) {
  return {
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    ...extra,
  };
}

export function createFallbackRetailer({
  retailer,
  logoInitial,
  color,
  url,
  trustScore,
  sellerName,
  returnDays,
  query,
}) {
  return {
    retailer,
    logo_initial: logoInitial,
    color,
    url,
    price: 0,
    mrp: 0,
    discount_pct: 0,
    shipping: 0,
    tax: 0,
    total_delivered: 0,
    delivery_date: 'Check on site',
    stock_status: 'Check Site',
    trust_score: trustScore,
    is_official: true,
    coupons: [],
    return_days: returnDays,
    warranty: '-',
    seller_name: sellerName,
    productName: query,
    image: '',
  };
}

export function createSearchOnlyRetailer({
  retailer,
  logoInitial,
  color,
  url,
  trustScore,
  sellerName,
  returnDays,
  query,
}) {
  return {
    ...createFallbackRetailer({
      retailer,
      logoInitial,
      color,
      url,
      trustScore,
      sellerName,
      returnDays,
      query,
    }),
    search_only: true,
  };
}

export function normalizeProductUrl(baseUrl, href) {
  try {
    const url = new URL(href, baseUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return href || baseUrl;
  }
}

export function normalizeImageUrl(baseUrl, src) {
  if (!src) return '';
  if (src.startsWith('//')) return `https:${src}`;
  return normalizeProductUrl(baseUrl, src);
}

export async function retryScrape(task, options = {}) {
  const { attempts = 1, delayMs = 0 } = options;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/** Small delay helper to be polite to servers (1-3 s). */
export function politeDelay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Variant-differentiating keywords that produce a different model when appended to a base name.
// If the title contains one of these but the query does NOT, the result is a variant → reject.
const VARIANT_SUFFIXES = [
  'pro max', 'pro', 'plus', 'ultra', 'max', 'mini', 'lite',
  'fe', 'edge', 'fold', 'flip', 'air', 'neo',
];

const ACCESSORY_KEYWORDS = [
  'case', 'cover', 'back cover', 'phone cover', 'bumper', 'screen guard',
  'tempered glass', 'protector', 'charger', 'adapter', 'cable', 'usb c cable',
  'wireless charger', 'power bank', 'skin', 'pouch', 'wallet case', 'magsafe case',
  'lens protector', 'camera protector', 'stand', 'holder', 'mount', 'tripod',
  'earbuds', 'headphones', 'neckband', 'speaker',
];

function includesPhrase(text, phrase) {
  return text.includes(phrase);
}

/**
 * Returns true when a scraped product name is relevant to the search query.
 * Prevents cases where a scraper returns a completely unrelated product
 * (e.g. "GRIPP" when searching for "iphone 15") OR a variant model
 * (e.g. "iPhone 15 Pro Max" when searching for "iphone 15").
 */
export function isRelevantProduct(productName, query) {
  if (!productName || !query) return false;
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleNorm = normalize(productName);
  const queryNorm = normalize(query);
  const queryTokens = queryNorm.split(' ').filter(t => t.length >= 2);
  if (queryTokens.length === 0) return true;

  // Reject accessories unless the user explicitly searched for one.
  for (const keyword of ACCESSORY_KEYWORDS) {
    const titleHasAccessoryKeyword = includesPhrase(titleNorm, keyword);
    const queryHasAccessoryKeyword = includesPhrase(queryNorm, keyword);
    if (titleHasAccessoryKeyword && !queryHasAccessoryKeyword) return false;
  }

  const importantTokens = queryTokens.filter((token) => token.length >= 3);
  const tokensToMatch = importantTokens.length > 0 ? importantTokens : queryTokens;
  const matchedTokenCount = tokensToMatch.filter((token) => titleNorm.includes(token)).length;
  const minimumMatches = Math.max(1, Math.ceil(tokensToMatch.length * 0.7));
  if (matchedTokenCount < minimumMatches) return false;

  // Variant rejection: if the title contains a differentiating suffix that the
  // query does NOT include, this is a variant model → reject.
  for (const suffix of VARIANT_SUFFIXES) {
    const titleHasSuffix = titleNorm.includes(suffix);
    const queryHasSuffix = queryNorm.includes(suffix);
    if (titleHasSuffix && !queryHasSuffix) return false;
  }

  return true;
}
