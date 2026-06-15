import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Store,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  BarChart3,
  MessageSquareText,
  Loader2,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { fetchProductReviews } from '../../../services/api';

// ── Star rendering ─────────────────────────
const Stars = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={`${
          star <= rating
            ? 'text-yellow-400 fill-yellow-400'
            : star <= rating + 0.5
            ? 'text-yellow-400 fill-yellow-400/50'
            : 'text-neutral-600'
        }`}
      />
    ))}
  </div>
);

// ── Genuineness indicator ──────────────────
const GenuineBadge = ({ score }) => {
  const color =
    score >= 95
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : score >= 90
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : score >= 85
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      : 'text-orange-400 bg-orange-500/10 border-orange-500/30';

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <ShieldCheck size={10} />
      <span>{score}% Genuine</span>
    </div>
  );
};

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
  } catch {
    return dateStr;
  }
}

// ── Single Review Card ─────────────────────
const ReviewCard = ({ review, index }) => {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = (review.text || '').length > 200;
  const displayText = shouldTruncate && !expanded ? review.text.slice(0, 200) + '...' : review.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5 hover:border-neutral-700/80 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, ${review.retailerColor || '#888'}80, ${review.retailerColor || '#888'}30)`,
            }}
          >
            {review.avatar || '??'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm">{review.reviewer || 'Anonymous'}</span>
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 size={10} />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {review.location && (
                <>
                  <span className="text-neutral-500 text-xs">{review.location}</span>
                  <span className="text-neutral-700">·</span>
                </>
              )}
              {review.date && (
                <span className="text-neutral-500 text-xs flex items-center gap-1">
                  <Calendar size={10} />
                  {getTimeAgo(review.date)}
                </span>
              )}
            </div>
          </div>
        </div>

        {review.genuineScore > 0 && <GenuineBadge score={review.genuineScore} />}
      </div>

      {/* Rating + Title */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <Stars rating={review.rating || 0} />
          <span className="text-neutral-400 text-xs">{review.rating || 0}/5</span>
        </div>
        {review.title && (
          <h4 className="text-white font-bold text-sm mt-1.5">{review.title}</h4>
        )}
      </div>

      {/* Body */}
      {review.text && (
        <>
          <p className="text-neutral-300 text-sm leading-relaxed mt-2">{displayText}</p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-emerald-400 text-xs font-bold mt-1 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Read more <ChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Footer: Retailer + Helpful */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/60">
        {/* Purchased from */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
            style={{
              color: review.retailerColor || '#888',
              backgroundColor: `${review.retailerColor || '#888'}15`,
              borderColor: `${review.retailerColor || '#888'}30`,
            }}
          >
            <Store size={11} />
            Reviewed on {review.retailer || 'Google Shopping'}
          </span>
          {review.images > 0 && (
            <span className="text-neutral-500 text-[10px]">📷 {review.images} photo{review.images > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Helpful */}
        <div className="flex items-center gap-3">
          {(review.helpful > 0 || review.notHelpful > 0) && (
            <>
              <button className="flex items-center gap-1 text-neutral-500 hover:text-emerald-400 transition-colors text-xs">
                <ThumbsUp size={12} />
                <span>{review.helpful || 0}</span>
              </button>
              <button className="flex items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors text-xs">
                <ThumbsDown size={12} />
                <span>{review.notHelpful || 0}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Rating Distribution Bar ────────────────
const RatingBar = ({ star, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-neutral-400 w-12 text-right">{star} star</span>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: (5 - star) * 0.1 }}
          className={`h-full rounded-full ${
            star >= 4 ? 'bg-emerald-500' : star >= 3 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
      </div>
      <span className="text-neutral-500 w-8">{count}</span>
    </div>
  );
};

// ── Skeleton loader ────────────────────────
const ReviewSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-neutral-800 rounded w-32" />
            <div className="h-3 bg-neutral-800 rounded w-24" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-neutral-800 rounded w-48" />
          <div className="h-3 bg-neutral-800 rounded w-full" />
          <div className="h-3 bg-neutral-800 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ────────────────────────
const ProductReviews = ({ query }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(!query);
  const [error, setError] = useState(false);
  const [source, setSource] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');

  const [filterRetailer, setFilterRetailer] = useState('all');
  const [sortBy, setSortBy] = useState('helpful');
  const [showAll, setShowAll] = useState(false);

  // Fetch real-time reviews
  useEffect(() => {
    if (!query) return;
    
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    setReviews([]);
    setStats(null);

    fetchProductReviews(query)
      .then(data => {
        if (cancelled) return;
        // Ensure safe data access
        const reviewsArray = Array.isArray(data?.reviews) ? data.reviews : [];
        const statsData = data?.stats && typeof data.stats === 'object' ? data.stats : null;
        setReviews(reviewsArray);
        setStats(statsData);
        setSource(String(data?.source || '') || '');
        setFetchedAt(String(data?.fetchedAt || '') || '');
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  // Compute retailers list from actual reviews
  const retailers = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    return [...new Set(reviews.map(r => r?.retailer).filter(Boolean))];
  }, [reviews]);

  // Filter and sort
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    if (filterRetailer !== 'all') {
      filtered = filtered.filter(r => r.retailer === filterRetailer);
    }
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        break;
      case 'highest':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'lowest':
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'helpful':
      default:
        filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
    }
    return filtered;
  }, [reviews, filterRetailer, sortBy]);

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 4);

  // ── Section Header (always visible) ──────
  const sectionHeader = (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <MessageSquareText size={20} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Customer Reviews</h2>
          <p className="text-neutral-500 text-sm mt-0.5">
            {source === 'live'
              ? 'Real-time reviews fetched from Google Shopping & Amazon'
              : 'Verified reviews from actual buyers across retailers'}
          </p>
        </div>
      </div>
      {fetchedAt && (
        <span className="text-neutral-600 text-[10px] flex items-center gap-1">
          <RefreshCw size={10} />
          Live · {getTimeAgo(fetchedAt)}
        </span>
      )}
    </div>
  );

  // ── Loading state ────────────────────────
  if (loading) {
    return (
      <section className="border-t border-neutral-800 pt-12">
        {sectionHeader}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5 animate-pulse">
              <div className="h-6 bg-neutral-800 rounded w-24 mb-3" />
              <div className="h-10 bg-neutral-800 rounded w-16 mb-2" />
              <div className="space-y-2">
                <div className="h-2 bg-neutral-800 rounded w-full" />
                <div className="h-2 bg-neutral-800 rounded w-full" />
                <div className="h-2 bg-neutral-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
        <ReviewSkeleton />
        <p className="text-center text-neutral-600 text-xs mt-4 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Fetching real-time reviews from Google Shopping & Amazon...
        </p>
      </section>
    );
  }

  // ── Error / No reviews ───────────────────
  if (error || reviews.length === 0) {
    return (
      <section className="border-t border-neutral-800 pt-12">
        {sectionHeader}
        <div className="text-center py-12 bg-neutral-900/40 rounded-2xl border border-neutral-800/40">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff size={28} className="text-neutral-500" />
          </div>
          <h3 className="text-white font-bold text-lg">No reviews available</h3>
          <p className="text-neutral-500 text-sm mt-2 max-w-md mx-auto">
            {error
              ? 'Could not fetch reviews right now. The review service may be temporarily unavailable.'
              : `No reviews found for "${query}" across our connected platforms. Try searching for a more specific product name.`}
          </p>
        </div>
      </section>
    );
  }

  // ── Main render ──────────────────────────
  return (
    <section className="border-t border-neutral-800 pt-12">
      {sectionHeader}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Average Rating */}
        <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-4xl font-black text-white">
                {stats?.avgRating?.toFixed(1) || '0.0'}
              </span>
              <div className="mt-1">
                <Stars rating={Math.round(stats?.avgRating || 0)} size={16} />
              </div>
              <p className="text-neutral-500 text-xs mt-1">{stats?.total || reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  star={star}
                  count={stats?.distribution?.[star] || 0}
                  total={stats?.total || reviews.length}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Authenticity Score */}
        <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-white font-bold text-sm">Review Authenticity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{stats?.avgGenuine || 0}%</span>
            <span className="text-neutral-500 text-xs">average genuineness</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-neutral-300 text-xs">
                {stats?.verifiedCount || 0} of {reviews.length} are verified purchases
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-neutral-300 text-xs">
                AI-analyzed for fake review patterns
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={12} className="text-blue-400" />
              <span className="text-neutral-300 text-xs">
                Sourced from {retailers.length} platform{retailers.length !== 1 ? 's' : ''} in real-time
              </span>
            </div>
          </div>
        </div>

        {/* Reviews by Retailer */}
        <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Store size={16} className="text-blue-400" />
            <span className="text-white font-bold text-sm">Reviews by Source</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
            {retailers.map((retailer) => {
              const count = reviews.filter(r => r.retailer === retailer).length;
              const avgRetailerRating =
                reviews.filter(r => r.retailer === retailer)
                  .reduce((acc, r) => acc + (r.rating || 0), 0) / count;
              const reviewObj = reviews.find(r => r.retailer === retailer);
              return (
                <div
                  key={retailer}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-neutral-800/40 rounded-lg px-2 py-1.5 transition-colors"
                  onClick={() => setFilterRetailer(filterRetailer === retailer ? 'all' : retailer)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                      style={{ backgroundColor: reviewObj?.retailerColor || '#666' }}
                    >
                      {retailer[0]}
                    </div>
                    <span className="text-neutral-300 font-medium">{retailer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars rating={Math.round(avgRetailerRating)} size={10} />
                    <span className="text-neutral-500">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter + Sort Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-neutral-500" />
          <button
            onClick={() => setFilterRetailer('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterRetailer === 'all'
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            All Sources
          </button>
          {retailers.map((retailer) => {
            const retailerObj = reviews.find(r => r.retailer === retailer);
            return (
              <button
                key={retailer}
                onClick={() => setFilterRetailer(filterRetailer === retailer ? 'all' : retailer)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  filterRetailer === retailer
                    ? 'text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
                style={
                  filterRetailer === retailer
                    ? { backgroundColor: retailerObj?.retailerColor || '#666' }
                    : {}
                }
              >
                {retailer}
              </button>
            );
          })}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-neutral-800 text-neutral-300 text-xs font-bold rounded-lg px-3 py-1.5 border border-neutral-700 focus:outline-none focus:border-neutral-600"
        >
          <option value="helpful">Most Helpful</option>
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {displayedReviews.map((review, i) => (
            <ReviewCard key={`${review.reviewer}-${review.date}-${i}`} review={review} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Show More / Less */}
      {filteredReviews.length > 4 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all border border-neutral-700"
          >
            {showAll ? 'Show Less Reviews' : `Show All ${filteredReviews.length} Reviews`}
          </button>
        </div>
      )}

      {/* Source Disclaimer */}
      <div className="mt-6 flex items-start gap-2 text-[11px] text-neutral-600 bg-neutral-900/40 rounded-xl p-3 border border-neutral-800/40">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <p>
          Reviews are fetched in real-time from Google Shopping, Amazon, and other retail platforms via SerpAPI.
          Genuineness scores are computed based on verified purchase status, review length, helpfulness votes, and content analysis.
          PriceWise AI aggregates reviews as-is and does not modify review content.
          {source === 'live' && ' These are live reviews — not cached or fabricated.'}
        </p>
      </div>
    </section>
  );
};

export default ProductReviews;
