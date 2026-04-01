import React from 'react';
import { Award, Zap, TrendingDown, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const RecommendationBanner = ({ bestOverall, bestBudget, priceSignal }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Best Overall */}
      <a
        href={bestOverall.url}
        target="_blank"
        rel="noopener noreferrer"
        className="lg:col-span-2 block"
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl p-8 text-white border border-neutral-700/80 relative overflow-hidden group cursor-pointer hover:border-neutral-600 hover:shadow-xl hover:shadow-black/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Award size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                <Award size={16} />
                <span>🏆 BEST OVERALL VALUE</span>
              </div>
              <h2 className="text-4xl font-extrabold mb-2">{bestOverall.retailer}</h2>
              <p className="text-neutral-400 text-lg mb-8">
                Highest trust score with competitive pricing and fast delivery.
              </p>
            </div>
            
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Price</p>
                <p className="text-3xl font-black">{bestOverall.price > 0 ? `₹${bestOverall.price.toLocaleString('en-IN')}` : 'Check Live'}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Trust</p>
                <p className="text-3xl font-black">{bestOverall.trust_score}%</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Delivery</p>
                <p className="text-3xl font-black">Tomorrow</p>
              </div>
              <div className="ml-auto hidden md:flex items-center space-x-2 text-neutral-500 group-hover:text-white transition-colors">
                <span className="text-sm font-bold">Visit Store</span>
                <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      </a>

      {/* Best Budget */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-neutral-900/70 rounded-3xl p-8 border border-neutral-700/60 flex flex-col justify-between"
      >
        <div>
          <div className="inline-flex items-center space-x-2 bg-green-500/10 px-4 py-1.5 rounded-full text-green-500 text-sm font-bold mb-6">
            <TrendingDown size={16} />
            <span>💸 BEST BUDGET</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">{bestBudget.retailer}</h2>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Lowest price. <span className="text-amber-500 font-bold">⚠️ Check seller rating</span> before proceeding.
          </p>
        </div>
        
        <div>
          <p className="text-2xl font-black text-white mb-6">{bestBudget.price > 0 ? `₹${bestBudget.price.toLocaleString('en-IN')}` : 'Check Live'}</p>
          <a 
            href={bestBudget.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-white font-bold text-sm bg-neutral-800 hover:bg-neutral-700 px-6 py-3 rounded-xl transition-all group"
          >
            <span>{bestBudget.price > 0 ? 'BUY NOW' : 'SEARCH NOW'}</span>
            <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </motion.div>

      {/* Signal Banner */}
      <div className="lg:col-span-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center space-x-4">
        <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shrink-0">
          <Zap size={20} fill="currentColor" />
        </div>
        <p className="text-neutral-400 font-medium">
          <span className="font-bold text-amber-500">Price Signal:</span> {priceSignal || "BUY NOW — Price is competitive. Compare and save."}
        </p>
      </div>
    </div>
  );
};

export default RecommendationBanner;
