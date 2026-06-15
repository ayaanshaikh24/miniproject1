import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ExternalLink, Star, Award, Package, Truck, ShieldCheck, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import TrustScore from '../pricing/TrustScore';
import { API_BASE } from '../../../services/api';

const PRODUCT_FALLBACK_IMAGE = '/product-placeholder.svg';

const RETAILER_BADGE_META = {
  amazon: { bg: '#111827', fg: '#f59e0b' },
  flipkart: { bg: '#1d4ed8', fg: '#ffffff' },
  croma: { bg: '#0f172a', fg: '#67e8f9' },
  'reliance digital': { bg: '#7f1d1d', fg: '#ffffff' },
  jiomart: { bg: '#4338ca', fg: '#ffffff' },
  'vijay sales': { bg: '#2563eb', fg: '#ffffff' },
  'tata cliq': { bg: '#be123c', fg: '#ffffff' },
  snapdeal: { bg: '#dc2626', fg: '#ffffff' },
  meesho: { bg: '#7e22ce', fg: '#ffffff' },
  nykaa: { bg: '#111827', fg: '#f472b6' },
  myntra: { bg: '#1f2937', fg: '#f43f5e' },
  shopclues: { bg: '#0f172a', fg: '#22d3ee' },
  'tata neu': { bg: '#1e293b', fg: '#f97316' },
  'bajaj finserv markets': { bg: '#1e3a8a', fg: '#ffffff' },
};

function normalizeStoreKey(store) {
  return String(store || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildStoreLogoDataUrl(store, meta) {
  const label = String(store || 'Store').trim().slice(0, 20);
  const bg = meta?.bg || '#111827';
  const fg = meta?.fg || '#ffffff';
  const fontSize = label.length > 12 ? 56 : 66;
  const baseline = 160;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="320" viewBox="0 0 540 320"><rect width="540" height="320" rx="36" fill="${bg}"/><text x="270" y="${baseline}" text-anchor="middle" fill="${fg}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getRetailerLogo(store) {
  const key = normalizeStoreKey(store);
  if (!key) return buildStoreLogoDataUrl('Store');
  const compact = key.replace(/\s+/g, '');
  const meta = RETAILER_BADGE_META[key] || RETAILER_BADGE_META[compact] || null;
  return buildStoreLogoDataUrl(store, meta);
}

function buildInlineImageFallback(label) {
  const safeLabel = String(label || 'Product').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="240" height="240" rx="24" fill="url(#g)"/><rect x="56" y="48" width="128" height="144" rx="14" fill="#0b1220" stroke="#334155"/><text x="120" y="214" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="15" font-weight="700">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function resolveBackendUrl(path = '') {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/api/')) return `${API_BASE}${value.slice(4)}`;
  if (value.startsWith('/')) return `${API_BASE}${value}`;
  return `${API_BASE}/${value}`;
}

function getStockColor(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('in stock')) return 'bg-emerald-500';
  if (s.includes('limited')) return 'bg-yellow-500';
  if (s.includes('out')) return 'bg-red-500';
  return 'bg-neutral-500';
}

function getStockText(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('in stock')) return 'In Stock';
  if (s.includes('limited')) return 'Limited Stock';
  if (s.includes('out')) return 'Out of Stock';
  return 'Check Site';
}

const RetailerCard = ({ retailer, isBestDeal, storeReviews = {} }) => {
  const actualBestDeal = retailer?.isBestDeal ?? isBestDeal;
  const priceDiff = retailer?.priceDifference;
  const priceDiffText = retailer?.priceDifferenceText;
  const retailerLogo = useMemo(() => getRetailerLogo(retailer?.store), [retailer?.store]);

  const storeData = storeReviews[retailer?.store] || {};
  const rating = storeData.rating ?? '—';
  const reviewCount = storeData.count ?? 0;

  const imageSources = useMemo(() => {
    const label = retailer?.name || retailer?.store || 'Product';
    return [
      retailer?.image,
      ...(Array.isArray(retailer?.imageFallbacks) ? retailer.imageFallbacks : []),
      retailerLogo,
      PRODUCT_FALLBACK_IMAGE,
      buildInlineImageFallback(label),
    ].filter(Boolean);
  }, [retailer?.image, retailer?.imageFallbacks, retailer?.name, retailer?.store, retailerLogo]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [retailer?.image, retailer?.name, retailer?.store]);

  const handleImageError = () => {
    setImageIndex((prev) => (prev >= imageSources.length - 1 ? prev : prev + 1));
  };

  const isUnavailable = Boolean(retailer?.isUnavailable || retailer?.searchOnly);
  const unavailableReason = retailer?.unavailableReason || 'This listing is currently unavailable';
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Resolve the redirect URL and open in a new tab
  const handleBuyNow = useCallback(async (e) => {
    e.preventDefault();
    const rawUrl = retailer?.url || '';
    
    // Always try to open something - if no URL, fall back to Google search
    const searchTerm = [retailer?.name || '', retailer?.store || '', 'india'].filter(Boolean).join(' ');
    const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;

    // If it's a redirect API URL, resolve it server-side first
    if (rawUrl.startsWith('/api/redirect/')) {
      setLoadingUrl(true);
      try {
        const resolvedRedirectUrl = resolveBackendUrl(rawUrl);
        const res = await fetch(resolvedRedirectUrl);
        const data = await res.json();
        window.open(data?.url || fallbackUrl, '_blank', 'noopener,noreferrer');
      } catch {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } finally {
        setLoadingUrl(false);
      }
    } else if (rawUrl && rawUrl !== '#') {
      // Direct URL (search fallback, known site URL, etc.) — open immediately
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    } else {
      // No URL - fall back to Google search
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }, [retailer?.url, retailer?.store, retailer?.name]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-neutral-900/60 rounded-3xl p-6 border transition-all flex flex-col md:flex-row gap-6 items-center ${
        actualBestDeal
          ? 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
          : 'border-neutral-800/60 hover:border-neutral-600'
      }`}
    >
      {/* Best Deal Badge */}
      {actualBestDeal && (
        <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] font-black py-1 px-3 rounded-full flex items-center space-x-1 uppercase tracking-widest z-10">
          <Award size={12} fill="currentColor" />
          <span>Best Deal</span>
        </div>
      )}

      {/* Price Difference Tag */}
      {!isUnavailable && priceDiff > 0 && (
        <div className="absolute -top-3 right-6 bg-red-500/90 text-white text-[10px] font-black py-1 px-3 rounded-full uppercase tracking-widest z-10">
          ₹{priceDiff.toLocaleString('en-IN')} more
        </div>
      )}
      {actualBestDeal && !isUnavailable && (
        <div className="absolute -top-3 right-6 bg-emerald-500/90 text-white text-[10px] font-black py-1 px-3 rounded-full uppercase tracking-widest z-10">
          Cheapest
        </div>
      )}

      {/* Product Image */}
      <div className={`h-24 w-24 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-sm ${
        isUnavailable ? 'bg-neutral-800 border border-neutral-700' : 'bg-white'
      }`}>
        {isUnavailable ? (
          retailerLogo ? (
            <img
              src={retailerLogo}
              alt={`${retailer.store || 'Retailer'} logo`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="object-contain h-full w-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-lg">
              <span className="text-2xl font-black text-white/80">
                {(retailer.store || 'S')[0].toUpperCase()}
              </span>
            </div>
          )
        ) : (
          <img
            src={imageSources[imageIndex] || PRODUCT_FALLBACK_IMAGE}
            alt={retailer.name || retailer.store || 'Product image'}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="object-contain h-full w-full"
          />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h4 className="font-bold text-white text-xl">{retailer.store}</h4>
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
              (retailer.trustScore || 0) >= 85
                ? 'bg-emerald-500/15 text-emerald-400'
                : (retailer.trustScore || 0) >= 70
                  ? 'bg-yellow-500/15 text-yellow-300'
                  : 'bg-red-500/15 text-red-400'
            }`}
          >
            {retailer.trustLabel || 'Medium'} Trust
          </span>

          {/* Stock Status Badge */}
          {!isUnavailable && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800">
              <span className={`w-1.5 h-1.5 rounded-full ${getStockColor(retailer.stockStatus)}`} />
              {getStockText(retailer.stockStatus)}
            </span>
          )}

          {!isUnavailable && retailer?.stalePrice && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Latest Known Price
            </span>
          )}

          {!isUnavailable && !retailer?.stalePrice && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              Live Price
            </span>
          )}

          {isUnavailable && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-300">
              Unavailable
            </span>
          )}
        </div>

        <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{retailer.name}</p>

        {/* Meta Row: Rating, Seller, Delivery */}
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
          {rating && rating !== 'N/A' && rating !== '—' && Number(rating) > 0 ? (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span className="text-white text-sm font-bold">{rating}</span>
              <span className="text-neutral-500 text-xs text-nowrap">({reviewCount?.toLocaleString?.('en-IN') || reviewCount || 0} reviews)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-neutral-600" />
              <span className="text-neutral-500 text-xs">
                {rating === '—' || rating === 'N/A' ? '—' : 'No ratings available'}
              </span>
            </div>
          )}

          {retailer.sellerName && retailer.sellerName !== retailer.store && (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <ShieldCheck size={12} />
              <span>{retailer.sellerName}</span>
            </div>
          )}

          {retailer.isOfficialStore && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              Official Store
            </span>
          )}

          {retailer.deliveryDate && retailer.deliveryDate !== 'Check on site' && (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <Truck size={12} />
              <span>{retailer.deliveryDate}</span>
            </div>
          )}
        </div>

        {/* Coupon */}
        {retailer.couponText && (
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
            <Tag size={12} />
            <span className="font-bold">{retailer.couponText}</span>
          </div>
        )}

        <div className="mt-3 max-w-xs mx-auto md:mx-0">
          <TrustScore score={retailer.trustScore || 50} size="sm" />
        </div>
      </div>

      {/* Price */}
      <div className="text-center md:text-right shrink-0 min-w-[150px]">
        {retailer.price && !isUnavailable ? (
          <>
            <span className="text-3xl font-black text-white">
              {typeof retailer.price === 'number' ? `₹${retailer.price.toLocaleString('en-IN')}` : retailer.price}
            </span>
            {priceDiffText && (
              <p className="text-xs text-red-400 mt-1">{priceDiffText}</p>
            )}
            {actualBestDeal && (
              <p className="text-xs text-emerald-400 font-bold mt-1">Lowest price found</p>
            )}
          </>
        ) : (
          <div>
            <span className="text-neutral-300 font-bold block text-sm">Currently unavailable</span>
            <span className="text-neutral-500 text-[10px] block mt-1 uppercase tracking-wider">{unavailableReason}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
        <button
          onClick={handleBuyNow}
          disabled={loadingUrl}
          className={`w-full md:w-44 flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-black shadow-lg transition-all disabled:opacity-60 disabled:cursor-wait ${
            actualBestDeal
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          <span>{loadingUrl ? 'Opening…' : 'Buy Now'}</span>
          <ExternalLink size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default RetailerCard;
