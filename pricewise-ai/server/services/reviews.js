/**
 * Real-time product reviews via SerpAPI.
 *
 * Flow:
 *   1. Google Shopping search → find product_id for the query
 *   2. Google Product API (reviews) → fetch real user reviews
 *   3. Normalize + return to frontend
 */

const REVIEW_CACHE = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Retailer color map ──────────────────────────────────────
const RETAILER_COLORS = {
  'amazon': '#FF9900',
  'amazon.in': '#FF9900',
  'flipkart': '#2874F0',
  'flipkart.com': '#2874F0',
  'croma': '#00B9B0',
  'croma.com': '#00B9B0',
  'reliance digital': '#ED1C24',
  'reliancedigital.in': '#ED1C24',
  'tata cliq': '#E21D24',
  'tatacliq.com': '#E21D24',
  'vijay sales': '#E8382F',
  'vijaysales.com': '#E8382F',
  'jiomart': '#003873',
  'jiomart.com': '#003873',
  'oneplus': '#EB0028',
  'oneplus store': '#EB0028',
  'samsung': '#1428A0',
  'samsung.com': '#1428A0',
  'apple': '#555555',
  'apple.com': '#555555',
  'myntra': '#FF3F6C',
  'nykaa': '#FC2779',
  'google store': '#4285F4',
  'google': '#4285F4',
};

function getRetailerColor(source) {
  if (!source) return '#888888';
  const key = source.toLowerCase().trim();
  return RETAILER_COLORS[key] || '#888888';
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Step 1: Find product_id from Google Shopping results
 */
async function findProductId(query, apiKey) {
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}&gl=in&hl=en`;
  const data = await fetchWithTimeout(url, 8000);

  const results = [
    ...(Array.isArray(data.shopping_results) ? data.shopping_results : []),
    ...(Array.isArray(data.inline_shopping_results) ? data.inline_shopping_results : []),
  ];

  // Find the first result with a product_id
  for (const item of results) {
    if (item.product_id) return item.product_id;
  }

  return null;
}

/**
 * Step 2: Fetch real reviews from Google Product API
 */
async function fetchGoogleProductReviews(productId, apiKey) {
  const url = `https://serpapi.com/search.json?engine=google_product&product_id=${encodeURIComponent(productId)}&api_key=${apiKey}&gl=in&hl=en&reviews=true`;
  const data = await fetchWithTimeout(url, 10000);

  const reviews = [];

  // reviews_results.reviews has the actual review data
  const rawReviews = data?.reviews_results?.reviews || data?.reviews || [];

  for (const review of rawReviews) {
    const rating = Number(review.rating) || 0;
    const source = review.source || '';

    reviews.push({
      reviewer: review.title?.replace(/^Review by\s+/i, '') || review.user?.name || 'Anonymous',
      avatar: getInitials(review.title?.replace(/^Review by\s+/i, '') || review.user?.name || 'A'),
      location: review.user?.location || '',
      rating,
      title: review.title || '',
      text: review.snippet || review.content || '',
      retailer: source || 'Google Shopping',
      retailerColor: getRetailerColor(source),
      verified: Boolean(review.verified_purchase || review.badge === 'Verified Purchase'),
      helpful: Number(review.likes) || Number(review.helpful_count) || 0,
      notHelpful: Number(review.dislikes) || 0,
      date: review.date || '',
      images: Array.isArray(review.images) ? review.images.length : (review.image ? 1 : 0),
      genuineScore: computeGenuineScore(review),
    });
  }

  // Also check product_results for overall rating info
  const productInfo = data?.product_results || {};
  const ratingInfo = {
    overallRating: Number(productInfo.rating) || 0,
    totalReviews: Number(productInfo.reviews) || reviews.length,
    reviewsDistribution: data?.reviews_results?.ratings || [],
  };

  return { reviews, ratingInfo, productInfo };
}

/**
 * Step 3: Fetch reviews from Amazon Product API (additional source)
 */
async function fetchAmazonReviews(query, apiKey) {
  try {
    // First find the Amazon product
    const searchUrl = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.in&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const searchData = await fetchWithTimeout(searchUrl, 8000);

    const results = searchData?.organic_results || [];
    if (results.length === 0) return [];

    const asin = results[0]?.asin;
    if (!asin) return [];

    // Fetch reviews for this product
    const reviewUrl = `https://serpapi.com/search.json?engine=amazon_product&product_id=${asin}&amazon_domain=amazon.in&api_key=${apiKey}`;
    const productData = await fetchWithTimeout(reviewUrl, 8000);

    const topReviews = productData?.top_reviews || [];
    return topReviews.map(review => ({
      reviewer: review.title || 'Amazon Customer',
      avatar: getInitials(review.title || 'AC'),
      location: review.location || 'India',
      rating: Number(review.rating) || 0,
      title: review.title || '',
      text: review.body || review.snippet || '',
      retailer: 'Amazon',
      retailerColor: '#FF9900',
      verified: Boolean(review.verified_purchase),
      helpful: Number(review.helpful_count) || 0,
      notHelpful: 0,
      date: review.date || '',
      images: Array.isArray(review.images) ? review.images.length : 0,
      genuineScore: computeGenuineScore(review),
    }));
  } catch (err) {
    console.warn('[reviews] Amazon reviews fetch failed:', err.message);
    return [];
  }
}

/**
 * Compute a genuineness score for a review based on various signals
 */
function computeGenuineScore(review) {
  let score = 70; // base

  // Verified purchase is a strong signal
  if (review.verified_purchase || review.badge === 'Verified Purchase') score += 12;

  // Longer reviews are usually more genuine
  const textLen = (review.snippet || review.content || review.body || '').length;
  if (textLen > 200) score += 8;
  else if (textLen > 100) score += 5;
  else if (textLen > 50) score += 2;
  else score -= 5; // very short reviews are suspicious

  // Has images
  if (review.images?.length > 0 || review.image) score += 3;

  // Has likes/helpful votes — community validation
  const likes = Number(review.likes) || Number(review.helpful_count) || 0;
  if (likes > 50) score += 5;
  else if (likes > 10) score += 3;
  else if (likes > 0) score += 1;

  // Has date
  if (review.date) score += 2;

  // Clamp
  return Math.max(50, Math.min(99, score));
}

/**
 * Main export: fetch real-time reviews for a product query
 */
export async function fetchProductReviews(query, apiKey) {
  if (!query || !apiKey) {
    return { reviews: [], stats: null, error: 'Missing query or API key' };
  }

  // Check cache
  const cacheKey = query.toLowerCase().trim();
  const cached = REVIEW_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[reviews] Cache hit for "${query}"`);
    return cached.data;
  }

  console.log(`[reviews] Fetching real-time reviews for "${query}"...`);

  try {
    // Step 1: Find product on Google Shopping
    const productId = await findProductId(query, apiKey);

    let allReviews = [];
    let ratingInfo = null;

    // Step 2: If we found a product_id, fetch Google Product reviews
    if (productId) {
      console.log(`[reviews] Found product_id: ${productId}`);
      const googleResult = await fetchGoogleProductReviews(productId, apiKey);
      allReviews.push(...googleResult.reviews);
      ratingInfo = googleResult.ratingInfo;
    }

    // Step 3: Also try Amazon reviews (in parallel if possible)
    try {
      const amazonReviews = await fetchAmazonReviews(query, apiKey);
      if (amazonReviews.length > 0) {
        allReviews.push(...amazonReviews);
        console.log(`[reviews] Added ${amazonReviews.length} Amazon reviews`);
      }
    } catch {
      // Non-critical, continue without Amazon reviews
    }

    // Deduplicate by reviewer + text similarity
    const seen = new Set();
    allReviews = allReviews.filter(r => {
      const key = `${r.reviewer}_${(r.text || '').slice(0, 50)}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by helpfulness
    allReviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));

    // Compute aggregate stats
    const stats = computeReviewStats(allReviews, ratingInfo);

    const result = {
      reviews: allReviews,
      stats,
      source: 'live',
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    REVIEW_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(`[reviews] Returning ${allReviews.length} real reviews for "${query}"`);
    return result;
  } catch (err) {
    console.error(`[reviews] Error fetching reviews for "${query}":`, err.message);
    return { reviews: [], stats: null, source: 'error', error: err.message };
  }
}

/**
 * Compute aggregate review statistics
 */
function computeReviewStats(reviews, ratingInfo) {
  if (reviews.length === 0 && !ratingInfo) return null;

  const total = reviews.length || ratingInfo?.totalReviews || 0;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (ratingInfo?.reviewsDistribution?.length > 0) {
    // Use SerpAPI's distribution data
    for (const entry of ratingInfo.reviewsDistribution) {
      const stars = Number(entry.stars) || 0;
      const count = Number(entry.amount || entry.count) || 0;
      if (stars >= 1 && stars <= 5) {
        distribution[stars] = count;
      }
    }
  } else {
    // Compute from reviews
    for (const r of reviews) {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    }
  }

  const avgRating = ratingInfo?.overallRating ||
    (reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0);

  const verifiedCount = reviews.filter(r => r.verified).length;
  const avgGenuine = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + (r.genuineScore || 70), 0) / reviews.length)
    : 0;
  const retailers = [...new Set(reviews.map(r => r.retailer).filter(Boolean))];

  return {
    total: Math.max(total, reviews.length),
    avgRating: Number(avgRating.toFixed(1)),
    distribution,
    verifiedCount,
    avgGenuine,
    retailers,
  };
}
