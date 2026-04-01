import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Bell, History, Settings, Trash2, ArrowUpRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { wishlist } from '../constants/mockData';
import ProductCard from '../components/features/product/ProductCard';
import { supabase } from '../utils/supabase';
import { getStoredAlerts, removePriceAlert, subscribeToAlerts } from '../utils/alerts';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('wishlist');
  const [alerts, setAlerts] = useState(() => getStoredAlerts());
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const raw = localStorage.getItem('pw-wishlist');
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : wishlist;
    } catch {
      return wishlist;
    }
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    setAlerts(getStoredAlerts());
    const unsubscribe = subscribeToAlerts(setAlerts);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = useMemo(() => {
    const fullName = user?.user_metadata?.full_name?.trim();
    if (fullName) return fullName;
    const email = user?.email?.trim();
    if (email) return email.split('@')[0];
    return 'User';
  }, [user]);

  const initials = useMemo(() => {
    const words = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || '');
    return words.join('') || 'U';
  }, [displayName]);

  const tabs = [
    { id: 'wishlist', label: 'Wishlist', icon: <Bookmark size={18} /> },
    { id: 'alerts', label: 'Price Alerts', icon: <Bell size={18} /> },
    { id: 'history', label: 'Search History', icon: <History size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={18} /> },
  ];

  const removeAlert = (id) => {
    setAlerts(removePriceAlert(id));
  };

  useEffect(() => {
    localStorage.setItem('pw-wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const handleToggleWishlist = (product) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== product.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-neutral-900 rounded-3xl p-4 border border-neutral-800 sticky top-32">
             <div className="flex items-center space-x-3 px-4 py-6 mb-6">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">{initials}</div>
                <div>
                 <h3 className="font-bold text-white leading-tight">{displayName}</h3>
                   <p className="text-neutral-500 text-xs">Premium Member</p>
                </div>
             </div>
             <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-neutral-800 text-white' 
                        : 'text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
             </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'wishlist' && (
              <motion.div 
                key="wishlist"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black text-white">Your Wishlist</h2>
                   <span className="text-sm font-bold text-neutral-500">{wishlistItems.length} Items Saved</span>
                </div>
                {wishlistItems.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 text-center">
                    <h3 className="text-lg font-bold text-white">Your wishlist is empty</h3>
                    <p className="mt-2 text-sm text-neutral-400">Use the heart icon on products to save them here.</p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map(item => {
                    const priceDifference = item.old_price ? item.old_price - item.price : 0;
                    return (
                      <div key={item.id} className="relative group">
                        {item.dropped && priceDifference > 0 && (
                          <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                            PRICE DROPPED ₹{priceDifference.toLocaleString('en-IN')}!
                          </div>
                        )}
                        <ProductCard
                          product={{ id: item.id, name: item.name, price: item.price, image: item.image, imageFallbacks: item.imageFallbacks }}
                          isWishlisted
                          onToggleWishlist={handleToggleWishlist}
                        />
                      </div>
                    );
                  })}
                </div>
                )}
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black text-white">Active Price Alerts</h2>
                   <button className="px-4 py-2 bg-white text-black rounded-xl font-bold text-xs shadow-lg">Add New Alert</button>
                </div>
                <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-neutral-950 text-xs font-black uppercase tracking-widest text-neutral-500">
                         <th className="px-8 py-5">Product</th>
                         <th className="px-8 py-5 text-center">Target Price</th>
                         <th className="px-8 py-5 text-center">Current Price</th>
                         <th className="px-8 py-5 text-center">Status</th>
                         <th className="px-8 py-5 text-right">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-800">
                       {alerts.map(alert => (
                         <tr key={alert.id} className="text-sm hover:bg-neutral-800/50 transition-colors">
                            <td className="px-8 py-6 font-bold text-white">{alert.product}</td>
                            <td className="px-8 py-6 text-center font-black text-blue-400">₹{alert.target_price.toLocaleString('en-IN')}</td>
                            <td className="px-8 py-6 text-center font-bold text-neutral-400">₹{alert.current_price.toLocaleString('en-IN')}</td>
                            <td className="px-8 py-6 text-center">
                               <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full uppercase">Active</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button onClick={() => removeAlert(alert.id)} className="p-2 text-neutral-500 hover:text-red-500 transition-colors">
                                 <Trash2 size={18} />
                               </button>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black text-white">Recent Searches</h2>
                </div>
                <div className="space-y-4">
                   {["Samsung Galaxy S24", "iPhone 15 Pro Max", "Sony WH-1000XM5", "MacBook Pro M3", "Logitech MX Master 3S"].map((search, idx) => (
                     <div key={idx} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex items-center justify-between group hover:border-neutral-700 transition-all">
                        <div className="flex items-center space-x-4">
                           <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-500">
                             <History size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-white">{search}</p>
                              <p className="text-xs text-neutral-500">Searched Oct 24, 2024</p>
                           </div>
                        </div>
                        <button className="flex items-center space-x-2 text-blue-400 font-bold text-sm bg-blue-500/10 px-5 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                           <span>Search Again</span>
                           <ArrowUpRight size={16} />
                        </button>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div 
                key="preferences"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <h2 className="text-3xl font-black text-white">Preferences</h2>
                <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 space-y-12">
                   {/* Preferred Retailers */}
                   <div className="space-y-6">
                      <h4 className="font-bold text-white uppercase tracking-widest text-xs">Preferred Retailers</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {["Amazon", "Flipkart", "Croma", "Reliance Digital", "Tata Cliq", "Myntra"].map(r => (
                          <label key={r} className="flex items-center space-x-3 cursor-pointer group">
                             <div className="relative w-6 h-6 border-2 border-neutral-700 rounded-lg group-hover:border-blue-500 transition-all flex items-center justify-center bg-neutral-800">
                                <input type="checkbox" className="sr-only" defaultChecked />
                                <CheckCircle size={14} className="text-blue-400" />
                             </div>
                             <span className="text-sm font-medium text-neutral-300">{r}</span>
                          </label>
                        ))}
                      </div>
                   </div>

                   <div className="h-px bg-neutral-800"></div>

                   {/* Notification Toggles */}
                   <div className="space-y-6">
                      <h4 className="font-bold text-white uppercase tracking-widest text-xs">Notifications</h4>
                      <div className="space-y-4">
                        {[
                          { label: "Email Notifications", desc: "Get daily price summaries." },
                          { label: "Push Notifications", desc: "Instant alerts for target price matches." },
                          { label: "SMS Alerts", desc: "For high-priority flash sales." }
                        ].map((n, idx) => (
                           <div key={idx} className="flex items-center justify-between">
                             <div>
                               <p className="font-bold text-white text-sm">{n.label}</p>
                               <p className="text-xs text-neutral-500">{n.desc}</p>
                             </div>
                             <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <button className="w-full py-4 bg-white text-black rounded-2xl font-bold shadow-xl hover:bg-neutral-200 transition-all">
                      Save All Changes
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
