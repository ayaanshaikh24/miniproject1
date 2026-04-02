import React from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Lowest Price' },
  { value: 'trust-desc', label: 'Highest Trust' },
  { value: 'delivery', label: 'Fastest Delivery' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 3, label: '3★+' },
  { value: 4, label: '4★+' },
  { value: 4.5, label: '4.5★+' },
];

const FilterSortBar = ({ sortBy, setSortBy, inStockOnly, setInStockOnly, minRating, setMinRating }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} className="text-neutral-500" />
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sort:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sortBy === opt.value
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-neutral-800 hidden md:block" />

      {/* Filter: In Stock */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-neutral-500" />
        <button
          onClick={() => setInStockOnly(!inStockOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            inStockOnly
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          In Stock Only
        </button>
      </div>

      {/* Filter: Min Rating */}
      <div className="flex items-center gap-1">
        {RATING_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setMinRating(opt.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              minRating === opt.value
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSortBar;
