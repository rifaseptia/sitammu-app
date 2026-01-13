-- Migration: Add attractions and attraction_reports tables
-- For multi-attraction system per destination

-- ============================================
-- ATTRACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    requires_ticket_block BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by destination
CREATE INDEX IF NOT EXISTS idx_attractions_destination ON attractions(destination_id);

-- ============================================
-- ATTRACTION REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attraction_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
    visitor_count INTEGER DEFAULT 0,
    ticket_blocks JSONB DEFAULT '[]',
    revenue INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint: one entry per attraction per report
    UNIQUE(report_id, attraction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attraction_reports_report ON attraction_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_attraction_reports_attraction ON attraction_reports(attraction_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attraction_reports ENABLE ROW LEVEL SECURITY;

-- Attractions: read for all authenticated, write for admins
CREATE POLICY "attractions_select" ON attractions FOR SELECT TO authenticated USING (true);
CREATE POLICY "attractions_insert" ON attractions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attractions_update" ON attractions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "attractions_delete" ON attractions FOR DELETE TO authenticated USING (true);

-- Attraction Reports: full access for authenticated users
CREATE POLICY "attraction_reports_select" ON attraction_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "attraction_reports_insert" ON attraction_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attraction_reports_update" ON attraction_reports FOR UPDATE TO authenticated USING (true);
CREATE POLICY "attraction_reports_delete" ON attraction_reports FOR DELETE TO authenticated USING (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE attractions IS 'Atraksi per destinasi (tiket masuk, toilet, dll)';
COMMENT ON COLUMN attractions.price IS 'Harga uniform (sama untuk semua kategori pengunjung)';
COMMENT ON COLUMN attractions.requires_ticket_block IS 'True jika perlu input blok tiket, false untuk input jumlah saja';

COMMENT ON TABLE attraction_reports IS 'Data pengunjung per atraksi per laporan harian';
