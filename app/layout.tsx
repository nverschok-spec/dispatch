import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })

export const metadata: Metadata = {
  title: 'Lavender Edition Systems — Software mit Haltung',
  description:
    'Sorgfältig entwickelte digitale Werkzeuge für Menschen, die ihr Handwerk verstehen.',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/app-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/app-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#150f22',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
