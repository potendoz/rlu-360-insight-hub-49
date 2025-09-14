-- Add sample doctors data for RLU360
INSERT INTO doctors (name, department, specialty, avatar_url) VALUES
('Dr. Somchai Jaidee', 'Internal Medicine', 'General Internal Medicine', ''),
('Dr. Siriporn Kasemsri', 'Surgery', 'General Surgery', ''),
('Dr. Thanakit Wongsawat', 'Cardiology', 'Interventional Cardiology', ''),
('Dr. Pranee Sukhumvit', 'Endocrinology', 'Diabetes & Metabolism', ''),
('Dr. Narong Thepkaisri', 'Nephrology', 'Dialysis & Transplant', ''),
('Dr. Wipada Sinlapakit', 'Gastroenterology', 'Hepatology', ''),
('Dr. Krit Bamrungpong', 'Pulmonology', 'Critical Care', ''),
('Dr. Malee Chaisomboon', 'Hematology', 'Blood Disorders', ''),
('Dr. Pichai Thaweesak', 'Oncology', 'Medical Oncology', ''),
('Dr. Suda Chalermchai', 'Neurology', 'Stroke & Movement', '')
ON CONFLICT DO NOTHING;

-- Add sample monthly data for current month
INSERT INTO doctor_monthly_data (
  doctor_id, month, year, rlu_score, lp_ratio, cp_ratio, 
  cpg_mismatch, cpg_mismatch_percentage, duplicate_order_rate,
  test_reduction, patients_count, total_tests, duplicate_tests,
  cost_savings, estimated_cost, total_patient, total_lab
)
SELECT 
  d.id,
  'January',
  2025,
  ROUND((RANDOM() * 40 + 60)::numeric, 1) as rlu_score,
  ROUND((RANDOM() * 0.5 + 1.5)::numeric, 2) as lp_ratio,
  ROUND((RANDOM() * 0.3 + 0.7)::numeric, 2) as cp_ratio,
  FLOOR(RANDOM() * 50 + 10)::integer as cpg_mismatch,
  ROUND((RANDOM() * 25 + 5)::numeric, 1) as cpg_mismatch_percentage,
  ROUND((RANDOM() * 15 + 2)::numeric, 1) as duplicate_order_rate,
  ROUND((RANDOM() * 30 + 10)::numeric, 1) as test_reduction,
  FLOOR(RANDOM() * 200 + 100)::integer as patients_count,
  FLOOR(RANDOM() * 1000 + 500)::integer as total_tests,
  FLOOR(RANDOM() * 100 + 20)::integer as duplicate_tests,
  ROUND((RANDOM() * 50000 + 20000)::numeric, 0) as cost_savings,
  ROUND((RANDOM() * 100000 + 50000)::numeric, 0) as estimated_cost,
  FLOOR(RANDOM() * 250 + 120)::integer as total_patient,
  FLOOR(RANDOM() * 800 + 400)::integer as total_lab
FROM doctors d
WHERE d.name LIKE 'Dr.%'
ON CONFLICT DO NOTHING;