import type { StructureResolver } from 'sanity/structure'
import {
  InboxIcon,
  EnvelopeIcon,
  StarIcon,
  CalendarIcon,
  PinIcon,
  BoltIcon,
  UsersIcon,
  ArchiveIcon,
} from '@sanity/icons'

export const structure: StructureResolver = (S) =>
  S.list().title('WhatsGoodMGM').items([
    S.listItem().title('Pending approval').icon(InboxIcon).child(
      S.documentList().title('Pending approval').apiVersion('2026-07-01')
        .filter('_type == "event" && status == "pending"')
        .defaultOrdering([{ field: 'likelyRecurring', direction: 'desc' }, { field: '_createdAt', direction: 'desc' }])
    ),
    S.listItem().title('New submissions').icon(EnvelopeIcon).child(
      S.documentList().title('New submissions').apiVersion('2026-07-01')
        .filter('_type == "submission" && status == "new"')
    ),
    S.divider(),
    S.listItem().title('Weekly picks').icon(StarIcon).child(S.documentTypeList('weeklyPick')),
    S.listItem().title('All events').icon(CalendarIcon).child(S.documentTypeList('event')),
    S.listItem().title('Venues').icon(PinIcon).child(S.documentTypeList('venue')),
    S.divider(),
    S.listItem().title('Auto-import sources').icon(BoltIcon).child(S.documentTypeList('source')),
    S.listItem().title('Contributors').icon(UsersIcon).child(S.documentTypeList('contributor')),
    S.listItem().title('Submission archive').icon(ArchiveIcon).child(S.documentTypeList('submission')),
  ])
