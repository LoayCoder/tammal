

# Add AI Model Knowledge Prompt and Document Upload to Question Generator

## Overview

Enhance the AI Question Generator with two new capabilities:

1. **Knowledge Base Prompt**: A pre-built expert system prompt grounded in international standards (ISO 45003, COPSOQ III, UWES, WHO, Gallup Q12) that instructs the AI to generate scientifically valid, framework-referenced survey questions.

2. **Document Upload**: Allow users to upload reference documents (PDF, DOCX, TXT) that get parsed and included as additional context in the AI prompt, enabling custom knowledge injection.

---

## Architecture

```text
+-----------------------------------------------------------------------+
| TOP CONTROL BAR                                                       |
+-----------------------------------------------------------------------+
|  LEFT PANEL (Config)           |  RIGHT PANEL (Results)               |
|  - Focus Areas                 |  - Question Cards (now include       |
|  - Question Type               |    framework references +            |
|  - Count / Complexity / Tone   |    psychological constructs)         |
|  - [NEW] Knowledge Base Card   |                                      |
|    - Toggle: Use Expert Prompt |                                      |
|    - Document Upload zone      |                                      |
|    - List of uploaded docs     |                                      |
|  - Advanced Settings           |                                      |
|  - Generate Button             |                                      |
+---------------------------------+-------------------------------------+
```

---

## Implementation Details

### 1. Database: New `ai_knowledge_documents` Table

Store uploaded reference documents per tenant:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `tenant_id` | uuid | Tenant isolation |
| `user_id` | uuid | Uploader |
| `file_name` | text | Original filename |
| `file_path` | text | Storage path in bucket |
| `file_size` | integer | Size in bytes |
| `content_text` | text | Extracted text content (for prompt injection) |
| `is_active` | boolean | Whether to include in generation |
| `created_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |

RLS: Tenant isolation + super_admin full access.

### 2. Storage Bucket: `ai-knowledge`

A new private storage bucket for uploaded reference documents. RLS policies allow tenant admins and super admins to upload/manage files.

### 3. Edge Function: `parse-document`

A new edge function that:
- Receives a file path from storage
- Reads the file content
- For text files (TXT, MD): reads directly
- For PDF/DOCX: extracts text content (basic extraction)
- Returns extracted text
- Saves extracted text to `ai_knowledge_documents.content_text`

### 4. Update `generate-questions` Edge Function

Modify the system prompt to support two new inputs:

**a) Expert Knowledge Prompt (hardcoded, toggle-controlled)**

When the user enables "Use Expert Knowledge Base", the system prompt is enhanced with the full I-O Psychology / Psychometrician / OHS expert role and the six reference frameworks (ISO 45003, ISO 10018/30414, COPSOQ III, UWES, WHO, Gallup Q12). Each generated question will also include:
- `framework_reference`: Which standard the question derives from
- `psychological_construct`: What is being measured
- `scoring_mechanism`: Recommended scoring approach

**b) Custom Document Context**

When documents are uploaded and active, their extracted text is appended to the prompt as additional context:
```
# Additional Reference Documents:
## Document: [filename]
[extracted text content, truncated to ~4000 tokens per document]
```

The tool-calling schema is also updated to include the new fields (`framework_reference`, `psychological_construct`, `scoring_mechanism`).

### 5. Frontend: Knowledge Base Section in ConfigPanel

Add a new collapsible card section in the ConfigPanel (below Advanced Settings, above Generate button):

**Knowledge Base Card:**
- Toggle: "Use Expert Knowledge Base" (enables the hardcoded expert prompt with ISO/COPSOQ/UWES/WHO/Gallup frameworks)
- Description text explaining what frameworks are included
- Expandable list showing the 6 frameworks with short descriptions

**Document Upload Section:**
- Drag-and-drop zone or file input for uploading reference documents
- Accepted formats: PDF, DOCX, TXT, MD
- Max file size: 5MB per file, max 5 documents
- List of uploaded documents with:
  - Filename
  - Size
  - Active/Inactive toggle
  - Delete button
- Upload flow: File -> Storage bucket -> `parse-document` edge function -> Extracted text saved to DB

### 6. Frontend: Updated QuestionCard Component

When expert knowledge mode is active, each question card additionally shows:
- **Framework Reference** badge (e.g., "ISO 45003", "UWES", "COPSOQ III")
- **Psychological Construct** label (e.g., "Psychological Safety", "Vigor", "Role Clarity")
- **Scoring Mechanism** note (e.g., "Likert 1-5 Agreement")

These fields are optional and only appear when the expert prompt is used.

### 7. Hook: `useAIKnowledge`

New hook to manage knowledge documents:
- `fetchDocuments()`: List active documents for tenant
- `uploadDocument(file)`: Upload file to storage + trigger parsing
- `toggleDocument(id, active)`: Enable/disable a document
- `deleteDocument(id)`: Soft delete

### 8. Update `GenerateInput` Interface

Add new fields:
```typescript
interface GenerateInput {
  // ...existing fields
  useExpertKnowledge?: boolean;
  knowledgeDocumentIds?: string[];
}
```

### 9. Localization

**English keys to add:**
```json
{
  "aiGenerator": {
    "knowledgeBase": "Knowledge Base",
    "knowledgeBaseDesc": "Ground questions in international standards and custom references",
    "useExpertPrompt": "Use Expert Knowledge Base",
    "expertPromptDesc": "Generates questions grounded in ISO 45003, COPSOQ III, UWES, WHO Guidelines, and Gallup Q12 frameworks",
    "frameworks": "Reference Frameworks",
    "frameworkISO45003": "ISO 45003 — Psychological Health & Safety",
    "frameworkISO10018": "ISO 10018 & ISO 30414 — Engagement & HR Reporting",
    "frameworkCOPSOQ": "COPSOQ III — Psychosocial Questionnaire",
    "frameworkUWES": "UWES — Work Engagement Scale",
    "frameworkWHO": "WHO — Mental Health at Work Guidelines",
    "frameworkGallup": "Gallup Q12 — Employee Needs Hierarchy",
    "uploadDocuments": "Upload Reference Documents",
    "uploadDocumentsDesc": "Upload PDF, DOCX, or TXT files as additional AI context",
    "dragOrClick": "Drag files here or click to upload",
    "maxFileSize": "Max 5MB per file, up to 5 documents",
    "parsing": "Parsing document...",
    "parseSuccess": "Document parsed and ready",
    "parseError": "Failed to parse document",
    "documentActive": "Active — included in generation",
    "documentInactive": "Inactive — excluded from generation",
    "frameworkReference": "Framework",
    "psychologicalConstruct": "Construct",
    "scoringMechanism": "Scoring"
  }
}
```

**Arabic keys** will mirror the English with proper Arabic translations.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | `ai_knowledge_documents` table + storage bucket + RLS |
| `supabase/functions/parse-document/index.ts` | Create | Extract text from uploaded files |
| `supabase/functions/generate-questions/index.ts` | Modify | Add expert prompt + document context injection |
| `supabase/config.toml` | Modify | Add `parse-document` and `validate-questions` entries |
| `src/hooks/useAIKnowledge.ts` | Create | Manage knowledge documents CRUD |
| `src/components/ai-generator/KnowledgeBasePanel.tsx` | Create | Expert prompt toggle + document upload UI |
| `src/components/ai-generator/ConfigPanel.tsx` | Modify | Add KnowledgeBasePanel section |
| `src/components/ai-generator/QuestionCard.tsx` | Modify | Show framework/construct/scoring badges |
| `src/hooks/useEnhancedAIGeneration.ts` | Modify | Pass knowledge params to edge function |
| `src/pages/admin/AIQuestionGenerator.tsx` | Modify | Add knowledge state management |
| `src/locales/en.json` | Modify | Add knowledge base translation keys |
| `src/locales/ar.json` | Modify | Add Arabic translations |

---

## Security Considerations

1. All documents stored in a private bucket with tenant-scoped RLS
2. Document content text sanitized before prompt injection (truncated to prevent token overflow)
3. File type validation on both client and server side
4. Soft deletes only for documents
5. Expert prompt is hardcoded server-side, never exposed to client manipulation

