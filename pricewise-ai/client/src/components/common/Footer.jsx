import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-neutral-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-black text-sm">P</div>
              <span className="text-xl font-bold text-white">PriceWise <span className="text-neutral-500">AI</span></span>
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed">
              India's smartest shopping companion. Never overpay again.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Navigation</h4>
            <ul className="space-y-3">
              {[{name: 'Home', path: '/'}, {name: 'Compare Products', path: '/'}, {name: 'Dashboard', path: '/dashboard'}].map(link => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-neutral-500 hover:text-white transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-neutral-500 hover:text-white transition-colors">How it Works</Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-neutral-500 hover:text-white transition-colors">My Dashboard</Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-neutral-500 hover:text-white transition-colors">Sign In / Register</Link>
              </li>
              <li>
                <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:text-white transition-colors">Powered by SerpAPI</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Stay Updated</h4>
            <p className="text-neutral-500 text-sm mb-4">Get weekly deal insights delivered to your inbox.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-3 rounded-l-xl outline-none placeholder-neutral-600 focus:border-neutral-600"
              />
              <button className="bg-white text-black px-4 py-3 rounded-r-xl hover:bg-neutral-200 transition-colors">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-600 text-xs">© 2024 PriceWise AI. All rights reserved.</p>
          <p className="text-neutral-600 text-xs">Built with ♥ for Indian shoppers.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
