"use client";

import { useState } from "react";
import { Edit2, Download, Send, Check } from "lucide-react";

type Props = {
  commId: string;
  clientName: string;
  circularTitle: string;
  today: string;
  initialSubject: string;
  initialBody: string;
  initialChannel: string;
};

export default function CommsEditor({
  commId,
  clientName,
  circularTitle,
  today,
  initialSubject,
  initialBody,
  initialChannel,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [channel, setChannel] = useState(initialChannel);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

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
    <>
      <div className="advisory-actions">
        <button className="btn btn-outline" onClick={() => setEditing((e) => !e)}>
          <Edit2 size={13} /> {editing ? "Done" : "Edit"}
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Download size={13} /> PDF
        </button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Send size={13} /> {saving ? "Saving..." : "Send"}
        </button>
      </div>

      <div style={{ width: "100%" }}>
        <div className="advisory-letterhead">
          <div>
            <div className="lh-firm">KARAN KOTAI &amp; ASSOCIATES</div>
            <div className="lh-tagline">Chartered Accountants · Established 2019</div>
          </div>
          <div className="lh-date">{today}</div>
        </div>

        <div className="advisory-body">
          <div className="advisory-meta-row">
            <div>
              <div className="advisory-meta-label">To</div>
              <div className="advisory-meta-value">{clientName}</div>
            </div>
            <div>
              <div className="advisory-meta-label">Subject</div>
              {editing ? (
                <input
                  className="advisory-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              ) : (
                <div className="advisory-meta-value">{subject}</div>
              )}
            </div>
          </div>

          <div className="advisory-meta-label" style={{ marginBottom: 6 }}>Re</div>
          <div style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 18 }}>{circularTitle}</div>

          <div className="channel-toggle" style={{ marginBottom: 18 }}>
            <button onClick={() => setChannel("email")} className={channel === "email" ? "active" : ""}>Email</button>
            <button onClick={() => setChannel("whatsapp")} className={channel === "whatsapp" ? "active" : ""}>WhatsApp</button>
          </div>

          {editing ? (
            <textarea
              className="advisory-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--text-mid)", whiteSpace: "pre-wrap" }}>{body}</div>
          )}

          {savedAt && (
            <div style={{ marginTop: 14 }}>
              <span className="saved-indicator"><Check size={14} /> Saved at {savedAt.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
