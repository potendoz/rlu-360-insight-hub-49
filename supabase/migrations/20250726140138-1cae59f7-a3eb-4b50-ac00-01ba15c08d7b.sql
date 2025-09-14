-- Create doctors table
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  specialty text NOT NULL,
  department text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create monthly performance data table
CREATE TABLE public.doctor_monthly_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  rlu_score numeric,
  cost_savings numeric DEFAULT 0,
  test_reduction numeric DEFAULT 0,
  patients_count integer DEFAULT 0,
  total_tests integer DEFAULT 0,
  duplicate_tests integer DEFAULT 0,
  cpg_mismatch integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_monthly_data ENABLE ROW LEVEL SECURITY;

-- Create policies for doctors table
CREATE POLICY "Authenticated users can view doctors" 
ON public.doctors 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage doctors" 
ON public.doctors 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND users.email LIKE '%admin%'
));

-- Create policies for monthly data table
CREATE POLICY "Authenticated users can view monthly data" 
ON public.doctor_monthly_data 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage monthly data" 
ON public.doctor_monthly_data 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND users.email LIKE '%admin%'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_monthly_data_updated_at
BEFORE UPDATE ON public.doctor_monthly_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.doctors (name, specialty, department) VALUES
('Dr. Priya Sharma', 'Internal Medicine', 'Emergency'),
('Dr. Rajesh Kumar', 'Cardiology', 'Cardiology'),
('Dr. Sunita Patel', 'Pathology', 'Laboratory');

-- Insert sample monthly data
INSERT INTO public.doctor_monthly_data (doctor_id, month, year, rlu_score, cost_savings, test_reduction, patients_count, total_tests, duplicate_tests, cpg_mismatch)
SELECT 
  d.id,
  '2024-01',
  2024,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 95
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 88
    WHEN d.name = 'Dr. Sunita Patel' THEN 92
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 45000
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 38000
    WHEN d.name = 'Dr. Sunita Patel' THEN 52000
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 28
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 22
    WHEN d.name = 'Dr. Sunita Patel' THEN 35
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 156
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 142
    WHEN d.name = 'Dr. Sunita Patel' THEN 89
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 320
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 280
    WHEN d.name = 'Dr. Sunita Patel' THEN 450
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 15
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 20
    WHEN d.name = 'Dr. Sunita Patel' THEN 25
  END,
  CASE 
    WHEN d.name = 'Dr. Priya Sharma' THEN 8
    WHEN d.name = 'Dr. Rajesh Kumar' THEN 15
    WHEN d.name = 'Dr. Sunita Patel' THEN 10
  END
FROM public.doctors d;