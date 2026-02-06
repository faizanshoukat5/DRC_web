-- Allow doctors to view their assigned patients' profiles
CREATE POLICY "Doctors can view their patients" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patients
      WHERE doctor_patients.patient_id = profiles.id
      AND doctor_patients.doctor_id = auth.uid()
    )
  );

-- Also allow patients to view their doctor's profile
CREATE POLICY "Patients can view their doctor" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patients
      WHERE doctor_patients.doctor_id = profiles.id
      AND doctor_patients.patient_id = auth.uid()
    )
  );
