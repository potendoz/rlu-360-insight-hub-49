-- Create mismatch_data table
CREATE TABLE public.mismatch_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_mismatch NUMERIC DEFAULT 0,
  fbs_mismatch NUMERIC DEFAULT 0,
  hba1c_mismatch NUMERIC DEFAULT 0,
  ft3_mismatch NUMERIC DEFAULT 0,
  ft4_mismatch NUMERIC DEFAULT 0,
  aptt_mismatch NUMERIC DEFAULT 0,
  lft_mismatch NUMERIC DEFAULT 0,
  lipid_profile_mismatch NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mismatch_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view mismatch data" 
ON public.mismatch_data 
FOR SELECT 
USING (true);

CREATE POLICY "All users can manage mismatch data" 
ON public.mismatch_data 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create mismatch_analysis table
CREATE TABLE public.mismatch_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  fbs_top_mismatch TEXT,
  fbs_count INTEGER DEFAULT 0,
  fbs_breakdown TEXT,
  hba1c_top_mismatch TEXT,
  hba1c_count INTEGER DEFAULT 0,
  hba1c_breakdown TEXT,
  ft3_top_mismatch TEXT,
  ft3_count INTEGER DEFAULT 0,
  ft3_breakdown TEXT,
  ft4_top_mismatch TEXT,
  ft4_count INTEGER DEFAULT 0,
  ft4_breakdown TEXT,
  aptt_top_mismatch TEXT,
  aptt_count INTEGER DEFAULT 0,
  aptt_breakdown TEXT,
  lft_top_mismatch TEXT,
  lft_count INTEGER DEFAULT 0,
  lft_breakdown TEXT,
  lipid_profile_top_mismatch TEXT,
  lipid_profile_count INTEGER DEFAULT 0,
  lipid_profile_breakdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mismatch_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view mismatch analysis" 
ON public.mismatch_analysis 
FOR SELECT 
USING (true);

CREATE POLICY "All users can manage mismatch analysis" 
ON public.mismatch_analysis 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_mismatch_data_updated_at
BEFORE UPDATE ON public.mismatch_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mismatch_analysis_updated_at
BEFORE UPDATE ON public.mismatch_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update doctor_monthly_data table to include new fields
ALTER TABLE public.doctor_monthly_data 
ADD COLUMN IF NOT EXISTS total_patient INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lab INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lp_ratio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpg_mismatch_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS duplicate_order_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cp_ratio NUMERIC DEFAULT 0;