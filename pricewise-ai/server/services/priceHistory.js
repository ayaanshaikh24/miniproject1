import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const HISTORY_FILE = join(DATA_DIR, 'price_history.json');

// In-memory cache of all price history
let historyData = null; // { [queryKey]: [ { retailer, price, trust_score, stock_status, image_url, recorded_at } ] }
let dirty = false;
let saveTimer = null;

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadHistory() {
  if (historyData !== null) return historyData;
  try {
    await ensureDataDir();
    if (existsSync(HISTORY_FILE)) {
      const raw = await readFile(HISTORY_FILE, 'utf-8');
      historyData = JSON.parse(raw);
    } else {
      historyData = {};
    }
  } catch (err) {
    console.warn('[price-history] Failed to load file, starting fresh:', err.message);
    historyData = {};
  }
  return historyData;
}

async function persistHistory() {
  if (!dirty || !historyData) return;
  try {
    await ensureDataDir();
    await writeFile(HISTORY_FILE, JSON.stringify(historyData, null, 2), 'utf-8');
    dirty = false;
  } catch (err) {
    console.warn('[price-history] Failed to persist:', err.message);
  }
}

function schedulePersist() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    await persistHistory();
  }, 2000); // batch writes: persist at most every 2s
}

/**
 * Save price snapshots for a query.
 * Works for ANY product type — no phone-only restrictions.
 */
export async function savePriceSnapshots(query, retailers) {
  if (!Array.isArray(retailers) || retailers.length === 0) return;
  const key = String(query || '').trim().toLowerCase();
  if (!key) return;

  try {
    const data = await loadHistory();
    if (!data[key]) data[key] = [];

    const now = new Date().toISOString();
    const snapshots = retailers
      .filter(r => typeof r.price === 'number' && r.price > 0 && !r.searchOnly)
      .map(r => ({
        retailer: r.store || 'Unknown',
        price: r.price,
        trust_score: r.trustScore || 0,
        stock_status: r.stockStatus || 'Unknown',
        image_url: r.image || '',
        recorded_at: now,
      }));

    if (snapshots.length === 0) return;
    data[key].push(...snapshots);

    // Trim old entries (>90 days) to keep file manageable
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    data[key] = data[key].filter(s => new Date(s.recorded_at).getTime() > cutoff);

    dirty = true;
    schedulePersist();
    console.log(`[price-history] ✓ Saved ${snapshots.length} snapshots for "${key}"`);
  } catch (err) {
    console.warn('[price-history] save error:', err.message);
  }
}

/**
 * Get price history for a query.
 * Works for ANY product type.
 */
export async function getPriceHistory(query, days = 30) {
  const key = String(query || '').trim().toLowerCase();
  if (!key) return [];

  try {
    const data = await loadHistory();
    const entries = data[key] || [];

    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return entries.filter(row => {
      const ts = new Date(row.recorded_at).getTime();
      return ts > since && Number(row.price) > 0;
    });
  } catch (err) {
    console.warn('[price-history] read error:', err.message);
    return [];
  }
}
