-- Migration: Add attraction_revenue to daily_reports and update constraints

-- 1. Add attraction_revenue column
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS attraction_revenue INTEGER DEFAULT 0;

-- 2. Drop existing constraint
ALTER TABLE daily_reports
DROP CONSTRAINT IF EXISTS check_payment_total;

-- 3. Add updated constraint
-- Verifies that Total Payments (Cash + QRIS) equals Total Revenue (Tickets + Attractions)
ALTER TABLE daily_reports
ADD CONSTRAINT check_payment_total 
CHECK (cash_amount + qris_amount = anak_revenue + dewasa_revenue + wna_revenue + attraction_revenue);

-- 4. Comment
COMMENT ON COLUMN daily_reports.attraction_revenue IS 'Total pendapatan dari atraksi lain (toilet, parkir, wahana, dll)';
