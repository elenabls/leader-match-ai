DROP POLICY "Public update performance_records" ON public.performance_records;

CREATE POLICY "Authenticated update performance_records"
ON public.performance_records
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);