import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { scrapeAmazon } from './services/scrapers/amazon.js';
import { scrapeFlipkart } from './services/scrapers/flipkart.js';
import { scrapeCroma } from './services/scrapers/croma.js';
import { scrapeRelianceDigital } from './services/scrapers/relianceDigital.js';
import { scrapeJioMart } from './services/scrapers/jiomart.js';
import { scrapeVijaySales } from './services/scrapers/vijaySales.js';
import { scrapeTataCliq } from './services/scrapers/tataCliq.js';
import { isRelevantProduct } from './services/scrapers/helpers.js';
import { searchSiteProductUrl } from './services/scrapers/siteSearch.js';
import { withRetailerPage } from './services/scrapers/browser.js';
import { getCachedResult, setCachedResult } from './services/cache.js';
import { savePriceSnapshots, getPriceHistory } from './services/priceHistory.js';
import { createAlert, getAlerts, deleteAlert } from './services/priceAlerts.js';
import { fetchProductReviews } from './services/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;
const redirectTargets = new Map();
const immersiveStoreCache = new Map();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:4173'] }));
app.use(express.json());

const HIGH_TRUST_RETAILERS = new Set([
  'amazon',
  'amazon.in',
  'flipkart',
  'flipkart.com',
  'croma',
  'croma.com',
  'reliance digital',
  'reliancedigital.in',
  'jiomart',
  'jiomart.com',
  'vijay sales',
  'vijaysales.com',
  'tata cliq',
  'tatacliq.com',
  // Official brand stores
  'apple',
  'apple.com',
  'apple store',
  'apple store india',
  'samsung',
  'samsung.com',
  'samsung shop',
  'samsung india',
  'mi store',
  'mi.com',
  'xiaomi',
  'xiaomi.com',
  'oneplus',
  'oneplus.in',
  'oneplus store',
]);

const MEDIUM_TRUST_RETAILERS = new Set([
  'imagine apple premium reseller',
  'invent - apple premium reseller',
  'invent apple premium reseller',
  'invent store',
  // Established regional chains
  'poorvika',
  'poorvika.com',
  'poorvika mobiles',
  'sangeetha',
  'sangeethashop',
  'sangeethashop.com',
  'sangeetha mobiles',
  'tata neu',
  'tataneu',
  'tataneu.com',
  'bajaj finserv markets',
  'bajajfinservmarkets',
  'bajajfinservmarkets.in',
  'bajaj markets x ondc',
  'paytm mall',
  'paytmmall',
  'paytmmall.com',
  'lot mobiles',
  'lotmobiles',
  'lotmobiles.com',
  'cellecor',
  'unicorn infosolutions',
  'unicorn store',
  'aptronix',
  // Major Indian e-commerce platforms
  'nykaa',
  'nykaa.com',
  'myntra',
  'myntra.com',
  'snapdeal',
  'snapdeal.com',
  'meesho',
  'meesho.com',
  'shopclues',
  'shopclues.com',
  'pepperfry',
  'pepperfry.com',
  'bigbasket',
  'bigbasket.com',
  'blinkit',
  'blinkit.com',
  'ajio',
  'ajio.com',
  'lenskart',
  'lenskart.com',
  'nykaa fashion',
  'nykaa beauty',
]);

const TRUSTED_RETAILER_DOMAINS = [
  'amazon.in',
  'amazon.com',
  'flipkart.com',
  'croma.com',
  'reliancedigital.in',
  'jiomart.com',
  'vijaysales.com',
  'tatacliq.com',
  'tataneu.com',
  'apple.com',
  'samsung.com',
  'oneplus.in',
  'mi.com',
  'xiaomi.com',
  'poorvika.com',
  'sangeethashop.com',
  'lotmobiles.com',
  'bajajfinservmarkets.in',
  'paytmmall.com',
  'nykaa.com',
  'myntra.com',
  'bigbasket.com',
  'snapdeal.com',
  'meesho.com',
  'shopclues.com',
  'pepperfry.com',
  'blinkit.com',
  'ajio.com',
  'lenskart.com',
];

// Denylist: known scam/fake/grey-market sellers – these are BLOCKED regardless of trust score
const BLOCKED_RETAILERS = new Set([
  'ovantica',
  'easyphones',
  'grest',
  'cliktodeal',
  'oldsold',
  'control z',
  'cashify',
  'budli',
  'togofogo',
  'togofonics',
  'greendust',
  'yaantra',
  'overcart',
  'gorefurb',
  'recell',
  'reglobe',
  'refurb king',
  'second hand bazar',
]);

// Patterns in the listing TITLE that indicate a fake/grey-market listing
const FAKE_LISTING_KEYWORDS = /(refurbished|renewed|open box|open-box|pre-owned|preowned|second hand|second-hand|fair grade|good grade|superb grade|like-new|certified refurbished|professionally inspected|tested & verified)/i;

function clampScore(score) {
  return Math.max(20, Math.min(99, Math.round(score)));
}

function normalizeStoreName(value) {
  return (value || '')
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.com$|\.in$/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hostFromUrl(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function urlMatchesTrustedRetailerDomain(value) {
  const host = hostFromUrl(value);
  if (!host) return false;
  return TRUSTED_RETAILER_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function isKnownTrustedRetailer(store, url) {
  const normalizedStore = normalizeStoreName(store);
  return HIGH_TRUST_RETAILERS.has(normalizedStore)
    || MEDIUM_TRUST_RETAILERS.has(normalizedStore)
    || urlMatchesTrustedRetailerDomain(url);
}

const OFFICIAL_RECOVERY_TARGETS = [
  {
    retailer: 'Flipkart',
    site: 'www.flipkart.com',
    trust: 92,
    serpapiStoreAliases: ['flipkart', 'flipkart.com'],
    retailerHint: 'flipkart',
  },
  {
    retailer: 'Croma',
    site: 'www.croma.com',
    trust: 88,
    serpapiStoreAliases: ['croma', 'croma.com'],
    retailerHint: 'croma',
  },
  {
    retailer: 'Reliance Digital',
    site: 'www.reliancedigital.in',
    trust: 88,
    serpapiStoreAliases: ['reliance digital', 'reliancedigital.in'],
    retailerHint: 'reliance digital',
  },
  {
    retailer: 'JioMart',
    site: 'www.jiomart.com',
    trust: 85,
    serpapiStoreAliases: ['jiomart', 'jiomart.com'],
    retailerHint: 'jiomart',
  },
  {
    retailer: 'Amazon',
    site: 'www.amazon.in',
    trust: 92,
    serpapiStoreAliases: ['amazon', 'amazon.in'],
    retailerHint: 'amazon',
  },
  {
    retailer: 'Tata Cliq',
    site: 'www.tatacliq.com',
    trust: 89,
    serpapiStoreAliases: ['tata cliq', 'tatacliq.com'],
    retailerHint: 'tata cliq',
  },
  {
    retailer: 'Vijay Sales',
    site: 'www.vijaysales.com',
    trust: 90,
    serpapiStoreAliases: ['vijay sales', 'vijaysales.com'],
    retailerHint: 'vijay sales',
  },
  {
    retailer: 'Snapdeal',
    site: 'www.snapdeal.com',
    trust: 78,
    serpapiStoreAliases: ['snapdeal', 'snapdeal.com'],
    retailerHint: 'snapdeal',
  },
  {
    retailer: 'Meesho',
    site: 'www.meesho.com',
    trust: 75,
    serpapiStoreAliases: ['meesho', 'meesho.com'],
    retailerHint: 'meesho',
  },
  {
    retailer: 'Nykaa',
    site: 'www.nykaa.com',
    trust: 80,
    serpapiStoreAliases: ['nykaa', 'nykaa.com', 'nykaa fashion', 'nykaa beauty'],
    retailerHint: 'nykaa',
  },
  {
    retailer: 'Myntra',
    site: 'www.myntra.com',
    trust: 80,
    serpapiStoreAliases: ['myntra', 'myntra.com'],
    retailerHint: 'myntra',
  },
  {
    retailer: 'ShopClues',
    site: 'www.shopclues.com',
    trust: 72,
    serpapiStoreAliases: ['shopclues', 'shopclues.com'],
    retailerHint: 'shopclues',
  },
  {
    retailer: 'Tata Neu',
    site: 'www.tataneu.com',
    trust: 86,
    serpapiStoreAliases: ['tata neu', 'tataneu', 'tataneu.com'],
    retailerHint: 'tata neu',
  },
  {
    retailer: 'Bajaj Finserv Markets',
    site: 'www.bajajfinservmarkets.in',
    trust: 82,
    serpapiStoreAliases: ['bajaj finserv markets', 'bajajfinservmarkets.in', 'bajaj markets x ondc'],
    retailerHint: 'bajaj finserv markets',
  },
];

const CORE_RETAILER_TARGETS = [
  {
    retailer: 'Amazon',
    site: 'www.amazon.in',
    trust: 92,
    searchUrl: 'https://www.amazon.in/s?k={query}',
  },
  {
    retailer: 'Flipkart',
    site: 'www.flipkart.com',
    trust: 92,
    searchUrl: 'https://www.flipkart.com/search?q={query}',
  },
  {
    retailer: 'Croma',
    site: 'www.croma.com',
    trust: 88,
    searchUrl: 'https://www.croma.com/searchB?q={query}%3Arelevance',
  },
  {
    retailer: 'Reliance Digital',
    site: 'www.reliancedigital.in',
    trust: 88,
    searchUrl: 'https://www.reliancedigital.in/search?q={query}',
  },
  {
    retailer: 'JioMart',
    site: 'www.jiomart.com',
    trust: 85,
    searchUrl: 'https://www.jiomart.com/search/{query}',
  },
  {
    retailer: 'Vijay Sales',
    site: 'www.vijaysales.com',
    trust: 90,
    searchUrl: 'https://www.vijaysales.com/search/{query}',
  },
  {
    retailer: 'Tata Cliq',
    site: 'www.tatacliq.com',
    trust: 89,
    searchUrl: 'https://www.tatacliq.com/search/?searchCategory=all&text={query}',
  },
  {
    retailer: 'Snapdeal',
    site: 'www.snapdeal.com',
    trust: 78,
    searchUrl: 'https://www.snapdeal.com/search?keyword={query}',
  },
  {
    retailer: 'Meesho',
    site: 'www.meesho.com',
    trust: 75,
    searchUrl: 'https://www.meesho.com/search?q={query}',
  },
  {
    retailer: 'Nykaa',
    site: 'www.nykaa.com',
    trust: 80,
    searchUrl: 'https://www.nykaa.com/search/result/?q={query}',
  },
  {
    retailer: 'Myntra',
    site: 'www.myntra.com',
    trust: 80,
    searchUrl: 'https://www.myntra.com/{query}',
  },
  {
    retailer: 'Tata Neu',
    site: 'www.tataneu.com',
    trust: 86,
    searchUrl: 'https://www.tataneu.com/search?q={query}',
  },
  {
    retailer: 'Bajaj Finserv Markets',
    site: 'www.bajajfinservmarkets.in',
    trust: 82,
    searchUrl: 'https://www.bajajfinservmarkets.in/search?q={query}',
  },
];

const MAIN_SERPAPI_TIMEOUT_MS = 15000;
const SCRAPER_TIMEOUT_MS = 12000;
const RECOVERY_TIMEOUT_MS = 12000;

async function withTimeout(task, timeoutMs, fallbackValue = null) {
  return await Promise.race([
    Promise.resolve().then(task),
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOfficialSerpapiFallback({ query, target, apiKey }) {
  try {
    const hintQuery = `${query} ${target.retailerHint || target.retailer}`.trim();
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(hintQuery)}&api_key=${apiKey}&gl=in&hl=en`;
    const data = await fetchJsonWithTimeout(url, RECOVERY_TIMEOUT_MS);

    const candidates = [
      ...(Array.isArray(data.shopping_results) ? data.shopping_results : []),
      ...(Array.isArray(data.inline_shopping_results) ? data.inline_shopping_results : []),
    ];

    const targetStores = new Set((target.serpapiStoreAliases || []).map((store) => normalizeStoreName(store)));
    const picked = candidates.find((item) => {
      const storeNormalized = normalizeStoreName(item.source || '');
      const hasMatchingStore = targetStores.has(storeNormalized);
      const hasPrice = Number(item.extracted_price) > 0 || Number.parseFloat(String(item.price || '').replace(/[^0-9.]/g, '')) > 0;
      const title = item.title || query;
      return hasMatchingStore && hasPrice && isRelevantProduct(title, query) && !isLowQualityListing(title);
    });

    if (!picked) return null;

    const extractedPrice = Number(picked.extracted_price) || Number.parseFloat(String(picked.price || '').replace(/[^0-9.]/g, '')) || 0;
    if (!extractedPrice) return null;

    const redirectUrl = rememberRedirectTarget({
      store: picked.source || target.retailer,
      price: extractedPrice,
      directUrl: picked.link || picked.product_link || '',
      immersiveApiUrl: picked.serpapi_immersive_product_api || '',
    });

    return createRetailerEntry({
      name: picked.title || query,
      price: extractedPrice,
      store: picked.source || target.retailer,
      rating: Number(picked.rating) || 0,
      reviews: Number(picked.reviews) || 0,
      url: redirectUrl,
      image: picked.thumbnail || '',
      source: 'serpapi',
    });
  } catch {
    return null;
  }
}

function extractOrganicPrice(result) {
  const richPrice = Number(result?.rich_snippet?.top?.detected_extensions?.price) || 0;
  if (richPrice >= 500) return richPrice;

  const textCandidates = [
    result?.snippet,
    result?.title,
    ...(Array.isArray(result?.rich_snippet?.top?.extensions) ? result.rich_snippet.top.extensions : []),
  ].filter(Boolean);

  for (const text of textCandidates) {
    const match = String(text).match(/(?:₹|Rs\.?|INR)\s?([0-9,]+(?:\.\d+)?)/i);
    if (!match) continue;
    const parsed = Number.parseFloat(match[1].replace(/,/g, '')) || 0;
    if (parsed >= 500) return parsed;
  }

  return 0;
}

async function fetchOfficialOrganicFallback({ query, target, apiKey }) {
  try {
    const organicQuery = `site:${target.site} ${query}`;
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(organicQuery)}&api_key=${apiKey}&gl=in&hl=en`;
    const data = await fetchJsonWithTimeout(url, RECOVERY_TIMEOUT_MS);
    const organicResults = Array.isArray(data.organic_results) ? data.organic_results : [];

    const picked = organicResults.find((item) => {
      const link = String(item.link || '');
      const title = item.title || query;
      const extractedPrice = extractOrganicPrice(item);
      return link.includes(target.site)
        && extractedPrice > 0
        && isRelevantProduct(title, query)
        && !isLowQualityListing(title);
    });

    if (!picked) return null;

    const extractedPrice = extractOrganicPrice(picked);
    if (!extractedPrice) return null;

    const rating = Number(picked?.rich_snippet?.top?.detected_extensions?.rating) || 0;
    const reviews = Number(picked?.rich_snippet?.top?.detected_extensions?.reviews) || 0;
    const redirectUrl = rememberRedirectTarget({
      store: target.retailer,
      name: picked.title || query,
      query,
      price: extractedPrice,
      directUrl: picked.link || '',
      immersiveApiUrl: '',
    });

    return createRetailerEntry({
      name: picked.title || query,
      price: extractedPrice,
      store: target.retailer,
      rating,
      reviews,
      url: redirectUrl,
      image: '',
      source: 'serpapi',
    });
  } catch {
    return null;
  }
}

async function scrapeOfficialSiteRecovery({ query, retailer, site, trust }) {
  const fallbackSearchUrlBySite = {
    'www.amazon.in': `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
    'www.tatacliq.com': `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`,
    'www.vijaysales.com': `https://www.vijaysales.com/search/${encodeURIComponent(query)}`,
  };

  const buildSearchOnly = () => ({
    retailer,
    logo_initial: retailer[0],
    color: '#111111',
    url: fallbackSearchUrlBySite[site] || `https://${site}`,
    price: 0,
    mrp: 0,
    discount_pct: 0,
    shipping: 0,
    tax: 0,
    total_delivered: 0,
    delivery_date: 'Check on site',
    stock_status: 'Check Site',
    trust_score: trust,
    is_official: true,
    coupons: [],
    return_days: 7,
    warranty: 'Brand Warranty',
    seller_name: retailer,
    rating: 0,
    review_count: 0,
    productName: query,
    image: '',
    search_only: true,
  });

  try {
    const productUrl = await searchSiteProductUrl({ site, query });
    if (!productUrl) return buildSearchOnly();

    const product = await withRetailerPage(productUrl, async (page) => {
      await page.waitForTimeout(700);

      return await page.evaluate(() => {
        const parseMoneyInPage = (value = '') => {
          const cleaned = String(value).replace(/[^0-9]/g, '');
          const amount = Number(cleaned);
          return Number.isFinite(amount) ? amount : 0;
        };

        const title =
          document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
          document.querySelector('h1')?.textContent?.trim() ||
          document.title?.replace(/\s*\|.*$/, '').trim() ||
          '';

        const image =
          document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
          document.querySelector('img[src]')?.getAttribute('src') ||
          '';

        let jsonLdPrice = 0;
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const script of scripts) {
          try {
            const parsed = JSON.parse(script.textContent || '{}');
            const walk = (obj) => {
              if (!obj || typeof obj !== 'object') return 0;
              if (Array.isArray(obj)) {
                for (const e of obj) {
                  const f = walk(e);
                  if (f > 0) return f;
                }
                return 0;
              }
              if (obj.offers) {
                const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
                for (const offer of offers) {
                  const direct = parseMoneyInPage(offer?.price);
                  if (direct > 0) return direct;
                  const nested = parseMoneyInPage(offer?.priceSpecification?.price);
                  if (nested > 0) return nested;
                }
              }
              for (const v of Object.values(obj)) {
                const f = walk(v);
                if (f > 0) return f;
              }
              return 0;
            };
            jsonLdPrice = walk(parsed);
            if (jsonLdPrice > 0) break;
          } catch {
            // ignore invalid json-ld blocks
          }
        }

        const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
        const regexMatches = Array.from(bodyText.matchAll(/(?:₹|Rs\.?|INR)\s?[0-9,]{3,}/gi));
        const regexPrice = regexMatches.length > 0 ? parseMoneyInPage(regexMatches[0][0]) : 0;

        return {
          title,
          image,
          price: jsonLdPrice || regexPrice || 0,
        };
      });
    });

    const recoveredName = product?.title || query;
    if (!isRelevantProduct(recoveredName, query) || isLowQualityListing(recoveredName)) {
      return null;
    }

    const hasPrice = typeof product?.price === 'number' && product.price > 0;

    return {
      retailer,
      logo_initial: retailer[0],
      color: '#111111',
      url: productUrl,
      price: hasPrice ? product.price : 0,
      mrp: hasPrice ? product.price : 0,
      discount_pct: 0,
      shipping: 0,
      tax: 0,
      total_delivered: hasPrice ? product.price : 0,
      delivery_date: 'Check on site',
      stock_status: hasPrice ? 'In Stock' : 'Check Site',
      trust_score: trust,
      is_official: true,
      coupons: [],
      return_days: 7,
      warranty: 'Brand Warranty',
      seller_name: retailer,
      rating: 0,
      review_count: 0,
      productName: recoveredName,
      image: product.image || '',
      search_only: !hasPrice,
    };
  } catch {
    return buildSearchOnly();
  }
}

function cleanMerchantUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    const blockedParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'srsltid',
    ];
    blockedParams.forEach((param) => url.searchParams.delete(param));
    return url.toString();
  } catch {
    return value;
  }
}

function isBlockedRetailer(store) {
  const normalizedStore = normalizeStoreName(store);
  return BLOCKED_RETAILERS.has(normalizedStore);
}

function isLowQualityListing(name = '') {
  return FAKE_LISTING_KEYWORDS.test(name);
}

function dedupeRetailers(retailers) {
  const seen = new Set();
  return retailers.filter((retailer) => {
    const key = `${normalizeStoreName(retailer.store)}|${Math.round(Number(retailer.price) || 0)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getTrustLabel(score) {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Medium';
  return 'Low';
}

function buildRetailerSearchUrl(template, query) {
  const encodedQuery = encodeURIComponent(query || '').replace(/%20/g, '+');
  return String(template || '').replace('{query}', encodedQuery);
}

function computeTrustFactor({ store, url, rating, reviews, source, name, returnDays = 0, isOfficialStore = false }) {
  // ── Weighted Trust Score (never hardcoded) ──
  // Seller Rating: 40% (0-40)
  const ratingScore = rating >= 4.5 ? 40 : rating >= 4 ? 32 : rating >= 3.5 ? 24 : rating >= 3 ? 16 : rating > 0 ? 8 : 20;
  // Review Count: 20% (0-20)
  const reviewScore = reviews >= 10000 ? 20 : reviews >= 1000 ? 16 : reviews >= 100 ? 12 : reviews >= 10 ? 8 : reviews > 0 ? 4 : 10;
  // Return Policy: 20% (0-20)
  const returnScore = returnDays >= 30 ? 20 : returnDays >= 14 ? 16 : returnDays >= 7 ? 12 : returnDays > 0 ? 8 : isKnownTrustedRetailer(store, url) ? 14 : 4;
  // Official Store: 20% (0-20)
  const ns = normalizeStoreName(store);
  const officialScore = isOfficialStore ? 20 : HIGH_TRUST_RETAILERS.has(ns) ? 18 : MEDIUM_TRUST_RETAILERS.has(ns) ? 14 : urlMatchesTrustedRetailerDomain(url) ? 12 : 4;
  // Penalties
  let penalty = 0;
  if (ns.includes('unknown')) penalty += 15;
  if (ns.includes('sponsored')) penalty += 10;
  if (BLOCKED_RETAILERS.has(ns)) penalty += 40;
  if (FAKE_LISTING_KEYWORDS.test(name || '')) penalty += 20;
  return clampScore(ratingScore + reviewScore + returnScore + officialScore - penalty);
}

function createRetailerEntry({ name, price, store, rating, reviews, url, image, source, searchOnly = false, unavailableReason = '', stockStatus = 'Check Site', deliveryDate = 'Check on site', sellerName = '', isOfficialStore = false, couponText = '', returnDays = 0 }) {
  const resolvedSeller = sellerName || store || 'Unknown';
  const resolvedOfficial = isOfficialStore || HIGH_TRUST_RETAILERS.has(normalizeStoreName(store));
  const trustScore = computeTrustFactor({ store, url, rating, reviews, source, name, returnDays, isOfficialStore: resolvedOfficial });
  return {
    name, price, store, rating, reviews, url, image, source, trustScore,
    trustLabel: getTrustLabel(trustScore),
    searchOnly, unavailableReason,
    stockStatus: stockStatus || 'Check Site',
    deliveryDate: deliveryDate || 'Check on site',
    sellerName: resolvedSeller,
    isOfficialStore: resolvedOfficial,
    couponText: couponText || '',
    returnDays: returnDays || 0,
  };
}

function createUnavailableRetailerEntry({ retailer, searchUrl, query, trust, reason }) {
  const resolvedUrl = buildRetailerSearchUrl(searchUrl, query);
  const trustScore = clampScore(trust || computeTrustFactor({
    store: retailer,
    url: resolvedUrl,
    rating: 0,
    reviews: 0,
    source: 'placeholder',
    name: query,
  }));

  return {
    name: query,
    price: null,
    store: retailer,
    rating: 0,
    reviews: 0,
    url: resolvedUrl,
    image: '',
    source: 'placeholder',
    trustScore,
    trustLabel: getTrustLabel(trustScore),
    searchOnly: true,
    unavailableReason: reason || 'Live price unavailable right now',
  };
}

function rememberRedirectTarget(target) {
  const id = randomUUID();
  redirectTargets.set(id, target);
  if (redirectTargets.size > 1000) {
    const oldestKey = redirectTargets.keys().next().value;
    redirectTargets.delete(oldestKey);
  }
  return `/api/redirect/${id}`;
}

function buildRedirectFallbackUrl(target) {
  // Build a useful search query: prefer product name/query over bare store name
  const productTerm = (target?.name || target?.query || '').trim();
  const storeTerm = (target?.store || '').trim();
  const terms = [productTerm, storeTerm].filter(Boolean).join(' ').trim();
  const searchQ = terms || 'smartphone deals india';
  return `https://www.google.com/search?q=${encodeURIComponent(searchQ)}`;
}

async function isLikelyReachableDestination(url) {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    // 405 Method Not Allowed and 403 are still often valid for browser navigation.
    if (response.status === 405 || response.status === 403) return true;
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function getImmersiveStores(immersiveApiUrl, apiKey) {
  if (!immersiveApiUrl) return [];
  if (immersiveStoreCache.has(immersiveApiUrl)) {
    return immersiveStoreCache.get(immersiveApiUrl);
  }

  const requestUrl = `${immersiveApiUrl}${immersiveApiUrl.includes('?') ? '&' : '?'}api_key=${apiKey}`;
  const promise = (async () => {
    const response = await fetch(requestUrl);
    const data = await response.json();
    return data?.product_results?.stores || [];
  })();

  immersiveStoreCache.set(immersiveApiUrl, promise);
  return promise;
}

async function resolveDirectMerchantUrl(target, apiKey) {
  if (!target) return '';

  // Helper: if the URL belongs to a known trusted retailer, trust it directly
  // (don't do a server-side HEAD check — Indian e-commerce sites block these).
  function resolveWithTrust(url) {
    const cleaned = cleanMerchantUrl(url || '');
    if (!cleaned) return buildRedirectFallbackUrl(target);
    if (isKnownTrustedRetailer(target.store, cleaned)) return cleaned;
    // For unknown stores fall back to Google search
    return buildRedirectFallbackUrl(target);
  }

  if (target.directUrl && !target.directUrl.includes('google.com/search?ibp=oshop')) {
    return resolveWithTrust(target.directUrl);
  }

  if (!target.immersiveApiUrl) {
    return resolveWithTrust(target.directUrl || '');
  }

  try {
    const stores = await getImmersiveStores(target.immersiveApiUrl, apiKey);
    const targetStore = normalizeStoreName(target.store);
    const targetPrice = Number(target.price) || 0;

    const exactStore = stores.filter((entry) => normalizeStoreName(entry.name) === targetStore);
    const candidates = exactStore.length > 0 ? exactStore : stores.filter((entry) => normalizeStoreName(entry.name).includes(targetStore) || targetStore.includes(normalizeStoreName(entry.name)));

    if (candidates.length === 0) {
      return resolveWithTrust(target.directUrl || '');
    }

    const ranked = candidates.sort((a, b) => {
      const priceDiffA = Math.abs((a.extracted_total || a.extracted_price || 0) - targetPrice);
      const priceDiffB = Math.abs((b.extracted_total || b.extracted_price || 0) - targetPrice);
      return priceDiffA - priceDiffB;
    });

    return resolveWithTrust(ranked[0]?.link || target.directUrl || '');
  } catch (error) {
    console.warn('[redirect] failed to resolve merchant URL:', error.message);
    return resolveWithTrust(target.directUrl || '');
  }
}

/** Convert a Playwright scraper result to the frontend's retailer shape */
function normalizeScraperResult(result) {
  if (!result) return null;
  const hasNumericPrice = typeof result.price === 'number' && result.price > 0;
  if (!hasNumericPrice && !result.search_only) return null;
  return createRetailerEntry({
    name: result.productName || '',
    price: hasNumericPrice ? result.price : null,
    store: result.retailer || 'Unknown',
    rating: result.rating || 0,
    reviews: result.review_count || 0,
    url: result.url || '',
    image: result.image || '',
    source: 'scraper',
    searchOnly: Boolean(result.search_only) || !hasNumericPrice,
    unavailableReason: !hasNumericPrice ? 'Live price unavailable right now' : '',
    stockStatus: result.stock_status || (hasNumericPrice ? 'In Stock' : 'Check Site'),
    deliveryDate: result.delivery_date || 'Check on site',
    sellerName: result.seller_name || result.retailer || 'Unknown',
    isOfficialStore: Boolean(result.is_official),
    couponText: Array.isArray(result.coupons) ? result.coupons.join(', ') : (result.coupons || ''),
    returnDays: result.return_days || 0,
  });
}

// ─── /api/search?q=iphone+13 ───────────────────────────────
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

  // Allow ?fresh=1 to bypass cache
  const bypassCache = req.query.fresh === '1';

  const cachedPayload = bypassCache ? null : await getCachedResult(query);
  if (cachedPayload) {
    return res.json(cachedPayload);
  }


  const API_KEY = process.env.SERPAPI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'System configuration error: SERPAPI_API_KEY is missing' });
  }

  console.log(`[search] "${query}" — fetching SerpAPI + scrapers in parallel...`);

  // Pre-start SerpAPI recovery for ALL official retailer targets immediately.
  // These run in the background while scrapers also run, so if scrapers fail
  // (due to anti-bot/CAPTCHA), SerpAPI results are already available.
  const prestartRecoveryPromise = Promise.allSettled(
    OFFICIAL_RECOVERY_TARGETS.map((target) =>
      withTimeout(
        () => fetchOfficialSerpapiFallback({ query, target, apiKey: API_KEY }),
        RECOVERY_TIMEOUT_MS,
        null,
      )
    )
  );

  const scraperTasks = [
    ['Amazon', scrapeAmazon(query)],
    ['Flipkart', scrapeFlipkart(query)],
    ['Croma', scrapeCroma(query)],
    ['Reliance Digital', scrapeRelianceDigital(query)],
    ['JioMart', scrapeJioMart(query)],
    ['Vijay Sales', scrapeVijaySales(query)],
    ['Tata Cliq', scrapeTataCliq(query)],
  ];

  const [serpResult, ...scraperResults] = await Promise.allSettled([
    withTimeout(async () => {
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${API_KEY}&gl=in&hl=en&num=40`;
      return await fetchJsonWithTimeout(url, MAIN_SERPAPI_TIMEOUT_MS);
    }, MAIN_SERPAPI_TIMEOUT_MS, {}),
    ...scraperTasks.map(([name, task]) => withTimeout(() => task.catch((err) => {
      console.warn(`[${name.toLowerCase()}] scrape error:`, err.message);
      return null;
    }), SCRAPER_TIMEOUT_MS, null)),
  ]);

  try {
    const retailers = [];

    scraperResults.forEach((result, index) => {
      const [scraperName] = scraperTasks[index];
      if (result.status === 'fulfilled' && result.value) {
        const normalized = normalizeScraperResult(result.value);
        if (normalized && !isLowQualityListing(normalized.name) && isRelevantProduct(normalized.name, query)) {
          console.log(`[${scraperName.toLowerCase()}] ✓ ${normalized.name} — ₹${normalized.price}`);
          retailers.push(normalized);
        } else {
          const reason = !normalized ? 'normalization failed' : isLowQualityListing(normalized.name) ? 'low quality' : 'not relevant';
          console.warn(`[${scraperName.toLowerCase()}] ✗ filtered out: ${reason}`);
        }
      } else if (result.status === 'rejected') {
        console.warn(`[${scraperName.toLowerCase()}] ✗ rejected:`, result.reason);
      } else {
        console.warn(`[${scraperName.toLowerCase()}] ✗ fulfilled but empty`);
      }
    });

    // ── SerpAPI results ──
    const data = serpResult.status === 'fulfilled' ? serpResult.value : {};

    const shoppingResults = [
      ...(data.shopping_results || []),
      ...(data.inline_shopping_results || []),
    ];

    // Match core retailers from shopping results by their actual source name
    for (const targetRetailer of CORE_RETAILER_TARGETS) {
      const exists = retailers.some(r =>
        normalizeStoreName(r.store) === normalizeStoreName(targetRetailer.retailer) && r.price
      );

      if (!exists && shoppingResults.length > 0) {
        // Only pick a shopping result that actually belongs to this retailer
        // AND is relevant to the query (not a variant model like "Pro" or "17e")
        const matchingResult = shoppingResults.find(item => {
          const src = normalizeStoreName(item.source || '');
          const target = normalizeStoreName(targetRetailer.retailer);
          const storeMatch = src === target || src.includes(target) || target.includes(src);
          if (!storeMatch) return false;
          const title = item.title || '';
          return isRelevantProduct(title, query) && !isLowQualityListing(title);
        });

        if (matchingResult) {
          const price = matchingResult.extracted_price || parseFloat(String(matchingResult.price || '').replace(/[^0-9.]/g, ''));
          if (price && price >= 500) {
            const redirectUrl = rememberRedirectTarget({
              store: matchingResult.source || targetRetailer.retailer,
              name: matchingResult.title || query,
              query,
              price,
              directUrl: matchingResult.link || matchingResult.product_link || '',
              immersiveApiUrl: matchingResult.serpapi_immersive_product_api || '',
            });

            retailers.push(createRetailerEntry({
              name: (matchingResult.title || query).substring(0, 80),
              price,
              store: targetRetailer.retailer,
              rating: matchingResult.rating || 0,
              reviews: matchingResult.reviews || 0,
              url: redirectUrl,
              image: matchingResult.thumbnail || '',
              source: 'serpapi-matched',
            }));
            console.log(`[serpapi-matched] ${targetRetailer.retailer} ✓ ₹${price}`);
          }
        }
      }
    }

    const pushCuratedSerpapiResult = (item, fallbackStore = 'Unknown Retailer') => {
      const priceStr = item.extracted_price || (item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : '');
      const store = item.source || fallbackStore;
      const name = item.title || query;
      const directUrl = item.link || item.product_link || '';

      // Block: no price, blocked seller, fake listing title, or irrelevant product
      // Note: we allow any non-blocked retailer through – trust scoring handles ranking
      if (!priceStr || isBlockedRetailer(store) || isLowQualityListing(name) || !isRelevantProduct(name, query)) {
        return;
      }

      const redirectUrl = rememberRedirectTarget({
        store,
        name,
        query,
        price: priceStr || 0,
        directUrl,
        immersiveApiUrl: item.serpapi_immersive_product_api || '',
      });

      retailers.push(createRetailerEntry({
        name,
        price: priceStr || '',
        store,
        rating: item.rating || 0,
        reviews: item.reviews || 0,
        url: redirectUrl,
        image: item.thumbnail || '',
        source: 'serpapi',
      }));
    };

    if (data.shopping_results) {
      data.shopping_results.forEach((item) => pushCuratedSerpapiResult(item));
    }

    if (data.inline_shopping_results) {
      data.inline_shopping_results.forEach((item) => pushCuratedSerpapiResult(item));
    }

    // Also check for ads which often contain major retailers like Amazon/Flipkart
    if (data.ads) {
      data.ads.forEach(ad => {
        if (ad.shopping_results) {
          ad.shopping_results.forEach((item) => pushCuratedSerpapiResult(item, 'Sponsored'));
        }
      });
    }

    let curatedRetailers = dedupeRetailers(retailers)
      .filter((retailer) => retailer.trustScore >= 30)
      .sort((a, b) => {
        const trustDelta = (b.trustScore || 0) - (a.trustScore || 0);
        if (Math.abs(trustDelta) >= 8) return trustDelta;
        return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
      });

    // Recovery: use pre-started SerpAPI results that have been running in parallel
    // with the scrapers. By now, they should be complete or nearly complete.
    const seenStores = new Set(curatedRetailers.map((r) => normalizeStoreName(r.store)));
    const unavailableOfficialRetailers = [];

    const preRecoveryResults = await prestartRecoveryPromise;

    for (let i = 0; i < OFFICIAL_RECOVERY_TARGETS.length; i++) {
      const target = OFFICIAL_RECOVERY_TARGETS[i];
      const targetNorm = normalizeStoreName(target.retailer);

      // Skip retailers already found by scrapers or main SerpAPI
      if (seenStores.has(targetNorm)) continue;

      const result = preRecoveryResults[i];
      let added = false;

      if (result.status === 'fulfilled' && result.value) {
        const recovered = result.value;
        if (!isBlockedRetailer(recovered.store) && !isLowQualityListing(recovered.name) && isRelevantProduct(recovered.name, query)) {
          curatedRetailers.push(recovered);
          seenStores.add(targetNorm);
          added = true;
          console.log(`[recovery] ${target.retailer} ✓ via parallel SerpAPI`);
        }
      }

      if (!added) {
        // Find the search URL template for this retailer
        const coreTarget = CORE_RETAILER_TARGETS.find(
          t => normalizeStoreName(t.retailer) === normalizeStoreName(target.retailer)
        );
        const searchUrl = coreTarget
          ? buildRetailerSearchUrl(coreTarget.searchUrl, query)
          : `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + target.retailer)}`;

        unavailableOfficialRetailers.push({
          store: target.retailer,
          reason: 'No reliable live price found right now',
          searchUrl,
        });

        // Also add as a retailer card (not just a banner link) so users see ALL retailers
        curatedRetailers.push(createRetailerEntry({
          name: query,
          price: 0,
          store: target.retailer,
          rating: 0,
          reviews: 0,
          url: searchUrl,
          image: '',
          source: 'unavailable-placeholder',
          unavailableReason: 'No reliable live price found right now',
          searchOnly: true,
        }));
      }
    }

    curatedRetailers = dedupeRetailers(curatedRetailers)
      .filter((retailer) => retailer.searchOnly || retailer.trustScore >= 30)
      .sort((a, b) => {
        // Put unavailable/searchOnly retailers at the bottom
        if (a.searchOnly && !b.searchOnly) return 1;
        if (!a.searchOnly && b.searchOnly) return -1;
        const trustDelta = (b.trustScore || 0) - (a.trustScore || 0);
        if (Math.abs(trustDelta) >= 8) return trustDelta;
        return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
      });

    // Now showing ALL retailers including unavailable ones as cards

    console.log(`[search] Found ${curatedRetailers.length} curated results.`);
    console.log(`[search] Stores: ${[...new Set(curatedRetailers.map(r => r.store))].join(', ')}`);

    if (curatedRetailers.length === 0) {
      return res.json({ retailers: [], reviews: [], unavailableOfficialRetailers });
    }

    // ── Best Deal: exactly ONE winner (lowest price, tiebreak by trust) ──
    let bestDealIdx = -1;
    let bestPrice = Infinity;
    let bestTrust = -1;
    curatedRetailers.forEach((r, i) => {
      if (r.searchOnly || typeof r.price !== 'number' || r.price <= 0) return;
      if (r.price < bestPrice || (r.price === bestPrice && (r.trustScore || 0) > bestTrust)) {
        bestPrice = r.price;
        bestTrust = r.trustScore || 0;
        bestDealIdx = i;
      }
    });

    const finalRetailers = curatedRetailers.map((r, i) => {
      const priceDiff = (typeof r.price === 'number' && r.price > 0 && bestPrice < Infinity) ? r.price - bestPrice : null;
      return {
        ...r,
        isBestDeal: i === bestDealIdx,
        priceDifference: priceDiff,
        priceDifferenceText: priceDiff > 0 ? `₹${priceDiff.toLocaleString('en-IN')} more than best deal` : null,
        savingsText: i === bestDealIdx && bestPrice < Infinity ? `Cheapest option` : null,
      };
    });

    const responsePayload = {
      retailers: finalRetailers,
      unavailableOfficialRetailers,
      query,
      name: query,
      bestDealPrice: bestPrice < Infinity ? bestPrice : null,
      cachedAt: new Date().toISOString(),
    };

    // Save to Supabase (fire-and-forget)
    setCachedResult(query, responsePayload).catch(() => {});
    savePriceSnapshots(query, finalRetailers).catch(() => {});

    res.json(responsePayload);
  } catch (err) {
    console.error(`[search error]`, err.message);
    const stalePayload = await getCachedResult(query);
    if (stalePayload) {
      return res.json({
        ...stalePayload,
        warning: 'Showing cached results because live search is temporarily unavailable.',
      });
    }

    return res.json({
      retailers: [],
      unavailableOfficialRetailers: [],
      query,
      name: query,
      warning: 'Live search is temporarily unavailable. Please try again shortly.',
    });
  }
});

app.get('/api/redirect/:id', async (req, res) => {
  const target = redirectTargets.get(req.params.id);
  if (!target) {
    // Return a Google fallback instead of 404 so the button always works
    return res.json({ url: 'https://www.google.com/search?q=buy+online+india' });
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  const resolvedUrl = await resolveDirectMerchantUrl(target, apiKey);
  if (!resolvedUrl) {
    return res.json({ url: buildRedirectFallbackUrl(target) });
  }

  // Return JSON — the frontend will window.open() the URL directly.
  // This avoids issues where the Vite dev-server proxy eats 302 headers.
  res.json({ url: resolvedUrl });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Price History ──
app.get('/api/price-history', async (req, res) => {
  const query = (req.query.q || '').trim();
  const days = parseInt(req.query.days) || 30;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });
  const history = await getPriceHistory(query, days);
  res.json({ history, query });
});

// ── Product Reviews (real-time) ──
app.get('/api/reviews', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

  const API_KEY = process.env.SERPAPI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'SERPAPI_API_KEY is missing' });
  }

  try {
    const result = await fetchProductReviews(query, API_KEY);
    res.json(result);
  } catch (err) {
    console.error('[reviews] endpoint error:', err.message);
    res.json({ reviews: [], stats: null, error: err.message });
  }
});

// ── Price Alerts CRUD ──
app.post('/api/price-alerts', async (req, res) => {
  const { email, productQuery, productName, targetPrice, currentPrice } = req.body;
  if (!email || !productQuery || !targetPrice) {
    return res.status(400).json({ error: 'email, productQuery, and targetPrice are required' });
  }
  const result = await createAlert({ email, productQuery, productName, targetPrice, currentPrice });
  if (result.error) return res.status(500).json({ error: result.error });
  res.json(result);
});

app.get('/api/price-alerts', async (req, res) => {
  const alerts = await getAlerts(req.query.email || '');
  res.json({ alerts });
});

app.delete('/api/price-alerts/:id', async (req, res) => {
  const result = await deleteAlert(req.params.id);
  if (result.error) return res.status(500).json({ error: result.error });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`\n🚀 PriceWise API running → http://localhost:${PORT}`);
});
