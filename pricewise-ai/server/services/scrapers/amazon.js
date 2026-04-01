import { withRetailerPage } from './browser.js';
import { createFallbackRetailer, normalizeProductUrl, retryScrape } from './helpers.js';
import { searchSiteProductUrl } from './siteSearch.js';

/**
 * Scrape the first relevant product from Amazon.in search results.
 * Returns a single retailer object matching the frontend schema, or null.
 */
export async function scrapeAmazon(query) {
  const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;

  try {
    const product = await retryScrape(async () => withRetailerPage(searchUrl, async (page) => {
      const captchaVisible = await page.locator('form[action*="validateCaptcha"]').count();
      if (captchaVisible > 0) {
        throw new Error('Amazon presented captcha');
      }

      await page.waitForSelector('div[data-component-type="s-search-result"], [data-asin], [data-cy="title-recipe"]', { timeout: 7000 });

      const products = await page.evaluate(() => {
        const parseMoney = (value) => {
          const match = value?.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
        };

        // Try multiple selectors — Amazon frequently changes their layout
        let cards = Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]'));
        if (cards.length === 0) {
          cards = Array.from(document.querySelectorAll('[data-asin]')).filter(el => {
            const asin = el.getAttribute('data-asin');
            return asin && asin.length > 0 && el.querySelector('h2 a, h2 span');
          });
        }

        return cards.map((card) => {
          const asin = card.getAttribute('data-asin');
          if (!asin) return null;

          const title = card.querySelector('h2 a span')?.textContent?.trim() || '';
          const href = card.querySelector('h2 a')?.getAttribute('href') || '';
          const price = parseMoney(card.querySelector('span.a-price:not(.a-text-price) .a-offscreen')?.textContent || card.querySelector('span.a-price .a-price-whole')?.textContent || '');
          const mrp = parseMoney(card.querySelector('span.a-price.a-text-price .a-offscreen')?.textContent || '') || price;
          const image = card.querySelector('img.s-image')?.getAttribute('src') || '';
          const ratingText = card.querySelector('span.a-icon-alt')?.textContent || '';
          const ratingMatch = ratingText.match(/([\d.]+)/);
          const reviewCount = parseMoney(card.querySelector('span.a-size-base.s-underline-text')?.textContent || '');

          if (!title || !price) return null;

          return {
            title,
            href,
            price,
            mrp,
            image,
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
            reviewCount,
          };
        }).filter(Boolean);
      });

      // Pick the product whose title best matches the search query
      if (Array.isArray(products) && products.length > 1) {
        const nrm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        const qtokens = nrm(query).split(' ').filter(t => t.length >= 3);
        if (qtokens.length > 0) products.sort((a, b) => qtokens.filter(t => nrm(b.title).includes(t)).length - qtokens.filter(t => nrm(a.title).includes(t)).length);
      }
      if (products.length === 0) console.warn('[amazon] page loaded but 0 product cards found');
      return products[0] || null;
    }), { attempts: 1 });

    if (product) {
      const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

      return {
        retailer: 'Amazon',
        logo_initial: 'A',
        color: '#FF9900',
        url: normalizeProductUrl('https://www.amazon.in', product.href),
        price: product.price,
        mrp: product.mrp,
        discount_pct: discountPct,
        shipping: 0,
        tax: 0,
        total_delivered: product.price,
        delivery_date: 'Check on site',
        stock_status: 'In Stock',
        trust_score: 92,
        is_official: true,
        coupons: [],
        return_days: 7,
        warranty: 'Brand Warranty',
        seller_name: 'Amazon.in',
        rating: product.rating,
        review_count: product.reviewCount,
        productName: product.title,
        image: product.image,
        reviews: [],
        review_source: 'Amazon',
      };
    }
  } catch (error) {
    console.warn('[amazon] browser scrape failed:', error.message);
  }

  // Fallback: use DuckDuckGo to find an Amazon product URL, then scrape the product page
  try {
    const productUrl = await searchSiteProductUrl({ site: 'www.amazon.in', query });
    if (productUrl) {
      const product = await withRetailerPage(productUrl, async (page) => {
        return await page.evaluate(() => {
          const parseMoney = (value) => {
            const match = value?.match(/[\d,]+/);
            return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
          };
          const title = document.querySelector('#productTitle')?.textContent?.trim() || document.querySelector('h1 span')?.textContent?.trim() || '';
          const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, #corePrice_feature_div .a-offscreen, #tp_price_block_total_price_wc .a-offscreen');
          const price = parseMoney(priceEl?.textContent || '');
          const mrpEl = document.querySelector('.a-price.a-text-price .a-offscreen, .basisPrice .a-offscreen');
          const mrp = parseMoney(mrpEl?.textContent || '') || price;
          const image = document.querySelector('#imgTagWrapperId img, #landingImage')?.getAttribute('src') || '';
          const ratingText = document.querySelector('#acrPopover .a-icon-alt, [data-hook="rating-out-of-text"]')?.textContent || '';
          const ratingMatch = ratingText.match(/([\d.]+)/);
          const reviewCountText = document.querySelector('#acrCustomerReviewText')?.textContent || '';
          const reviewCount = parseMoney(reviewCountText);
          return { title, price, mrp, image, rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0, reviewCount };
        });
      });
      if (product?.title && product?.price) {
        const mrp = product.mrp >= product.price ? product.mrp : product.price;
        const discountPct = mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;
        return {
          retailer: 'Amazon', logo_initial: 'A', color: '#FF9900',
          url: productUrl, price: product.price, mrp, discount_pct: discountPct,
          shipping: 0, tax: 0, total_delivered: product.price,
          delivery_date: 'Check on site', stock_status: 'In Stock',
          trust_score: 92, is_official: true, coupons: [], return_days: 7,
          warranty: 'Brand Warranty', seller_name: 'Amazon.in',
          rating: product.rating, review_count: product.reviewCount,
          productName: product.title, image: product.image,
          reviews: [], review_source: 'Amazon',
        };
      }
    }
  } catch (err) {
    console.warn('[amazon] DuckDuckGo fallback failed:', err.message);
  }

  return createFallbackRetailer({
    retailer: 'Amazon',
    logoInitial: 'A',
    color: '#FF9900',
    url: searchUrl,
    trustScore: 92,
    sellerName: 'Amazon.in',
    returnDays: 7,
    query,
  });
}

/**
 * Scrape top customer reviews from an Amazon product detail page.
 * Uses stable data-hook attributes rather than obfuscated class names.
 */
export async function scrapeAmazonProductInsights(productUrl) {
  try {
    return await withRetailerPage(productUrl, async (page) => {
      // Check for captcha
      const captchaVisible = await page.locator('form[action*="validateCaptcha"]').count();
      if (captchaVisible > 0) throw new Error('Amazon captcha on product page');

      // Wait for either reviews section or customer review widget
      await page.waitForSelector(
        '[data-hook="review"], #averageCustomerReviews, [data-hook="cmps-review-star-rating"]',
        { timeout: 7000 },
      ).catch(() => {});

      return await page.evaluate(() => {
        const clean = (val) => (val || '').replace(/\s+/g, ' ').trim();

        // ── Individual review cards (data-hook is stable on Amazon) ──
        const reviewEls = Array.from(document.querySelectorAll('[data-hook="review"]')).slice(0, 5);
        const reviews = reviewEls.map((el) => {
          const titleEl = el.querySelector('[data-hook="review-title"]');
          // Amazon puts the star count inside the title span too; grab the text-only child
          const titleText = clean(
            Array.from(titleEl?.querySelectorAll('span') || [])
              .filter((s) => !s.querySelector('span') && !/out of 5 stars/i.test(s.textContent || ''))
              .map((s) => s.textContent)
              .join(' ') || titleEl?.textContent || '',
          );

          const bodyEl = el.querySelector('[data-hook="review-body"]');
          const body = clean(bodyEl?.textContent || '').replace(/^Read more\s*/i, '');

          const reviewer = clean(
            el.querySelector('[data-hook="genome-widget"] span')?.textContent ||
            el.querySelector('.a-profile-name')?.textContent || '',
          );

          const ratingEl = el.querySelector(
            '[data-hook="review-star-rating"] .a-icon-alt, [data-hook="cmps-review-star-rating"] .a-icon-alt',
          );
          const ratingMatch = ratingEl?.textContent?.match(/([\d.]+)/);

          return {
            title: titleText,
            text: body.slice(0, 450),
            reviewer: reviewer || 'Amazon customer',
            source: 'Amazon',
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
          };
        }).filter((r) => r.text.length > 25);

        return { reviews };
      });
    });
  } catch (error) {
    console.warn('[amazon] product insights failed:', error.message);
    return { reviews: [] };
  }
}
