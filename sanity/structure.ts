import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list().title('WhatsGoodMGM').items([
    S.listItem().title('📥 Pending events').child(
      S.documentList().title('Pending events').apiVersion('2026-07-01')
        .filter('_type == "event" && status == "pending"')
        .defaultOrdering([{ field: 'likelyRecurring', direction: 'desc' }, { field: '_createdAt', direction: 'desc' }])
    ),
    S.listItem().title('📨 New submissions').child(
      S.documentList().title('New submissions').apiVersion('2026-07-01')
        .filter('_type == "submission" && status == "new"')
    ),
    S.divider(),
    S.listItem().title("⭐ Weekly Picks").child(S.documentTypeList('weeklyPick')),
    S.listItem().title('📅 All events').child(S.documentTypeList('event')),
    S.listItem().title('📍 Venues').child(S.documentTypeList('venue')),
    S.divider(),
    S.listItem().title('🔌 Ingestion sources').child(S.documentTypeList('source')),
    S.listItem().title('👥 Contributors').child(S.documentTypeList('contributor')),
    S.listItem().title('🗂 All submissions').child(S.documentTypeList('submission')),
  ])
