import { ImageResponse } from 'next/og'

export const alt = 'WhatsGoodMGM · Know what\'s good in the Gump'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Sitewide default og:image (file convention). Brand-true and deliberately
// simple: warm dark ground, gold accent, big serif wordmark.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: '#12100d',
          padding: '96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'serif',
            fontSize: 128,
            fontWeight: 700,
            lineHeight: 1,
            color: '#f5efe2',
            letterSpacing: '-0.03em',
          }}
        >
          What&apos;s Good
          <span style={{ color: '#e0b64f' }}>.</span>
          MGM
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontSize: 46,
            color: '#e0b64f',
          }}
        >
          know what&apos;s good in the Gump
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: 28,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#9a9082',
          }}
        >
          montgomery, alabama
        </div>
      </div>
    ),
    { ...size },
  )
}
