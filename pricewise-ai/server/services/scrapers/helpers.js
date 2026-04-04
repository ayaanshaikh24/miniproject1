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
  const queryNorm = normalize(query);

  // ── 1. Accessory rejection ───────────────────────────────────────────────
  for (const keyword of ACCESSORY_KEYWORDS) {
    if (titleNorm.includes(keyword) && !queryNorm.includes(keyword)) return false;
  }

  const queryWords = queryNorm.split(' ').filter(Boolean);
  const titleWords = titleNorm.split(' ').filter(Boolean);

  if (queryWords.length === 0) return true;

  // ── 2. Token match (≥70% of query words must appear in title) ────────────
  const importantWords = queryWords.filter(w => w.length >= 3);
  const toMatch = importantWords.length > 0 ? importantWords : queryWords;
  const matchCount = toMatch.filter(w => titleNorm.includes(w)).length;
  if (matchCount < Math.max(1, Math.ceil(toMatch.length * 0.7))) return false;

  // ── 3. Numeric-token exact variant rejection ─────────────────────────────
  // For each number in the query (e.g. "17"), find the corresponding token in
  // the title. If the title token is not exactly the query number (e.g. it's
  // "17e", "17pro", "17plus" even split across words), it's a variant → reject.
  const numberTokens = queryWords.filter(w => /^\d+$/.test(w));
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

  // ── 4. Known variant suffix word rejection ───────────────────────────────
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

