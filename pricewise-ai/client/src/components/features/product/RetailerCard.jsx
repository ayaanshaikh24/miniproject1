import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import TrustScore from '../pricing/TrustScore';

const PRODUCT_FALLBACK_IMAGE = '/product-placeholder.svg';

function buildInlineImageFallback(label) {
  const safeLabel = String(label || 'Product').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="240" height="240" rx="24" fill="url(#g)"/><rect x="56" y="48" width="128" height="144" rx="14" fill="#0b1220" stroke="#334155"/><text x="120" y="214" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="15" font-weight="700">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const RetailerCard = ({ retailer, isBestDeal }) => {
  const imageSources = useMemo(() => {
    const label = retailer?.name || retailer?.store || 'Product';
    const namedFallback = `https://picsum.photos/seed/${encodeURIComponent(label)}/320/320`;
    return [
      retailer?.image,
      ...(Array.isArray(retailer?.imageFallbacks) ? retailer.imageFallbacks : []),
      namedFallback,
      PRODUCT_FALLBACK_IMAGE,
      buildInlineImageFallback(label),
    ].filter(Boolean);
  }, [retailer?.image, retailer?.imageFallbacks, retailer?.name, retailer?.store]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [retailer?.image, retailer?.name, retailer?.store]);

  const handleImageError = () => {
    setImageIndex((prev) => {
      if (prev >= imageSources.length - 1) return prev;
      return prev + 1;
    });
  };

  const isUnavailable = Boolean(retailer?.isUnavailable);
  const unavailableReason = retailer?.unavailableReason || 'This listing is currently unavailable';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-neutral-900/60 rounded-3xl p-6 border transition-all flex flex-col md:flex-row gap-6 items-center ${
        isBestDeal 
          ? 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
          : 'border-neutral-800/60 hover:border-neutral-600'
      }`}
    >
      {isBestDeal && (
        <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] font-black py-1 px-3 rounded-full flex items-center space-x-1 uppercase tracking-widest z-10">
          <Award size={12} fill="currentColor" />
          <span>Best Deal</span>
        </div>
      )}

      {/* Product Image or Unavailable Logo */}
      <div className={`h-24 w-24 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-sm ${
        isUnavailable 
          ? 'bg-neutral-800 border border-neutral-700' 
          : 'bg-white'
      }`}>
        {isUnavailable ? (
          // Show store initial badge instead of product image when unavailable
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
          {isUnavailable && (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-300">
              Unavailable
            </span>
          )}
        </div>
        <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{retailer.name}</p>
        
        <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
          <Star size={14} className="text-yellow-400 fill-current" />
          <span className="text-white text-sm font-bold">{retailer.rating || 'N/A'}</span>
          <span className="text-neutral-500 text-xs text-nowrap">({retailer.reviews || 0} reviews)</span>
        </div>

        <div className="mt-3 max-w-xs mx-auto md:mx-0">
          <TrustScore score={retailer.trustScore || 50} size="sm" />
        </div>
      </div>

      {/* Price */}
      <div className="text-center md:text-right shrink-0 min-w-[150px]">
        {retailer.price && !isUnavailable ? (
          <span className="text-3xl font-black text-white">
            {typeof retailer.price === 'number' ? `₹${retailer.price.toLocaleString('en-IN')}` : retailer.price}
          </span>
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
          target={!isUnavailable && retailer.url ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isUnavailable || !retailer.url) e.preventDefault();
          }}
          className={`w-full md:w-44 flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-black shadow-lg transition-all ${
            isUnavailable
              ? 'bg-neutral-700 text-neutral-300 cursor-not-allowed'
              : isBestDeal 
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
