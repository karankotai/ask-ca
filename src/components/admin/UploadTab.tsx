"use client";

import { useCallback, useRef, useState } from "react";
import { LoadingDots, ErrorBox } from "./shared";

const SOURCES = ["rbi", "sebi", "mca", "irdai", "egazette", "other"] as const;

interface UploadResult {
  status: string;
  documents_saved: number;
  chunks_indexed: number;
  message: string;
}

export default function UploadTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState("");
  const [source, setSource] = useState<string>("other");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [circularNumber, setCircularNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => [...prev, ...pdfs]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit() {
    const linkList = links
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (files.length === 0 && linkList.length === 0) {
      setError("Please add at least one PDF file or link.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("source", source);

    for (const file of files) {
      formData.append("files", file);
    }

    if (linkList.length > 0) {
      formData.append("links", JSON.stringify(linkList));
    }

    if (title) formData.append("title", title);
    if (date) formData.append("date", date);
    if (circularNumber) formData.append("circular_number", circularNumber);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || "Upload failed.");
        return;
      }

      setResult(data);
      setFiles([]);
      setLinks("");
      setTitle("");
      setDate("");
      setCircularNumber("");
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-white bg-zinc-700/30"
            : "border-zinc-600 bg-[#2f2f2f] hover:border-zinc-400"
        }`}
      >
        <svg
          className="h-8 w-8 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
          />
        </svg>
        <p className="text-sm text-zinc-400">
          Drag & drop PDF files here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg bg-[#2f2f2f] px-4 py-2"
            >
              <span className="truncate text-sm text-zinc-300">{f.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="ml-3 text-xs text-zinc-500 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">
          Links (one per line)
        </label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://example.com/circular.pdf&#10;https://example.com/notification"
          rows={3}
          className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {/* Source */}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Optional fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            Title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-extracted if empty"
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            Date (optional)
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            Circular No. (optional)
          </label>
          <input
            value={circularNumber}
            onChange={(e) => setCircularNumber(e.target.value)}
            placeholder="e.g. RBI/2025-26/100"
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
      >
        {loading ? "Uploading..." : "Upload & Index"}
      </button>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-[#2f2f2f] p-4">
          <LoadingDots />
          <span className="text-sm text-zinc-400">
            Processing documents and indexing into RAG...
          </span>
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-[#2f2f2f] p-5">
          <h3 className="mb-3 text-sm font-semibold text-green-400">
            Upload Successful
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Documents Saved", result.documents_saved],
              ["Chunks Indexed", result.chunks_indexed],
              ["Status", result.status],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-[#1a1a1a] p-3">
                <p className="text-xs text-zinc-500">{label as string}</p>
                <p className="text-lg font-semibold text-white">
                  {String(value ?? "\u2014")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">{result.message}</p>
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}
