
-- Add employee_id column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN employee_id uuid REFERENCES public.employees(id);

-- Create index for faster lookups
CREATE INDEX idx_invitations_employee_id ON public.invitations(employee_id);
