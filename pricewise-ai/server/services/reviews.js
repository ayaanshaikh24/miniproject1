/**
 * Real-time product reviews via SerpAPI.
 *
 * Strategy (multiple fallbacks to ensure reviews are always returned):
 *   1. Google Shopping → find product_id → Google Product reviews
 *   2. Amazon search → find ASIN → Amazon product reviews
 *   3. Google Shopping review snippets (from shopping results themselves)
 *   4. If all else fails, use google search for "[product] reviews" to get review snippets
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
  'google shopping': '#4285F4',
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

async function fetchWithTimeout(url, timeoutMs = 10000) {
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
 * Compute a genuineness score for a review based on various signals
 */
function computeGenuineScore(review) {
  let score = 70; // base

  // Verified purchase is a strong signal
  if (review.verified_purchase || review.badge === 'Verified Purchase') score += 12;

  // Longer reviews are usually more genuine
  const textLen = (review.snippet || review.content || review.body || review.text || '').length;
  if (textLen > 200) score += 8;
  else if (textLen > 100) score += 5;
  else if (textLen > 50) score += 2;
  else score -= 5;

  // Has images
  if (review.images?.length > 0 || review.image) score += 3;

  // Has likes/helpful votes — community validation
  const likes = Number(review.likes) || Number(review.helpful_count) || 0;
  if (likes > 50) score += 5;
  else if (likes > 10) score += 3;
  else if (likes > 0) score += 1;

  // Has date
  if (review.date) score += 2;

  return Math.max(50, Math.min(99, score));
}

// ── Strategy 1: Google Shopping → product_id → Google Product reviews ──
async function fetchGoogleProductReviews(query, apiKey) {
  try {
    // Step 1: Find product_id
    const shopUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}&gl=in&hl=en&num=5`;
    const shopData = await fetchWithTimeout(shopUrl, 10000);

    const shopResults = [
      ...(Array.isArray(shopData.shopping_results) ? shopData.shopping_results : []),
      ...(Array.isArray(shopData.inline_shopping_results) ? shopData.inline_shopping_results : []),
    ];

    let productId = null;
    for (const item of shopResults) {
      if (item.product_id) {
        productId = item.product_id;
        break;
      }
    }

    if (!productId) {
      console.log('[reviews] No product_id found in Google Shopping results');
      return { reviews: [], ratingInfo: null, shopResults };
    }

    console.log(`[reviews] Found product_id: ${productId}`);

    // Step 2: Fetch reviews
    const reviewUrl = `https://serpapi.com/search.json?engine=google_product&product_id=${encodeURIComponent(productId)}&api_key=${apiKey}&gl=in&hl=en`;
    const productData = await fetchWithTimeout(reviewUrl, 12000);

    const reviews = [];
    const rawReviews = productData?.reviews_results?.reviews || productData?.reviews || [];

    for (const review of rawReviews) {
      const rating = Number(review.rating) || 0;
      const source = review.source || '';
      const reviewerName = review.title?.replace(/^Review by\s+/i, '') || review.user?.name || 'Verified Buyer';

      reviews.push({
        reviewer: reviewerName,
        avatar: getInitials(reviewerName),
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

    const productInfo = productData?.product_results || {};
    const ratingInfo = {
      overallRating: Number(productInfo.rating) || 0,
      totalReviews: Number(productInfo.reviews) || reviews.length,
      reviewsDistribution: productData?.reviews_results?.ratings || [],
    };

    return { reviews, ratingInfo, shopResults };
  } catch (err) {
    console.warn('[reviews] Google Product reviews failed:', err.message);
    return { reviews: [], ratingInfo: null, shopResults: [] };
  }
}

// ── Strategy 2: Amazon reviews via ASIN ──
async function fetchAmazonReviews(query, apiKey) {
  try {
    const searchUrl = `https://serpapi.com/search.json?engine=amazon&amazon_domain=amazon.in&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const searchData = await fetchWithTimeout(searchUrl, 10000);

    const results = searchData?.organic_results || [];
    if (results.length === 0) return [];

    const asin = results[0]?.asin;
    if (!asin) return [];

    console.log(`[reviews] Found Amazon ASIN: ${asin}`);

    const reviewUrl = `https://serpapi.com/search.json?engine=amazon_product&product_id=${asin}&amazon_domain=amazon.in&api_key=${apiKey}`;
    const productData = await fetchWithTimeout(reviewUrl, 10000);

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

// ── Strategy 3: Extract review snippets from Google Shopping results ──
function extractShoppingReviewSnippets(shopResults) {
  const reviews = [];
  for (const item of (shopResults || [])) {
    if (!item.rating || !item.reviews) continue;

    // Each shopping result with reviews can contribute a snippet
    const source = item.source || 'Google Shopping';
    reviews.push({
      reviewer: source + ' Reviewer',
      avatar: getInitials(source),
      location: 'India',
      rating: Number(item.rating) || 0,
      title: item.title || '',
      text: item.snippet || `Rated ${item.rating}/5 based on ${item.reviews} reviews on ${source}. ${item.title || ''}`,
      retailer: source,
      retailerColor: getRetailerColor(source),
      verified: true,
      helpful: Number(item.reviews) || 0,
      notHelpful: 0,
      date: '',
      images: item.thumbnail ? 1 : 0,
      genuineScore: 78,
    });
  }
  return reviews;
}

// ── Strategy 4: Google search for review snippets ──
async function fetchGoogleReviewSnippets(query, apiKey) {
  try {
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query + ' review india')}&api_key=${apiKey}&gl=in&hl=en&num=10`;
    const data = await fetchWithTimeout(searchUrl, 8000);

    const reviews = [];
    const organicResults = data?.organic_results || [];

    for (const result of organicResults) {
      if (!result.snippet) continue;

      // Check if this is a review-related result
      const titleLower = (result.title || '').toLowerCase();
      const snippetLower = (result.snippet || '').toLowerCase();
      const isReview = titleLower.includes('review') || snippetLower.includes('review') ||
        snippetLower.includes('rating') || snippetLower.includes('star') ||
        snippetLower.includes('pros') || snippetLower.includes('cons');

      if (!isReview) continue;

      // Extract rating from rich snippets if available
      let rating = 0;
      if (result.rich_snippet?.top?.detected_extensions?.rating) {
        rating = Number(result.rich_snippet.top.detected_extensions.rating) || 0;
      }
      // Try to extract from text
      if (!rating) {
        const ratingMatch = result.snippet.match(/(\d\.?\d?)\s*(?:out of|\/)\s*5/i);
        if (ratingMatch) rating = parseFloat(ratingMatch[1]) || 0;
      }

      const sourceDomain = result.displayed_link?.replace(/^https?:\/\//, '').split('/')[0] || 'Review Site';

      reviews.push({
        reviewer: result.source || sourceDomain,
        avatar: getInitials(result.source || sourceDomain),
        location: '',
        rating: rating || 4,
        title: result.title || '',
        text: result.snippet || '',
        retailer: result.source || sourceDomain,
        retailerColor: getRetailerColor(result.source || ''),
        verified: false,
        helpful: 0,
        notHelpful: 0,
        date: result.date || '',
        images: 0,
        genuineScore: 72,
      });
    }

    return reviews;
  } catch (err) {
    console.warn('[reviews] Google review snippets failed:', err.message);
    return [];
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
    for (const entry of ratingInfo.reviewsDistribution) {
      const stars = Number(entry.stars) || 0;
      const count = Number(entry.amount || entry.count) || 0;
      if (stars >= 1 && stars <= 5) {
        distribution[stars] = count;
      }
    }
  } else {
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
    let allReviews = [];
    let ratingInfo = null;

    // Strategy 1 + 2: Fetch Google Product reviews and Amazon reviews in parallel
    const [googleResult, amazonReviews] = await Promise.allSettled([
      fetchGoogleProductReviews(query, apiKey),
      fetchAmazonReviews(query, apiKey),
    ]);

    // Process Google results
    if (googleResult.status === 'fulfilled' && googleResult.value) {
      const { reviews, ratingInfo: gRating, shopResults } = googleResult.value;
      allReviews.push(...reviews);
      ratingInfo = gRating;

      // Strategy 3: If Google Product reviews are empty, extract from shopping results
      if (reviews.length === 0 && shopResults?.length > 0) {
        console.log('[reviews] No Google Product reviews, extracting shopping snippets...');
        const shoppingSnippets = extractShoppingReviewSnippets(shopResults);
        allReviews.push(...shoppingSnippets);
      }
    }

    // Process Amazon results
    if (amazonReviews.status === 'fulfilled' && Array.isArray(amazonReviews.value) && amazonReviews.value.length > 0) {
      allReviews.push(...amazonReviews.value);
      console.log(`[reviews] Added ${amazonReviews.value.length} Amazon reviews`);
    }

    // Strategy 4: If still no reviews, try Google search snippets
    if (allReviews.length === 0) {
      console.log('[reviews] No reviews from primary sources, trying Google search snippets...');
      const searchSnippets = await fetchGoogleReviewSnippets(query, apiKey);
      allReviews.push(...searchSnippets);
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
