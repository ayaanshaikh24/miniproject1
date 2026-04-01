import React, { useEffect, useState } from 'react';
import { Target, Mail, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPriceAlert } from '../../../utils/alerts';

const PriceAlertModal = ({ isOpen, onClose, currentPrice, productName }) => {
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState(currentPrice - 2000);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTarget(Math.max((currentPrice || 0) - 2000, 0));
  }, [currentPrice, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericTarget = Number(target);
    if (!numericTarget || numericTarget <= 0) {
      toast.error('Enter a valid target price.');
      return;
    }

    createPriceAlert({
      product: productName || 'Tracked product',
      targetPrice: numericTarget,
      currentPrice,
      email,
    });

    setSubmitted(true);
    toast.success("Price alert set! We'll notify you.");
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail('');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          ></motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {submitted ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white">Alert Set!</h3>
                <p className="text-neutral-500">We'll email you at <b className="text-white">{email}</b> as soon as the price hits <b className="text-white">₹{target.toLocaleString('en-IN')}</b>.</p>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-neutral-800 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-800 text-neutral-400 rounded-xl flex items-center justify-center">
                      <Target size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Set Price Alert</h3>
                  </div>
                  <button onClick={onClose} className="text-neutral-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500">Target Price (₹)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500 font-bold">₹</div>
                      <input 
                        type="number" 
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 text-lg font-black text-white"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-600">Current lowest: ₹{Number(currentPrice || 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500">Notification Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 text-white placeholder-neutral-600"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-bold rounded-2xl transition-all"
                  >
                    Set Tracking Alert
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PriceAlertModal;
