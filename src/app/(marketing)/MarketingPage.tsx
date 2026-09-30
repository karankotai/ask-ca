"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Users,
  BarChart3,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

const STATS = [
  { label: "RBI updates monitored per year", value: "1,843+" },
  { label: "Compliances per NBFC tracked", value: "600+" },
  { label: "Saved per week per CS", value: "10-15 hrs" },
  { label: "More clients without adding staff", value: "50%" },
];

type Capability = {
  title: string;
  desc: string;
  Icon: LucideIcon;
  accent: string;
};
const CAPABILITIES: Capability[] = [
  {
    title: "Regulatory Intelligence",
    Icon: ShieldCheck,
    accent: "#10b981",
    desc: "AI monitors every RBI circular, master direction, and notification. Plain-English summaries with deadline extraction and penalty flagging. Search 5+ years of historical circulars by question.",
  },
  {
    title: "Client-Specific Mapping",
    Icon: Users,
    accent: "#6366f1",
    desc: "Every obligation filtered to each client's SBR layer, entity type, and business activities. No noise — only what applies to that specific NBFC.",
  },
  {
    title: "Multi-Client Command Center",
    Icon: BarChart3,
    accent: "#f59e0b",
    desc: "All your NBFC clients in one dashboard. Cross-client impact alerts when a new circular drops. Compliance calendar across your entire portfolio.",
  },
  {
    title: "Professional Deliverables",
    Icon: FileSpreadsheet,
    accent: "#3b82f6",
    desc: "AI-drafted compliance notes branded with your firm name. Practice analytics showing coverage across clients. Professional outputs in minutes, not hours.",
  },
];

const CLIENTS = [
  {
    name: "Ananya Finserv Pvt Ltd",
    tag: "NBFC-ICC · Base Layer",
    progress: "12/12 · On track",
    due: "Due Mar 15",
    statusColor: "#10b981",
  },
  {
    name: "Kisan MicroFin Ltd",
    tag: "NBFC-MFI · Middle Layer",
    progress: "8/10 · 2 upcoming",
    due: "Due Feb 28",
    statusColor: "#f59e0b",
  },
  {
    name: "Meridian Capital Services",
    tag: "NBFC-Factor · Base Layer",
    progress: "15/15 · On track",
    due: "Due Mar 31",
    statusColor: "#10b981",
  },
  {
    name: "Sarvottam Finance Corp",
    tag: "NBFC-ICC · Middle Layer",
    progress: "9/11 · 1 overdue",
    due: "Due Feb 10",
    statusColor: "#ef4444",
  },
  {
    name: "Prithvi Lending Co",
    tag: "NBFC-ICC · Base Layer",
    progress: "7/7 · On track",
    due: "Due Apr 15",
    statusColor: "#10b981",
  },
];

const HIW = [
  {
    step: "1",
    title: "New circular drops. You're the first to know.",
    body:
      "RegMitra monitors every RBI circular, master direction, and notification around the clock. When something new drops, you get an AI-generated summary with the key changes, affected entities, deadlines, and penalties — all in plain English. Your client gets a call from you within hours, not days. They see you as the CS who's always on top of it — while their peers' advisors are still checking rbi.org.in.",
    cardTitle: "Amendment to Master Direction — Know Your Customer (KYC) Direction, 2016",
    cardId: "RBI/2026-27/42",
    cardTime: "Published 2 hours ago",
    interpretation:
      "This circular amends the KYC Master Direction to require video-based Customer Identification Process (V-CIP) for all new accounts opened by NBFC-ML and NBFC-UL entities. Existing customers must be re-verified within 12 months. The amendment also introduces enhanced due diligence requirements for high-risk customer categories.",
    metadata: [
      ["Effective Date", "Jul 1, 2026"],
      ["Affected Entities", "NBFC-ML, NBFC-UL"],
      ["Compliance Deadline", "Jul 1, 2026"],
      ["Penalty", "S.45MA Directions"],
    ],
    affectedLabel: "Affected Clients 4 of 5",
    affected: [
      "Ananya Finserv",
      "Kisan MicroFin",
      "Meridian Capital",
      "Sarvottam Finance",
    ],
  },
  {
    step: "2",
    title: "Personalized advisory, ready to send.",
    body:
      "For each affected client, RegMitra drafts a professional compliance advisory — branded with your firm name, personalized to their NBFC type and SBR layer, with specific action items and deadlines. Review it, tweak it, send it. Your client receives a polished advisory that reads like you spent an hour writing it. They forward it to their board. You just became indispensable.",
    cardTitle: "Compliance Advisory",
    cardSub: "Auto-generated · Ready for review",
    advisory: {
      firm: "Sharma & Associates",
      firmSub: "Company Secretaries · Established 2011",
      date: "February 10, 2026",
      to: "Ananya Finserv Pvt Ltd",
      subject: "KYC Direction Amendment — V-CIP Requirements",
      update:
        "The RBI has issued an amendment (RBI/2026-27/42) to the Master Direction on KYC, mandating Video-based Customer Identification Process (V-CIP) for all new account openings.",
      impact:
        "As a Base Layer NBFC-ICC, Ananya Finserv is required to implement V-CIP capabilities for new customer onboarding and re-verify existing high-risk customers within 12 months.",
      actions: [
        "Update KYC policy document to include V-CIP provisions",
        "Procure or integrate a V-CIP technology solution",
        "Train front-office staff on new CIP procedures",
      ],
      deadline: "July 1, 2026",
      by: "CS Priya Sharma | Sharma & Associates",
    },
  },
  {
    step: "3",
    title: "Every client, every deadline — nothing slips.",
    body:
      "One dashboard shows compliance status across all your NBFC clients. Every recurring return, every new obligation, every deadline — color-coded by urgency, filterable by client. No more juggling spreadsheets. When a client's board asks 'are we compliant?', you don't scramble. You pull up a live dashboard. The answer is always yes — and your clients never have to worry.",
    calendar: {
      month: "February 2026",
      days: Array.from({ length: 31 }, (_, i) => i + 1),
      events: [
        { date: 5, label: "CRILC Quarterly Report", client: "Ananya Finserv", tone: "upcoming" },
        { date: 10, label: "NBS-1 Return Filing", client: "Sarvottam Finance", tone: "overdue" },
        { date: 14, label: "Factoring Activity Return", client: "Meridian Capital", tone: "upcoming" },
        { date: 28, label: "KYC V-CIP Policy Update", client: "All Clients", tone: "upcoming" },
      ],
      legend: [
        { label: "Completed", tone: "completed" },
        { label: "Upcoming", tone: "upcoming" },
        { label: "Overdue", tone: "overdue" },
      ],
    },
  },
];

export default function MarketingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");
  const [submitted, setSubmitted] = useState<"waitlist" | "cta" | null>(null);

  function onWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail) return;
    setSubmitted("waitlist");
  }
  function onCtaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ctaEmail) return;
    setSubmitted("cta");
  }

  return (
    <div className="m-page">
      <nav className="m-nav">
        <div className="m-nav-inner">
          <Link href="/" className="m-brand">
            <span className="m-brand-mark">R</span>
            <span className="m-brand-name">RegMitra</span>
          </Link>
          <div className="m-nav-links">
            <a href="#how">How it works</a>
            <a href="#capabilities">Capabilities</a>
            <Link href="/login">Sign in</Link>
          </div>
          <div className="m-nav-ctas">
            <form action="/api/auth/demo-login" method="POST" className="m-nav-try-form">
              <button type="submit" className="btn btn-ghost m-nav-try">
                Try it out
              </button>
            </form>
            <Link href="/signup" className="btn btn-primary m-nav-signup">
              Create account <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="m-hero">
        <div className="m-hero-inner">
          <div className="m-hero-tag">Built for Practicing Company Secretaries</div>
          <h1 className="m-hero-title">
            Your clients hear about new RBI circulars from you first —
            <span className="m-hero-accent"> not the other way around.</span>
          </h1>
          <p className="m-hero-sub">
            AI-powered regulatory intelligence that monitors every RBI circular,
            maps it to each client's profile, and drafts your advisory — before
            anyone else has finished reading it.
          </p>
          <div className="m-hero-actions">
            <form action="/api/auth/demo-login" method="POST" className="m-hero-try-form">
              <button type="submit" className="btn btn-primary m-hero-try">
                Try the dashboard <ArrowRight size={14} />
              </button>
            </form>
            <form className="m-waitlist" onSubmit={onWaitlistSubmit}>
              <div className="m-waitlist-input-wrap">
                <Mail size={16} className="m-waitlist-icon" />
                <input
                  className="m-waitlist-input"
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <button className="btn btn-ghost m-waitlist-btn" type="submit">
                {submitted === "waitlist" ? "You're on the list" : "Join Waitlist"}
              </button>
            </form>
          </div>
          <a className="m-hero-demo" href="#">
            Or book a 15-min demo call
          </a>
        </div>
      </section>

      <section className="m-preview-wrap">
        <div className="m-preview">
          <div className="m-preview-appurl">app.regmitra.com</div>
          <div className="m-preview-section-title">Your Clients</div>
          <div className="m-preview-meta">
            <span className="m-preview-meta-strong">5 active</span> NBFC profiles &nbsp;·&nbsp;
            <span className="m-preview-meta-strong">New circular</span> — 4 clients affected
          </div>
          <div className="m-preview-list">
            {CLIENTS.map((c) => (
              <div key={c.name} className="m-preview-row">
                <div className="m-preview-avatar" style={{ background: c.statusColor + "22", color: c.statusColor }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="m-preview-row-meta">
                  <div className="m-preview-row-name">{c.name}</div>
                  <div className="m-preview-row-tag">{c.tag}</div>
                </div>
                <div className="m-preview-row-progress" style={{ color: c.statusColor }}>{c.progress}</div>
                <div className="m-preview-row-due">{c.due}</div>
              </div>
            ))}
          </div>
          <div className="m-preview-footer">
            Monitoring <strong>1,843+</strong> RBI regulatory updates per year
          </div>
        </div>
      </section>

      <section id="how" className="m-section">
        <div className="m-section-inner">
          <div className="m-section-eyebrow">How it works</div>
          <h2 className="m-section-title">From circular to client advisory in minutes</h2>
          <p className="m-section-sub">
            See how RegMitra transforms your daily compliance workflow — and how
            your clients notice the difference.
          </p>

          <div className="m-hiw-stack">
            {HIW.map((step, idx) => (
              <div key={idx} className="m-hiw-block">
                <div className="m-hiw-left">
                  <div className="m-hiw-step">{step.step}</div>
                  <h3 className="m-hiw-title">{step.title}</h3>
                  <p className="m-hiw-body">{step.body}</p>
                </div>
                <div className="m-hiw-right">
                  {idx === 0 && (
                    <div className="m-card m-circular-card">
                      <div className="m-circular-head">
                        <div className="m-circular-app">app.regmitra.com</div>
                        <div className="m-circular-new">NEW</div>
                      </div>
                      <div className="m-circular-id">
                        <span className="m-circular-org">RBI</span> / {step.cardId}
                        <span className="m-circular-time">· {step.cardTime}</span>
                      </div>
                      <h4 className="m-circular-title">{step.cardTitle}</h4>
                      <div className="m-circular-section-label">AI Interpretation</div>
                      <p className="m-circular-interpretation">{step.interpretation}</p>
                      <div className="m-circular-meta-grid">
                        {step.metadata!.map(([k, v]) => (
                          <div key={k} className="m-circular-meta">
                            <div className="m-circular-meta-k">{k}</div>
                            <div className="m-circular-meta-v">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="m-circular-section-label">{step.affectedLabel}</div>
                      <div className="m-circular-affected">
                        {step.affected?.map((name) => (
                          <span key={name} className="m-circular-aff-pill">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className="m-card m-adv-card">
                      <div className="m-adv-header">
                        <div>
                          <h4 className="m-adv-title">{step.cardTitle}</h4>
                          <div className="m-adv-sub">{step.cardSub}</div>
                        </div>
                        <div className="m-adv-pdf">PDF</div>
                      </div>
                      <div className="m-adv-firm">
                        <div className="m-adv-firm-name">{step.advisory?.firm}</div>
                        <div className="m-adv-firm-sub">{step.advisory?.firmSub}</div>
                      </div>
                      <div className="m-adv-sep" />
                      <div className="m-adv-grid">
                        <div className="m-adv-k">To</div>
                        <div className="m-adv-v">{step.advisory?.to}</div>
                        <div className="m-adv-k">Subject</div>
                        <div className="m-adv-v m-adv-strong">{step.advisory?.subject}</div>
                      </div>
                      <div className="m-adv-block">
                        <div className="m-adv-block-k">Regulatory Update</div>
                        <div className="m-adv-block-v">{step.advisory?.update}</div>
                      </div>
                      <div className="m-adv-block">
                        <div className="m-adv-block-k">Impact on Your NBFC</div>
                        <div className="m-adv-block-v">{step.advisory?.impact}</div>
                      </div>
                      <div className="m-adv-block">
                        <div className="m-adv-block-k">Required Actions</div>
                        <ol className="m-adv-actions">
                          {step.advisory?.actions.map((a, i) => (
                            <li key={i}>
                              <span className="m-adv-actions-n">{i + 1}</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ol>
                        <div className="m-adv-deadline">
                          Compliance Deadline: <strong>{step.advisory?.deadline}</strong>
                        </div>
                      </div>
                      <div className="m-adv-by">Prepared by {step.advisory?.by}</div>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className="m-card m-cal-card">
                      <div className="m-cal-head">
                        <h4 className="m-cal-title">{step.calendar?.month}</h4>
                        <div className="m-cal-legend">
                          {step.calendar?.legend.map((l) => (
                            <span key={l.label} className={`m-cal-legend-item m-tone-${l.tone}`}>
                              <span className="m-cal-legend-dot" />
                              {l.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="m-cal-weekdays">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                      </div>
                      <div className="m-cal-grid">
                        {Array.from({ length: 6 * 7 }).map((_, i) => {
                          const startOffset = 0;
                          const dayNum = i - startOffset + 1;
                          const events =
                            step.calendar?.events.filter((e) => e.date === dayNum) ?? [];
                          const hasAny = events.length > 0;
                          const anyTone = events[0]?.tone;
                          return (
                            <div
                              key={i}
                              className={`m-cal-cell ${hasAny ? `m-cell-event m-tone-${anyTone}` : ""}`}
                            >
                              {dayNum >= 1 && dayNum <= 28 && (
                                <span className="m-cal-day">{dayNum}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="m-cal-events">
                        <div className="m-cal-events-title">Across All Clients</div>
                        {step.calendar?.events.map((e) => (
                          <div key={e.label + e.date} className={`m-cal-event m-tone-${e.tone}`}>
                            <div className="m-cal-event-main">{e.label}</div>
                            <div className="m-cal-event-sub">{e.client} Feb {e.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="m-section m-section-muted">
        <div className="m-section-inner">
          <div className="m-section-eyebrow">Capabilities</div>
          <h2 className="m-section-title">Everything you need, nothing you don't</h2>
          <div className="m-cap-grid">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="m-cap-card">
                <div
                  className="m-cap-icon"
                  style={{ background: cap.accent + "18", color: cap.accent }}
                >
                  <cap.Icon size={20} />
                </div>
                <h3 className="m-cap-title">{cap.title}</h3>
                <p className="m-cap-desc">{cap.desc}</p>
              </div>
            ))}
          </div>
          <div className="m-stats">
            {STATS.map((s) => (
              <div key={s.label} className="m-stat-card">
                <div className="m-stat-value">{s.value}</div>
                <div className="m-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta-section" className="m-cta">
        <div className="m-cta-inner">
          <h2 className="m-cta-title">
            Be the CS your clients never worry about
          </h2>
          <p className="m-cta-sub">
            Join the early access list and be among the first to use RegMitra.
          </p>
          <div className="m-cta-actions">
            <form className="m-waitlist m-waitlist-cta" onSubmit={onCtaSubmit}>
              <div className="m-waitlist-input-wrap">
                <Mail size={16} className="m-waitlist-icon" />
                <input
                  className="m-waitlist-input"
                  type="email"
                  value={ctaEmail}
                  onChange={(e) => setCtaEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <button className="btn btn-primary m-waitlist-btn" type="submit">
                {submitted === "cta" ? "You're on the list" : "Join Waitlist"}
              </button>
            </form>
            <form action="/api/auth/demo-login" method="POST" className="m-cta-try-form">
              <button type="submit" className="btn btn-ghost m-cta-try">
                Or try the demo dashboard <ArrowRight size={14} />
              </button>
            </form>
          </div>
          <ul className="m-cta-perks">
            <li>Early access before public launch</li>
            <li>Founding member pricing — locked in forever</li>
            <li>Direct input on the product roadmap</li>
          </ul>
        </div>
      </section>

      <footer className="m-footer">
        <div className="m-footer-inner">
          <div className="m-footer-brand-col">
            <Link href="/" className="m-brand">
              <span className="m-brand-mark">R</span>
              <span className="m-brand-name">RegMitra</span>
            </Link>
            <p className="m-footer-tag">AI Regulatory Intelligence for Practicing Company Secretaries</p>
          </div>
          <div className="m-footer-cols">
            <div className="m-footer-col">
              <div className="m-footer-col-title">Product</div>
              <a href="#how">How it works</a>
              <a href="#capabilities">Capabilities</a>
              <Link href="/signup">Early access</Link>
            </div>
            <div className="m-footer-col">
              <div className="m-footer-col-title">Company</div>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Create account</Link>
              <a href="#">Contact</a>
            </div>
            <div className="m-footer-col">
              <div className="m-footer-col-title">Connect</div>
              <a href="#" className="m-social"><Mail size={14} /> hello@regmitra.com</a>
              <a href="#" className="m-social">LinkedIn</a>
              <a href="#" className="m-social">Twitter</a>
            </div>
          </div>
        </div>
        <div className="m-footer-base">
          © {new Date().getFullYear()} RegMitra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
