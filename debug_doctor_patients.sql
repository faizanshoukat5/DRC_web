-- Debug script to check doctor_patients data and policies

-- 1. Check all rows in doctor_patients table (as service role)
SELECT 
  dp.id,
  dp.doctor_id,
  dp.patient_id,
  dp.created_at,
  d.name as doctor_name,
  p.name as patient_name
FROM doctor_patients dp
LEFT JOIN profiles d ON dp.doctor_id = d.id
LEFT JOIN profiles p ON dp.patient_id = p.id
ORDER BY dp.created_at DESC;

-- 2. Check RLS policies on doctor_patients
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'doctor_patients';

-- 3. Check unique constraints and indexes
SELECT
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'doctor_patients';

-- 4. Test query as if you were the doctor (replace YOUR_DOCTOR_UUID)
-- Run this after setting the JWT:
-- SELECT set_config('request.jwt.claims', '{"sub": "YOUR_DOCTOR_UUID"}', true);

-- Then run:
-- SELECT patient_id, created_at 
-- FROM doctor_patients 
-- WHERE doctor_id = 'YOUR_DOCTOR_UUID';
