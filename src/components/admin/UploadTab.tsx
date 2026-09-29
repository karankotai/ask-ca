"use client";

import { useCallback, useRef, useState } from "react";
import { LoadingPlaceholder, ErrorBox } from "./shared";

const SOURCES: { value: string; label: string }[] = [
  { value: "rbi", label: "RBI" },
  { value: "sebi", label: "SEBI" },
  { value: "mca", label: "MCA" },
  { value: "irdai", label: "IRDAI" },
  { value: "egazette", label: "e-Gazette" },
  { value: "other", label: "Other" },
];

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
    <div className="admin-stack">
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
        className={"admin-drop " + (dragOver ? "active" : "")}
      >
        <svg
          className="admin-drop-icon"
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
        <p className="admin-drop-hint">
          Drag & drop PDF files here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="admin-file-list">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="admin-file-row">
              <span className="admin-file-name">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="admin-file-remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="admin-label">Links (one per line)</label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder={"https://example.com/circular.pdf\nhttps://example.com/notification"}
          rows={3}
          className="admin-textarea"
        />
      </div>

      <div>
        <label className="admin-label">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="admin-select"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-grid cols-3">
        <div>
          <label className="admin-label">
            Title <span className="hint">(optional)</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-extracted if empty"
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">
            Date <span className="hint">(optional)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">
            Circular No. <span className="hint">(optional)</span>
          </label>
          <input
            value={circularNumber}
            onChange={(e) => setCircularNumber(e.target.value)}
            placeholder="e.g. RBI/2025-26/100"
            className="admin-input"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Uploading..." : "Upload & Index"}
      </button>

      {loading && (
        <div className="admin-loading">
          <span className="admin-loading-text">
            Processing documents and indexing into RAG...
          </span>
        </div>
      )}

      {result && (
        <div className="admin-success">
          <h3 className="admin-success-title">Upload Successful</h3>
          <div className="admin-stat-grid cols-3">
            {[
              ["Documents Saved", result.documents_saved],
              ["Chunks Indexed", result.chunks_indexed],
              ["Status", result.status],
            ].map(([label, value]) => (
              <div key={label as string} className="admin-stat-card">
                <p className="admin-stat-label">{label as string}</p>
                <p className="admin-stat-value">
                  {String(value ?? "\u2014")}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-light)", margin: 0 }}>
            {result.message}
          </p>
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}
