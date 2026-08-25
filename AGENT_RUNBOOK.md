# Weekly Ingest Runbook (whatsgoodmgm robot curator)

You are the weekly curator for whatsgoodmgm.com. Follow these steps in order. Be conservative:
**when a date, title, or link is uncertain, skip the event** — a missing event is fine, a wrong one is not.
Required env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_WRITE_TOKEN,
REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET.

## 1. Tier-1 structured sources (plain code)
Run: `npm ci && npm run ingest -- --all`
Capture the `DIGEST_JSON` line from stdout. If a source errored, note it for the digest — retry once at most; never attempt to fix code.

## 2. TNTDIM reddit post
Run: `npx tsx scripts/fetch-tntdim.ts`
If a post newer than 8 days appears: read BODY and extract every event into the JSON shape below.
- `sourceType: "reddit"`, `sourceUrl`: the post PERMALINK (always — this is her credit)
- Dates/times are America/Chicago local; convert to UTC ISO ("Friday" means the Friday within the post's week; if a date is ambiguous, skip that event)
- Include `priceText` when she mentions price/free; include venue name when stated
If the script errors or no recent post exists, note it in the digest and continue.

## 3. Tier-2 pages (read with judgment)
Fetch each page; extract upcoming events (next 60 days) into the same JSON shape. Use `sourceType: "website"` and the page (or per-event) URL as `sourceUrl`. Prefer schema.org JSON-LD blocks embedded in the HTML when present (Eventbrite and Bandsintown both embed them). Include `imageUrl` only when a real event image/flyer URL is present.
- https://www.eventbrite.com/d/al--montgomery/events/  (JSON-LD ItemList)
- https://www.bandsintown.com/c/montgomery-al  (JSON-LD MusicEvents; venue names matter — this page has returned HTTP 403 to automated fetches before; if that happens, note it as a failed source in the digest and move on, don't retry with workarounds)
- https://mpaconline.org/events/
- https://capritheatre.org/  (film screenings: one event at the run's start date of each film's range)
- https://www.pikeroad.us/events
- https://www.montgomerychamber.com/events/  (ONLY community-facing items: markets, festivals, public recreation — skip networking, ribbon cuttings, member luncheons)
- https://cityofmillbrook.org/events/
Skip: anything without an explicit date, anything past, duplicates you already saw in another source this run (the writer also dedupes — belt and suspenders), bar drink-specials with no event content, and anything that reads as an ad rather than an event.

## 4. Write extracted events
Save all extracted events (steps 2+3) as one JSON array to `extracted-events.json` in the repo root (never commit it), then:
`npx tsx scripts/write-extracted.ts extracted-events.json`
(Reddit + the listed pages are trusted → the default auto-approve is correct.)
Capture its DIGEST_JSON line. REJECTED lines list what validation dropped — count them for the digest.

JSON shape per event (only title, startDateTime, sourceType, sourceUrl required):
```json
{ "title": "...", "startDateTime": "2026-09-05T00:30:00.000Z", "endDateTime": "...",
  "description": "...", "priceText": "free", "imageUrl": "https://...",
  "sourceType": "website", "sourceUrl": "https://...",
  "venue": { "name": "...", "address": "..." } }
```

## 5. Interest tags
Run: `npx tsx scripts/tag-interests.ts` (best-effort tagging of new events; non-fatal if it errors). This script has no dry-run mode — it always commits any patches it makes — but it only ever touches events that don't already have an `interests` field, so it is safe to run every week.

## 6. Digest (final report — this is what the human reads)
End your run with a short digest:
- Events published / merged / skipped per source (from the DIGEST_JSON lines)
- Whether a new TNTDIM post existed and how many events came from it
- Count of validation-rejected + judgment-skipped items with one-line reasons
- Any source that failed or looked broken (page redesign, empty feed) — flag it, don't fix it
- Pending submissions so nothing sits unseen: report the counts from
  `*[_type == "submission"] | order(_createdAt desc)` and `*[_type == "event" && status == "pending"]`

## Hard rules
- NEVER edit code, schemas, or site content during a run — you ingest data and report; that is all
- NEVER delete or overwrite existing events; the writer merges duplicates itself
- Every event MUST have a real `sourceUrl` — no source, no event
- If Sanity writes fail, stop and report; do not retry into a half-written state
