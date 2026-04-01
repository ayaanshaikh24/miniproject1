import React, { useState } from 'react';
import { Search, Camera, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Extracts a product name from a retailer URL
function extractProductFromUrl(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = parsed.hostname.toLowerCase();
    const path = decodeURIComponent(parsed.pathname);

    // Amazon: /Product-Name-Here/dp/ASIN
    if (hostname.includes('amazon')) {
      const parts = path.split('/').filter(Boolean);
      // Find the part before "dp"
      const dpIndex = parts.indexOf('dp');
      if (dpIndex > 0) {
        return parts[dpIndex - 1].replace(/-/g, ' ');
      }
      // Fallback: use search param
      const searchParam = parsed.searchParams.get('k');
      if (searchParam) return searchParam;
      // Use first path segment
      if (parts.length > 0) return parts[0].replace(/-/g, ' ');
    }

    // Flipkart: /product-name-here/p/itemid
    if (hostname.includes('flipkart')) {
      const parts = path.split('/').filter(Boolean);
      const pIndex = parts.indexOf('p');
      if (pIndex > 0) {
        return parts[pIndex - 1].replace(/-/g, ' ');
      }
      // Search URL
      const searchParam = parsed.searchParams.get('q');
      if (searchParam) return searchParam;
      if (parts.length > 0) return parts[0].replace(/-/g, ' ');
    }

    // Croma: /product-name/p/12345
    if (hostname.includes('croma')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].replace(/-/g, ' ');
    }

    // Reliance Digital
    if (hostname.includes('reliancedigital')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].replace(/-/g, ' ');
    }

    // Meesho
    if (hostname.includes('meesho')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[0].replace(/-/g, ' ');
    }

    // Myntra
    if (hostname.includes('myntra')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].replace(/-/g, ' ');
    }

    // Snapdeal
    if (hostname.includes('snapdeal')) {
      const parts = path.split('/').filter(Boolean);
      const prodIndex = parts.indexOf('product');
      if (prodIndex >= 0 && parts.length > prodIndex + 1) {
        return parts[prodIndex + 1].replace(/-/g, ' ');
      }
    }

    // Tata Cliq
    if (hostname.includes('tatacliq')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].replace(/-/g, ' ');
    }

    // JioMart
    if (hostname.includes('jiomart')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].replace(/-/g, ' ');
    }

    // Generic fallback: take the longest path segment and clean it up
    const parts = path.split('/').filter(p => p.length > 2);
    if (parts.length > 0) {
      // Find the longest segment (likely the product name)
      const longest = parts.reduce((a, b) => a.length > b.length ? a : b, '');
      return longest.replace(/[-_]/g, ' ');
    }
    
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
  const [isImageSearch, setIsImageSearch] = useState(false);
  const navigate = useNavigate();

  const baseLoadingSteps = [
    "🔍 Identifying product...",
    "🛍️ Comparing 10 stores...",
    "🤖 Analyzing reviews..."
  ];

  const loadingSteps = isImageSearch 
    ? ["📸 Analyzing image to detect product...", ...baseLoadingSteps] 
    : baseLoadingSteps;

  const validateUrl = (url) => {
    const pattern = /^(https?:\/\/)?[\w.-]+\.\w{2,}(\/\S*)?$/;
    return pattern.test(url);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate extracting product name from image
    setIsImageSearch(true);
    
    // Create a fun fake product name from the filename
    const filename = file.name.split('.')[0];
    const extractedName = filename.replace(/[-_@]/g, ' ') || 'Smart Watch';
    
    setInputValue(extractedName);
    
    // Automatically submit after a short delay to simulate "processing image"
    setTimeout(() => {
      document.getElementById('search-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 500);
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
      if (extracted) {
        searchQuery = extracted;
      }
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
          setIsImageSearch(false);
          navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
        }, 800);
      }
    }, 1200);
  };

  const tabs = [
    { id: 'url', label: 'Paste URL', icon: <LinkIcon size={16} /> },
    { id: 'name', label: 'Type Name', icon: <Search size={16} /> },
    { id: 'image', label: 'Upload Image', icon: <Camera size={16} /> },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex space-x-1 mb-4 bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-fit mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== 'image') setIsImageSearch(false);
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
        <div className={`relative flex items-center bg-neutral-900 border transition-all rounded-2xl shadow-lg shadow-black/30 px-2 overflow-hidden ${
          error ? 'border-red-500' : 'border-neutral-800 group-focus-within:border-neutral-600'
        }`}>
          <div className="pl-4 text-neutral-500">
            {activeTab === 'url' ? <LinkIcon size={20} /> : activeTab === 'image' ? <Camera size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || activeTab === 'image'}
            placeholder={
              activeTab === 'url' ? "Paste product URL from Amazon, Flipkart, Myntra..." :
              activeTab === 'image' ? "Click camera to upload product photo" :
              "Enter product name (e.g. iPhone 15)"
            }
            className={`w-full py-5 px-4 bg-transparent outline-none text-white placeholder-neutral-600 text-lg font-medium ${
              activeTab === 'image' ? 'cursor-not-allowed opacity-50' : ''
            }`}
          />
          {activeTab === 'image' && (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload Product Image"
              />
              <button type="button" className="p-3 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg mr-2 transition-colors">
                <Camera size={20} />
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || (!inputValue && activeTab !== 'image')}
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
                  {isImageSearch ? <Camera size={32} /> : <Search size={32} />}
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
