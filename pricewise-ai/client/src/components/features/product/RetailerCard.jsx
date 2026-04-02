import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Star, Award, Package, Truck, ShieldCheck, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import TrustScore from '../pricing/TrustScore';

const PRODUCT_FALLBACK_IMAGE = '/product-placeholder.svg';

function buildInlineImageFallback(label) {
  const safeLabel = String(label || 'Product').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="240" height="240" rx="24" fill="url(#g)"/><rect x="56" y="48" width="128" height="144" rx="14" fill="#0b1220" stroke="#334155"/><text x="120" y="214" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="15" font-weight="700">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

const RetailerCard = ({ retailer, isBestDeal }) => {
  const actualBestDeal = retailer?.isBestDeal ?? isBestDeal;
  const priceDiff = retailer?.priceDifference;
  const priceDiffText = retailer?.priceDifferenceText;

  const imageSources = useMemo(() => {
    const label = retailer?.name || retailer?.store || 'Product';
    return [
      retailer?.image,
      ...(Array.isArray(retailer?.imageFallbacks) ? retailer.imageFallbacks : []),
      PRODUCT_FALLBACK_IMAGE,
      buildInlineImageFallback(label),
    ].filter(Boolean);
  }, [retailer?.image, retailer?.imageFallbacks, retailer?.name, retailer?.store]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [retailer?.image, retailer?.name, retailer?.store]);

  const handleImageError = () => {
    setImageIndex((prev) => (prev >= imageSources.length - 1 ? prev : prev + 1));
  };

  const isUnavailable = Boolean(retailer?.isUnavailable || retailer?.searchOnly);
  const unavailableReason = retailer?.unavailableReason || 'This listing is currently unavailable';

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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-lg">
            <span className="text-2xl font-black text-white/80">
              {(retailer.store || 'S')[0].toUpperCase()}
            </span>
          </div>
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

          {isUnavailable && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-300">
              Unavailable
            </span>
          )}
        </div>

        <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{retailer.name}</p>

        {/* Meta Row: Rating, Seller, Delivery */}
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-white text-sm font-bold">{retailer.rating || 'N/A'}</span>
            <span className="text-neutral-500 text-xs text-nowrap">({retailer.reviews || 0} reviews)</span>
          </div>

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
        <a
          href={isUnavailable ? '#' : (retailer.url || '#')}
          target={!isUnavailable && retailer.url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          onClick={(e) => { if (isUnavailable || !retailer.url) e.preventDefault(); }}
          className={`w-full md:w-44 flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-black shadow-lg transition-all ${
            isUnavailable
              ? 'bg-neutral-700 text-neutral-300 cursor-not-allowed'
              : actualBestDeal
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          <span>{isUnavailable ? 'Unavailable' : 'Buy Now'}</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  );
};

export default RetailerCard;
