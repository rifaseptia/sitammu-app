-- Migration: Fix total_revenue generated column to include attraction_revenue
-- NOTE: We must drop dependent views first, then the column, then recreate them.

-- 1. Drop dependent views
DROP VIEW IF EXISTS v_weekly_summary;
DROP VIEW IF EXISTS v_today_report_status;

-- 2. Update daily_reports table
-- Drop old generated column
ALTER TABLE daily_reports DROP COLUMN IF EXISTS total_revenue;

-- Add new generated column including attraction_revenue
ALTER TABLE daily_reports 
ADD COLUMN total_revenue BIGINT 
GENERATED ALWAYS AS (anak_revenue + dewasa_revenue + wna_revenue + attraction_revenue) STORED;

-- 3. Recreate views

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

-- Comment on views
COMMENT ON VIEW v_today_report_status IS 'Status laporan hari ini per destinasi';
COMMENT ON VIEW v_weekly_summary IS 'Ringkasan mingguan per destinasi';
