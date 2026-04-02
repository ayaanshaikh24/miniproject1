import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, WifiOff, Loader2, Bell, Clock } from 'lucide-react';

import RetailerCard from '../components/features/product/RetailerCard';
import FilterSortBar from '../components/features/product/FilterSortBar';
import PriceHistoryChart from '../components/features/product/PriceHistoryChart';
import PriceAlertModal from '../components/features/pricing/PriceAlertModal';
import { searchProductsLive, fetchPriceHistory } from '../services/api';

// Skeleton loader for cards
const SkeletonCard = () => (
  <div className="bg-neutral-900/60 rounded-3xl p-6 border border-neutral-800/60 animate-pulse flex flex-col md:flex-row gap-6 items-center">
    <div className="h-24 w-24 rounded-xl bg-neutral-800 shrink-0" />
    <div className="flex-1 space-y-3 w-full">
      <div className="h-6 bg-neutral-800 rounded-lg w-32" />
      <div className="h-4 bg-neutral-800 rounded-lg w-64" />
      <div className="h-3 bg-neutral-800 rounded-lg w-40" />
    </div>
    <div className="h-8 bg-neutral-800 rounded-lg w-28 shrink-0" />
    <div className="h-12 bg-neutral-800 rounded-2xl w-36 shrink-0" />
  </div>
);

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [data, setData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  // Filter/Sort state
  const [sortBy, setSortBy] = useState('price-asc');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // Price Alert modal
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setApiError(false);
    setData(null);
    setPriceHistory([]);

    searchProductsLive(query)
      .then(resData => { if (!cancelled) setData(resData); })
      .catch(() => { if (!cancelled) setApiError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Fetch price history in parallel (non-blocking)
    fetchPriceHistory(query)
      .then(h => { if (!cancelled) setPriceHistory(h); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6 mt-8">
          <div className="flex items-baseline gap-4 border-b border-neutral-800 pb-8">
            <div>
              <div className="h-8 bg-neutral-800 rounded-lg w-48 animate-pulse" />
              <div className="h-4 bg-neutral-800 rounded-lg w-32 mt-3 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
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
          <p className="text-neutral-500 text-sm">{data?.error || "Couldn't reach the search server."}</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black rounded-2xl font-bold">Search Again</button>
        </div>
      </div>
    );
  }

  const retailers = data?.retailers || [];
  const unavailableOfficialRetailers = data?.unavailableOfficialRetailers || [];
  const resultWarning = data?.warning || '';
  const cachedAt = data?.cachedAt || '';
  const bestDealPrice = data?.bestDealPrice;

  if (retailers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-500 mx-auto">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-white">No results for "{query}"</h2>
          <p className="text-neutral-500">We couldn't find this product. Try a shorter or more generic keyword.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-white text-black rounded-2xl font-bold">Search Again</button>
        </div>
      </div>
    );
  }

  // Apply filters
  let filteredRetailers = [...retailers];

  if (inStockOnly) {
    filteredRetailers = filteredRetailers.filter(r => {
      const s = (r.stockStatus || '').toLowerCase();
      return s.includes('in stock') || s === 'check site' || s === '';
    });
  }

  if (minRating > 0) {
    filteredRetailers = filteredRetailers.filter(r => (r.rating || 0) >= minRating || r.rating === 0);
  }

  // Apply sort
  filteredRetailers.sort((a, b) => {
    const aUnavailable = Boolean(a.searchOnly || !a.price);
    const bUnavailable = Boolean(b.searchOnly || !b.price);
    if (aUnavailable !== bUnavailable) return aUnavailable ? 1 : -1;

    switch (sortBy) {
      case 'trust-desc':
        return (b.trustScore || 0) - (a.trustScore || 0);
      case 'delivery':
        return 0; // preserve order for now
      case 'price-asc':
      default:
        return (a.price || Infinity) - (b.price || Infinity);
    }
  });

  const lowestPrice = bestDealPrice || null;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 mt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-neutral-800 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white capitalize">{query}</h1>
            <p className="text-neutral-400 text-sm mt-2">
              Comparing {retailers.length} retailers
              {cachedAt && (
                <span className="inline-flex items-center gap-1 ml-3 text-neutral-500">
                  <Clock size={12} />
                  Updated {timeAgo(cachedAt)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm font-bold text-white hover:bg-neutral-800 transition-all"
          >
            <Bell size={16} />
            Set Price Alert
          </button>
        </div>

        {resultWarning && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            {resultWarning}
          </div>
        )}

        {/* Filter/Sort Bar */}
        <FilterSortBar
          sortBy={sortBy}
          setSortBy={setSortBy}
          inStockOnly={inStockOnly}
          setInStockOnly={setInStockOnly}
          minRating={minRating}
          setMinRating={setMinRating}
        />

        {/* Retailer Cards */}
        <section>
          <h2 className="text-2xl font-black text-white tracking-tight mb-6">Price Comparison</h2>

          {unavailableOfficialRetailers.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-300 font-bold text-sm">Official Store Check</p>
              <p className="text-amber-100/90 text-xs mt-1">
                These stores were checked but no live price was found:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unavailableOfficialRetailers.map((item, idx) => (
                  <span
                    key={`${item.store}-${idx}`}
                    className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200"
                  >
                    {item.store}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredRetailers.map((retailer, i) => (
              <RetailerCard
                key={`${retailer.store}-${i}`}
                retailer={{
                  ...retailer,
                  isUnavailable: Boolean(retailer.searchOnly || !retailer.price),
                }}
                isBestDeal={retailer.isBestDeal}
              />
            ))}
          </div>

          {filteredRetailers.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No retailers match your filters. Try adjusting them.
            </div>
          )}
        </section>

        {/* Price History Chart */}
        <section className="border-t border-neutral-800 pt-12">
          <PriceHistoryChart history={priceHistory} />
        </section>
      </div>

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        currentPrice={lowestPrice}
        productName={query}
        productQuery={query}
      />
    </div>
  );
};

export default Results;
