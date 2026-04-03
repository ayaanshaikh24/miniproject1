import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Search, User, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const Navbar = ({ darkMode, setDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Compare', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'py-3 bg-[#0d0d12]/85 backdrop-blur-xl border-b border-neutral-800/60 shadow-lg shadow-black/30' 
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-black text-sm">P</div>
            <span className="text-xl font-bold tracking-tight text-white">PriceWise <span className="text-neutral-500">AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  location.pathname === link.path ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-neutral-300">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="px-5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-sm font-bold rounded-full transition-all flex items-center space-x-2"
                >
                  <span>Logout</span>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">Login</Link>
                <Link to="/login" className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-sm font-bold rounded-full transition-all">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-neutral-400"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-neutral-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-medium text-neutral-400 hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-4">
                {user ? (
                  <>
                    <span className="text-sm font-medium text-neutral-300">{user.email}</span>
                    <button onClick={handleLogout} className="w-full py-3 bg-neutral-900 text-white border border-neutral-800 text-center font-bold rounded-xl flex justify-center items-center space-x-2">
                       <span>Logout</span>
                       <LogOut size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="text-base font-medium text-neutral-400">Login</Link>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full py-3 bg-white text-black text-center font-bold rounded-xl">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
