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

// ── Variant / model detection ──────────────────────────────────────────
// Multi-word variant suffixes (checked as whole words/phrases).
const VARIANT_WORD_SUFFIXES = [
  'pro max', 'pro', 'plus', 'ultra', 'max', 'mini', 'lite',
  'fe', 'edge', 'fold', 'flip', 'air', 'neo', 'slim',
];

// Single-letter model suffixes (e.g. iPhone 17e, iPhone 6s, iPhone 5c).
const SINGLE_LETTER_SUFFIXES = ['e', 's', 'c', 'r', 'a'];

// Price-language patterns to strip before relevance matching.
// Important: do NOT remove plain model numbers (e.g. "iphone 17").
const PRICE_COMPARISON_PATTERN = /\b(?:under|below|above|over|within|upto|up\s*to|less\s*than|more\s*than|around|approx(?:imately)?)\s*(?:rs\.?|inr|₹)?\s*\d[\d,]*(?:\.\d+)?(?:\s*(?:thousand|lakh|k|l))?\b/gi;
const PRICE_BUDGET_WORD_PATTERN = /\b(?:budget|price\s*range)\b/gi;
const PRICE_AMOUNT_WITH_UNIT_PATTERN = /\b\d[\d,]*(?:\.\d+)?\s*(?:thousand|lakh|k|l)\b/gi;

/**
 * Strip price-related language from a query so it can be used for
 * product-relevance matching.  E.g. "laptops under 30 thousand" → "laptops".
 */
export function stripPriceLanguage(query) {
  return (query || '')
    .replace(PRICE_COMPARISON_PATTERN, ' ')
    .replace(PRICE_BUDGET_WORD_PATTERN, ' ')
    .replace(PRICE_AMOUNT_WITH_UNIT_PATTERN, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Returns true when the query is a generic product-category search
 * (e.g. "laptop", "washing machine", "water bottle", "bicycle") rather
 * than a specific model number search (e.g. "iPhone 15", "Samsung S24").
 *
 * Heuristic: a query is generic when, after stripping price language,
 * it contains no digits and its words are all common English / category words.
 */
export function isGenericCategoryQuery(query) {
  const cleaned = stripPriceLanguage(query || '');
  // If cleaned query still has digits, it's probably a model-number search
  if (/\d/.test(cleaned)) return false;
  // If cleaned query is very short it might be a brand with a model implied
  if (cleaned.trim().length < 3) return false;
  return true;
}

/**
 * Check if `text` contains `phrase` as a whole word / phrase (not a substring
 * of another word).  Uses word splitting instead of regex to avoid escaping issues.
 */
function hasWholeWord(text, phrase) {
  // For multi-word phrases, check if they appear bounded by spaces / edges
  const padded = ' ' + text + ' ';
  return padded.includes(' ' + phrase + ' ');
}

/**
 * Check if `text` contains a number immediately followed by a single letter
 * suffix (e.g. "17e", "6s"), OR a number word followed by a standalone letter
 * word (e.g. "17 e").  Avoids false positives on words like "iphone".
 */
function hasModelLetterVariant(text, letter) {
  const chars = text;
  // Pattern 1: digit immediately followed by the letter, then space or end
  // e.g. "17e" in "apple iphone 17e 128gb"
  for (let i = 1; i < chars.length; i++) {
    if (chars[i] === letter && chars[i - 1] >= '0' && chars[i - 1] <= '9') {
      const after = i + 1;
      if (after >= chars.length || chars[after] === ' ') {
        return true;
      }
    }
  }
  // Pattern 2: standalone letter word right after a word ending in a digit
  // e.g. "17 e" in "apple iphone 17 e 128gb"
  const words = text.split(' ');
  for (let i = 1; i < words.length; i++) {
    if (words[i] === letter) {
      const prevWord = words[i - 1];
      const lastChar = prevWord[prevWord.length - 1];
      if (lastChar >= '0' && lastChar <= '9') {
        return true;
      }
    }
  }
  return false;
}

const ACCESSORY_KEYWORDS = [
  'case', 'cover', 'back cover', 'phone cover', 'bumper', 'screen guard',
  'tempered glass', 'protector', 'charger', 'adapter', 'cable', 'usb c cable',
  'wireless charger', 'power bank', 'skin', 'pouch', 'wallet case', 'magsafe case',
  'lens protector', 'camera protector', 'stand', 'holder', 'mount', 'tripod',
  'earbuds', 'headphones', 'neckband', 'speaker',
];

const PHONE_QUERY_KEYWORDS = [
  'iphone', 'samsung', 'oneplus', 'pixel', 'realme', 'redmi', 'xiaomi',
  'oppo', 'vivo', 'nothing', 'motorola', 'moto', 'mobile', 'phone', 'smartphone',
];

const PHONE_TITLE_SIGNALS = [
  'iphone', 'galaxy', 'mobile', 'smartphone', '5g', '4g', 'sim', 'dual sim',
  'android', 'ios', 'phone', 'oneplus', 'pixel', 'redmi', 'realme', 'vivo', 'oppo', 'xiaomi',
];

const NON_PHONE_CATEGORY_KEYWORDS = [
  'monitor', 'tv', 'television', 'laptop', 'notebook', 'tablet', 'pad', 'watch',
  'earbuds', 'headphones', 'speaker', 'router', 'printer', 'camera', 'refrigerator',
  'washing machine', 'air conditioner', 'microwave', 'keyboard', 'mouse',
  'full hd', 'qhd', 'uhd', 'amoled monitor', 'ips monitor', 'curved monitor',
  'inch', 'hz', 'refresh rate',
];

function isPhoneIntentQuery(queryNorm) {
  return PHONE_QUERY_KEYWORDS.some((keyword) => queryNorm.includes(keyword));
}

function looksLikePhoneTitle(titleNorm) {
  return PHONE_TITLE_SIGNALS.some((keyword) => titleNorm.includes(keyword));
}

function isStorageNumberToken(token, queryWords) {
  if (!/^\d{2,4}$/.test(token)) return false;
  const hasStorageUnit = queryWords.includes('gb') || queryWords.includes('tb') || queryWords.includes('mb');
  return hasStorageUnit;
}

const OPTIONAL_SPEC_TOKENS = new Set([
  'black', 'white', 'blue', 'green', 'red', 'pink', 'purple', 'yellow', 'gold', 'silver', 'grey', 'gray',
  'space', 'midnight', 'starlight', 'titanium', 'natural', 'desert',
  'dual', 'sim', 'esim', 'new', 'latest',
]);

function isOptionalSpecToken(token) {
  if (!token) return true;
  if (OPTIONAL_SPEC_TOKENS.has(token)) return true;
  if (token === 'gb' || token === 'tb' || token === 'mb') return true;
  // Storage / RAM-like specs are optional when matching the same model.
  if (/^\d+(?:gb|tb|mb)$/.test(token)) return true;
  // Common marketing generation/year suffixes.
  if (/^\d{4}$/.test(token)) return true;
  return false;
}

const TOKEN_ALIASES = {
  samsung: ['galaxy'],
  galaxy: ['samsung'],
  iphone: ['apple', 'ios'],
  oneplus: ['1plus'],
  xiaomi: ['mi', 'redmi'],
  mi: ['xiaomi'],
  motorola: ['moto'],
  moto: ['motorola'],
};

function tokenMatchesTitle(token, titleNorm, titleWords) {
  if (!token) return false;

  if (titleNorm.includes(token)) return true;

  // Handle model tokens like s24, a55, m35, x200 that might be split as "s 24"
  // or "s-24" after normalization.
  const modelMatch = token.match(/^([a-z]{1,4})(\d{1,4}[a-z]?)$/i);
  if (modelMatch) {
    const letters = modelMatch[1].toLowerCase();
    const digits = modelMatch[2].toLowerCase();
    if (titleNorm.includes(`${letters}${digits}`)) return true;
    if (titleNorm.includes(`${letters} ${digits}`)) return true;
    // Also allow exact adjacent tokens in title words.
    for (let i = 0; i < titleWords.length - 1; i += 1) {
      if (titleWords[i] === letters && titleWords[i + 1] === digits) return true;
    }
  }

  const aliases = TOKEN_ALIASES[token] || [];
  return aliases.some((alias) => titleNorm.includes(alias));
}

/**
 * Returns true when a scraped product name is relevant to the search query.
 *
 * Strategy:
 * 1. Must match at least 70% of the important query tokens (basic relevance).
 * 2. For every numeric token in the query (e.g. "17" in "iphone 17"), the
 *    title must NOT contain that number followed by extra letters/words that
 *    differentiate a variant (e.g. "17e", "17 pro", "17 plus").
 * 3. The title must NOT contain any known variant suffix word (pro, plus…)
 *    that the query does not include.
 * 4. Accessory keywords in the title that aren't in the query → reject.
 */
export function isRelevantProduct(productName, query) {
  if (!productName || !query) return false;

  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleNorm = normalize(productName);

  // Strip price language ("under 30 thousand", "below 500", etc.) before matching
  const cleanedQuery = stripPriceLanguage(query);
  const queryNorm = normalize(cleanedQuery || query);
  const generic = isGenericCategoryQuery(query);

  // ── 0. Query intent disambiguation ──────────────────────────────────────
  // For phone-intent queries, reject obvious non-phone categories.
  if (!generic && isPhoneIntentQuery(queryNorm)) {
    const hasNonPhoneSignal = NON_PHONE_CATEGORY_KEYWORDS.some((keyword) => titleNorm.includes(keyword) && !queryNorm.includes(keyword));
    if (hasNonPhoneSignal) return false;
  }

  // ── 1. Accessory rejection ───────────────────────────────────────────────
  if (!generic) {
    for (const keyword of ACCESSORY_KEYWORDS) {
      if (titleNorm.includes(keyword) && !queryNorm.includes(keyword)) return false;
    }
  }

  const queryWords = queryNorm.split(' ').filter(Boolean);
  const titleWords = titleNorm.split(' ').filter(Boolean);

  if (queryWords.length === 0) return true;

  // For generic category searches, only do a simple token-presence check.
  // Skip numeric and variant-suffix rejection — the user is browsing a
  // category, not looking for an exact model.
  if (generic) {
    // Synonym expansion — so "bag" also matches "backpack", etc.
    const SYNONYMS = {
      'bag': ['backpack', 'rucksack', 'briefcase', 'satchel', 'tote', 'pack', 'sling'],
      'backpack': ['bag', 'rucksack', 'pack'],
      'shoes': ['sneakers', 'footwear', 'trainers', 'joggers', 'shoe'],
      'shoe': ['sneakers', 'footwear', 'trainers', 'joggers', 'shoes'],
      'bottle': ['flask', 'sipper', 'tumbler'],
      'fan': ['cooler', 'blower'],
      'tv': ['television', 'smart tv', 'led tv'],
      'ac': ['air conditioner', 'airconditioner'],
      'fridge': ['refrigerator'],
      'refrigerator': ['fridge'],
      'cycle': ['bicycle', 'bike'],
      'bicycle': ['cycle', 'bike'],
      'bike': ['bicycle', 'cycle'],
      'earbuds': ['earphones', 'tws'],
      'headphones': ['headphone', 'headset'],
      'watch': ['smartwatch', 'timepiece'],
      'charger': ['charging', 'adapter'],
      'mouse': ['mice'],
    };

    const importantWords = queryWords.filter(w => w.length >= 3);
    const toMatch = importantWords.length > 0 ? importantWords : queryWords;

    // For each query token, also accept its synonyms in the title
    const matchCount = toMatch.filter(w => {
      if (titleNorm.includes(w)) return true;
      const syns = SYNONYMS[w] || [];
      return syns.some(syn => titleNorm.includes(syn));
    }).length;

    // Accept if at least 1 important keyword (or synonym) matches
    return matchCount >= 1;
  }

  // ── Model-specific search from here ─────────────────────────────────────

  // If query contains model numbers (e.g. "15" in "iphone 15"),
  // they must be present in the title to avoid generic category pages.
  const numberTokens = queryWords.filter(w => /^\d+$/.test(w));
  for (const num of numberTokens) {
    if (!titleWords.includes(num)) return false;
  }

  // ── 2. Strict core-token match for specific queries ────────────────────────
  // For model searches, every important core token must be present.
  // Optional specs (colors/storage/marketing words) are excluded from required set.
  const coreTokens = queryWords.filter((w) => w.length >= 2 && !isOptionalSpecToken(w) && !isStorageNumberToken(w, queryWords));
  const requiredTokens = coreTokens.length > 0 ? coreTokens : queryWords.filter((w) => w.length >= 2);
  if (requiredTokens.length > 0) {
    const missingCore = requiredTokens.some((w) => !tokenMatchesTitle(w, titleNorm, titleWords));
    if (missingCore) return false;
  }

  // ── 3. Fallback token match (legacy safety) ───────────────────────────────
  const importantWords = queryWords.filter(w => w.length >= 3);
  const toMatch = importantWords.length > 0 ? importantWords : queryWords;
  const matchCount = toMatch.filter(w => titleNorm.includes(w)).length;
  if (matchCount < Math.max(1, Math.ceil(toMatch.length * 0.7))) return false;

  // ── 4. Numeric-token exact variant rejection ─────────────────────────────
  // For each number in the query (e.g. "17"), find the corresponding token in
  // the title. If the title token is not exactly the query number (e.g. it's
  // "17e", "17pro", "17plus" even split across words), it's a variant → reject.
  for (const num of numberTokens) {
    // Find a title word that starts with this number
    const titleToken = titleWords.find(w => w.startsWith(num));
    if (titleToken && titleToken !== num) {
      // The title has "17e", "17pro" etc. but query only has "17" → reject
      return false;
    }
    // Also check: query has "17" but title has "17 e" (next word is a single letter after num)
    const numIdx = titleWords.indexOf(num);
    if (numIdx !== -1 && numIdx + 1 < titleWords.length) {
      const nextWord = titleWords[numIdx + 1];
      if (nextWord.length === 1 && /[a-z]/.test(nextWord)) {
        // e.g. "17 e" or "17 s" — single letter suffix as separate word
        return false;
      }
    }
  }

  // ── 5. Known variant suffix word rejection ───────────────────────────────
  for (const suffix of VARIANT_WORD_SUFFIXES) {
    const suffixWords = suffix.split(' ');
    // Check if ALL words of the suffix appear consecutively in titleWords
    const inTitle = titleWords.some((_, i) =>
      suffixWords.every((sw, j) => titleWords[i + j] === sw)
    );
    const inQuery = queryWords.some((_, i) =>
      suffixWords.every((sw, j) => queryWords[i + j] === sw)
    );
    if (inTitle && !inQuery) return false;
  }

  return true;
}

