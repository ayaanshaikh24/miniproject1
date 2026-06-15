const API_BASE = process.env.API_BASE || 'http://localhost:3001';

function fail(message) {
  throw new Error(message);
}

async function fetchJson(path, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) {
      fail(`Request failed for ${path}: HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function validateSearchPayload(payload) {
  if (!payload || typeof payload !== 'object') fail('Search payload is empty.');
  if (!Array.isArray(payload.retailers)) fail('Search payload missing retailers array.');
  if (!Array.isArray(payload.unavailableOfficialRetailers)) {
    fail('Search payload missing unavailableOfficialRetailers array.');
  }

  const badRetailer = payload.retailers.find((retailer) => {
    if (!retailer || typeof retailer !== 'object') return true;
    if (!retailer.store || !retailer.url) return true;
    if (retailer.searchOnly) return false;
    const price = Number(retailer.price) || 0;
    return price <= 0;
  });

  if (badRetailer) {
    fail('Search payload includes invalid or unavailable retailer cards.');
  }
}

function validateReviewsPayload(payload) {
  if (!payload || typeof payload !== 'object') fail('Reviews payload is empty.');
  if (!Array.isArray(payload.reviews)) fail('Reviews payload missing reviews array.');

  const malformed = payload.reviews.find((review) => {
    if (!review || typeof review !== 'object') return true;
    return !review.text || !review.retailer;
  });

  if (malformed) {
    fail('Reviews payload includes malformed review entries.');
  }
}

async function run() {
  console.log(`[smoke] API base: ${API_BASE}`);

  const health = await fetchJson('/api/health');
  if (health.status !== 'ok') fail('Health endpoint did not return status=ok.');
  console.log('[smoke] Health check passed.');

  const search = await fetchJson('/api/search?q=iphone%2015&fresh=1', 60000);
  validateSearchPayload(search);

  const liveRetailerCount = search.retailers.length;
  console.log(`[smoke] Search check passed. liveRetailers=${liveRetailerCount}, unavailableList=${search.unavailableOfficialRetailers.length}`);

  const reviews = await fetchJson('/api/reviews?q=iphone%2015', 60000);
  validateReviewsPayload(reviews);

  if (reviews.reviews.length === 0) {
    console.warn('[smoke] Warning: reviews array is empty for this query.');
  } else {
    console.log(`[smoke] Reviews check passed. reviews=${reviews.reviews.length}`);
  }

  console.log('[smoke] All stability checks passed.');
}

run().catch((error) => {
  console.error(`[smoke] FAILED: ${error.message}`);
  process.exit(1);
});
