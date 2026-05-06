"use client";

import { useState } from "react";

type Props = {
  commId: string;
  initialSubject: string;
  initialBody: string;
  initialChannel: string;
};

export default function CommsEditor({ commId, initialSubject, initialBody, initialChannel }: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [channel, setChannel] = useState(initialChannel);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/comms/${commId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, channel }),
      });
      if (r.ok) setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Channel:</label>
        <button
          onClick={() => setChannel("email")}
          className={`px-3 py-1 text-sm rounded ${channel === "email" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
        >Email</button>
        <button
          onClick={() => setChannel("whatsapp")}
          className={`px-3 py-1 text-sm rounded ${channel === "whatsapp" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
        >WhatsApp (copy)</button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono min-h-[400px]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save draft"}
        </button>
        {savedAt && (
          <span className="text-sm text-emerald-600">✓ Saved at {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
