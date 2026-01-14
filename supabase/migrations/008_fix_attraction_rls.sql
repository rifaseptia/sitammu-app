-- Migration: Secure attractions tables with RLS
-- Previous migration disabled RLS, this one enables it with proper policies

-- 1. Enable RLS
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attraction_reports ENABLE ROW LEVEL SECURITY;

-- 2. Policies for attractions
-- READ: Public/Authenticated read
CREATE POLICY "Allow public read on attractions"
ON attractions FOR SELECT
USING (true);

-- WRITE: Authenticated users only (or specific roles if needed)
CREATE POLICY "Allow authenticated insert on attractions"
ON attractions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on attractions"
ON attractions FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on attractions"
ON attractions FOR DELETE
USING (auth.role() = 'authenticated');

-- 3. Policies for attraction_reports
-- READ: Authenticated users
CREATE POLICY "Allow authenticated select on attraction_reports"
ON attraction_reports FOR SELECT
USING (auth.role() = 'authenticated');

-- WRITE: Authenticated users
CREATE POLICY "Allow authenticated insert on attraction_reports"
ON attraction_reports FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on attraction_reports"
ON attraction_reports FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on attraction_reports"
ON attraction_reports FOR DELETE
USING (auth.role() = 'authenticated');
