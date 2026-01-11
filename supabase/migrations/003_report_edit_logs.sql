-- Migration: Add report_edit_logs table for audit trail
-- This table tracks all edits made to submitted reports

CREATE TABLE IF NOT EXISTS report_edit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    edited_by UUID NOT NULL REFERENCES users(id),
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changes JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_report_edit_logs_report_id ON report_edit_logs(report_id);
CREATE INDEX idx_report_edit_logs_edited_by ON report_edit_logs(edited_by);
CREATE INDEX idx_report_edit_logs_edited_at ON report_edit_logs(edited_at DESC);

-- Example changes JSONB structure:
-- {
--   "anak_count": { "old": 10, "new": 15 },
--   "cash_amount": { "old": 100000, "new": 150000 }
-- }
