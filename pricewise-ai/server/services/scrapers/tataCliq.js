import { withRetailerPage } from './browser.js';
import { createFallbackRetailer, normalizeProductUrl, retryScrape } from './helpers.js';
import { searchSiteProductUrl } from './siteSearch.js';

export async function scrapeTataCliq(query) {
  const searchUrl = `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`;

  try {
    const product = await retryScrape(async () => withRetailerPage(searchUrl, async (page) => {
      await page.waitForTimeout(3000);

      const products = await page.evaluate(() => {
        const parseMoney = (value) => {
          const match = value?.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
        };

        // Tata Cliq product cards use data-* or anchor with product slug
        const cards = Array.from(document.querySelectorAll('[data-qaid="product-card"], .ProductModule__product-container, article'));

        if (cards.length === 0) {
          // Fallback: grab all anchors pointing to product pages
          const anchors = Array.from(document.querySelectorAll('a[href*="/p-"]'));
          return anchors.slice(0, 5).map((a) => {
            const parent = a.closest('li, article, div[class*="product"]') || a.parentElement;
            const text = (parent?.textContent || '').replace(/\s+/g, ' ').trim();
            const priceMatches = Array.from(text.matchAll(/₹\s?[\d,]+/g)).map((m) => parseMoney(m[0])).filter(Boolean);
            const title = parent?.querySelector('h2, h3, p[class*="title"], [class*="name"]')?.textContent?.trim()
              || (a.textContent || '').trim();
            return { title, href: a.getAttribute('href') || '', price: priceMatches[0] || 0, mrp: priceMatches[1] || priceMatches[0] || 0, image: parent?.querySelector('img')?.getAttribute('src') || '' };
          }).filter((p) => p.title && p.price);
        }

        return cards.slice(0, 5).map((card) => {
          const link = card.querySelector('a[href*="/p-"]') || card.closest('a');
          const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
          const priceMatches = Array.from(text.matchAll(/₹\s?[\d,]+/g)).map((m) => parseMoney(m[0])).filter(Boolean);
          const title = card.querySelector('h2, h3, [class*="title"], [class*="name"]')?.textContent?.trim() || '';
          return {
            title,
            href: link?.getAttribute('href') || '',
            price: priceMatches[0] || 0,
            mrp: priceMatches[1] || priceMatches[0] || 0,
            image: card.querySelector('img')?.getAttribute('src') || '',
          };
        }).filter((p) => p.title && p.price);
      });

      // Pick the product whose title best matches the search query
      if (Array.isArray(products) && products.length > 1) {
        const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const qtokens = nrm(query).split(' ').filter(t => t.length >= 3);
        if (qtokens.length > 0) products.sort((a, b) => qtokens.filter(t => nrm(b.title).includes(t)).length - qtokens.filter(t => nrm(a.title).includes(t)).length);
      }
      return products[0] || null;
    }), { attempts: 1 });

    if (product?.title && product?.price) {
      const productUrl = normalizeProductUrl('https://www.tatacliq.com', product.href);
      const mrp = product.mrp >= product.price ? product.mrp : product.price;
      const discountPct = mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;

      return {
        retailer: 'Tata Cliq',
        logo_initial: 'T',
        color: '#E21D24',
        url: productUrl,
        price: product.price,
        mrp,
        discount_pct: discountPct,
        shipping: 0,
        tax: 0,
        total_delivered: product.price,
        delivery_date: 'Check on site',
        stock_status: 'In Stock',
        trust_score: 89,
        is_official: true,
        coupons: [],
        return_days: 7,
        warranty: 'Brand Warranty',
        seller_name: 'Tata Cliq',
        rating: 0,
        review_count: 0,
        productName: product.title,
        image: (product.image && !product.image.includes('placeholder')) ? product.image : '',
        reviews: [],
        review_source: 'Tata Cliq',
      };
    }
  } catch (error) {
    console.warn('[tatacliq] scrape failed:', error.message);
  }

  // Fallback: find a Tata Cliq product URL via search engine, then parse the PDP directly.
  try {
    const productUrl = await retryScrape(
      async () => searchSiteProductUrl({ site: 'www.tatacliq.com', query }),
      { attempts: 1 },
    );

    if (productUrl) {
      const product = await withRetailerPage(productUrl, async (page) => {
        await page.waitForTimeout(2500);

        return await page.evaluate(() => {
          const parseMoney = (value) => {
            const match = value?.match(/[\d,]+/);
            return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
          };

          const title =
            document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
            document.querySelector('h1')?.textContent?.trim() ||
            document.title?.replace(/\s*\|.*$/, '').trim() ||
            '';

          const bodyText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();
          const priceMatches = Array.from(bodyText.matchAll(/(?:₹|Rs\.?|INR)\s?[\d,]+/gi))
            .map((match) => parseMoney(match[0]))
            .filter(Boolean);

          const image =
            document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            document.querySelector('img[src]')?.getAttribute('src') ||
            '';

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
          retailer: 'Tata Cliq',
          logo_initial: 'T',
          color: '#E21D24',
          url: normalizeProductUrl('https://www.tatacliq.com', productUrl),
          price: product.price,
          mrp,
          discount_pct: discountPct,
          shipping: 0,
          tax: 0,
          total_delivered: product.price,
          delivery_date: 'Check on site',
          stock_status: 'In Stock',
          trust_score: 89,
          is_official: true,
          coupons: [],
          return_days: 7,
          warranty: 'Brand Warranty',
          seller_name: 'Tata Cliq',
          rating: 0,
          review_count: 0,
          productName: product.title,
          image: product.image || '',
          reviews: [],
          review_source: 'Tata Cliq',
        };
      }
    }
  } catch (error) {
    console.warn('[tatacliq] product-page fallback failed:', error.message);
  }

  return createFallbackRetailer({
    retailer: 'Tata Cliq',
    logoInitial: 'T',
    color: '#E21D24',
    url: searchUrl,
    trustScore: 89,
    sellerName: 'Tata Cliq',
    returnDays: 7,
    query,
  });
}
