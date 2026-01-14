-- Migration 010: Fix attraction_reports RLS to work with custom auth
-- The previous policies used auth.role() which doesn't work with PIN-based login

-- Drop existing policies for attraction_reports
DROP POLICY IF EXISTS "Allow authenticated select on attraction_reports" ON attraction_reports;
DROP POLICY IF EXISTS "Allow authenticated insert on attraction_reports" ON attraction_reports;
DROP POLICY IF EXISTS "Allow authenticated update on attraction_reports" ON attraction_reports;
DROP POLICY IF EXISTS "Allow authenticated delete on attraction_reports" ON attraction_reports;
DROP POLICY IF EXISTS "attraction_reports_select" ON attraction_reports;
DROP POLICY IF EXISTS "attraction_reports_insert" ON attraction_reports;
DROP POLICY IF EXISTS "attraction_reports_update" ON attraction_reports;
DROP POLICY IF EXISTS "attraction_reports_delete" ON attraction_reports;

-- Create new policies with USING (true) to allow app-level auth
CREATE POLICY "attraction_reports_select_v2" ON attraction_reports FOR SELECT USING (true);
CREATE POLICY "attraction_reports_insert_v2" ON attraction_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "attraction_reports_update_v2" ON attraction_reports FOR UPDATE USING (true);
CREATE POLICY "attraction_reports_delete_v2" ON attraction_reports FOR DELETE USING (true);

-- Also fix attractions table if needed
DROP POLICY IF EXISTS "Allow public read on attractions" ON attractions;
DROP POLICY IF EXISTS "Allow authenticated insert on attractions" ON attractions;
DROP POLICY IF EXISTS "Allow authenticated update on attractions" ON attractions;
DROP POLICY IF EXISTS "Allow authenticated delete on attractions" ON attractions;

CREATE POLICY "attractions_select_v2" ON attractions FOR SELECT USING (true);
CREATE POLICY "attractions_insert_v2" ON attractions FOR INSERT WITH CHECK (true);
CREATE POLICY "attractions_update_v2" ON attractions FOR UPDATE USING (true);
CREATE POLICY "attractions_delete_v2" ON attractions FOR DELETE USING (true);
