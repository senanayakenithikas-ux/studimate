"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/client-fetch";
import type { Material, Subject } from "@/types";

export default function UploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await apiFetch<Subject[]>("/api/subjects");
        setSubjects(data);
        if (data[0]) setSubjectId(data[0].id);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load subjects",
        );
      }
    }
    void loadSubjects();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) return;

    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("subjectId", subjectId);
    formData.append("title", title || "Uploaded material");
    if (file) formData.append("file", file);

    try {
      const material = await apiFetch<Material>("/api/materials", {
        method: "POST",
        body: formData,
      });
      setMessage(
        `Uploaded "${material.title}" (${material.extractedText.length} chars extracted)`,
      );
      setTitle("");
      setFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Upload" />
      <div className="mx-auto max-w-lg p-6">
        <Card title="Upload study material">
          {loadError ? (
            <p className="mb-4 text-sm text-red-400">{loadError}</p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter notes"
            />
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">
                PDF file
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-zinc-400"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
            {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
          </form>
        </Card>
      </div>
    </>
  );
}
