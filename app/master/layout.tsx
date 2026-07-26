import type { Metadata } from 'next'

// Own manifest so "Install as app" from /master or /master/login produces a
// distinctly-named, distinctly-launching icon — see app/techniker/layout.tsx
// for why this exists per-role instead of sharing the root manifest.
export const metadata: Metadata = {
  title: 'MeisterPlan Master',
  manifest: '/master.webmanifest',
}

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return children
}
