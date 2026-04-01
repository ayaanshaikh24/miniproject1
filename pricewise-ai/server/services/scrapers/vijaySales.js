import { withRetailerPage } from './browser.js';
import { createFallbackRetailer, normalizeImageUrl, retryScrape } from './helpers.js';
import { searchSiteProductUrl } from './siteSearch.js';

export async function scrapeVijaySales(query) {
  const searchUrl = `https://www.vijaysales.com/search/${encodeURIComponent(query)}`;

  try {
    const productUrl = await retryScrape(async () => searchSiteProductUrl({ site: 'www.vijaysales.com', query }), { attempts: 1 });
    if (productUrl) {
      const product = await withRetailerPage(productUrl, async (page) => {
        await page.waitForTimeout(2500);

        return await page.evaluate(() => {
          const parseMoney = (value) => {
            const match = value?.match(/[\d,]+/);
            return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
          };

          const bodyText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();
          const priceMatches = Array.from(bodyText.matchAll(/₹\s?[\d,]+/g)).map((match) => parseMoney(match[0])).filter(Boolean);
          const title = document.querySelector('h1')?.textContent?.trim() || document.title.replace(/\|.*$/, '').trim();
          const image = document.querySelector('img[src], img[data-src]')?.getAttribute('src') || document.querySelector('img[data-src]')?.getAttribute('data-src') || '';

          return {
            title,
            price: priceMatches[0] || 0,
            mrp: priceMatches[1] || priceMatches[0] || 0,
            image,
          };
        });
      });

      if (product?.title && product?.price) {
        const mrp = product.mrp >= product.price ? product.mrp : product.price;
        const discountPct = mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;
        return {
          retailer: 'Vijay Sales',
          logo_initial: 'V',
          color: '#E8382F',
          url: productUrl,
          price: product.price,
          mrp,
          discount_pct: discountPct,
          shipping: 0,
          tax: 0,
          total_delivered: product.price,
          delivery_date: 'Check on site',
          stock_status: 'In Stock',
          trust_score: 90,
          is_official: true,
          coupons: [],
          return_days: 7,
          warranty: 'Brand Warranty',
          seller_name: 'Vijay Sales',
          rating: 0,
          review_count: 0,
          productName: product.title,
          image: normalizeImageUrl('https://www.vijaysales.com', product.image),
        };
      }
    }
  } catch (error) {
    console.warn('[vijaysales] scrape failed:', error.message);
  }

  return createFallbackRetailer({
    retailer: 'Vijay Sales',
    logoInitial: 'V',
    color: '#E8382F',
    url: searchUrl,
    trustScore: 90,
    sellerName: 'Vijay Sales',
    returnDays: 7,
    query,
  });
}