-- Add foreign key constraints to link mismatch_data and mismatch_analysis tables to doctors table
ALTER TABLE public.mismatch_data 
ADD CONSTRAINT fk_mismatch_data_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.mismatch_analysis 
ADD CONSTRAINT fk_mismatch_analysis_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;