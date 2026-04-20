-- PriceWise AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ============================================================
-- 1. Product Cache (3-hour TTL)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_normalized TEXT NOT NULL UNIQUE,
  response_payload JSONB NOT NULL,
  retailer_count INTEGER DEFAULT 0,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 hours')
);

CREATE INDEX IF NOT EXISTS idx_product_cache_query ON product_cache(query_normalized);
CREATE INDEX IF NOT EXISTS idx_product_cache_expires ON product_cache(expires_at);

-- ============================================================
-- 2. Price History (snapshots per search)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT,
  product_query TEXT NOT NULL,
  retailer TEXT NOT NULL,
  price NUMERIC NOT NULL,
  trust_score INTEGER DEFAULT 0,
  stock_status TEXT DEFAULT 'Unknown',
  image_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_query ON price_history(product_query);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_combo ON price_history(product_query, retailer);

-- Backfill-safe migration for existing deployments
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS product_id TEXT;

-- ============================================================
-- 3. Price Alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  product_query TEXT NOT NULL,
  product_name TEXT,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled')),
  last_checked_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email);

-- ============================================================
-- 4. RLS — Permissive (app-level data, not user secrets)
-- ============================================================
ALTER TABLE product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on product_cache" ON product_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on price_alerts" ON price_alerts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Auto-cleanup expired cache
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM product_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
