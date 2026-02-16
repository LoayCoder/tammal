
-- Add head_employee_id to divisions
ALTER TABLE public.divisions
ADD COLUMN head_employee_id uuid REFERENCES public.employees(id);

-- Add head_employee_id to sites (sections)
ALTER TABLE public.sites
ADD COLUMN head_employee_id uuid REFERENCES public.employees(id);
