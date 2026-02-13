-- Add framework_id to reference_documents so documents can be linked to frameworks
ALTER TABLE public.reference_documents 
ADD COLUMN framework_id uuid REFERENCES public.reference_frameworks(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_reference_documents_framework_id ON public.reference_documents(framework_id);
