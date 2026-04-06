-- 001_schema.sql
-- Run this in your Supabase SQL Editor to create tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- Tables
-- =========================================================================

-- 1. Table: amazon_orders
CREATE TABLE IF NOT EXISTS amazon_orders (
    order_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_date DATE,
    order_value NUMERIC NOT NULL DEFAULT 0,
    product_name TEXT NOT NULL,
    ship_to TEXT,
    amazon_account TEXT
);

-- 2. Table: campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_name TEXT NOT NULL,
    order_id TEXT REFERENCES amazon_orders(order_id) ON DELETE SET NULL,
    order_value NUMERIC DEFAULT 0,
    campaign_fee NUMERIC DEFAULT 0,
    expected_refund NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Matched', 'Failed')),
    assigned_to TEXT
);

-- Ensure order_id exists if table was created previously
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS order_id TEXT REFERENCES amazon_orders(order_id) ON DELETE SET NULL;

-- 3. Table: bank_credits
CREATE TABLE IF NOT EXISTS bank_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    credit_date DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    neft_ref TEXT UNIQUE NOT NULL,
    description TEXT,
    match_status TEXT DEFAULT 'UNMATCHED' CHECK (match_status IN ('UNMATCHED', 'MATCHED', 'PARTIAL')),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL
);

-- Ensure campaign_id exists if table was created previously
ALTER TABLE bank_credits ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- 4. Table: settlements
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    bank_credit_id UUID REFERENCES bank_credits(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'PAID', 'FAILED')),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Ensure relational columns exist if table was created previously
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS bank_credit_id UUID REFERENCES bank_credits(id) ON DELETE CASCADE;

-- =========================================================================
-- Optimization: Indices
-- =========================================================================

-- Core Status Indices
CREATE INDEX IF NOT EXISTS idx_bank_credits_match_status ON bank_credits(match_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_to ON campaigns(assigned_to);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);

-- Relational Indices (Interconnections)
CREATE INDEX IF NOT EXISTS idx_campaigns_order_id ON campaigns(order_id);
CREATE INDEX IF NOT EXISTS idx_bank_credits_campaign_id ON bank_credits(campaign_id);
CREATE INDEX IF NOT EXISTS idx_settlements_campaign_id ON settlements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_settlements_bank_credit_id ON settlements(bank_credit_id);

-- Date-based Indices
CREATE INDEX IF NOT EXISTS idx_bank_credits_date ON bank_credits(credit_date);

-- =========================================================================
-- Views
-- =========================================================================

-- View: v_pending_settlements
CREATE OR REPLACE VIEW v_pending_settlements AS
SELECT
    s.id              AS settlement_id,
    c.product_name,
    c.expected_refund,
    bc.amount         AS credit_amount,
    bc.credit_date,
    s.amount          AS settlement_amount,
    s.created_at      AS settlement_created_at
FROM settlements s
JOIN campaigns   c  ON s.campaign_id    = c.id
JOIN bank_credits bc ON s.bank_credit_id = bc.id
WHERE s.status = 'Pending';

-- Optimized Dashboard Summary View (Aggregated)
CREATE OR REPLACE VIEW v_dashboard_summary AS
WITH 
  campaign_stats AS (
    SELECT 
      COUNT(*) AS total_campaigns,
      COUNT(*) FILTER (WHERE status = 'Pending') AS pending_campaigns,
      COUNT(*) FILTER (WHERE status = 'Matched') AS matched_campaigns
    FROM campaigns
  ),
  credit_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE match_status != 'UNMATCHED') AS matched_credits,
      COUNT(*) FILTER (WHERE match_status = 'UNMATCHED') AS unmatched_credits,
      COALESCE(SUM(amount), 0) AS total_received,
      COALESCE(SUM(amount) FILTER (WHERE match_status = 'UNMATCHED'), 0) AS unexplained_amount
    FROM bank_credits
  ),
  settlement_stats AS (
    SELECT COUNT(*) AS pending_settlements FROM settlements WHERE status = 'Pending'
  ),
  order_stats AS (
    SELECT COUNT(*) AS total_orders FROM amazon_orders
  )
SELECT
    cs.total_campaigns,
    cs.pending_campaigns,
    cs.matched_campaigns,
    bc.matched_credits,
    bc.unmatched_credits,
    bc.total_received,
    bc.unexplained_amount,
    ss.pending_settlements,
    os.total_orders
FROM campaign_stats cs
CROSS JOIN credit_stats bc
CROSS JOIN settlement_stats ss
CROSS JOIN order_stats os;

-- =========================================================================
-- Row Level Security (RLS)
-- =========================================================================

ALTER TABLE campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_credits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements   ENABLE ROW LEVEL SECURITY;

-- 1. Campaigns Access
DROP POLICY IF EXISTS "Allow All Access" ON campaigns;
CREATE POLICY "Allow All Access" ON campaigns
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Amazon Orders Access
DROP POLICY IF EXISTS "Allow All Access" ON amazon_orders;
CREATE POLICY "Allow All Access" ON amazon_orders
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Bank Credits Access
DROP POLICY IF EXISTS "Allow All Access" ON bank_credits;
CREATE POLICY "Allow All Access" ON bank_credits
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Settlements Access
DROP POLICY IF EXISTS "Allow All Access" ON settlements;
CREATE POLICY "Allow All Access" ON settlements
    FOR ALL USING (true) WITH CHECK (true);
