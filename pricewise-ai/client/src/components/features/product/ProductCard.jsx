import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PRODUCT_FALLBACK_IMAGE = '/product-placeholder.svg';

function buildInlineImageFallback(label) {
  const safeLabel = String(label || 'Product').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="260" height="260" rx="20" fill="url(#g)"/><rect x="64" y="50" width="132" height="152" rx="14" fill="#0b1220" stroke="#334155"/><text x="130" y="228" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="15" font-weight="700">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ProductCard = ({ product, isWishlisted = false, onToggleWishlist }) => {
  const navigate = useNavigate();

  const imageSources = useMemo(() => {
    const label = product.name || 'Product';
    return [
      product.image,
      ...(Array.isArray(product.imageFallbacks) ? product.imageFallbacks : []),
      PRODUCT_FALLBACK_IMAGE,
      buildInlineImageFallback(label),
    ].filter(Boolean);
  }, [product.image, product.imageFallbacks, product.name]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [product.id, product.image, product.name]);

  const handleClick = () => {
    navigate(`/results?q=${encodeURIComponent(product.name)}`);
  };

  const handleImageError = () => {
    setImageIndex((prev) => {
      if (prev >= imageSources.length - 1) return prev;
      return prev + 1;
    });
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={handleClick}
      className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 transition-all hover:border-neutral-700 group flex flex-col h-full snap-start min-w-[220px] cursor-pointer"
    >
      <div className="h-40 bg-neutral-800 rounded-xl mb-4 p-4 flex items-center justify-center relative overflow-hidden">
        <img 
          src={imageSources[imageIndex] || PRODUCT_FALLBACK_IMAGE}
          alt={product.name} 
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
        <button 
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 p-2 bg-neutral-900/80 rounded-full transition-colors ${
            isWishlisted ? 'text-red-400' : 'text-neutral-500 hover:text-red-400'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
        </button>
      </div>
      
      <div className="flex-1">
        <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
        <div className="flex items-center space-x-1 mb-3">
          <Star size={12} className="text-yellow-500 fill-current" />
          <span className="text-[10px] font-bold text-neutral-500">{product.trust_score ? `Trust: ${product.trust_score}%` : '4.8 (2.4k)'}</span>
        </div>
      </div>
      
      <div className="mt-auto flex justify-between items-center pt-4 border-t border-neutral-800">
        <span className="text-lg font-black text-white">₹{product.price.toLocaleString('en-IN')}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="p-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
