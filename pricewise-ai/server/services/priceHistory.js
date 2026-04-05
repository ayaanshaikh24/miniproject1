import { supabase, isSupabaseReady } from './supabase.js';

const PHONE_QUERY_KEYWORDS = [
  'iphone',
  'samsung',
  'oneplus',
  'pixel',
  'realme',
  'redmi',
  'xiaomi',
  'oppo',
  'vivo',
  'nothing',
  'motorola',
  'moto',
  'mobile',
  'phone',
  'smartphone',
];

function isPhoneLikeQuery(query = '') {
  const q = String(query || '').toLowerCase();
  return PHONE_QUERY_KEYWORDS.some((keyword) => q.includes(keyword));
}

export async function savePriceSnapshots(query, retailers) {
  if (!isSupabaseReady() || !Array.isArray(retailers) || retailers.length === 0) return;
  const key = String(query || '').trim().toLowerCase();
  if (!key) return;

  try {
    const snapshots = retailers
      .filter(r => typeof r.price === 'number' && r.price > 0 && !r.searchOnly)
      .map(r => ({
        product_query: key,
        retailer: r.store || 'Unknown',
        price: r.price,
        trust_score: r.trustScore || 0,
        stock_status: r.stockStatus || 'Unknown',
        image_url: r.image || '',
        recorded_at: new Date().toISOString(),
      }));

    if (snapshots.length === 0) return;
    const { error } = await supabase.from('price_history').insert(snapshots);
    if (error) console.warn('[price-history] save error:', error.message);
  } catch (err) {
    console.warn('[price-history] save error:', err.message);
  }
}

export async function getPriceHistory(query, days = 30) {
  if (!isSupabaseReady()) return [];
  const key = String(query || '').trim().toLowerCase();
  if (!key) return [];

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('price_history')
      .select('retailer, price, trust_score, stock_status, image_url, recorded_at')
      .eq('product_query', key)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      console.warn('[price-history] read error:', error.message);
      return [];
    }
    const rows = data || [];

    // Filter out corrupted/implausible points (for example accessory prices for phone queries).
    const minPrice = isPhoneLikeQuery(key) ? 5000 : 1;
    return rows.filter((row) => Number(row?.price) >= minPrice && Number(row?.trust_score || 0) >= 60);
  } catch (err) {
    console.warn('[price-history] read error:', err.message);
    return [];
  }
}
