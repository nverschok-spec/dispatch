import type { ServiceCategory } from '@/lib/types';

// Mirrors lib/data/serviceCatalog.ts (medical specialties) for the Handwerk
// vertical. GEWERKE = trades a Betrieb can register as; HANDWERK_CATALOG maps
// each trade to its intake-wizard problem list (category -> symptom -> details).

export const GEWERKE = [
  'Sanitär & Heizung',
  'Elektrik',
  'Garten- und Landschaftsbau (GaLaBau)',
  'Maler',
  'Schlüsseldienst',
] as const;

export type Gewerk = typeof GEWERKE[number];

interface CatalogService {
  name: string;
  durationMin: number;
  category: ServiceCategory;
  icon: string;
  /** Shown with a NOTFALL badge in the intake wizard; skips arrival-window
   *  selection in favour of "so schnell wie möglich" + Notdienstaufschlag. */
  urgent?: boolean;
}

export const HANDWERK_CATALOG: Record<Gewerk, CatalogService[]> = {
  'Sanitär & Heizung': [
    { name: 'Wasserrohrbruch',        durationMin: 90,  category: 'Notdienst', icon: '🚨', urgent: true },
    { name: 'Tropfender Wasserhahn',  durationMin: 60,  category: 'Sanitaer',  icon: '🚰' },
    { name: 'Verstopfung (Abfluss)',  durationMin: 60,  category: 'Sanitaer',  icon: '🪠' },
    { name: 'Heizungsausfall',        durationMin: 90,  category: 'Notdienst', icon: '🔥', urgent: true },
    { name: 'Wartung / Inspektion',   durationMin: 120, category: 'Heizung',   icon: '🛠️' },
    { name: 'Neuinstallation Bad',    durationMin: 240, category: 'Sanitaer',  icon: '🛁' },
    { name: 'Therme defekt',          durationMin: 90,  category: 'Heizung',   icon: '♨️', urgent: true },
  ],
  'Elektrik': [
    { name: 'Stromausfall (Wohnung)', durationMin: 60,  category: 'Notdienst', icon: '⚡', urgent: true },
    { name: 'Sicherung fliegt raus',  durationMin: 45,  category: 'Elektrik',  icon: '🔌' },
    { name: 'Steckdose defekt',       durationMin: 45,  category: 'Elektrik',  icon: '🔧' },
    { name: 'Lichtinstallation',      durationMin: 90,  category: 'Elektrik',  icon: '💡' },
    { name: 'E-Check / Prüfung',      durationMin: 60,  category: 'Elektrik',  icon: '✅' },
    { name: 'Wallbox-Installation',   durationMin: 180, category: 'Elektrik',  icon: '🔋' },
  ],
  'Garten- und Landschaftsbau (GaLaBau)': [
    { name: 'Rasenpflege',            durationMin: 90,  category: 'GaLaBau',   icon: '🌱' },
    { name: 'Baumschnitt',            durationMin: 120, category: 'GaLaBau',   icon: '🌳' },
    { name: 'Heckenschnitt',          durationMin: 90,  category: 'GaLaBau',   icon: '🌿' },
    { name: 'Sturmschaden',           durationMin: 120, category: 'Notdienst', icon: '🌪️', urgent: true },
    { name: 'Terrassenbau (Beratung)', durationMin: 60, category: 'GaLaBau',   icon: '🪵' },
    { name: 'Bewässerungssystem',     durationMin: 120, category: 'GaLaBau',   icon: '💧' },
  ],
  'Maler': [
    { name: 'Innenanstrich (Beratung)', durationMin: 60, category: 'Sonstiges', icon: '🎨' },
    { name: 'Fassadenanstrich (Beratung)', durationMin: 60, category: 'Sonstiges', icon: '🏠' },
    { name: 'Tapezierarbeiten',       durationMin: 90,  category: 'Sonstiges', icon: '🖌️' },
    { name: 'Wasserschaden-Sanierung', durationMin: 120, category: 'Notdienst', icon: '💦', urgent: true },
  ],
  'Schlüsseldienst': [
    { name: 'Ausgesperrt (Wohnung)',  durationMin: 45,  category: 'Notdienst', icon: '🔑', urgent: true },
    { name: 'Schloss defekt',         durationMin: 60,  category: 'Sonstiges', icon: '🔒' },
    { name: 'Schlüssel nachmachen',   durationMin: 30,  category: 'Sonstiges', icon: '🗝️' },
    { name: 'Einbruchschaden',        durationMin: 90,  category: 'Notdienst', icon: '🚪', urgent: true },
  ],
};

// app/api/book-handwerk/route.ts stores AppointmentDoc.serviceId as the
// synthetic key `${gewerk}::${problemName}` (Handwerk practices don't
// necessarily have a populated `services` catalog). The Dispatcher Timeline
// (Phase 2) needs the duration/icon back out of that key to size/label blocks.
export function resolveHandwerkService(serviceId: string): CatalogService | null {
  const [gewerk, problemName] = serviceId.split('::');
  const catalog = HANDWERK_CATALOG[gewerk as Gewerk];
  if (!catalog) return null;
  return catalog.find(s => s.name === problemName) ?? null;
}
