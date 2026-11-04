'use client'

import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Clock3, FileText, Menu, MoveUpRight, Sparkles, Timer, X, Zap } from 'lucide-react'
import { useState } from 'react'

const products = [
  { name: 'Einfach-Termin', type: 'Praxisorganisation', desc: 'Termine, Anamnesen und Erinnerungen — ruhig organisiert.', icon: CalendarDays, a: '#8b6fe0', b: '#5fe0b8', size: 'large' },
  { name: 'Handwerker-Dispatch', type: 'Auftragssteuerung', desc: 'Der klare Leitstand für jeden Einsatz.', icon: Zap, a: '#e8a23d', b: '#6b7a8c', size: 'wide' },
  { name: 'Pixo', type: 'Creative workspace', desc: 'Ideen werden sichtbar.', icon: Sparkles, a: '#2dd4c8', b: '#5b8def', size: 'small' },
  { name: 'AI Time Manager', type: 'Fokus & Zeit', desc: 'Mehr Raum für das Wesentliche.', icon: Timer, a: '#e06b9e', b: '#7ed9a0', size: 'small' },
  { name: 'Deutsch B2 Trainer', type: 'Sprache & Prüfung', desc: 'Sicher sprechen. Sicher bestehen.', icon: FileText, a: '#6c7ae0', b: '#d9a86c', size: 'wide' },
]

const reveals = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: .8, ease: [0.22, 1, .36, 1] } } }

function ProductCard({ product, index }: { product: typeof products[number], index: number }) {
  const Icon = product.icon
  return <motion.article variants={reveals} custom={index} whileHover={{ y: -6 }} className={`product-card product-${product.size} group relative overflow-hidden rounded-[2rem] p-6 sm:p-8`} style={{ '--card-a': product.a, '--card-b': product.b } as React.CSSProperties}>
    <div className="product-glow" aria-hidden="true" />
    <div className="relative z-10 flex h-full flex-col">
      <div className="icon-orb mb-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ color: product.a }}><Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" /></div>
      <div className="mt-14"><p className="eyebrow mb-3" style={{ color: product.a }}>{product.type}</p><h3 className="font-display text-2xl text-ink sm:text-3xl">{product.name}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-ink-muted">{product.desc}</p><a href="#kontakt" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-gold-1">Mehr erfahren <ArrowUpRight className="h-4 w-4" /></a></div>
    </div>
  </motion.article>
}

export default function LandingPage() {
  const [variant, setVariant] = useState<'A' | 'B' | 'C'>('B')
  const [menuOpen, setMenuOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const orbY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : 80])
  return <main className={`site-shell variant-${variant.toLowerCase()}`}>
    <div className="ambient" aria-hidden="true"><motion.div style={{ y: orbY }} className="glow-orb orb-one" /><div className="glow-orb orb-two" /><div className="grain" /></div>
    <header className="site-header"><Link href="#top" className="brand" aria-label="Lavender Edition Systems Startseite"><span className="brand-mark">L</span><span>Lavender Edition <em>Systems</em></span></Link><nav className="hidden items-center gap-8 md:flex"><a href="#produkte">Produkte</a><a href="#philosophie">Philosophie</a><a href="#kontakt">Kontakt</a></nav><div className="header-actions"><Link href="/login" className="hidden text-sm text-ink-muted transition hover:text-ink sm:block">Anmelden</Link><Link href="#kontakt" className="button button-small">Gespräch vereinbaren <ArrowUpRight className="h-4 w-4" /></Link><button onClick={() => setMenuOpen(!menuOpen)} className="menu-button md:hidden" aria-label="Menü öffnen" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button></div>{menuOpen && <nav className="mobile-nav md:hidden"><a href="#produkte" onClick={() => setMenuOpen(false)}>Produkte</a><a href="#philosophie" onClick={() => setMenuOpen(false)}>Philosophie</a><a href="#kontakt" onClick={() => setMenuOpen(false)}>Kontakt</a></nav>}</header>

    <section id="top" className="hero section-wrap"><div className="hero-copy"><p className="eyebrow">Software mit Haltung · Made in Germany</p><h1 className="font-display">Weniger Lärm.<br /><em>Mehr Wirkung.</em></h1><p className="hero-subline">Digitale Werkzeuge für Menschen, die ihr Handwerk verstehen — sorgfältig entwickelt, ruhig im Umgang, stark im Ergebnis.</p><div className="hero-actions"><Link href="#produkte" className="button">Produkte entdecken <ArrowUpRight className="h-4 w-4" /></Link><a href="mailto:office@lavender-edition.de?subject=Gespräch%20vereinbaren" className="button button-ghost">Persönlich sprechen <MoveUpRight className="h-4 w-4" /></a></div></div><div className="hero-preview" aria-label="Vorschau einer Produktoberfläche"><div className="preview-window"><div className="preview-top"><span className="preview-dots"><i /><i /><i /></span><span className="preview-label">Handwerker-Dispatch / Heute</span><span className="preview-status">● live</span></div><div className="preview-body"><div className="preview-sidebar"><span className="sidebar-logo">H</span><span className="sidebar-line active" /><span className="sidebar-line" /><span className="sidebar-line" /><span className="sidebar-line" /></div><div className="preview-content"><div className="preview-heading"><div><small>DIENSTAG, 04. NOVEMBER</small><h3>Guten Morgen, Jonas.</h3></div><Clock3 className="h-5 w-5 text-gold-1" /></div><div className="preview-stats"><div><small>OFFENE AUFTRÄGE</small><strong>24</strong></div><div><small>IM EINSATZ</small><strong className="teal">08</strong></div></div><div className="preview-list"><div><span className="list-avatar purple">M</span><span><b>Wasserhahn tropft</b><small>Berlin · 10:30 Uhr</small></span><i className="list-dot" /></div><div><span className="list-avatar amber">S</span><span><b>Heizung prüfen</b><small>Charlottenburg · 11:15 Uhr</small></span><i className="list-dot muted" /></div><div><span className="list-avatar blue">K</span><span><b>Rohrbruch im Keller</b><small>Neukölln · 12:00 Uhr</small></span><i className="list-dot" /></div></div></div></div></div><div className="preview-caption">Ein ruhiger Überblick, wenn es darauf ankommt.</div></div></section>

    <section className="trust-strip section-wrap"><span>Made in Germany</span><i /><span>DSGVO-konform</span><i /><span>5 Produkte</span><i /><span>Persönlicher Support</span></section>

    <section id="produkte" className="section-wrap products-section"><div className="section-heading"><div><p className="eyebrow">Unsere Produkte</p><h2 className="font-display">Klarheit für <em>komplexe Dinge.</em></h2></div><p>Fünf eigenständige Werkzeuge.<br />Eine gemeinsame Idee: weniger Reibung.</p></div><div className="variation-picker" role="group" aria-label="Hero-Varianten"><span>Ansicht</span>{(['A', 'B', 'C'] as const).map(v => <button key={v} onClick={() => setVariant(v)} className={variant === v ? 'active' : ''} aria-pressed={variant === v}>{v}<small>{v === 'A' ? 'Editorial' : v === 'B' ? 'Depth' : 'Minimal'}</small></button>)}</div><motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .12 }} variants={{ visible: { transition: { staggerChildren: .1 } } }} className="products-grid">{products.map((p, i) => <ProductCard key={p.name} product={p} index={i} />)}</motion.div></section>

    <section id="philosophie" className="philosophy section-wrap"><div><p className="eyebrow">Unsere Philosophie</p><blockquote className="font-display">„Gute Software drängt sich nicht auf. Sie schafft <em>Raum.</em>“</blockquote></div><div className="principles"><div><b>01</b><h3>Durchdacht</h3><p>Wir beginnen mit dem echten Problem — nicht mit der neuesten Technologie.</p></div><div><b>02</b><h3>Verlässlich</h3><p>Transparenz, Datenschutz und persönlicher Support sind keine Extras.</p></div><div><b>03</b><h3>Wesentlich</h3><p>Jede Funktion hat einen Zweck. Alles andere darf weg.</p></div></div></section>

    <section className="metrics section-wrap"><div><strong>5</strong><span>Produkte mit<br />einer Haltung</span></div><div><strong>100<span>%</span></strong><span>DSGVO-konform<br />entwickelt</span></div><div><strong>24<span>/7</span></strong><span>Ruhiger Überblick<br />wenn es zählt</span></div><div><strong>1</strong><span>persönlicher<br />Ansprechpartner</span></div></section>

    <section id="kontakt" className="final-cta section-wrap"><div><p className="eyebrow">Der nächste Schritt</p><h2 className="font-display">Lassen Sie uns über<br /><em>Ihre Idee sprechen.</em></h2></div><div><p>Kein Sales-Pitch. Ein ehrliches Gespräch darüber, was Software für Sie leichter machen kann.</p><a href="mailto:office@lavender-edition.de?subject=Gespräch%20vereinbaren" className="button">Gespräch vereinbaren <ArrowUpRight className="h-4 w-4" /></a></div></section>

    <footer className="site-footer section-wrap"><div className="footer-brand"><Link href="#top" className="brand"><span className="brand-mark">L</span><span>Lavender Edition <em>Systems</em></span></Link><p>Software für die Dinge,<br />die wirklich zählen.</p></div><div className="footer-col"><span>Produkte</span><a href="#produkte">Einfach-Termin</a><a href="#produkte">Handwerker-Dispatch</a><a href="#produkte">Pixo</a><a href="#produkte">AI Time Manager</a></div><div className="footer-col"><span>Unternehmen</span><a href="#philosophie">Philosophie</a><a href="mailto:office@lavender-edition.de">Kontakt</a><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link></div><div className="footer-note">© {new Date().getFullYear()} Lavender Edition Systems<br />Mit Sorgfalt aus Deutschland.</div></footer>
  </main>
}
