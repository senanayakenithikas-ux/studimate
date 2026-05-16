"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMaterials, mockSubjects, mockUser, type Material } from "@/lib/mock-data";
import { Upload, FileText, X, Check, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

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

  const handleFileUpload = (file: File) => {
    setUploadingFile(file.name);

    // Simulate upload
    setTimeout(() => {
      const newMaterial: Material = {
        id: Date.now(),
        name: file.name,
        size: formatFileSize(file.size),
        subject: mockSubjects[0].name,
        uploadedAt: new Date().toISOString().split("T")[0],
      };
      setMaterials((prev) => [newMaterial, ...prev]);
      setUploadingFile(null);
    }, 1500);
  };

  const handleRemoveMaterial = (id: number) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateSubject = (id: number, subject: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, subject } : m))
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout userName={mockUser.name}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Upload Materials</h1>
        <p className="text-muted-foreground">
          Upload your study materials for AI-powered learning
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 mb-8",
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-border hover:border-indigo-500/50"
        )}
      >
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-indigo-500/20" : "bg-secondary"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-indigo-400" : "text-muted-foreground"
              )}
            />
          </div>
          <p className="text-foreground font-medium mb-2">
            {isDragging
              ? "Drop your file here"
              : "Drop your PDF or text file here"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or browse to upload
          </p>
          <label>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
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

      {/* Uploading State */}
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

      {/* Materials List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Materials
        </h2>

        {materials.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              No materials yet
            </p>
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
                        {mockSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      onClick={() => handleRemoveMaterial(material.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
