const DIRECT_URLS = {
  // ── iPhone 15 ──────────────────────────────────────────────
  "iPhone 15 128GB": {
    "Amazon": "https://www.amazon.in/dp/B0CHX1W1XY",
    "Flipkart": "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itmbf14ef54f645d",
    "Croma": "https://www.croma.com/apple-iphone-15-128gb-blue-/p/300652",
    "Reliance Digital": "https://www.reliancedigital.in/apple-iphone-15-128-gb-blue/p/493839316",
    "Tata Cliq": "https://www.tatacliq.com/apple-iphone-15-128gb-blue/p-mp000000019484803",
    "Vijay Sales": "https://www.vijaysales.com/apple-iphone-15-128gb-blue/27117",
    "JioMart": "https://www.jiomart.com/p/electronics/apple-iphone-15-128-gb-blue/603612883"
  },
  // Some retailers use the shorter key "iPhone 15"
  "iPhone 15": {
    "Flipkart": "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itmbf14ef54f645d",
    "Croma": "https://www.croma.com/apple-iphone-15-128gb-blue-/p/300652",
    "Reliance Digital": "https://www.reliancedigital.in/apple-iphone-15-128-gb-blue/p/493839316",
    "Tata Cliq": "https://www.tatacliq.com/apple-iphone-15-128gb-blue/p-mp000000019484803",
    "Vijay Sales": "https://www.vijaysales.com/apple-iphone-15-128gb-blue/27117",
    "JioMart": "https://www.jiomart.com/p/electronics/apple-iphone-15-128-gb-blue/603612883"
  },

  // ── Samsung Galaxy S24 ────────────────────────────────────
  "Samsung Galaxy S24": {
    "Amazon": "https://www.amazon.in/dp/B0CS5L9VJ3",
    "Flipkart": "https://www.flipkart.com/samsung-galaxy-s24-5g-phantom-black-128-gb/p/itm6fcef53f4a484",
    "Croma": "https://www.croma.com/samsung-galaxy-s24-5g-128gb-phantom-black-/p/304153",
    "Reliance Digital": "https://www.reliancedigital.in/samsung-galaxy-s24-5g-128-gb-phantom-black/p/493842718",
    "Tata Cliq": "https://www.tatacliq.com/samsung-galaxy-s24-5g-128gb-phantom-black/p-mp000000022160145",
    "JioMart": "https://www.jiomart.com/p/electronics/samsung-galaxy-s24-5g-128gb-phantom-black/604312456",
    "Myntra": "https://www.myntra.com/mobile-phones/samsung/samsung-galaxy-s24-5g-128gb/27019876/buy",
    "Nykaa": "https://www.nykaafashion.com/samsung-galaxy-s24-5g-128gb/p/12986543"
  },

  // ── Google Pixel 8 Pro ────────────────────────────────────
  "Google Pixel 8 Pro": {
    "Amazon": "https://www.amazon.in/dp/B0CGTD5TDJ",
    "Flipkart": "https://www.flipkart.com/google-pixel-8-pro-obsidian-128-gb/p/itm51f9522df8e95",
    "Croma": "https://www.croma.com/google-pixel-8-pro-5g-12gb-ram-128gb-obsidian-/p/302485",
    "Reliance Digital": "https://www.reliancedigital.in/google-pixel-8-pro-128-gb-obsidian/p/493840125",
    "Tata Cliq": "https://www.tatacliq.com/google-pixel-8-pro-128gb-obsidian/p-mp000000021543812"
  },

  // ── OnePlus 12 ────────────────────────────────────────────
  "OnePlus 12 256GB": {
    "Amazon": "https://www.amazon.in/dp/B0CS5L9VJ5",
    "Flipkart": "https://www.flipkart.com/oneplus-12-flowy-emerald-256-gb/p/itm6e5e5a03a2a86",
    "OnePlus Store": "https://www.oneplus.in/12",
    "Croma": "https://www.croma.com/oneplus-12-256gb-flowy-emerald/p/305123",
    "Reliance Digital": "https://www.reliancedigital.in/oneplus-12-256-gb-flowy-emerald/p/493843456"
  },
  // Some retailers use the shorter key "OnePlus 12"
  "OnePlus 12": {
    "OnePlus Store": "https://www.oneplus.in/12",
    "Flipkart": "https://www.flipkart.com/oneplus-12-flowy-emerald-256-gb/p/itm6e5e5a03a2a86",
    "Croma": "https://www.croma.com/oneplus-12-256gb-flowy-emerald/p/305123",
    "Reliance Digital": "https://www.reliancedigital.in/oneplus-12-256-gb-flowy-emerald/p/493843456"
  }
};

// Generates real, working search URLs or direct links for each retailer platform
function getRetailerUrl(retailer, productName) {
  if (DIRECT_URLS[productName] && DIRECT_URLS[productName][retailer]) {
    return DIRECT_URLS[productName][retailer];
  }

  const q = encodeURIComponent(productName);
  const urls = {
    "Amazon": `https://www.amazon.in/s?k=${q}`,
    "Flipkart": `https://www.flipkart.com/search?q=${q}`,
    "Tata Cliq": `https://www.tatacliq.com/search/?text=${q}`,
    "Croma": `https://www.croma.com/searchB?q=${q}`,
    "Meesho": `https://www.meesho.com/search?q=${q}`,
    "Snapdeal": `https://www.snapdeal.com/search?keyword=${q}`,
    "Reliance Digital": `https://www.reliancedigital.in/search?q=${q}`,
    "Myntra": `https://www.myntra.com/${q.toLowerCase().replace(/%20/g, '-')}`,
    "Nykaa": `https://www.nykaa.com/search/result/?q=${q}`,
    "JioMart": `https://www.jiomart.com/search/${q}`,
    "Vijay Sales": `https://www.vijaysales.com/search/${q}`,
    "OnePlus Store": `https://www.oneplus.in/12`,
  };
  return urls[retailer] || `https://www.google.com/search?q=${q}+buy+india`;
}

// ─── Product Catalog ─────────────────────────────────────────
// Each product has its own retailers, price_history, reviews, and alternatives

const productCatalog = {
  "samsung-s24-128-black": {
    id: "samsung-s24-128-black",
    name: "Samsung Galaxy S24 128GB Phantom Black",
    brand: "Samsung",
    category: "Smartphones",
    image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg",
    rating: 4.8,
    review_count: 2847,
    specs: {
      display: "6.2-inch Dynamic AMOLED 2X",
      processor: "Exynos 2400 / Snapdragon 8 Gen 3",
      ram: "8GB",
      storage: "128GB",
      battery: "4000mAh",
      camera: "50MP Triple Rear + 12MP Front",
    },
    retailers: [
      { retailer: "Amazon", logo_initial: "A", color: "#FF9900", url: getRetailerUrl("Amazon", "Samsung Galaxy S24"), price: 64999, mrp: 74999, discount_pct: 13, shipping: 0, tax: 0, total_delivered: 64999, delivery_date: "Tomorrow, 7 AM - 11 AM", stock_status: "In Stock", trust_score: 92, is_official: true, coupons: ["HDFC 10% Off", "Exchange Bonus"], return_days: 7, warranty: "1 Year Brand Warranty", seller_name: "Appario Retail" },
      { retailer: "Flipkart", logo_initial: "F", color: "#2874F0", url: getRetailerUrl("Flipkart", "Samsung Galaxy S24"), price: 62999, mrp: 74999, discount_pct: 16, shipping: 0, tax: 0, total_delivered: 62999, delivery_date: "Tomorrow, Oct 25", stock_status: "In Stock", trust_score: 94, is_official: true, coupons: ["Axis 5% Cashback"], return_days: 10, warranty: "1 Year Brand Warranty", seller_name: "IndiFlashMart" },
      { retailer: "Tata Cliq", logo_initial: "T", color: "#E21D24", url: getRetailerUrl("Tata Cliq", "Samsung Galaxy S24"), price: 65500, mrp: 74999, discount_pct: 12, shipping: 0, tax: 0, total_delivered: 65500, delivery_date: "Thu, Oct 26", stock_status: "In Stock", trust_score: 88, is_official: true, coupons: ["CLIQFIRST"], return_days: 7, warranty: "1 Year Brand Warranty", seller_name: "Tata Retail" },
      { retailer: "Croma", logo_initial: "C", color: "#00B9B0", url: getRetailerUrl("Croma", "Samsung Galaxy S24"), price: 66999, mrp: 74999, discount_pct: 10, shipping: 0, tax: 0, total_delivered: 66999, delivery_date: "Today, Express Delivery", stock_status: "In Stock", trust_score: 95, is_official: true, coupons: ["NeuCoins 5%"], return_days: 7, warranty: "1 Year Brand Warranty", seller_name: "Croma Official" },

      { retailer: "Reliance Digital", logo_initial: "R", color: "#ED1C24", url: getRetailerUrl("Reliance Digital", "Samsung Galaxy S24"), price: 67999, mrp: 74999, discount_pct: 9, shipping: 0, tax: 0, total_delivered: 67999, delivery_date: "Today", stock_status: "In Stock", trust_score: 93, is_official: true, coupons: ["ReliancePoints"], return_days: 7, warranty: "1 Year Brand Warranty", seller_name: "Reliance Retail" },
      { retailer: "Myntra", logo_initial: "M", color: "#FF3F6C", url: getRetailerUrl("Myntra", "Samsung Galaxy S24"), price: 65999, mrp: 74999, discount_pct: 12, shipping: 0, tax: 0, total_delivered: 65999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 90, is_official: true, coupons: ["MYNTRA200"], return_days: 15, warranty: "Brand Warranty", seller_name: "Myntra Official" },
      { retailer: "Nykaa", logo_initial: "N", color: "#FC2779", url: getRetailerUrl("Nykaa", "Samsung Galaxy S24"), price: 68500, mrp: 74999, discount_pct: 8, shipping: 0, tax: 0, total_delivered: 68500, delivery_date: "Fri, Oct 27", stock_status: "In Stock", trust_score: 85, is_official: true, coupons: [], return_days: 5, warranty: "Brand Warranty", seller_name: "Nykaa Retail" },
      { retailer: "JioMart", logo_initial: "J", color: "#003873", url: getRetailerUrl("JioMart", "Samsung Galaxy S24"), price: 63500, mrp: 74999, discount_pct: 15, shipping: 0, tax: 0, total_delivered: 63500, delivery_date: "Thu, Oct 26", stock_status: "In Stock", trust_score: 82, is_official: true, coupons: ["JIOMART10"], return_days: 7, warranty: "Brand Warranty", seller_name: "Reliance Retail" },
    ],
    price_history: [
      { date: "Oct 2023", amazon: 72999, flipkart: 71999, croma: 74999 },
      { date: "Nov 2023", amazon: 71999, flipkart: 70999, croma: 73999 },
      { date: "Dec 2023", amazon: 69999, flipkart: 69999, croma: 72999 },
      { date: "Jan 2024", amazon: 68999, flipkart: 67999, croma: 70999 },
      { date: "Feb 2024", amazon: 67999, flipkart: 66999, croma: 69999 },
      { date: "Mar 2024", amazon: 66999, flipkart: 65999, croma: 68999 },
      { date: "Apr 2024", amazon: 65999, flipkart: 64999, croma: 67999 },
      { date: "May 2024", amazon: 65500, flipkart: 64500, croma: 67500 },
      { date: "Jun 2024", amazon: 64999, flipkart: 63999, croma: 66999 },
      { date: "Jul 2024", amazon: 64500, flipkart: 63500, croma: 66500 },
      { date: "Aug 2024", amazon: 64999, flipkart: 62999, croma: 66999 },
      { date: "Sep 2024", amazon: 64999, flipkart: 62999, croma: 66999 },
    ],
    reviews: [
      { reviewer: "Amit S.", rating: 5, text: "Amazing phone! The display is crisp and the battery lasts all day.", source: "Amazon", genuine_score: 98, verified: true, date: "2024-09-15" },
      { reviewer: "Sanya K.", rating: 4, text: "Good performance, but price is still high for 128GB.", source: "Flipkart", genuine_score: 95, verified: true, date: "2024-09-20" },
      { reviewer: "John Doe", rating: 5, text: "The camera quality is unparalleled. Best compact flagship.", source: "Croma", genuine_score: 92, verified: true, date: "2024-10-01" },
      { reviewer: "Rahul M.", rating: 3, text: "Heats up a bit during heavy gaming.", source: "Tata Cliq", genuine_score: 85, verified: false, date: "2024-10-05" },
      { reviewer: "Priya V.", rating: 5, text: "Phantom Black looks very premium.", source: "Amazon", genuine_score: 97, verified: true, date: "2024-10-10" },
    ],
    alternatives: [
      { id: "pixel-8-pro", name: "Google Pixel 8 Pro", price: 79999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "iphone-15", name: "iPhone 15 128GB", price: 69999, image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg", trust_score: 96 },
      { id: "oneplus-12", name: "OnePlus 12 256GB", price: 64999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 91 },
      { id: "pixel-7a", name: "Google Pixel 7a", price: 39999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 85 },
    ],
    bestOverall: "Flipkart",
    bestBudget: "JioMart",
    aiSummary: "Overall, users are highly impressed with the S24's display quality and camera performance. While battery life is improved over previous generations, heavy gamers might notice slight thermal throttling. The consensus is that it's the best compact Android flagship available today.",
    pros: ["Vibrant 6.2\" display", "Excellent cameras", "Compact form factor", "Galaxy AI features", "Long support life"],
    cons: ["128GB base storage", "Exynos variant in some regions", "Slight heating under load", "No charger in box", "Incremental upgrade"],
    expertReviews: [
      { pub: "GSMArena", score: "4.5/5", text: "The compact flagship of your dreams. Perfect ergonomics meets raw power." },
      { pub: "The Verge", score: "8/10", text: "AI features are cool, but the real star is the display and seven-year support." },
    ],
    authenticitySignals: [
      { label: "Authorized Retailer Status", status: "pass", text: "Verified official distribution partner." },
      { label: "Price Anomaly Detection", status: "pass", text: "Price is within 5% of standard market value." },
      { label: "Seller History & Feedback", status: "warning", text: "Mixed reports for some marketplace sellers." },
      { label: "Product Traceability", status: "pass", text: "Global SKU matches official Samsung database." },
      { label: "Review Pattern Analysis", status: "pass", text: "Verified purchase reviews show consistent metadata." },
    ],
    retailerBreakdown: [
      { r: "Amazon", s: "Appario Retail", v: "Official" },
      { r: "Flipkart", s: "IndiFlashMart", v: "Verified" },

      { r: "Reliance", s: "Reliance Retail", v: "Official" },
    ],
    priceSignal: "BUY NOW — Price is at a 6-month low. No major festive sales expected in the next 30 days.",
    smartTip: "Prices on Flipkart tend to drop between 2 AM and 5 AM. Our trackers suggest waiting 4 hours for a potential 2% further dip.",
  },

  "iphone-15": {
    id: "iphone-15",
    name: "Apple iPhone 15 128GB Blue",
    brand: "Apple",
    category: "Smartphones",
    image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg",
    rating: 4.7,
    review_count: 3541,
    specs: {
      display: "6.1-inch Super Retina XDR OLED",
      processor: "A16 Bionic",
      ram: "6GB",
      storage: "128GB",
      battery: "3349mAh",
      camera: "48MP Dual Rear + 12MP Front",
    },
    retailers: [
      { retailer: "Amazon", logo_initial: "A", color: "#FF9900", url: getRetailerUrl("Amazon", "iPhone 15 128GB"), price: 69900, mrp: 79900, discount_pct: 12, shipping: 0, tax: 0, total_delivered: 69900, delivery_date: "Tomorrow, 7 AM - 11 AM", stock_status: "In Stock", trust_score: 96, is_official: true, coupons: ["HDFC 10% Off", "Exchange up to ₹17,000"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Appario Retail" },
      { retailer: "Flipkart", logo_initial: "F", color: "#2874F0", url: getRetailerUrl("Flipkart", "iPhone 15 128GB"), price: 67999, mrp: 79900, discount_pct: 15, shipping: 0, tax: 0, total_delivered: 67999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 95, is_official: true, coupons: ["Axis Bank 5% Cashback", "No Cost EMI"], return_days: 10, warranty: "1 Year Apple Warranty", seller_name: "SuperComNet" },
      { retailer: "Croma", logo_initial: "C", color: "#00B9B0", url: getRetailerUrl("Croma", "iPhone 15"), price: 71999, mrp: 79900, discount_pct: 10, shipping: 0, tax: 0, total_delivered: 71999, delivery_date: "Today, Express Delivery", stock_status: "In Stock", trust_score: 97, is_official: true, coupons: ["NeuCoins 5%", "Exchange Offer"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Croma Official" },
      { retailer: "Reliance Digital", logo_initial: "R", color: "#ED1C24", url: getRetailerUrl("Reliance Digital", "iPhone 15"), price: 72499, mrp: 79900, discount_pct: 9, shipping: 0, tax: 0, total_delivered: 72499, delivery_date: "Today", stock_status: "In Stock", trust_score: 94, is_official: true, coupons: ["JioCoins 3%"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Reliance Retail" },
      { retailer: "Tata Cliq", logo_initial: "T", color: "#E21D24", url: getRetailerUrl("Tata Cliq", "iPhone 15"), price: 70999, mrp: 79900, discount_pct: 11, shipping: 0, tax: 0, total_delivered: 70999, delivery_date: "Thu, Oct 26", stock_status: "In Stock", trust_score: 90, is_official: true, coupons: ["CLIQFIRST ₹1000 Off"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Tata Retail" },
      { retailer: "Vijay Sales", logo_initial: "V", color: "#E8382F", url: getRetailerUrl("Vijay Sales", "iPhone 15"), price: 72999, mrp: 79900, discount_pct: 9, shipping: 0, tax: 0, total_delivered: 72999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 91, is_official: true, coupons: ["ICICI 5% Off"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Vijay Sales Official" },

      { retailer: "JioMart", logo_initial: "J", color: "#003873", url: getRetailerUrl("JioMart", "iPhone 15"), price: 71500, mrp: 79900, discount_pct: 10, shipping: 0, tax: 0, total_delivered: 71500, delivery_date: "Thu, Oct 26", stock_status: "In Stock", trust_score: 85, is_official: true, coupons: ["JIOMART10"], return_days: 7, warranty: "1 Year Apple Warranty", seller_name: "Reliance Retail" },
    ],
    price_history: [
      { date: "Oct 2023", amazon: 79900, flipkart: 79900, croma: 79900 },
      { date: "Nov 2023", amazon: 77900, flipkart: 76999, croma: 78999 },
      { date: "Dec 2023", amazon: 76900, flipkart: 75999, croma: 77999 },
      { date: "Jan 2024", amazon: 75900, flipkart: 74999, croma: 76999 },
      { date: "Feb 2024", amazon: 74900, flipkart: 73999, croma: 75999 },
      { date: "Mar 2024", amazon: 73900, flipkart: 72999, croma: 74999 },
      { date: "Apr 2024", amazon: 72900, flipkart: 71999, croma: 73999 },
      { date: "May 2024", amazon: 71900, flipkart: 70999, croma: 73499 },
      { date: "Jun 2024", amazon: 70900, flipkart: 69999, croma: 72999 },
      { date: "Jul 2024", amazon: 70500, flipkart: 69499, croma: 72499 },
      { date: "Aug 2024", amazon: 69999, flipkart: 68999, croma: 71999 },
      { date: "Sep 2024", amazon: 69900, flipkart: 67999, croma: 71999 },
    ],
    reviews: [
      { reviewer: "Neha T.", rating: 5, text: "The Dynamic Island is a game changer! Love the USB-C switch finally. Camera quality is incredible in low light.", source: "Amazon", genuine_score: 97, verified: true, date: "2024-09-18" },
      { reviewer: "Vikram S.", rating: 4, text: "Great upgrade from iPhone 12. The 48MP camera is noticeable. Battery could be slightly better for heavy use.", source: "Flipkart", genuine_score: 94, verified: true, date: "2024-09-25" },
      { reviewer: "Aarav P.", rating: 5, text: "iOS 17 is buttery smooth. This phone is the perfect daily driver — fast, reliable, great camera.", source: "Croma", genuine_score: 96, verified: true, date: "2024-10-02" },
      { reviewer: "Ritu M.", rating: 4, text: "60Hz display feels outdated compared to Android flagships at this price. Everything else is top-notch though.", source: "Amazon", genuine_score: 91, verified: true, date: "2024-10-08" },
      { reviewer: "Karan J.", rating: 3, text: "Too expensive for 128GB in 2024. No always-on display either. If you can afford Pro, skip this.", source: "Flipkart", genuine_score: 88, verified: false, date: "2024-10-12" },
      { reviewer: "Diya R.", rating: 5, text: "The blue color is gorgeous in person. Build quality feels premium and sturdy.", source: "Tata Cliq", genuine_score: 95, verified: true, date: "2024-10-15" },
    ],
    alternatives: [
      { id: "samsung-s24-128-black", name: "Samsung Galaxy S24 128GB", price: 62999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "pixel-8-pro", name: "Google Pixel 8 Pro", price: 79999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "oneplus-12", name: "OnePlus 12 256GB", price: 64999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 91 },
      { id: "iphone-15-pro", name: "iPhone 15 Pro 128GB", price: 129900, image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg", trust_score: 98 },
    ],
    bestOverall: "Flipkart",
    bestBudget: "Flipkart",
    aiSummary: "The iPhone 15 is praised universally for its smooth iOS experience, excellent camera system with the new 48MP sensor, and the welcome switch to USB-C. Battery life is solid for moderate users. The main complaints revolve around the 60Hz display and lack of always-on display at this price point. It remains the best mainstream iPhone for most users.",
    pros: ["48MP main camera with excellent low-light", "USB-C finally!", "Dynamic Island is intuitive", "7 years of iOS updates", "Premium build quality"],
    cons: ["60Hz display (no ProMotion)", "No always-on display", "128GB base storage", "No charger in box", "Limited customization"],
    expertReviews: [
      { pub: "MKBHD", score: "8.5/10", text: "The iPhone for the masses. Solid all around, but 60Hz is hard to forgive at this price." },
      { pub: "TechRadar", score: "4.5/5", text: "Apple's most balanced phone yet. USB-C and Dynamic Island make it a compelling upgrade." },
    ],
    authenticitySignals: [
      { label: "Apple Authorized Reseller", status: "pass", text: "Verified Apple authorized distribution channel." },
      { label: "Price Anomaly Detection", status: "pass", text: "Price is within 8% of Apple Store MRP." },
      { label: "Seller History & Feedback", status: "warning", text: "Some third-party sellers have mixed ratings." },
      { label: "IMEI Verification", status: "pass", text: "IMEI range matches Apple India manufacturing batch." },
      { label: "Review Pattern Analysis", status: "pass", text: "Review patterns are organic with verified purchases." },
    ],
    retailerBreakdown: [
      { r: "Amazon", s: "Appario Retail", v: "Official" },
      { r: "Flipkart", s: "SuperComNet", v: "Verified" },
      { r: "Croma", s: "Croma Official", v: "Official" },
      { r: "Meesho", s: "PhoneWorld_Mumbai", v: "Caution" },
    ],
    priceSignal: "WAIT — Price is expected to drop further during the upcoming sale season. Historical data shows 5-8% drops during festive sales.",
    smartTip: "The iPhone 15 typically sees its best prices during Flipkart Big Billion Days and Amazon Great Indian Festival. Next expected sale: Diwali season.",
  },

  "pixel-8-pro": {
    id: "pixel-8-pro",
    name: "Google Pixel 8 Pro 128GB Obsidian",
    brand: "Google",
    category: "Smartphones",
    image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg",
    rating: 4.6,
    review_count: 1892,
    specs: {
      display: "6.7-inch LTPO OLED, 120Hz",
      processor: "Google Tensor G3",
      ram: "12GB",
      storage: "128GB",
      battery: "5050mAh",
      camera: "50MP + 48MP + 48MP Triple Rear",
    },
    retailers: [
      { retailer: "Flipkart", logo_initial: "F", color: "#2874F0", url: getRetailerUrl("Flipkart", "Google Pixel 8 Pro"), price: 79999, mrp: 106999, discount_pct: 25, shipping: 0, tax: 0, total_delivered: 79999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 95, is_official: true, coupons: ["Bank Offer 10%"], return_days: 10, warranty: "2 Year Google Warranty", seller_name: "RetailNet" },
      { retailer: "Amazon", logo_initial: "A", color: "#FF9900", url: getRetailerUrl("Amazon", "Google Pixel 8 Pro"), price: 82999, mrp: 106999, discount_pct: 22, shipping: 0, tax: 0, total_delivered: 82999, delivery_date: "Tomorrow, 7 AM", stock_status: "In Stock", trust_score: 94, is_official: true, coupons: ["HDFC EMI Offer"], return_days: 7, warranty: "2 Year Google Warranty", seller_name: "Appario Retail" },
      { retailer: "Croma", logo_initial: "C", color: "#00B9B0", url: getRetailerUrl("Croma", "Google Pixel 8 Pro"), price: 84999, mrp: 106999, discount_pct: 20, shipping: 0, tax: 0, total_delivered: 84999, delivery_date: "Today", stock_status: "In Stock", trust_score: 96, is_official: true, coupons: ["NeuCoins 5%"], return_days: 7, warranty: "2 Year Google Warranty", seller_name: "Croma Official" },
      { retailer: "Reliance Digital", logo_initial: "R", color: "#ED1C24", url: getRetailerUrl("Reliance Digital", "Google Pixel 8 Pro"), price: 85999, mrp: 106999, discount_pct: 19, shipping: 0, tax: 0, total_delivered: 85999, delivery_date: "Today", stock_status: "In Stock", trust_score: 93, is_official: true, coupons: ["ReliancePoints"], return_days: 7, warranty: "2 Year Google Warranty", seller_name: "Reliance Retail" },
      { retailer: "Tata Cliq", logo_initial: "T", color: "#E21D24", url: getRetailerUrl("Tata Cliq", "Google Pixel 8 Pro"), price: 83999, mrp: 106999, discount_pct: 21, shipping: 0, tax: 0, total_delivered: 83999, delivery_date: "Thu, Oct 26", stock_status: "In Stock", trust_score: 88, is_official: true, coupons: ["CLIQFIRST"], return_days: 7, warranty: "2 Year Google Warranty", seller_name: "Tata Retail" },
    ],
    price_history: [
      { date: "Oct 2023", amazon: 106999, flipkart: 106999, croma: 106999 },
      { date: "Nov 2023", amazon: 101999, flipkart: 99999, croma: 104999 },
      { date: "Dec 2023", amazon: 97999, flipkart: 95999, croma: 99999 },
      { date: "Jan 2024", amazon: 94999, flipkart: 92999, croma: 96999 },
      { date: "Feb 2024", amazon: 92999, flipkart: 89999, croma: 94999 },
      { date: "Mar 2024", amazon: 89999, flipkart: 87999, croma: 91999 },
      { date: "Apr 2024", amazon: 87999, flipkart: 85999, croma: 89999 },
      { date: "May 2024", amazon: 86999, flipkart: 84999, croma: 88999 },
      { date: "Jun 2024", amazon: 85999, flipkart: 82999, croma: 87999 },
      { date: "Jul 2024", amazon: 84999, flipkart: 81999, croma: 86999 },
      { date: "Aug 2024", amazon: 83999, flipkart: 80999, croma: 85999 },
      { date: "Sep 2024", amazon: 82999, flipkart: 79999, croma: 84999 },
    ],
    reviews: [
      { reviewer: "Arjun K.", rating: 5, text: "Best camera phone I've ever used. AI features like Magic Eraser and Best Take are incredible. Stock Android is bliss.", source: "Flipkart", genuine_score: 97, verified: true, date: "2024-09-20" },
      { reviewer: "Maya S.", rating: 4, text: "Love the camera but Tensor G3 gets warm during prolonged gaming. Battery life is excellent otherwise.", source: "Amazon", genuine_score: 93, verified: true, date: "2024-10-01" },
      { reviewer: "Rohan P.", rating: 5, text: "7 years of updates! That's insane value. The 120Hz display is gorgeous too.", source: "Croma", genuine_score: 96, verified: true, date: "2024-10-05" },
      { reviewer: "Sneha D.", rating: 4, text: "Great phone overall but the price is steep for Google's first-gen hardware reliability.", source: "Amazon", genuine_score: 89, verified: true, date: "2024-10-10" },
      { reviewer: "Ravi T.", rating: 3, text: "Good phone but overpriced compared to Samsung and OnePlus offering similar specs.", source: "Flipkart", genuine_score: 85, verified: false, date: "2024-10-12" },
    ],
    alternatives: [
      { id: "iphone-15", name: "iPhone 15 128GB", price: 67999, image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg", trust_score: 96 },
      { id: "samsung-s24-128-black", name: "Samsung Galaxy S24 128GB", price: 62999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "oneplus-12", name: "OnePlus 12 256GB", price: 64999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 91 },
      { id: "pixel-7a", name: "Google Pixel 7a", price: 39999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 85 },
    ],
    bestOverall: "Flipkart",
    bestBudget: "Flipkart",
    aiSummary: "The Pixel 8 Pro is widely regarded as the best camera phone available. Google's AI features like Magic Eraser, Best Take, and Audio Magic Eraser are genuinely useful. Battery life is exceptional. The main concerns are Tensor G3 thermal management and the premium pricing when comparing raw specs to competitors.",
    pros: ["Best-in-class camera system", "7 years of updates", "Stock Android experience", "Excellent AI features", "Great battery life"],
    cons: ["Tensor G3 thermal issues", "Premium pricing", "No expandable storage", "Limited availability in India", "Curved display edges"],
    expertReviews: [
      { pub: "DxOMark", score: "157 pts", text: "Top-ranked camera smartphone. Excels in photo, video, and zoom across all lighting conditions." },
      { pub: "Android Authority", score: "9/10", text: "Google finally made a phone that can compete with Samsung and Apple — and beat them in cameras." },
    ],
    authenticitySignals: [
      { label: "Google Authorized Partner", status: "pass", text: "Verified Google-authorized distribution channel." },
      { label: "Price Anomaly Detection", status: "pass", text: "Price within standard market discount range." },
      { label: "Seller History & Feedback", status: "pass", text: "All listed sellers have 95%+ positive ratings." },
      { label: "Product Traceability", status: "pass", text: "Serial number range matches Google India batch." },
      { label: "Review Pattern Analysis", status: "pass", text: "Organic review pattern detected." },
    ],
    retailerBreakdown: [
      { r: "Flipkart", s: "RetailNet", v: "Official" },
      { r: "Amazon", s: "Appario Retail", v: "Official" },
      { r: "Croma", s: "Croma Official", v: "Official" },
      { r: "Reliance", s: "Reliance Retail", v: "Official" },
    ],
    priceSignal: "BUY NOW — At ₹79,999, this is the all-time low for the Pixel 8 Pro. Price has been consistently dropping.",
    smartTip: "Pixel phones get their best deals on Flipkart. Combine with a bank card offer for an extra 5-10% off.",
  },

  "oneplus-12": {
    id: "oneplus-12",
    name: "OnePlus 12 256GB Flowy Emerald",
    brand: "OnePlus",
    category: "Smartphones",
    image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg",
    rating: 4.5,
    review_count: 4210,
    specs: {
      display: "6.82-inch LTPO AMOLED, 120Hz",
      processor: "Snapdragon 8 Gen 3",
      ram: "12GB",
      storage: "256GB",
      battery: "5400mAh + 100W SUPERVOOC",
      camera: "50MP + 48MP + 64MP Hasselblad",
    },
    retailers: [
      { retailer: "Amazon", logo_initial: "A", color: "#FF9900", url: getRetailerUrl("Amazon", "OnePlus 12 256GB"), price: 64999, mrp: 69999, discount_pct: 7, shipping: 0, tax: 0, total_delivered: 64999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 93, is_official: true, coupons: ["SBI 10% Off"], return_days: 7, warranty: "1 Year OnePlus Warranty", seller_name: "Appario Retail" },
      { retailer: "Flipkart", logo_initial: "F", color: "#2874F0", url: getRetailerUrl("Flipkart", "OnePlus 12 256GB"), price: 62999, mrp: 69999, discount_pct: 10, shipping: 0, tax: 0, total_delivered: 62999, delivery_date: "Tomorrow", stock_status: "In Stock", trust_score: 94, is_official: true, coupons: ["Axis 5% Off"], return_days: 10, warranty: "1 Year OnePlus Warranty", seller_name: "SuperComNet" },
      { retailer: "OnePlus Store", logo_initial: "O", color: "#EB0028", url: getRetailerUrl("OnePlus Store", "OnePlus 12"), price: 64999, mrp: 69999, discount_pct: 7, shipping: 0, tax: 0, total_delivered: 64999, delivery_date: "2-3 Days", stock_status: "In Stock", trust_score: 99, is_official: true, coupons: ["Red Cable Extra ₹1000 Off"], return_days: 15, warranty: "1 Year OnePlus Warranty", seller_name: "OnePlus Official" },
      { retailer: "Croma", logo_initial: "C", color: "#00B9B0", url: getRetailerUrl("Croma", "OnePlus 12"), price: 66999, mrp: 69999, discount_pct: 4, shipping: 0, tax: 0, total_delivered: 66999, delivery_date: "Today", stock_status: "In Stock", trust_score: 95, is_official: true, coupons: ["NeuCoins"], return_days: 7, warranty: "1 Year OnePlus Warranty", seller_name: "Croma Official" },
      { retailer: "Reliance Digital", logo_initial: "R", color: "#ED1C24", url: getRetailerUrl("Reliance Digital", "OnePlus 12"), price: 67499, mrp: 69999, discount_pct: 3, shipping: 0, tax: 0, total_delivered: 67499, delivery_date: "Today", stock_status: "In Stock", trust_score: 93, is_official: true, coupons: [], return_days: 7, warranty: "1 Year OnePlus Warranty", seller_name: "Reliance Retail" },
    ],
    price_history: [
      { date: "Jan 2024", amazon: 69999, flipkart: 69999, croma: 69999 },
      { date: "Feb 2024", amazon: 69999, flipkart: 68999, croma: 69999 },
      { date: "Mar 2024", amazon: 68999, flipkart: 67999, croma: 69999 },
      { date: "Apr 2024", amazon: 67999, flipkart: 66999, croma: 68999 },
      { date: "May 2024", amazon: 67499, flipkart: 65999, croma: 68499 },
      { date: "Jun 2024", amazon: 66999, flipkart: 65499, croma: 67999 },
      { date: "Jul 2024", amazon: 66499, flipkart: 64999, croma: 67499 },
      { date: "Aug 2024", amazon: 65999, flipkart: 63999, croma: 67499 },
      { date: "Sep 2024", amazon: 64999, flipkart: 62999, croma: 66999 },
    ],
    reviews: [
      { reviewer: "Aditya R.", rating: 5, text: "100W charging is absolutely insane — 0 to 100% in 26 minutes! Best value flagship.", source: "Amazon", genuine_score: 96, verified: true, date: "2024-02-10" },
      { reviewer: "Pooja M.", rating: 5, text: "Hasselblad camera is noticeably improved. Great video quality too.", source: "Flipkart", genuine_score: 94, verified: true, date: "2024-03-05" },
      { reviewer: "Sameer K.", rating: 4, text: "Brilliant phone, but OxygenOS is becoming more like ColorOS. Miss the old OnePlus.", source: "Amazon", genuine_score: 92, verified: true, date: "2024-04-12" },
      { reviewer: "Tanya G.", rating: 4, text: "Amazing display and speakers. The phone is a bit heavy though.", source: "Croma", genuine_score: 90, verified: true, date: "2024-05-01" },
      { reviewer: "Vijay N.", rating: 3, text: "Good specs on paper but software bugs are frustrating. Needs more updates.", source: "Flipkart", genuine_score: 87, verified: false, date: "2024-06-15" },
    ],
    alternatives: [
      { id: "samsung-s24-128-black", name: "Samsung Galaxy S24 128GB", price: 62999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "iphone-15", name: "iPhone 15 128GB", price: 67999, image: "https://m.media-amazon.com/images/I/61bK6PMOC3L._SL1500_.jpg", trust_score: 96 },
      { id: "pixel-8-pro", name: "Google Pixel 8 Pro", price: 79999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 94 },
      { id: "iqoo-12", name: "iQOO 12 256GB", price: 52999, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg", trust_score: 88 },
    ],
    bestOverall: "Flipkart",
    bestBudget: "Flipkart",
    aiSummary: "The OnePlus 12 delivers incredible value with flagship Snapdragon 8 Gen 3 performance, Hasselblad-tuned cameras, and the fastest charging in its class at 100W. The 5400mAh battery ensures all-day use. Main criticisms center around OxygenOS becoming bloated and the phone's weight.",
    pros: ["100W SUPERVOOC charging", "5400mAh battery", "Snapdragon 8 Gen 3", "Hasselblad cameras", "QHD+ 120Hz AMOLED"],
    cons: ["OxygenOS bloat increasing", "Heavy at 220g", "No wireless charging", "Curved edges cause accidental touches", "Only 4 years of updates"],
    expertReviews: [
      { pub: "NDTV Gadgets", score: "8.5/10", text: "The best value flagship of 2024. OnePlus is back to its roots with killer specs at a competitive price." },
      { pub: "Tom's Guide", score: "4/5", text: "Blazing fast performance and charging. If you can live with OxygenOS, this is unbeatable." },
    ],
    authenticitySignals: [
      { label: "OnePlus Authorized Seller", status: "pass", text: "Verified OnePlus authorized retail partner." },
      { label: "Price Anomaly Detection", status: "pass", text: "Price is within expected market range." },
      { label: "Seller Verification", status: "pass", text: "All listed sellers are verified partners." },
      { label: "Product Traceability", status: "pass", text: "Serial number matches OnePlus India batch." },
      { label: "Review Authenticity", status: "pass", text: "Organic review pattern with verified purchases." },
    ],
    retailerBreakdown: [
      { r: "OnePlus Store", s: "OnePlus Official", v: "Official" },
      { r: "Amazon", s: "Appario Retail", v: "Official" },
      { r: "Flipkart", s: "SuperComNet", v: "Verified" },
      { r: "Croma", s: "Croma Official", v: "Official" },
    ],
    priceSignal: "BUY NOW — At ₹62,999, this is near the all-time low. Excellent value compared to competitors.",
    smartTip: "OnePlus 12 gets additional Red Cable member discounts on the official OnePlus Store. Stack with bank offers for maximum savings.",
  },
};

// ─── Search / Match Function ────────────────────────────────
// Fuzzy-match a query string against all products in the catalog

export function searchProducts(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // Direct ID match
  if (productCatalog[q]) return productCatalog[q];

  // Keyword matching — score each product
  let bestMatch = null;
  let bestScore = 0;

  for (const [id, product] of Object.entries(productCatalog)) {
    let score = 0;
    const name = product.name.toLowerCase();
    const brand = product.brand.toLowerCase();

    // Exact name match
    if (name === q) { score += 100; }
    // Name contains full query
    else if (name.includes(q)) { score += 60; }
    // Query contains product name keywords
    else {
      const queryWords = q.split(/\s+/);
      const nameWords = name.split(/\s+/);
      for (const qw of queryWords) {
        for (const nw of nameWords) {
          if (nw.includes(qw) || qw.includes(nw)) {
            score += 15;
          }
        }
        if (brand.includes(qw)) score += 20;
        if (id.includes(qw)) score += 10;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // If we have a decent match, return it
  if (bestScore >= 20) {
    return bestMatch;
  }

  // NO MATCH FOUND — Generate a dynamic product for real-time live search redirection
  const dynamicRetailers = [
    { retailer: "Amazon", logo_initial: "A", color: "#FF9900", url: getRetailerUrl("Amazon", query), price: 0, mrp: 0, discount_pct: 0, shipping: 0, tax: 0, total_delivered: 0, delivery_date: "Check Site", stock_status: "Check Site", trust_score: 95, is_official: true, coupons: [], return_days: "Varies", warranty: "-", seller_name: "Amazon" },
    { retailer: "Flipkart", logo_initial: "F", color: "#2874F0", url: getRetailerUrl("Flipkart", query), price: 0, mrp: 0, discount_pct: 0, shipping: 0, tax: 0, total_delivered: 0, delivery_date: "Check Site", stock_status: "Check Site", trust_score: 94, is_official: true, coupons: [], return_days: "Varies", warranty: "-", seller_name: "Flipkart" },
    { retailer: "Croma", logo_initial: "C", color: "#00B9B0", url: getRetailerUrl("Croma", query), price: 0, mrp: 0, discount_pct: 0, shipping: 0, tax: 0, total_delivered: 0, delivery_date: "Check Site", stock_status: "Check Site", trust_score: 96, is_official: true, coupons: [], return_days: "Varies", warranty: "-", seller_name: "Croma" },
    { retailer: "Reliance Digital", logo_initial: "R", color: "#ED1C24", url: getRetailerUrl("Reliance Digital", query), price: 0, mrp: 0, discount_pct: 0, shipping: 0, tax: 0, total_delivered: 0, delivery_date: "Check Site", stock_status: "Check Site", trust_score: 93, is_official: true, coupons: [], return_days: "Varies", warranty: "-", seller_name: "Reliance" },
    { retailer: "Tata Cliq", logo_initial: "T", color: "#E21D24", url: getRetailerUrl("Tata Cliq", query), price: 0, mrp: 0, discount_pct: 0, shipping: 0, tax: 0, total_delivered: 0, delivery_date: "Check Site", stock_status: "Check Site", trust_score: 88, is_official: true, coupons: [], return_days: "Varies", warranty: "-", seller_name: "Tata Cliq" },
  ];

  return {
    id: "dynamic-" + Math.random().toString(36).substr(2, 9),
    name: query,
    brand: "Various",
    category: "Live Search Results",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400&h=400",
    rating: 0,
    review_count: 0,
    specs: {},
    retailers: dynamicRetailers,
    price_history: [],
    reviews: [],
    alternatives: [],
    bestOverall: "Amazon",
    bestBudget: "Flipkart",
    aiSummary: `You've searched for a product outside our core tracked catalog. We've generated live search links so you can instantly check prices and availability for "${query}" across top Indian retailers.`,
    pros: ["Real-time search across multiple stores", "Direct links to platform search results"],
    cons: ["Live prices require clicking through", "Historical pricing data unavailable for dynamic queries"],
    expertReviews: [],
    authenticitySignals: [],
    retailerBreakdown: [],
    priceSignal: "CHECK LIVE — Click 'Buy Now' to search the retailer's live catalog.",
    smartTip: `For custom searches like "${query}", compare results on Amazon, Flipkart, and Croma to ensure you're getting the best deal.`,
  };
}

// ─── Legacy Exports (for backward compatibility) ────────────
export const product = productCatalog["samsung-s24-128-black"];
export const retailers = product.retailers;
export const price_history = product.price_history;
export const reviews = product.reviews;
export const alternatives = product.alternatives;

export const wishlist = [
  { id: "s-s24", name: "Samsung Galaxy S24", price: 62999, old_price: 64999, dropped: true, image: "https://m.media-amazon.com/images/I/71ScpYvIDHL._SL1500_.jpg" },
  { id: "w-earbuds", name: "Sony WF-1000XM5", price: 21999, dropped: false, image: "https://m.media-amazon.com/images/I/61oCISLE+PL._SL1500_.jpg" },
  { id: "l-macbook", name: "MacBook Air M3", price: 104990, dropped: false, image: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._SL1500_.jpg" },
  { id: "v-ipad", name: "iPad Pro 11", price: 79900, old_price: 81900, dropped: true, image: "https://m.media-amazon.com/images/I/81d74M0QveL._SL1500_.jpg" },
  { id: "k-kindle", name: "Kindle Paperwhite", price: 13999, dropped: false, image: "https://m.media-amazon.com/images/I/61D4Z3yKPAL._SL1000_.jpg" },
];

export const alerts = [
  { id: 1, product: "iPhone 15", target_price: 60000, current_price: 69999, status: "Active" },
  { id: 2, product: "PS5 Console", target_price: 45000, current_price: 49990, status: "Active" },
  { id: 3, product: "Sony WH-1000XM5", target_price: 25000, current_price: 26999, status: "Active" },
];

export default productCatalog;
