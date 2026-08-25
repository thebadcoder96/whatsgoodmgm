# One-time setup (do together, ~20 min)

1. **Reddit app** (for TNTDIM ingestion): reddit.com/prefs/apps -> create app -> type "script",
   name "whatsgoodmgm-ingest", redirect uri http://localhost:8080 (unused). Copy the client id
   (shown under the app name) and the secret into `.env.local` as REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET.
   Verify: `npx tsx scripts/fetch-tntdim.ts` prints her latest TNTDIM post (or NO_TNTDIM_POSTS_FOUND).
2. **Sanity revalidation webhook**: manage.sanity.io -> project r4b3vt07 -> API -> Webhooks -> create:
   POST https://whatsgoodmgm.com/api/revalidate?secret=<REVALIDATE_SECRET from .env.local>,
   dataset production, trigger on create/update/delete. Verify: edit an event in Studio,
   site updates within seconds.
3. **GitHub secrets** (backups only): repo Settings -> Secrets and variables -> Actions ->
   add SANITY_PROJECT_ID and SANITY_WRITE_TOKEN. Verify: Actions tab -> "Sanity backup" ->
   Run workflow -> green run with export artifact.
4. **Schedule the weekly agent**: create a scheduled Claude Code cloud agent (routine),
   Mondays 6:00 AM Central, connected to this repo, with env vars:
   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET=production, SANITY_WRITE_TOKEN,
   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET.
   Prompt: "Follow AGENT_RUNBOOK.md at the repo root, start to finish, and end with the digest."
   First run: temporarily add "run everything in dry-run mode (add --dry-run to the ingest and
   write-extracted commands, skip tag-interests)" to the prompt, review the digest, then remove it.
