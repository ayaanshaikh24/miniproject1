import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Github } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabase';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        toast.success("Account created successfully! Check your email to verify (if enabled).");
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message || "Could not sign in with Google");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neutral-900/50 rounded-full blur-[120px] -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-3xl p-8 md:p-12 border border-neutral-800 shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black font-black text-3xl mx-auto mb-6 shadow-xl">P</div>
          <h2 className="text-3xl font-black text-white mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-neutral-500">
            {isLogin ? "Join 10k+ smart shoppers today." : "Start saving with PriceWise AI."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500 group-focus-within:text-blue-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-11 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 transition-all font-medium text-white placeholder-neutral-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500 group-focus-within:text-blue-400">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-11 pr-4 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 transition-all font-medium text-white placeholder-neutral-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Password</label>
              {isLogin && <a href="#" className="text-[10px] font-bold text-blue-400 hover:underline">Forgot?</a>}
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-500 group-focus-within:text-blue-400">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 transition-all font-medium text-white placeholder-neutral-600"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 group mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Processing..." : isLogin ? "Login Now" : "Create Account"}</span>
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 flex items-center space-x-4">
          <div className="h-px bg-neutral-800 flex-1"></div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Or Continue With</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button type="button" onClick={signInWithGoogle} className="flex items-center justify-center space-x-2 py-3.5 border border-neutral-800 rounded-2xl hover:bg-neutral-800/50 transition-all text-xs font-bold text-neutral-300">
             <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-[10px]">G</div>
             <span>Google</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-3.5 border border-neutral-800 rounded-2xl hover:bg-neutral-800/50 transition-all text-xs font-bold text-neutral-300">
             <Github size={18} className="text-white" />
             <span>GitHub</span>
          </button>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-neutral-500 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
