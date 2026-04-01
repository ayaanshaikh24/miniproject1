import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, WifiOff, Loader2, Star } from 'lucide-react';

import RetailerCard from '../components/features/product/RetailerCard';
import { searchProductsLive } from '../services/api';

const TRUSTED_STORE_KEYWORDS = [
  'amazon',
  'flipkart',
  'croma',
  'reliance',
  'jiomart',
  'vijay',
  'tata',
  'apple',
  'samsung',
  'oneplus',
  'bigbasket',
  'myntra',
  'nykaa',
  'poorvika',
  'sangeetha',
  'bajaj',
  'invent',
  'imagine',
];

function isLikelyUnavailableRetailer(retailer) {
  const store = String(retailer?.store || '').toLowerCase();
  const url = String(retailer?.url || '').toLowerCase();
  const hasLivePrice = typeof retailer?.price === 'number' && retailer.price > 0;
  const explicitUnavailable = Boolean(retailer?.searchOnly || retailer?.unavailableReason);
  const hasTrustedStoreKeyword = TRUSTED_STORE_KEYWORDS.some((keyword) => store.includes(keyword));
  const suspiciousStore = !hasTrustedStoreKeyword || store.includes('unknown') || store.includes('sponsored');
  const missingUrl = !retailer?.url;
  const weakTrust = Number(retailer?.trustScore || 0) < 70;
  const unsafeTarget = url.includes('eknumber.') || url.includes('404') || url.includes('/bestsellers-');
  return explicitUnavailable || !hasLivePrice || missingUrl || suspiciousStore || weakTrust || unsafeTarget;
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [data, setData] = useState(null);
  const [retryingStore, setRetryingStore] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [showAllReviews, setShowAllReviews] = useState(false);

  const handleRetryOfficialStore = async (storeName) => {
    if (!query || retryingStore) return;
    setRetryingStore(storeName);
    setApiError(false);

    try {
      const resData = await searchProductsLive(query);
      setData(resData);
    } catch (e) {
      console.error(e);
      setApiError(true);
    } finally {
      setRetryingStore('');
    }
  };

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setApiError(false);
    setData(null);

    searchProductsLive(query)
      .then(resData => {
        if (!cancelled) {
          setData(resData);
        }
      })
      .catch((e) => { 
        console.error(e);
        if (!cancelled) setApiError(true); 
      })
      .finally(() => { 
        if (!cancelled) setLoading(false); 
      });

    return () => { cancelled = true; };
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 size={40} className="text-neutral-500 animate-spin" />
        <h2 className="text-xl font-bold text-white">Fetching real-time prices...</h2>
      </div>
    );
  }

  if (apiError || (data && data.error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-red-500 mx-auto">
            <WifiOff size={40} />
          </div>
          <h2 className="text-2xl font-black text-white">Search Failed</h2>
          <p className="text-neutral-500 text-sm">
            {data?.error || "Couldn't reach the search server. Check if SERPAPI_API_KEY is configured."}
          </p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black rounded-2xl font-bold">
            Search Again
          </button>
        </div>
      </div>
    );
  }

  const retailers = data?.retailers || [];
  const reviews = data?.reviews || [];
  const unavailableOfficialRetailers = data?.unavailableOfficialRetailers || [];
  const resultWarning = data?.warning || '';

  if (retailers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-500 mx-auto">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-white">No results for "{query}"</h2>
          <p className="text-neutral-500">We couldn't find this product. Try a shorter or more generic keyword.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black rounded-2xl font-bold">
            Search Again
          </button>
        </div>
      </div>
    );
  }

  const normalizedRetailers = retailers.map((retailer) => ({
    ...retailer,
    isUnavailable: isLikelyUnavailableRetailer(retailer),
  }));

  // Sort retailers by price: lowest first, unavailable cards go to the end.
  const sortedRetailers = [...normalizedRetailers].sort((a, b) => {
    if (a.isUnavailable !== b.isUnavailable) return a.isUnavailable ? 1 : -1;
    const priceA = (typeof a.price === 'number' && a.price > 0) ? a.price : Infinity;
    const priceB = (typeof b.price === 'number' && b.price > 0) ? b.price : Infinity;
    return priceA - priceB;
  });

  // Find the lowest price from available listings only to highlight the Best Deal
  const validPrices = sortedRetailers
    .filter(r => !r.isUnavailable && r.price && typeof r.price === 'number' && r.price > 0)
    .map(r => r.price);
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const sharedProductImage = sortedRetailers.find((r) => Boolean(r.image))?.image || '';

  // Calculate overall rating context
  const validRatings = retailers.filter(r => r.rating > 0).map(r => r.rating);
  const avgRating = validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b) / validRatings.length).toFixed(1) : 0;
  const totalReviews = retailers.reduce((sum, r) => sum + (r.reviews || 0), 0);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16 mt-8">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-neutral-800 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white capitalize">{query}</h1>
            <p className="text-neutral-400 text-sm mt-2">Comparing {sortedRetailers.length} top retailers</p>
          </div>
        </div>

        {resultWarning && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            {resultWarning}
          </div>
        )}

        {/* ── Retailer Cards ─────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-black text-white tracking-tight mb-6">Price Comparison</h2>

          {unavailableOfficialRetailers.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-300 font-bold text-sm">Official Store Check</p>
              <p className="text-amber-100/90 text-xs mt-1">
                We checked these genuine stores, but live price was unavailable at this moment:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unavailableOfficialRetailers.map((item, idx) => (
                  <div
                    key={`${item.store}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200"
                  >
                    <span>{item.store}</span>
                    <button
                      type="button"
                      onClick={() => handleRetryOfficialStore(item.store)}
                      disabled={Boolean(retryingStore)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-100 transition hover:bg-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {retryingStore === item.store ? (
                        <>
                          <Loader2 size={10} className="animate-spin" />
                          Retrying
                        </>
                      ) : (
                        'Retry now'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {sortedRetailers.map((retailer, i) => (
              <RetailerCard
                key={`${retailer.store}-${i}`}
                retailer={{
                  ...retailer,
                  imageFallbacks: [sharedProductImage].filter(Boolean),
                }}
                isBestDeal={retailer.price === lowestPrice && lowestPrice !== null}
              />
            ))}
          </div>
        </section>

        {/* ── Customer Reviews ───────────────────────────────────────── */}
        <section className="border-t border-neutral-800 pt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Customer Reviews</h2>
              <p className="text-neutral-500 max-w-xl">
                 Overall consensus across retailers is {avgRating > 0 ? `${avgRating}/5 stars from ${totalReviews} ratings.` : 'currently unavailable.'} Read sample reviews below.
              </p>
            </div>

            {/* Retailer Filter Radio Buttons */}
            {reviews.length > 0 && (
              <div className="flex flex-wrap gap-2 bg-neutral-900/50 p-2 rounded-2xl border border-neutral-800">
                <button
                  onClick={() => setFilterStore('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterStore === 'all' 
                      ? 'bg-white text-black' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All Reviews
                </button>
                {[...new Set(reviews.map(r => r.store))].map(store => (
                  <button
                    key={store}
                    onClick={() => setFilterStore(store)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterStore === store 
                        ? 'bg-white text-black' 
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {store}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews
              .filter(r => filterStore === 'all' || r.store === filterStore)
              .slice(0, showAllReviews ? undefined : 4)
              .map((review, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-white font-black text-sm">
                        {review.store ? review.store.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">{review.store || 'Verified Store'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.floor(review.rating) ? 'currentColor' : 'none'} />
                      ))}
                      <span className="text-xs font-bold ml-1 text-white">{review.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-neutral-300 text-sm leading-relaxed flex-1 pt-1">"{review.text}"</p>
                  
                  <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-medium">
                    <span>— {review.reviewer}</span>
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Verified Buyer
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* View More Button */}
          {reviews.filter(r => filterStore === 'all' || r.store === filterStore).length > 4 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="px-10 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white font-bold hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                {showAllReviews ? 'View Less Reviews' : 'View More Reviews'}
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Results;
