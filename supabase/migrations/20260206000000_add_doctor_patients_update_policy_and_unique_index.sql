-- Ensure one doctor per patient: unique index on patient_id
CREATE UNIQUE INDEX IF NOT EXISTS doctor_patients_patient_id_key
  ON doctor_patients (patient_id);

-- Allow patients to update their own doctor relationship (required for UPSERT)
DROP POLICY IF EXISTS "Patients can update their own relationships" ON public.doctor_patients;
CREATE POLICY "Patients can update their own relationships" ON public.doctor_patients
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- (Optional) Ensure INSERT policy exists (should already be present from earlier migration)
-- CREATE POLICY "Patients can select doctors" ON public.doctor_patients
--   FOR INSERT WITH CHECK (
--     auth.uid() = patient_id
--   );

-- Note: After applying this migration in your Supabase project, the client-side
-- upsert with `onConflict: 'patient_id'` will be allowed to perform UPDATEs
-- when a row already exists for the patient. Deploy this migration using
-- drizzle-kit, Supabase migrations, or run the SQL in the Supabase SQL editor.
