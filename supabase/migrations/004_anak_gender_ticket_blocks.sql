-- Migration: Add anak gender fields and ticket blocks
-- This supports the new report structure based on manual report analysis

-- 1. Add anak gender columns
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS anak_male INT NOT NULL DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS anak_female INT NOT NULL DEFAULT 0;

-- 2. Add ticket blocks tracking (JSONB array)
-- Format: [{"category": "dewasa", "block_no": "197", "start": "019632", "end": "019700", "count": 69}]
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS ticket_blocks JSONB DEFAULT '[]';

-- 3. Add check constraint for anak gender (commented out for flexibility)
-- ALTER TABLE daily_reports ADD CONSTRAINT check_anak_gender 
--   CHECK (anak_male + anak_female = anak_count);

-- 4. Index for ticket blocks search if needed
CREATE INDEX IF NOT EXISTS idx_reports_ticket_blocks ON daily_reports USING gin(ticket_blocks);

-- 5. Update the anak revenue constraint (anak price is Rp 5.000)
-- Note: This changes the expected anak_revenue calculation
-- Old: anak_count * 7500
-- New: anak_count * 5000

COMMENT ON COLUMN daily_reports.anak_male IS 'Jumlah anak laki-laki';
COMMENT ON COLUMN daily_reports.anak_female IS 'Jumlah anak perempuan';
COMMENT ON COLUMN daily_reports.ticket_blocks IS 'Data blok tiket dalam format JSON array';
