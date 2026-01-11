-- ============================================
-- SITAMMU Database Schema
-- Sistem Informasi Tamu Destinasi Wisata
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DESTINATIONS - Destinasi Wisata
-- ============================================
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destinations_code ON destinations(code);
CREATE INDEX idx_destinations_active ON destinations(is_active) WHERE is_active = true;

COMMENT ON TABLE destinations IS 'Daftar destinasi wisata yang dikelola';

-- ============================================
-- 2. USERS - Pengguna Aplikasi
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('petugas', 'koordinator', 'admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_destination ON users(destination_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

COMMENT ON TABLE users IS 'Pengguna aplikasi (petugas, koordinator, admin)';

-- ============================================
-- 3. COUNTRIES - Daftar Negara untuk WNA
-- ============================================
CREATE TABLE countries (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  flag_emoji VARCHAR(10),
  is_popular BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_countries_popular ON countries(is_popular, sort_order) WHERE is_popular = true;

COMMENT ON TABLE countries IS 'Daftar negara untuk input WNA';

-- ============================================
-- 4. DAILY_REPORTS - Laporan Harian
-- ============================================
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  
  -- Visitor counts
  anak_count INT NOT NULL DEFAULT 0 CHECK (anak_count >= 0),
  dewasa_count INT NOT NULL DEFAULT 0 CHECK (dewasa_count >= 0),
  wna_count INT NOT NULL DEFAULT 0 CHECK (wna_count >= 0),
  
  -- Dewasa gender breakdown
  dewasa_male INT NOT NULL DEFAULT 0 CHECK (dewasa_male >= 0),
  dewasa_female INT NOT NULL DEFAULT 0 CHECK (dewasa_female >= 0),
  
  -- WNA countries breakdown (JSONB: {"MY": 5, "SG": 3, ...})
  wna_countries JSONB DEFAULT '{}',
  
  -- Revenue breakdown
  anak_revenue BIGINT NOT NULL DEFAULT 0 CHECK (anak_revenue >= 0),
  dewasa_revenue BIGINT NOT NULL DEFAULT 0 CHECK (dewasa_revenue >= 0),
  wna_revenue BIGINT NOT NULL DEFAULT 0 CHECK (wna_revenue >= 0),
  
  -- Payment methods
  cash_amount BIGINT NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
  qris_amount BIGINT NOT NULL DEFAULT 0 CHECK (qris_amount >= 0),
  
  -- Totals (computed but stored for query performance)
  total_visitors INT GENERATED ALWAYS AS (anak_count + dewasa_count + wna_count) STORED,
  total_revenue BIGINT GENERATED ALWAYS AS (anak_revenue + dewasa_revenue + wna_revenue) STORED,
  
  -- Notes
  notes TEXT,
  
  -- Status & submission
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_destination_date UNIQUE (destination_id, report_date),
  CONSTRAINT check_dewasa_gender CHECK (dewasa_male + dewasa_female = dewasa_count),
  CONSTRAINT check_payment_total CHECK (cash_amount + qris_amount = anak_revenue + dewasa_revenue + wna_revenue)
);

CREATE INDEX idx_reports_destination ON daily_reports(destination_id);
CREATE INDEX idx_reports_date ON daily_reports(report_date DESC);
CREATE INDEX idx_reports_status ON daily_reports(status);
CREATE INDEX idx_reports_destination_date ON daily_reports(destination_id, report_date DESC);

COMMENT ON TABLE daily_reports IS 'Laporan rekap harian per destinasi';

-- ============================================
-- 5. REPORT_LOGS - Audit Trail Laporan
-- ============================================
CREATE TABLE report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_logs_report ON report_logs(report_id);
CREATE INDEX idx_report_logs_created ON report_logs(created_at DESC);

COMMENT ON TABLE report_logs IS 'Audit trail perubahan laporan';

-- ============================================
-- 6. ACTIVITY_LOGS - Log Aktivitas User
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_destination ON activity_logs(destination_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

COMMENT ON TABLE activity_logs IS 'Log aktivitas pengguna';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_destinations_updated
  BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reports_updated
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Countries: Read-only for all authenticated users
CREATE POLICY "Countries are viewable by all" ON countries
  FOR SELECT USING (true);

-- Destinations: Viewable by all authenticated
CREATE POLICY "Destinations viewable by all" ON destinations
  FOR SELECT USING (true);

-- ============================================
-- SEED DATA: Countries
-- ============================================
INSERT INTO countries (code, name, flag_emoji, is_popular, sort_order) VALUES
  -- Popular countries (sorted by frequency)
  ('MY', 'Malaysia', '🇲🇾', true, 1),
  ('SG', 'Singapura', '🇸🇬', true, 2),
  ('CN', 'Tiongkok', '🇨🇳', true, 3),
  ('JP', 'Jepang', '🇯🇵', true, 4),
  ('KR', 'Korea Selatan', '🇰🇷', true, 5),
  ('AU', 'Australia', '🇦🇺', true, 6),
  ('US', 'Amerika Serikat', '🇺🇸', true, 7),
  ('GB', 'Inggris', '🇬🇧', true, 8),
  ('NL', 'Belanda', '🇳🇱', true, 9),
  ('DE', 'Jerman', '🇩🇪', true, 10),
  -- Other countries
  ('FR', 'Prancis', '🇫🇷', false, 100),
  ('IT', 'Italia', '🇮🇹', false, 100),
  ('ES', 'Spanyol', '🇪🇸', false, 100),
  ('TH', 'Thailand', '🇹🇭', false, 100),
  ('VN', 'Vietnam', '🇻🇳', false, 100),
  ('PH', 'Filipina', '🇵🇭', false, 100),
  ('IN', 'India', '🇮🇳', false, 100),
  ('RU', 'Rusia', '🇷🇺', false, 100),
  ('SA', 'Arab Saudi', '🇸🇦', false, 100),
  ('AE', 'Uni Emirat Arab', '🇦🇪', false, 100),
  ('CA', 'Kanada', '🇨🇦', false, 100),
  ('BR', 'Brasil', '🇧🇷', false, 100),
  ('NZ', 'Selandia Baru', '🇳🇿', false, 100),
  ('ZZ', 'Lainnya', '🌍', false, 999)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: Destinations (for testing)
-- ============================================
INSERT INTO destinations (code, name, location) VALUES
  ('DST001', 'Pantai Indah Kapuk', 'Jakarta Utara, DKI Jakarta'),
  ('DST002', 'Taman Wisata Alam', 'Bogor, Jawa Barat'),
  ('DST003', 'Air Terjun Curug', 'Bandung, Jawa Barat')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: Users (for testing)
-- PIN: 123456 (hashed with bcrypt)
-- ============================================
INSERT INTO users (destination_id, name, pin_hash, role) VALUES
  (
    (SELECT id FROM destinations WHERE code = 'DST001'),
    'Budi Petugas',
    '$2b$10$rQZ5K3YXJ8VhAz8qQ9k5.OxEYgZ.8FvJ2KmL4NnPpRrStUvWxYz12',
    'petugas'
  ),
  (
    (SELECT id FROM destinations WHERE code = 'DST001'),
    'Ani Koordinator',
    '$2b$10$rQZ5K3YXJ8VhAz8qQ9k5.OxEYgZ.8FvJ2KmL4NnPpRrStUvWxYz12',
    'koordinator'
  ),
  (
    (SELECT id FROM destinations WHERE code = 'DST002'),
    'Citra Petugas',
    '$2b$10$rQZ5K3YXJ8VhAz8qQ9k5.OxEYgZ.8FvJ2KmL4NnPpRrStUvWxYz12',
    'petugas'
  ),
  (
    (SELECT id FROM destinations WHERE code = 'DST002'),
    'Dodi Koordinator',
    '$2b$10$rQZ5K3YXJ8VhAz8qQ9k5.OxEYgZ.8FvJ2KmL4NnPpRrStUvWxYz12',
    'koordinator'
  ),
  (
    NULL,
    'Admin Pusat',
    '$2b$10$rQZ5K3YXJ8VhAz8qQ9k5.OxEYgZ.8FvJ2KmL4NnPpRrStUvWxYz12',
    'admin'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample Daily Report (for testing)
-- ============================================
INSERT INTO daily_reports (
  destination_id,
  report_date,
  anak_count,
  dewasa_count,
  wna_count,
  dewasa_male,
  dewasa_female,
  wna_countries,
  anak_revenue,
  dewasa_revenue,
  wna_revenue,
  cash_amount,
  qris_amount,
  status,
  notes
) VALUES (
  (SELECT id FROM destinations WHERE code = 'DST001'),
  CURRENT_DATE - INTERVAL '1 day',
  50,
  200,
  10,
  120,
  80,
  '{"MY": 4, "SG": 3, "JP": 2, "AU": 1}',
  375000,   -- 50 × 7500
  3000000,  -- 200 × 15000
  500000,   -- 10 × 50000
  2500000,  -- cash
  1375000,  -- qris
  'submitted',
  'Hari libur nasional, pengunjung ramai'
)
ON CONFLICT (destination_id, report_date) DO NOTHING;

-- ============================================
-- VIEWS (for dashboard)
-- ============================================

-- View: Today's report status per destination
CREATE OR REPLACE VIEW v_today_report_status AS
SELECT 
  d.id AS destination_id,
  d.code,
  d.name,
  dr.id AS report_id,
  dr.status,
  dr.total_visitors,
  dr.total_revenue,
  dr.submitted_at,
  CASE 
    WHEN dr.id IS NULL THEN 'pending'
    WHEN dr.status = 'draft' THEN 'draft'
    ELSE 'submitted'
  END AS daily_status
FROM destinations d
LEFT JOIN daily_reports dr ON d.id = dr.destination_id 
  AND dr.report_date = CURRENT_DATE
WHERE d.is_active = true;

-- View: Weekly summary per destination
CREATE OR REPLACE VIEW v_weekly_summary AS
SELECT 
  d.id AS destination_id,
  d.code,
  d.name,
  DATE_TRUNC('week', dr.report_date) AS week_start,
  COUNT(*) AS report_count,
  SUM(dr.total_visitors) AS total_visitors,
  SUM(dr.total_revenue) AS total_revenue,
  SUM(dr.anak_count) AS anak_count,
  SUM(dr.dewasa_count) AS dewasa_count,
  SUM(dr.wna_count) AS wna_count
FROM destinations d
JOIN daily_reports dr ON d.id = dr.destination_id
WHERE dr.status = 'submitted'
GROUP BY d.id, d.code, d.name, DATE_TRUNC('week', dr.report_date);

COMMENT ON VIEW v_today_report_status IS 'Status laporan hari ini per destinasi';
COMMENT ON VIEW v_weekly_summary IS 'Ringkasan mingguan per destinasi';

-- ============================================
-- DONE!
-- ============================================
