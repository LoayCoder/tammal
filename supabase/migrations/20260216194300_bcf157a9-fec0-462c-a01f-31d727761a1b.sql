
-- Add color column to divisions table
ALTER TABLE public.divisions ADD COLUMN color text DEFAULT '#3B82F6';

-- Add color column to sites (sections) table  
ALTER TABLE public.sites ADD COLUMN color text DEFAULT '#3B82F6';
