import type { Metadata } from 'next'
import { Fraunces, Epilogue, IBM_Plex_Mono } from 'next/font/google'
import { SITE_URL } from '@/lib/siteUrl'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const epilogue = Epilogue({
  subsets: ['latin'],
  variable: '--font-epilogue',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'WhatsGoodMGM · Know what\'s good in the Gump', template: '%s · WhatsGoodMGM' },
  description: 'a free, community-made guide to what\'s good in Montgomery, Alabama. events, maps, and a calendar you can subscribe to.',
  openGraph: {
    siteName: 'WhatsGoodMGM',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script in <body> legitimately
    // flips data-theme before React hydrates when the visitor has dark stored
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${fraunces.variable} ${epilogue.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        {/* runs before paint so a stored dark preference never flashes cream */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('wg-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  )
}
