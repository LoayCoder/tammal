import { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image,
  Video,
  Mic,
  File,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

type EvidenceType = "photo" | "document" | "video" | "audio" | "other";

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: EvidenceType;
  uploadedAt: Date;
}

const TYPE_ICONS: Record<EvidenceType, React.ElementType> = {
  photo:    Image,
  document: FileText,
  video:    Video,
  audio:    Mic,
  other:    File,
};

const TYPE_LABELS: Record<EvidenceType, string> = {
  photo:    "Photo",
  document: "Document",
  video:    "Video",
  audio:    "Audio",
  other:    "Other",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferType(name: string): EvidenceType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "photo";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return "audio";
  if (["pdf", "doc", "docx", "txt", "xlsx", "csv"].includes(ext)) return "document";
  return "other";
}

interface EvidenceCollectionPanelProps {
  incidentId?: string;
  onUpload?: (files: EvidenceFile[], description: string) => void;
  className?: string;
}

export function EvidenceCollectionPanel({
  onUpload,
  className,
}: EvidenceCollectionPanelProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [description, setDescription] = useState("");
  const [activeType, setActiveType] = useState<EvidenceType | "all">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newFiles: EvidenceFile[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: inferType(f.name),
      uploadedAt: new Date(),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    onUpload?.(files, description);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const filteredFiles =
    activeType === "all" ? files : files.filter((f) => f.type === activeType);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Evidence Collection</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Attach supporting files to strengthen the investigation.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl",
          "border-2 border-dashed cursor-pointer select-none",
          "px-6 py-10 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-primary/3"
        )}
      >
        <input
          ref={inputRef}
          type="file"\n          multiple\n          accept=".pdf,image/*,video/*,audio/*"\n          className="sr-only"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <UploadCloud className="w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Release to upload" : "Upload supporting documents, photos, or files"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click to browse · PDF, images, video, audio
          </p>
        </div>
      </div>

      {/* Type filter pills */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["all", "photo", "document", "video", "audio", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150",
                activeType === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t]}
              {t !== "all" && (
                <span className="ml-1 opacity-70">
                  ({files.filter((f) => f.type === t).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* File list */}
      {filteredFiles.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filteredFiles.map((file) => {
            const TypeIcon = TYPE_ICONS[file.type];
            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 animate-calm-fade-in"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <TypeIcon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {TYPE_LABELS[file.type]}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Context & Notes
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this evidence shows and how it relates to the incident..."
          rows={3}
          className={cn(
            "resize-none rounded-xl border-border/60 bg-card",
            "focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "transition-all duration-200 text-sm"
          )}
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={files.length === 0}
        className={cn(
          "w-full rounded-xl h-11 font-medium transition-all duration-200",
          submitted && "bg-success hover:bg-success"
        )}
      >
        {submitted ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Evidence submitted
          </span>
        ) : (
          `Submit Evidence${files.length > 0 ? ` (${files.length} file${files.length !== 1 ? "s" : ""})` : ""}`
        )}
      </Button>
    </div>
  );
}
