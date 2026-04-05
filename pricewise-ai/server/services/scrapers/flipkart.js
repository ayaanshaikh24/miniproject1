import { withRetailerPage } from './browser.js';
import { createFallbackRetailer, normalizeProductUrl, retryScrape } from './helpers.js';
import { searchSiteProductUrl } from './siteSearch.js';

/**
 * Scrape the first relevant product from Flipkart search results.
 * Flipkart uses obfuscated class names that change, so we rely on
 * structural selectors and text-content patterns instead.
 */
export async function scrapeFlipkart(query) {
  const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  try {
    const product = await retryScrape(async () => withRetailerPage(searchUrl, async (page) => {
      await page.waitForTimeout(800);

      const closeButton = page.getByRole('button', { name: '✕' }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click().catch(() => {});
      }

      await page.waitForSelector('a[href*="/p/"], div[data-id]', { timeout: 7000 });

      const products = await page.evaluate(() => {
        const parseMoney = (value) => {
          const match = value?.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
        };

        const cards = Array.from(document.querySelectorAll('div[data-id]'));

        return cards.map((card) => {
          const link = card.querySelector('a[href*="/p/"]');
          if (!link) return null;

          const text = card.textContent || '';
          const exactPriceTexts = Array.from(card.querySelectorAll('div, span'))
            .map((element) => element.textContent?.trim() || '')
            .filter((value) => /^₹\s?[\d,]+$/.test(value));
          const numericPrices = [...new Set(exactPriceTexts.map((value) => parseMoney(value)).filter(Boolean))];

          let price = numericPrices[0] || 0;
          let mrp = numericPrices[1] || price;

          if (mrp && mrp < price) {
            [price, mrp] = [mrp, price];
          }

          if (mrp > price * 2) {
            mrp = price;
          }

          if (!price) return null;

          const title = link.getAttribute('title')?.trim()
            || card.querySelector('img[alt]')?.getAttribute('alt')?.trim()
            || Array.from(card.querySelectorAll('div, span'))
              .map((element) => element.textContent?.trim() || '')
              .find((value) => value.length > 20 && value.length < 220 && !value.includes('₹'))
            || '';

          if (!title) return null;

          const ratingFromBadge = Array.from(card.querySelectorAll('div, span'))
            .map((el) => (el.textContent || '').trim())
            .find((value) => /^([1-5](?:\.\d)?)\s*★?$/.test(value));
          const ratingMatch = (ratingFromBadge || text).match(/([1-5](?:\.\d)?)\s*★?/);
          const ratingReviewMatch = text.match(/([\d,]+)\s+Ratings?\s*&\s*([\d,]+)\s+Reviews?/i);
          const reviewMatch = text.match(/([\d,]+)\s+Reviews?/i);
          const ratingCount = ratingReviewMatch ? parseInt(ratingReviewMatch[1].replace(/,/g, ''), 10) : 0;
          const reviewCount = ratingReviewMatch
            ? parseInt(ratingReviewMatch[2].replace(/,/g, ''), 10)
            : reviewMatch
              ? parseInt(reviewMatch[1].replace(/,/g, ''), 10)
              : 0;

          const imageEl = card.querySelector('img');
          const srcset = imageEl?.getAttribute('srcset') || '';
          const firstSrcset = srcset.split(',')[0]?.trim().split(' ')[0] || '';
          const imageUrl = imageEl?.getAttribute('src')
            || imageEl?.getAttribute('data-src')
            || imageEl?.getAttribute('data-lazy-src')
            || firstSrcset
            || '';

          return {
            title,
            href: link.getAttribute('href') || '',
            price,
            mrp,
            image: imageUrl,
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
            reviewCount: reviewCount || ratingCount,
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
      const productUrl = normalizeProductUrl('https://www.flipkart.com', product.href);
      let rating = product.rating;
      let reviewCount = product.reviewCount;
      let image = (product.image && !product.image.includes('placeholder')) ? product.image : '';

      // Search cards often miss rating/image; enrich from PDP when needed.
      if (!rating || !image) {
        try {
          const enrich = await withRetailerPage(productUrl, async (page) => {
            await page.waitForTimeout(1200);
            return await page.evaluate(() => {
              const clean = (v) => (v || '').replace(/\s+/g, ' ').trim();
              const parseCount = (value) => {
                const match = String(value || '').match(/[\d,]+/);
                return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
              };

              const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
              const imgSrc = document.querySelector('img[src], img[data-src]')?.getAttribute('src')
                || document.querySelector('img[data-src]')?.getAttribute('data-src')
                || '';

              const bodyText = clean(document.body?.textContent || '');
              const ratingMatch = bodyText.match(/\b([1-5](?:\.\d)?)\s*★/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
              const reviewMatch = bodyText.match(/([\d,]+)\s+Reviews?/i);
              const reviewCount = reviewMatch ? parseCount(reviewMatch[1]) : 0;

              return {
                image: ogImage || imgSrc,
                rating,
                reviewCount,
              };
            });
          });

          if (!image && enrich?.image) image = enrich.image;
          if (!rating && enrich?.rating) rating = enrich.rating;
          if (!reviewCount && enrich?.reviewCount) reviewCount = enrich.reviewCount;
        } catch {
          // keep existing values
        }
      }

      const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

      return {
        retailer: 'Flipkart',
        logo_initial: 'F',
        color: '#2874F0',
        url: productUrl,
        price: product.price,
        mrp: product.mrp,
        discount_pct: discountPct,
        shipping: 0,
        tax: 0,
        total_delivered: product.price,
        delivery_date: 'Check on site',
        stock_status: 'In Stock',
        trust_score: 94,
        is_official: true,
        coupons: [],
        return_days: 10,
        warranty: 'Brand Warranty',
        seller_name: 'Flipkart',
        rating,
        review_count: reviewCount,
        productName: product.title,
        image,
        reviews: [],
        review_source: 'Flipkart',
      };
    }
  } catch (error) {
    console.warn('[flipkart] browser scrape failed:', error.message);
  }

  try {
    const productUrl = await searchSiteProductUrl({ site: 'www.flipkart.com', query });
    if (productUrl) {
      const product = await withRetailerPage(productUrl, async (page) => {
        await page.waitForTimeout(1800);

        return await page.evaluate(() => {
          const parseMoney = (value) => {
            const match = value?.match(/[\d,]+/);
            return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
          };

          const bodyText = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();
          const priceMatches = Array.from(bodyText.matchAll(/₹\s?[\d,]+/g)).map((match) => parseMoney(match[0])).filter(Boolean);
          const title = document.querySelector('h1, span.B_NuCI')?.textContent?.trim() || document.title.replace(/\|.*$/, '').trim();
          const image = document.querySelector('img[src], img[srcset]')?.getAttribute('src') || '';

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
          retailer: 'Flipkart',
          logo_initial: 'F',
          color: '#2874F0',
          url: productUrl,
          price: product.price,
          mrp,
          discount_pct: discountPct,
          shipping: 0,
          tax: 0,
          total_delivered: product.price,
          delivery_date: 'Check on site',
          stock_status: 'In Stock',
          trust_score: 94,
          is_official: true,
          coupons: [],
          return_days: 10,
          warranty: 'Brand Warranty',
          seller_name: 'Flipkart',
          rating: 0,
          review_count: 0,
          productName: product.title,
          image: product.image || '',
          reviews: [],
          review_source: 'Flipkart',
        };
      }
    }
  } catch (error) {
    console.warn('[flipkart] site-search fallback failed:', error.message);
  }

  return createFallbackRetailer({
    retailer: 'Flipkart',
    logoInitial: 'F',
    color: '#2874F0',
    url: searchUrl,
    trustScore: 94,
    sellerName: 'Flipkart',
    returnDays: 10,
    query,
  });
}

export { scrapeFlipkartProductInsights };

async function scrapeFlipkartProductInsights(productUrl) {
  try {
    return await withRetailerPage(productUrl, async (page) => {
      const closeButton = page.getByRole('button', { name: '✕' }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click().catch(() => {});
      }

      // Scroll to reveal lazy-loaded reviews
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(1200);

      // Try to click "All Reviews" to get more review coverage
      const allReviewsBtn = page.getByText(/all \d+ reviews?|see all reviews?|view all reviews?/i).first();
      if (await allReviewsBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await allReviewsBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
      } else {
        // Scroll further to load more review content
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(800);
      }

      return await page.evaluate(() => {
        const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
        const bodyText = clean(document.body?.textContent || '');

        // ── Rating & count ──────────────────────────────────────
        const summaryMatch = bodyText.match(/(\d(?:\.\d)?)\s*★?\s*([\d,.]+)\s+Ratings?\s*&\s*([\d,.]+)\s+Reviews?/i)
          || bodyText.match(/([\d,.]+)\s+Ratings?\s*&\s*([\d,.]+)\s+Reviews?/i);
        const reviewOnlyMatch = bodyText.match(/([\d,.]+)\s+Reviews?/i);

        // Class-name-independent rating: look for standalone "4.3" or "4.3 ★" near rating-total text
        const ratingInBody = bodyText.match(/\b(\d\.\d)\s*(?:★|out of 5)/i);

        // ── Review extraction — class-name-free ─────────────────
        const reviews = [];
        const seen = new Set();

        // Strategy 1: Find the smallest DOM element that contains
        // "Certified Buyer" + some review-like text.
        const allElements = Array.from(document.querySelectorAll('div, article, li'));
        const candidates = allElements.filter((el) => {
          const text = el.textContent?.trim() || '';
          return (
            text.includes('Certified Buyer') &&
            text.length >= 80 &&
            text.length <= 1200 &&
            el.children.length >= 1 &&
            el.children.length <= 20
          );
        });

        // Sort ascending by text length → pick the most specific containers
        candidates.sort((a, b) => a.textContent.length - b.textContent.length);

        for (const el of candidates) {
          if (reviews.length >= 4) break;
          const raw = clean(el.textContent);

          // Deduplicate (skip if current text is a sub/super-string of an already-seen one)
          const isDup = [...seen].some(
            (prev) => prev.includes(raw) || raw.includes(prev),
          );
          if (isDup) continue;
          seen.add(raw);

          const starMatch = raw.match(/\b(\d(?:\.\d)?)\s*★/);
          // Attempt to pull reviewer name: short word(s) before "Certified Buyer"
          const nameMatch = raw.match(/([A-Za-z][A-Za-z .]{1,30})\s+Certified Buyer/i);

          // Strip the "Certified Buyer" label and reviewer name from the body text
          let body = raw
            .replace(/Certified Buyer/gi, '')
            .replace(nameMatch ? nameMatch[0] : '', '')
            .replace(/\d(?:\.\d)?\s*★?/g, '')
            .replace(/READ MORE/gi, '')
            .replace(/^\s*[,.\-–|]\s*/, '')
            .trim();

          if (body.length < 30) continue;

          reviews.push({
            title: '',
            text: body.slice(0, 450),
            reviewer: nameMatch ? nameMatch[1].trim() : 'Flipkart customer',
            source: 'Flipkart',
            rating: starMatch ? parseFloat(starMatch[1]) : 0,
          });
        }

        // Strategy 2: If no reviews found yet, scrape broader "READ MORE" snippets
        if (reviews.length === 0) {
          const readMoreDivs = Array.from(document.querySelectorAll('div'))
            .filter((el) => {
              const text = el.textContent?.trim() || '';
              return text.length >= 100 && text.length <= 800 && /READ MORE|Certified Buyer/i.test(text);
            })
            .sort((a, b) => a.textContent.length - b.textContent.length)
            .slice(0, 4);

          for (const el of readMoreDivs) {
            if (reviews.length >= 3) break;
            const raw = clean(el.textContent);
            const isDup = [...seen].some((prev) => prev.includes(raw) || raw.includes(prev));
            if (isDup) continue;
            seen.add(raw);

            reviews.push({
              title: '',
              text: raw.replace(/READ MORE/gi, '').trim().slice(0, 400),
              reviewer: 'Flipkart customer',
              source: 'Flipkart',
              rating: 0,
            });
          }
        }

        return {
          rating: ratingInBody
            ? parseFloat(ratingInBody[1])
            : summaryMatch && summaryMatch.length === 4
              ? parseFloat(summaryMatch[1])
              : 0,
          reviewCount: summaryMatch
            ? parseInt(summaryMatch[summaryMatch.length - 1].replace(/[,.]/g, ''), 10)
            : reviewOnlyMatch
              ? parseInt(reviewOnlyMatch[1].replace(/[,.]/g, ''), 10)
              : 0,
          reviews,
        };
      });
    });
  } catch (error) {
    console.warn('[flipkart] product insights failed:', error.message);
    return { rating: 0, reviewCount: 0, reviews: [] };
  }
}
