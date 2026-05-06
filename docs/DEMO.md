# Shrenik Demo — Operations

## One-time setup

1. `npm install`
2. Ensure `.env` has:
   - `DATABASE_URL=...` (shared Neon Postgres)
   - `ANTHROPIC_API_KEY=sk-ant-...` (only required for the precompute step)
3. Apply the additive SQL once: `psql "$DATABASE_URL" < prisma/demo-migration.sql`
   - This is purely additive — adds `demo_*` tables and a few columns to `scraped_documents`. No drops.
4. `npm run demo:seed` — populates 3 clients, 9 counterparties, ~63 transactions, 7 circulars, 10 baseline compliance items.
5. `npm run demo:precompute` — runs Anthropic offline for every (circular × client) pair (~1-3 min).

## Pre-demo checklist

- [ ] `npm run demo:reset` — restores baseline state
- [ ] `npm run dev` — server running on :3000
- [ ] Browser zoom 110-125%
- [ ] Open `http://localhost:3000/dashboard` — wait there
- [ ] Backup tab open at `http://localhost:3000/circulars/<live-drop-id>/impact` (find the ID via Prisma Studio or DB query: `SELECT id FROM scraped_documents WHERE is_live_drop = true`)
- [ ] WiFi reliable; hotspot ready as backup
- [ ] Ambient noise OK; close email/Slack/etc.

## Demo flow (6 minutes)

| Time | Action |
|---|---|
| 0:00 | Open /dashboard. Walk through KPIs (3 flagged, ~5 new circulars, ₹X cr exposure) and the "Needs attention today" feed. |
| 0:30 | Click Steelvine row → walk through /clients/client_steelvine. Establish concentration chart (OEM at 78%). |
| 1:00 | Back to /circulars. Click the Factories Act circular (the static focus, MOL/2026/FA-SHIFT-01). Walk through AI summary. |
| ~2:05 | Toast appears automatically (timer fires 60s after page load). Click it. |
| 2:15 | /circulars/<id>/impact opens. Walk left pane (Steelvine CRITICAL, Astra HIGH, Northwind HIGH). |
| 2:30 | Click Astra in left pane. Walk rationale (Helix 47%, threshold 40%). |
| 3:00 | Click INV-4521 row → expand. **THE PINPOINT MOMENT.** Hold for narrative. |
| 4:00 | Click "Generate client communications" → /comms/<id>. Walk pre-drafted email. Edit one line, save. |
| 5:00 | Click "Calendar" link → /calendar. Show 3 new items at top (RPT disclosures for Astra/Northwind/Steelvine). |
| 5:30 | Click status toggle on "PF return filing — Astra". Watch it animate to ✓ done. Counter updates. |
| 6:00 | Closing beat: "What you've just seen runs end-to-end. Real connector to your books is the pilot conversation." |

## Keyboard overrides

- **Cmd+Shift+T** — fire live trigger immediately (skip the 60s timer)
- **Cmd+Shift+P** — pause/extend timer by 30s (if Shrenik interrupts)

## Rehearsal

Run a full round-trip rehearsal:
1. `npm run demo:reset`
2. Walk through all 6 minutes
3. `npm run demo:reset`
4. Repeat — should be reproducible.

## Architecture notes

- **Cached AI:** all impact analyses + comm drafts are precomputed offline and stored in `demo_impact_analyses` / `demo_draft_comms`. Demo-time UI loads these from cache; no live AI calls during the demo.
- **Live trigger:** `Circular.releasedAt` is far-future for the live-drop circular. The static focus page (`/circulars/<MOL/2026/FA-SHIFT-01>`) arms a 60-sec client-side timer that calls `/api/demo/release/:id`, flipping `releasedAt` to now. The notification poll picks it up within ~5 sec.
- **Reset:** `/api/demo/reset` (or `npm run demo:reset`) restores baseline — `releasedAt` to year 3000, deletes ComplianceItems created from live-drop, resets DraftComm statuses, restores the PF item to pending.
