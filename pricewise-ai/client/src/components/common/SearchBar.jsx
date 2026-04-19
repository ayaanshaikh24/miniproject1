import React, { useState } from 'react';
import { Search, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const URL_QUERY_KEYS = ['k', 'q', 'query', 'search', 'keyword', 'product', 'productname', 'name', 'title'];

const BRAND_TOKENS = new Set([
  'apple', 'iphone', 'samsung', 'galaxy', 'oneplus', 'pixel', 'xiaomi', 'redmi',
  'realme', 'vivo', 'oppo', 'motorola', 'moto', 'nothing',
]);

const VARIANT_TOKENS = new Set(['pro', 'max', 'plus', 'ultra', 'fe', 'mini', 'lite', 'r']);

const NOISE_TOKENS = new Set([
  'www', 'http', 'https', 'com', 'in', 'co', 'net', 'org',
  'product', 'products', 'item', 'items', 'buy', 'shop', 'store', 'official',
  'online', 'india', 'offer', 'offers', 'deals', 'deal', 'price', 'best',
  'new', 'latest', 'with', 'and', 'for', 'from', 'the', 'this', 'that', 'your',
  'ref', 'refs', 'utm', 'source', 'medium', 'campaign', 'pid', 'sku', 'asin',
  'dp', 'gp', 'pd', 'p', 'slrdl', 'click', 'redirect', 'amp', 'html', 'htm',
  'amazon', 'flipkart', 'myntra', 'meesho', 'snapdeal', 'tatacliq', 'jiomart',
  'croma', 'reliancedigital', 'vijaysales', 'nykaa', 'ajio',
]);

function cleanSegment(value = '') {
  return String(value)
    .replace(/\.[a-z]{2,4}$/i, ' ')
    .replace(/[-_+/]+/g, ' ')
    .replace(/%[0-9a-f]{2}/gi, ' ')
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeExtractedProductQuery(raw = '') {
  const normalized = cleanSegment(raw).toLowerCase();
  if (!normalized) return '';

  const tokens = normalized.split(' ').filter(Boolean).filter((token) => {
    if (token.length <= 1) return false;
    if (NOISE_TOKENS.has(token)) return false;
    // Drop long mixed IDs (tracking ids / SKU-like hashes)
    if (token.length >= 10 && /\d/.test(token) && /[a-z]/.test(token)) return false;
    return true;
  });

  if (tokens.length === 0) return '';

  // Keep a compact, search-friendly query to improve cross-retailer matching.
  return tokens.slice(0, 8).join(' ');
}

function extractParamCandidate(parsedUrl) {
  for (const key of URL_QUERY_KEYS) {
    const value = parsedUrl.searchParams.get(key);
    const cleaned = sanitizeExtractedProductQuery(value || '');
    if (cleaned) return cleaned;
  }

  const allParamValues = Array.from(parsedUrl.searchParams.values()).join(' ');
  return sanitizeExtractedProductQuery(allParamValues);
}

function simplifyQueryForSearch(query = '') {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return '';

  const tokens = q.split(' ').filter(Boolean);
  const numberToken = tokens.find((token) => /^\d{1,3}$/.test(token));
  const brandToken = tokens.find((token) => BRAND_TOKENS.has(token));
  const variantToken = tokens.find((token) => VARIANT_TOKENS.has(token));
  const isPhoneLike = Boolean(brandToken) && Boolean(numberToken);

  if (!isPhoneLike) return query;

  const compact = [brandToken, numberToken];
  if (variantToken) compact.push(variantToken);
  return compact.join(' ').trim();
}


// Extracts a product name from a retailer URL
function extractProductFromUrl(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = parsed.hostname.toLowerCase();
    const path = decodeURIComponent(parsed.pathname);
    const paramCandidate = extractParamCandidate(parsed);

    if (paramCandidate) return paramCandidate;

    // Amazon: /Product-Name-Here/dp/ASIN
    if (hostname.includes('amazon')) {
      const parts = path.split('/').filter(Boolean);
      // Find the part before "dp"
      const dpIndex = parts.indexOf('dp');
      if (dpIndex > 0) {
        return sanitizeExtractedProductQuery(parts[dpIndex - 1]);
      }
      // Fallback: use search param
      const searchParam = parsed.searchParams.get('k');
      if (searchParam) return sanitizeExtractedProductQuery(searchParam);
      // Use first path segment
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[0]);
    }

    // Flipkart: /product-name-here/p/itemid
    if (hostname.includes('flipkart')) {
      const parts = path.split('/').filter(Boolean);
      const pIndex = parts.indexOf('p');
      if (pIndex > 0) {
        return sanitizeExtractedProductQuery(parts[pIndex - 1]);
      }
      // Search URL
      const searchParam = parsed.searchParams.get('q');
      if (searchParam) return sanitizeExtractedProductQuery(searchParam);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[0]);
    }

    // Croma: /product-name/p/12345
    if (hostname.includes('croma')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[parts.length - 1]);
    }

    // Reliance Digital
    if (hostname.includes('reliancedigital')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[parts.length - 1]);
    }

    // Meesho
    if (hostname.includes('meesho')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[0]);
    }

    // Myntra
    if (hostname.includes('myntra')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[parts.length - 1]);
    }

    // Snapdeal
    if (hostname.includes('snapdeal')) {
      const parts = path.split('/').filter(Boolean);
      const prodIndex = parts.indexOf('product');
      if (prodIndex >= 0 && parts.length > prodIndex + 1) {
        return sanitizeExtractedProductQuery(parts[prodIndex + 1]);
      }
    }

    // Tata Cliq
    if (hostname.includes('tatacliq')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[parts.length - 1]);
    }

    // JioMart
    if (hostname.includes('jiomart')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return sanitizeExtractedProductQuery(parts[parts.length - 1]);
    }

    // Generic fallback: combine path segments and query params, then sanitize.
    const pathText = path
      .split('/')
      .filter(Boolean)
      .map((segment) => cleanSegment(segment))
      .join(' ');

    const fallback = sanitizeExtractedProductQuery(`${pathText} ${Array.from(parsed.searchParams.values()).join(' ')}`);
    if (fallback) return fallback;
    
    return null;
  } catch {
    return null;
  }
}

const SearchBar = () => {
  const [activeTab, setActiveTab] = useState('url');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const loadingSteps = [
    "🔍 Identifying product...",
    "🛍️ Comparing 10 stores...",
    "🤖 Analyzing reviews..."
  ];

  const validateUrl = (url) => {
    const pattern = /^(https?:\/\/)?[\w.-]+\.\w{2,}(\/\S*)?$/;
    return pattern.test(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let searchQuery = inputValue.trim();
    if (activeTab === 'url') {
      if (!validateUrl(searchQuery)) {
        setError('Please enter a valid product URL from Amazon, Flipkart, etc.');
        return;
      }
      const extracted = extractProductFromUrl(searchQuery);
      if (!extracted) {
        setError('Could not detect product from this URL. Paste a direct product page URL.');
        return;
      }
      searchQuery = simplifyQueryForSearch(extracted);
    }
    setError('');
    setIsLoading(true);
    let step = 0;
    const interval = setInterval(() => {
      if (step < loadingSteps.length - 1) {
        step++;
        setLoadingStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          setLoadingStep(0);
          navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
        }, 800);
      }
    }, 1200);
  };

  const tabs = [
    { id: 'url', label: 'Paste URL', icon: <LinkIcon size={16} /> },
    { id: 'name', label: 'Type Name', icon: <Search size={16} /> },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex space-x-1 mb-4 bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-fit mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-neutral-800 text-white' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form id="search-form" onSubmit={handleSubmit} className="relative group">
        <div className={`relative flex items-center bg-neutral-900 border transition-all rounded-2xl shadow-lg shadow-black/30 px-2 ${
          error ? 'border-red-500' : 'border-neutral-800 group-focus-within:border-neutral-600'
        }`}>
          <div className="pl-4 text-neutral-500">
            {activeTab === 'url' ? <LinkIcon size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={
              activeTab === 'url' ? "Paste product URL from Amazon, Flipkart, Myntra..." :
              "Search laptops, washing machines, mobiles, anything..."
            }
            className="w-full py-5 px-4 bg-transparent outline-none text-white placeholder-neutral-600 text-lg font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue}
            className="bg-white hover:bg-neutral-200 text-black font-bold py-3.5 px-8 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed m-2 flex items-center space-x-2 shrink-0"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
            <span>Compare Now</span>
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-10 left-0 flex items-center space-x-2 text-red-400 text-sm font-medium"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                <motion.div 
                  className="absolute inset-0 border-4 border-white rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                ></motion.div>
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Search size={32} />
                </div>
              </div>
              <motion.h3 
                key={loadingStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-white"
              >
                {loadingSteps[loadingStep]}
              </motion.h3>
              <p className="text-neutral-500 mt-2">Hang tight, we're doing the heavy lifting.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
