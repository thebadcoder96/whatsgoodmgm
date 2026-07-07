import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  // Next 16 requires a second "profile" argument for revalidateTag. "max" reproduces
  // the pre-16 single-arg behavior (immediate, unbounded revalidation) per the
  // deprecation notice at https://nextjs.org/docs/messages/revalidate-tag-single-arg
  revalidateTag('sanity', 'max')
  return NextResponse.json({ ok: true, revalidated: true })
}
