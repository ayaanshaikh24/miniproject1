import { withRetailerPage } from './browser.js';
import { createFallbackRetailer, normalizeImageUrl, normalizeProductUrl, retryScrape } from './helpers.js';
import { searchSiteProductUrl } from './siteSearch.js';

export async function scrapeRelianceDigital(query) {
  const searchUrl = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;

  try {
    const product = await retryScrape(async () => withRetailerPage(searchUrl, async (page) => {
      await page.waitForTimeout(2200);

      const products = await page.evaluate(() => {
        const parseMoney = (value) => {
          const match = value?.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
        };

        const links = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/product/"], a[href*="/item/"]'));

        const climbCard = (element) => {
          let current = element;
          for (let depth = 0; depth < 7 && current; depth += 1) {
            const text = (current.textContent || '').trim();
            if (text.includes('₹') && text.length > 20) return current;
            current = current.parentElement;
          }
          return element.parentElement || element;
        };

        return links.map((link) => {
          const href = link.getAttribute('href') || '';
          if (!href.includes('/p/')) return null;

          const card = climbCard(link);
          const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
          const priceMatches = Array.from(text.matchAll(/₹\s?[\d,]+/g)).map((match) => parseMoney(match[0])).filter(Boolean);
          const price = priceMatches[0] || 0;
          const mrp = priceMatches[1] || price;

          const title = link.getAttribute('title')?.trim()
            || card.querySelector('h3, h2, p.sp__name, .product-card-details__name')?.textContent?.trim()
            || (link.textContent || '').trim()
            || '';

          if (!title || !price) return null;

          return {
            title,
            href,
            price,
            mrp: mrp >= price ? mrp : price,
            image: card.querySelector('img')?.getAttribute('src') || '',
          };
        }).filter(Boolean);
      });

      // Pick the product whose title best matches the search query
      if (Array.isArray(products) && products.length > 1) {
        const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const qtokens = nrm(query).split(' ').filter(t => t.length >= 3);
        if (qtokens.length > 0) products.sort((a, b) => qtokens.filter(t => nrm(b.title).includes(t)).length - qtokens.filter(t => nrm(a.title).includes(t)).length);
      }
      return products[0] || null;
    }), { attempts: 1 });

    if (product) {
      const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
      return {
        retailer: 'Reliance Digital',
        logo_initial: 'R',
        color: '#ED1C24',
        url: normalizeProductUrl('https://www.reliancedigital.in', product.href),
        price: product.price,
        mrp: product.mrp,
        discount_pct: discountPct,
        shipping: 0,
        tax: 0,
        total_delivered: product.price,
        delivery_date: 'Check on site',
        stock_status: 'In Stock',
        trust_score: 93,
        is_official: true,
        coupons: [],
        return_days: 7,
        warranty: 'Brand Warranty',
        seller_name: 'Reliance Digital',
        rating: 0,
        review_count: 0,
        productName: product.title,
        image: normalizeImageUrl('https://www.reliancedigital.in', product.image),
      };
    }
  } catch (error) {
    console.warn('[reliance] browser scrape failed:', error.message);
  }

  try {
    const productUrl = await searchSiteProductUrl({ site: 'www.reliancedigital.in', query });
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
          retailer: 'Reliance Digital',
          logo_initial: 'R',
          color: '#ED1C24',
          url: productUrl,
          price: product.price,
          mrp,
          discount_pct: discountPct,
          shipping: 0,
          tax: 0,
          total_delivered: product.price,
          delivery_date: 'Check on site',
          stock_status: 'In Stock',
          trust_score: 93,
          is_official: true,
          coupons: [],
          return_days: 7,
          warranty: 'Brand Warranty',
          seller_name: 'Reliance Digital',
          rating: 0,
          review_count: 0,
          productName: product.title,
          image: normalizeImageUrl('https://www.reliancedigital.in', product.image),
        };
      }
    }
  } catch (error) {
    console.warn('[reliance] site-search fallback failed:', error.message);
  }

  return createFallbackRetailer({
    retailer: 'Reliance Digital',
    logoInitial: 'R',
    color: '#ED1C24',
    url: searchUrl,
    trustScore: 93,
    sellerName: 'Reliance Digital',
    returnDays: 7,
    query,
  });
}