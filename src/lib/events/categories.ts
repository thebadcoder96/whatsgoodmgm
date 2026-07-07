// Single source of truth for event categories, kept free of any `sanity`
// package import so it can be safely pulled into RSC/client bundles.
// `sanity/schemaTypes/event.ts` re-exports this for the Studio schema.
export const CATEGORIES = ['music', 'arts', 'food', 'family', 'nightlife', 'community', 'sports', 'education', 'festival', 'other']
