"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/client-fetch";
import type { Material, Subject } from "@/types";
import { Upload, FileText, X, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadListItem {
  id: string;
  name: string;
  size: string;
  subject: string;
  uploadedAt: string;
}

function UploadPageContent() {
  const searchParams = useSearchParams();
  const querySubjectId = searchParams.get("subject_id");

  const [materials, setMaterials] = useState<UploadListItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [removingMaterialId, setRemovingMaterialId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await apiFetch<Subject[]>("/api/subjects");
        setSubjects(data);
        if (querySubjectId && data.some((s) => s.id === querySubjectId)) {
          setSubjectId(querySubjectId);
        } else if (data[0]) {
          setSubjectId(data[0].id);
        }

        const rows = await apiFetch<Material[]>("/api/materials?all=true");
        const subjectNameById = new Map(data.map((s) => [s.id, s.name]));
        setMaterials(
          rows.map((row) => ({
            id: row.id,
            name: row.title,
            size: "PDF",
            subject: subjectNameById.get(row.subjectId) ?? "Subject",
            uploadedAt: row.createdAt || new Date().toISOString().split("T")[0],
          })),
        );
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load subjects",
        );
      }
    }
    void loadSubjects();
  }, [querySubjectId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!subjectId) {
      setUploadError("Add a subject before uploading materials.");
      return;
    }

    setUploadError(null);
    setUploadingFile(file.name);

    const formData = new FormData();
    formData.append("subject_id", subjectId);
    formData.append("file", file);

    try {
      const row = await apiFetch<Material>("/api/materials/upload", {
        method: "POST",
        body: formData,
      });
      const subjectName =
        subjects.find((s) => s.id === subjectId)?.name ?? "Subject";
      const newMaterial: UploadListItem = {
        id: row.id,
        name: row.title,
        size: formatFileSize(file.size),
        subject: subjectName,
        uploadedAt: new Date().toISOString().split("T")[0],
      };
      setMaterials((prev) => [newMaterial, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleRemoveMaterial = async (id: string) => {
    if (removingMaterialId) return;

    setRemovingMaterialId(id);
    setUploadError(null);
    try {
      await apiFetch<{ id: string }>(`/api/materials/${id}`, {
        method: "DELETE",
      });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to delete material",
      );
    } finally {
      setRemovingMaterialId(null);
    }
  };

  const handleUpdateSubject = (id: string, subject: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, subject } : m)),
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Upload Materials</h1>
        <p className="text-muted-foreground">
          Upload PDF study materials for AI-powered learning
        </p>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-destructive">{loadError}</p>
      ) : null}
      {uploadError ? (
        <p className="mb-4 text-sm text-destructive">{uploadError}</p>
      ) : null}

      {querySubjectId && subjectId === querySubjectId ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Uploading to selected subject.{" "}
          <Link
            href={`/subjects/${querySubjectId}`}
            className="text-indigo-400 hover:underline"
          >
            Back to subject
          </Link>
        </p>
      ) : null}

      {subjects.length > 0 ? (
        <div className="mb-6 max-w-xs">
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Subject for upload
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 mb-8",
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-border hover:border-indigo-500/50",
        )}
      >
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-indigo-500/20" : "bg-secondary",
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-indigo-400" : "text-muted-foreground",
              )}
            />
          </div>
          <p className="text-foreground font-medium mb-2">
            Drop your PDF here
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or browse to upload
          </p>
          <label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse Files
              </span>
            </Button>
          </label>
        </div>
      </div>

      {uploadingFile && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{uploadingFile}</p>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Materials
        </h2>

        {materials.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">No materials yet</p>
            <p className="text-sm text-muted-foreground">
              Upload your first study material to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {material.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {material.size} • Uploaded{" "}
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select
                      value={material.subject}
                      onValueChange={(value) =>
                        handleUpdateSubject(material.id, value)
                      }
                    >
                      <SelectTrigger className="w-[140px] bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      disabled={removingMaterialId === material.id}
                      aria-label={`Delete ${material.name}`}
                      onClick={() => void handleRemoveMaterial(material.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadPageContent />
    </Suspense>
  );
}
