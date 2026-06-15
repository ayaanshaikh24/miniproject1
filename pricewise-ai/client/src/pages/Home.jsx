import React from 'react';
import { Shield, Zap, Sparkles, CheckCircle, ArrowRight, Star, Search, TrendingDown, Eye, Lock, Box, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { cn } from '../utils/utils';
import SearchBar from '../components/common/SearchBar';

const PRODUCT_FALLBACK_IMAGE = '/product-placeholder.svg';

const RETAILER_LOGOS = {
  Flipkart: ['https://logo.clearbit.com/flipkart.com'],
  Amazon: ['https://logo.clearbit.com/amazon.in', 'https://logo.clearbit.com/amazon.com'],
  Croma: ['https://logo.clearbit.com/croma.com'],
  Reliance: ['https://logo.clearbit.com/reliancedigital.in'],
  'Tata Cliq': ['https://logo.clearbit.com/tatacliq.com'],
  JioMart: ['https://logo.clearbit.com/jiomart.com'],
};

const RecentProductCard = ({ product, onClick }) => {
  const namedFallback = `https://dummyimage.com/600x600/1f2937/e5e7eb&text=${encodeURIComponent(product.name)}`;
  const imageSources = [
    product.image,
    ...(product.imageFallbacks || []),
    `https://source.unsplash.com/600x600/?${encodeURIComponent(product.name + ' product')}`,
    namedFallback,
    PRODUCT_FALLBACK_IMAGE,
  ].filter(Boolean);
  const logoSources = [
    ...(RETAILER_LOGOS[product.retailer] || []),
    ...(product.retailerLogoFallbacks || []),
  ].filter(Boolean);

  const [imageIndex, setImageIndex] = React.useState(0);
  const [logoIndex, setLogoIndex] = React.useState(0);
  const [showLogoImage, setShowLogoImage] = React.useState(logoSources.length > 0);

  React.useEffect(() => {
    setImageIndex(0);
    setLogoIndex(0);
    setShowLogoImage(logoSources.length > 0);
  }, [product.name, product.image, logoSources.length]);

  const handleImageError = () => {
    setImageIndex((prev) => (prev < imageSources.length - 1 ? prev + 1 : prev));
  };

  const handleLogoError = () => {
    setLogoIndex((prev) => {
      if (prev < logoSources.length - 1) {
        return prev + 1;
      }
      setShowLogoImage(false);
      return prev;
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="min-w-[260px] bg-neutral-900 border border-neutral-800 p-6 rounded-2xl snap-start cursor-pointer hover:border-neutral-700 transition-all group"
    >
      <div className="h-36 bg-neutral-800 rounded-xl mb-4 p-3 flex items-center justify-center overflow-hidden">
        <img
          src={imageSources[imageIndex] || PRODUCT_FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-500 text-xs font-black uppercase">
          {showLogoImage ? (
            <img
              src={logoSources[logoIndex]}
              alt={`${product.retailer} logo`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleLogoError}
              className="w-7 h-7 object-contain"
            />
          ) : (
            product.retailer.slice(0, 2)
          )}
        </div>
        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
          Save {product.savings}
        </span>
      </div>

      <h4 className="font-bold text-lg text-white mb-1">{product.name}</h4>
      <p className="text-neutral-500 text-xs mb-4">{product.retailer}</p>
      <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
        <span className="text-white font-bold text-lg">{product.price}</span>
        <ArrowRight size={16} className="text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
};

const GridItem = ({ area, icon, title, description }) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-neutral-800 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-neutral-800 bg-neutral-950 p-6 shadow-sm shadow-black/30 md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-neutral-700 bg-neutral-900 p-2 text-neutral-400">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white">
                {title}
              </h3>
              <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-neutral-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const recentProducts = [
    {
      name: "Samsung S24",
      price: "₹62,999",
      retailer: "Flipkart",
      savings: "₹12,000",
      image: "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-1.jpg",
      imageFallbacks: [
        "https://images.samsung.com/is/image/samsung/p6pim/in/sm-s921blbcins/gallery/in-galaxy-s24-s921-sm-s921blbcins-539295406",
      ],
    },
    {
      name: "iPhone 15",
      price: "₹69,990",
      retailer: "Amazon",
      savings: "₹5,000",
      image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg",
      imageFallbacks: [
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-blue-select-202309?wid=940&hei=1112&fmt=png-alpha",
      ],
    },
    {
      name: "Pixel 8 Pro",
      price: "₹79,999",
      retailer: "Croma",
      savings: "₹8,000",
      image: "https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg",
      imageFallbacks: [
        "https://lh3.googleusercontent.com/2M5m6xqcaS6l03gaYfNwCuWHa3gwxM-H2ymlk4EYBLETymFcpnSUsctNk6heAQ7EzxKJ0C5EvhczHxVn9Yx8uWbRnk8",
      ],
    },
    {
      name: "Sony WH-5",
      price: "₹26,990",
      retailer: "Reliance",
      savings: "₹3,000",
      image: "https://m.media-amazon.com/images/I/61oCISLE+PL._SL1500_.jpg",
      imageFallbacks: [
        "https://m.media-amazon.com/images/I/61D4Z3yKPAL._SL1000_.jpg",
      ],
    },
    {
      name: "MacBook Air M3",
      price: "₹1,04,900",
      retailer: "Tata Cliq",
      savings: "₹10,000",
      image: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._SL1500_.jpg",
      imageFallbacks: [
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1708367688034",
      ],
    },
    {
      name: "iPad Pro",
      price: "₹79,900",
      retailer: "JioMart",
      savings: "₹6,000",
      image: "https://m.media-amazon.com/images/I/81d74M0QveL._SL1500_.jpg",
      imageFallbacks: [
        "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-pro-finish-select-202210-11inch-spacegray-wifi_AV1?wid=940&hei=1112&fmt=png-alpha",
      ],
    },
  ];

  return (
    <div className="bg-black min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 pt-20 overflow-hidden">
        {/* Subtle gradient blobs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-neutral-800/30 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neutral-700/20 rounded-full blur-[100px] -z-10"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 text-sm font-medium mb-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live: Comparing 10+ Indian retailers</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Shop Smarter.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-600">
              Never Overpay.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Paste any product URL — we compare prices, verify authenticity, and filter fake reviews across 10+ stores instantly.
          </p>

          <SearchBar />
          
          <div className="pt-8 flex flex-wrap justify-center items-center gap-8 text-neutral-600">
            {["Amazon", "Flipkart", "Croma", "Reliance", "Nykaa"].map(name => (
              <span key={name} className="font-bold text-sm uppercase tracking-[0.2em]">{name}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid with GlowingEffect */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How PriceWise AI Works</h2>
          <p className="text-neutral-500 max-w-xl mx-auto">Four simple steps powered by AI. Paste a link, get the truth.</p>
        </div>

        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={<Zap className="h-4 w-4" />}
            title="Paste Any Product URL"
            description="Copy a link from Amazon, Flipkart, or any Indian retailer. Our AI instantly identifies the product."
          />
          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            icon={<Search className="h-4 w-4" />}
            title="Compare 10+ Stores"
            description="Real-time price comparison with total delivered cost including shipping, taxes, and hidden fees."
          />
          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={<Shield className="h-4 w-4" />}
            title="Fake Review Detection"
            description="AI-powered review intelligence filters fake reviews, analyzes sentiment, and gives you the real story behind every product."
          />
          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={<Eye className="h-4 w-4" />}
            title="Authenticity Verification"
            description="Verified seller status, distribution analysis, and price anomaly detection to protect you from counterfeits."
          />
          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={<TrendingDown className="h-4 w-4" />}
            title="Price History & Alerts"
            description="12-month price trends, all-time low markers, and custom alerts so you never miss a deal."
          />
        </ul>
      </section>

      {/* Stats Section */}
      <section className="border-y border-neutral-800 py-20 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { value: "10+", label: "Retailers Tracked" },
              { value: "₹3,200", label: "Avg. Savings" },
              { value: "1.2M+", label: "Searches This Month" },
              { value: "98.2%", label: "Match Accuracy" },
            ].map((stat, idx) => (
              <motion.div key={idx} whileHover={{ scale: 1.05 }}>
                <p className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</p>
                <p className="text-sm text-neutral-500 font-medium uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Compared */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Recently Compared</h2>
            <p className="text-neutral-500">Discover what other smart shoppers are tracking.</p>
          </div>
          <button className="hidden sm:flex items-center space-x-2 text-neutral-400 hover:text-white font-bold transition-all">
            <span>View All</span>
            <ArrowRight size={20} />
          </button>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-8 scrollbar-hide snap-x">
          {recentProducts.map((p, idx) => (
            <RecentProductCard
              key={idx}
              product={p}
              onClick={() => navigate(`/results?q=${encodeURIComponent(p.name)}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
