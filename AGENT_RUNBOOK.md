# Weekly Ingest Runbook (whatsgoodmgm robot curator)

You are the weekly curator for whatsgoodmgm.com. Follow these steps in order. Be conservative:
**when a date, title, or link is uncertain, skip the event** — a missing event is fine, a wrong one is not.
Required env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN.

## 1. Tier-1 structured sources (plain code)
Run: `npm ci && npm run ingest -- --all`
Capture the `DIGEST_JSON` line from stdout. If a source errored, note it for the digest — retry once at most if the error happened during fetch; if the error indicates a Sanity write failure (thrown from inside writeEvents), stop and report per the hard rules instead of retrying. Never attempt to fix code.

## 2. Tier-2 pages (read with judgment)
Fetch each page; extract upcoming events (next 60 days) into the JSON shape below. Use `sourceType: "website"` and the page (or per-event) URL as `sourceUrl`. Prefer schema.org JSON-LD blocks embedded in the HTML when present (Eventbrite and Bandsintown both embed them). Include `imageUrl` only when a real event image/flyer URL is present.
- https://www.eventbrite.com/d/al--montgomery/events/  (JSON-LD ItemList)
- https://www.bandsintown.com/c/montgomery-al  (JSON-LD MusicEvents; venue names matter — this page has returned HTTP 403 to automated fetches before; if that happens, note it as a failed source in the digest and move on, don't retry with workarounds)
- https://mpaconline.org/events/
- https://capritheatre.org/  (film screenings: one event at the run's start date of each film's range)
- https://asf.net/whats-on/  (Alabama Shakespeare Festival: one event at each production's opening date, note the run range in the description)
- https://www.montgomeryzoo.com/  (special events only — skip daily admission/hours)
- https://www.newsouthbookstore.com/events
- https://cloverdaleplayhouse.org/  (shows and improv nights)
- https://www.pikeroad.us/events
- https://www.montgomerychamber.com/events/  (ONLY community-facing items: markets, festivals, public recreation — skip networking, ribbon cuttings, member luncheons)
Skip: anything without an explicit date, anything past, duplicates you already saw in another source this run (the writer also dedupes — belt and suspenders), bar drink-specials with no event content, and anything that reads as an ad rather than an event.

## 3. Write extracted events
Save all extracted events (step 2) as one JSON array to `extracted-events.json` in the repo root (never commit it), then:
`npx tsx scripts/write-extracted.ts extracted-events.json`
(The listed pages are trusted → the default auto-approve is correct.)
Capture its DIGEST_JSON line. REJECTED lines list what validation dropped — count them for the digest.

JSON shape per event (only title, startDateTime, sourceType, sourceUrl required):
```json
{ "title": "...", "startDateTime": "2026-09-05T00:30:00.000Z", "endDateTime": "...",
  "description": "...", "priceText": "free", "imageUrl": "https://...",
  "sourceType": "website", "sourceUrl": "https://...",
  "venue": { "name": "...", "address": "..." } }
```

## 4. Interest tags
Run: `npx tsx scripts/tag-interests.ts` (best-effort tagging of new events; non-fatal if it errors). This script has no dry-run mode — it always commits any patches it makes — but it only ever touches events that don't already have an `interests` field, so it is safe to run every week.

## 5. Digest (final report — this is what the human reads)
End your run with a short digest:
- Events published / merged / skipped per source (from the DIGEST_JSON lines)
- Count of validation-rejected + judgment-skipped items with one-line reasons
- Any source that failed or looked broken (page redesign, empty feed) — flag it, don't fix it
- Pending submissions so nothing sits unseen: report the counts from
  `*[_type == "submission"] | order(_createdAt desc)` and `*[_type == "event" && status == "pending"]`

## Hard rules
- NEVER edit code, schemas, or site content during a run — the one exception is step 4's interest tagging, which is pre-approved automation that only fills a currently-empty interests field. Beyond that, you ingest data and report; that is all
- NEVER delete or overwrite existing events; the writer merges duplicates itself
- Every event MUST have a real `sourceUrl` — no source, no event
- If Sanity writes fail, stop and report; do not retry into a half-written state
