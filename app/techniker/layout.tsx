import type { Metadata } from 'next'

// Own manifest so "Install as app" from /techniker or /techniker/login
// produces a distinctly-named, distinctly-launching icon instead of one
// indistinguishable from the dispatcher/master installs (all three used to
// share the root layout's generic MeisterPlan manifest).
export const metadata: Metadata = {
  title: 'MeisterPlan Techniker',
  manifest: '/techniker.webmanifest',
}

export default function TechnikerLayout({ children }: { children: React.ReactNode }) {
  return children
}
