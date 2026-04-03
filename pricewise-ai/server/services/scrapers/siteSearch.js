import * as cheerio from 'cheerio';
import { browserHeaders } from './helpers.js';

export async function searchSiteProductUrl({ site, query }) {
  const searchQuery = `site:${site} ${query}`;
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: browserHeaders({ Host: 'html.duckduckgo.com' }),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const links = $('a.result__a');

      for (let index = 0; index < links.length; index += 1) {
        const rawHref = $(links[index]).attr('href') || '';
        const resolved = resolveDuckDuckGoUrl(rawHref);
        if (isUsableProductUrl(resolved, site)) {
          return resolved;
        }
      }
    }
  } catch {
    // fall through to SerpAPI fallback
  }

  return await searchSiteProductUrlViaSerpApi({ site, query, searchQuery });
}

async function searchSiteProductUrlViaSerpApi({ site, query, searchQuery }) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&gl=in&hl=en`;
    const response = await fetch(url, {
      headers: browserHeaders(),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const organicResults = Array.isArray(data?.organic_results) ? data.organic_results : [];

    for (const result of organicResults) {
      const resolved = String(result?.link || '').trim();
      const title = String(result?.title || '').trim();
      if (!resolved || !resolved.includes(site)) continue;
      if (isUsableProductUrl(resolved, site)) return resolved;

      const normalizedTitle = title.toLowerCase();
      const normalizedQuery = String(query || '').toLowerCase();
      if (normalizedTitle.includes(normalizedQuery) && !/search|category|offers|deals/i.test(resolved)) {
        return resolved;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isUsableProductUrl(value, site) {
  if (!value || !value.includes(site)) return false;

  const productPathHints = {
    'www.amazon.in': ['/dp/', '/gp/product/'],
    'www.flipkart.com': ['/p/'],
    'www.croma.com': ['/p/'],
    'www.reliancedigital.in': ['/p/'],
    'www.tatacliq.com': ['/p-'],
    'www.vijaysales.com': ['/p/', '/product/'],
    'www.jiomart.com': ['/p/'],
    'www.snapdeal.com': ['/product/'],
    'www.meesho.com': ['/p/'],
    'www.nykaa.com': ['/p/'],
    'www.myntra.com': ['/buy/'],
    'www.tataneu.com': ['/p/'],
    'www.bajajfinservmarkets.in': ['/product/'],
    'www.shopclues.com': ['/product/'],
  };

  const deniedFragments = ['/search', 'search?', '/s?', '/all-categories', '/offers', '/collections'];
  if (deniedFragments.some((fragment) => value.includes(fragment))) return false;

  const allowedHints = productPathHints[site] || [];
  if (allowedHints.length === 0) return true;
  return allowedHints.some((hint) => value.includes(hint));
}

function resolveDuckDuckGoUrl(rawHref) {
  if (!rawHref) return '';
  if (rawHref.startsWith('http')) return rawHref;

  try {
    const url = new URL(rawHref, 'https://html.duckduckgo.com');
    return url.searchParams.get('uddg') || rawHref;
  } catch {
    return rawHref;
  }
}