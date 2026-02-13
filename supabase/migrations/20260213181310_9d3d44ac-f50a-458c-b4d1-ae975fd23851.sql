-- Allow authenticated users to manage their own knowledge documents
CREATE POLICY "Users can manage their own knowledge documents"
ON public.ai_knowledge_documents FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());