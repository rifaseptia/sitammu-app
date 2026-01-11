-- ============================================
-- Add DELETE policy for daily_reports
-- This allows authenticated users to delete reports
-- ============================================

-- Allow all authenticated users to delete reports
-- (In production, you may want to restrict this to admin role only)
CREATE POLICY "Allow delete on daily_reports for authenticated users"
ON daily_reports
FOR DELETE
USING (true);

-- Also ensure UPDATE policy exists for reports
CREATE POLICY "Allow update on daily_reports for authenticated users"
ON daily_reports
FOR UPDATE
USING (true);

-- Also ensure INSERT policy exists for reports
CREATE POLICY "Allow insert on daily_reports for authenticated users"
ON daily_reports
FOR INSERT
WITH CHECK (true);

-- Also ensure SELECT policy exists for reports
CREATE POLICY "Allow select on daily_reports for authenticated users"
ON daily_reports
FOR SELECT
USING (true);
