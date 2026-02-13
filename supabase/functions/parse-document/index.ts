import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { documentId, filePath, fileName } = await req.json();

    if (!documentId || !filePath) {
      return new Response(JSON.stringify({ error: "documentId and filePath are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("ai-knowledge")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contentText = "";
    const lowerName = (fileName || filePath).toLowerCase();

    if (lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
      // Plain text files - read directly
      contentText = await fileData.text();
    } else if (lowerName.endsWith(".pdf")) {
      // PDF - extract text by reading as text (basic extraction)
      // For PDFs, we do a best-effort text extraction
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      // Simple PDF text extraction - find text between BT/ET markers or stream content
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = decoder.decode(bytes);
      
      // Extract readable text segments (basic approach)
      const textSegments: string[] = [];
      // Match parenthesized strings in PDF (text objects)
      const matches = rawText.matchAll(/\(([^)]{2,})\)/g);
      for (const match of matches) {
        const segment = match[1].replace(/\\n/g, "\n").replace(/\\\\/g, "\\").replace(/\\'/g, "'");
        if (segment.length > 2 && /[a-zA-Z\u0600-\u06FF]/.test(segment)) {
          textSegments.push(segment);
        }
      }
      contentText = textSegments.join(" ").trim();
      
      if (!contentText || contentText.length < 20) {
        contentText = `[PDF document: ${fileName}. Text extraction was limited. The document has been uploaded for reference.]`;
      }
    } else if (lowerName.endsWith(".docx")) {
      // DOCX - extract text from XML content
      // DOCX files are ZIP archives containing XML
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = decoder.decode(bytes);
      
      // Extract text from XML tags (best effort without zip library)
      const xmlTextMatches = rawText.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      const textParts: string[] = [];
      for (const match of xmlTextMatches) {
        textParts.push(match[1]);
      }
      contentText = textParts.join(" ").trim();
      
      if (!contentText || contentText.length < 20) {
        contentText = `[DOCX document: ${fileName}. Text extraction was limited. The document has been uploaded for reference.]`;
      }
    } else {
      // Try to read as text for any other format
      try {
        contentText = await fileData.text();
      } catch {
        contentText = `[Document: ${fileName}. Unable to extract text content.]`;
      }
    }

    // Truncate to ~16000 chars (~4000 tokens) to prevent prompt overflow
    const MAX_CHARS = 16000;
    if (contentText.length > MAX_CHARS) {
      contentText = contentText.substring(0, MAX_CHARS) + "\n\n[... content truncated for prompt size limits ...]";
    }

    // Update the document record with extracted text
    const { error: updateError } = await supabase
      .from("ai_knowledge_documents")
      .update({ content_text: contentText })
      .eq("id", documentId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save extracted text" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      contentLength: contentText.length,
      preview: contentText.substring(0, 200),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in parse-document:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
