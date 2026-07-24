import type { LucideIcon } from "lucide-react"
import { Droplets, Flame, Zap, Wind, Wrench, PlugZap, ThermometerSnowflake } from "lucide-react"

export type DepositStatus = "paid" | "pending" | "none"
export type OrderTag = "new" | "notdienst" | "wartung"

export interface Order {
  id: string
  title: string
  category: string
  icon: LucideIcon
  street: string
  plz: string
  city: string
  receivedAt: string
  tags: OrderTag[]
  deposit: DepositStatus
  estMinutes: number
  contactName: string
  phone: string
  description: string
  accessNote: string
  photos: string[]
  laborHours: number
  hourlyRate: number
  travelCost: number
  materialCost: number
}

export interface PriceBreakdown {
  labor: number
  travel: number
  material: number
  net: number
  vat: number
  gross: number
  deductibleBase: number // labor + travel (§35a eligible)
  deductible: number // 20% of eligible, capped
}

// §35a EStG: 20% of labor + travel/machine costs (not materials) are deductible,
// capped at 1.200 € per year.
export function getPriceBreakdown(order: Order): PriceBreakdown {
  const labor = order.laborHours * order.hourlyRate
  const travel = order.travelCost
  const material = order.materialCost
  const net = labor + travel + material
  const vat = net * 0.19
  const gross = net + vat
  const deductibleBase = (labor + travel) * 1.19 // gross labor portion
  const deductible = Math.min(deductibleBase * 0.2, 1200)
  return { labor, travel, material, net, vat, gross, deductibleBase, deductible }
}

export interface Visit {
  id: string
  title: string
  street: string
  city: string
  start: number // hour, e.g. 9.5 = 09:30
  end: number
  kind: "installation" | "reparatur" | "wartung" | "notdienst"
}

export interface Technician {
  id: string
  name: string
  role: "Meister" | "Geselle" | "Azubi"
  initials: string
  color: string
  status: "unterwegs" | "vor-ort" | "pause" | "verfügbar"
  vehicle: string
  visits: Visit[]
}

export const unassignedOrders: Order[] = [
  {
    id: "A-4821",
    title: "Tropfender Wasserhahn",
    category: "Sanitär",
    icon: Droplets,
    street: "Kastanienallee 12",
    plz: "10435",
    city: "Berlin",
    receivedAt: "vor 6 Min.",
    tags: ["new", "notdienst"],
    deposit: "pending",
    estMinutes: 60,
    contactName: "Familie Krüger",
    phone: "+49 170 2841923",
    description:
      "Der Wasserhahn in der Küche tropft seit gestern durchgehend, auch wenn er fest zugedreht ist. Unter dem Becken sammelt sich Wasser.",
    accessNote: "3. OG links, Klingel Krüger. Aufzug vorhanden. Hund im Haushalt (freundlich).",
    photos: ["/fault-faucet.png", "/fault-pipe.png"],
    laborHours: 1,
    hourlyRate: 89,
    travelCost: 35,
    materialCost: 24.5,
  },
  {
    id: "A-4820",
    title: "Heizung fällt aus",
    category: "Heizung",
    icon: Flame,
    street: "Bergmannstraße 88",
    plz: "10961",
    city: "Berlin",
    receivedAt: "vor 14 Min.",
    tags: ["notdienst"],
    deposit: "paid",
    estMinutes: 120,
    contactName: "Herr Baumann",
    phone: "+49 151 55029183",
    description:
      "Die Gastherme läuft nicht mehr an, Fehlercode E4 im Display. Keine Warmwasser- und Heizungsversorgung in der Wohnung.",
    accessNote: "EG, Hinterhaus. Heizungsraum im Keller, Schlüssel beim Nachbarn (Wohnung 2).",
    photos: ["/fault-pipe.png", "/fault-faucet.png"],
    laborHours: 2,
    hourlyRate: 95,
    travelCost: 35,
    materialCost: 148,
  },
  {
    id: "A-4818",
    title: "Kurzschluss Verteilerkasten",
    category: "Elektro",
    icon: Zap,
    street: "Sonnenallee 204",
    plz: "12059",
    city: "Berlin",
    receivedAt: "vor 28 Min.",
    tags: ["new"],
    deposit: "none",
    estMinutes: 90,
    contactName: "Frau Yılmaz",
    phone: "+49 176 33810274",
    description:
      "Nach einem lauten Knall ist im halben Haus der Strom ausgefallen. Der Sicherungsautomat lässt sich nicht wieder einschalten.",
    accessNote: "2. OG rechts. Verteilerkasten im Flur neben der Wohnungstür.",
    photos: ["/fault-pipe.png"],
    laborHours: 1.5,
    hourlyRate: 92,
    travelCost: 35,
    materialCost: 61,
  },
  {
    id: "A-4815",
    title: "Lüftung wartung Jahresservice",
    category: "Klima",
    icon: Wind,
    street: "Prenzlauer Allee 45",
    plz: "10405",
    city: "Berlin",
    receivedAt: "vor 42 Min.",
    tags: ["wartung"],
    deposit: "paid",
    estMinutes: 75,
    contactName: "Hausverwaltung Nord",
    phone: "+49 30 44029100",
    description:
      "Jährlicher Wartungsservice der Lüftungsanlage im Treppenhaus gemäß Wartungsvertrag. Filterwechsel inklusive.",
    accessNote: "Technikraum Dach, Zugang über Treppenhaus B. Hausmeister vor Ort ab 08:00 Uhr.",
    photos: ["/fault-faucet.png"],
    laborHours: 1.25,
    hourlyRate: 85,
    travelCost: 35,
    materialCost: 42,
  },
  {
    id: "A-4811",
    title: "Verstopfter Abfluss Küche",
    category: "Sanitär",
    icon: Wrench,
    street: "Torstraße 130",
    plz: "10119",
    city: "Berlin",
    receivedAt: "vor 1 Std.",
    tags: ["new"],
    deposit: "pending",
    estMinutes: 45,
    contactName: "Herr Novak",
    phone: "+49 152 09183746",
    description:
      "Der Abfluss in der Küchenspüle ist komplett verstopft, Wasser läuft nicht mehr ab. Handelsübliche Mittel haben nicht geholfen.",
    accessNote: "4. OG, kein Aufzug. Klingel Novak.",
    photos: ["/fault-faucet.png", "/fault-pipe.png"],
    laborHours: 0.75,
    hourlyRate: 89,
    travelCost: 35,
    materialCost: 12,
  },
  {
    id: "A-4809",
    title: "Steckdose ohne Strom",
    category: "Elektro",
    icon: PlugZap,
    street: "Warschauer Str. 7",
    plz: "10243",
    city: "Berlin",
    receivedAt: "vor 1 Std.",
    tags: ["new"],
    deposit: "none",
    estMinutes: 45,
    contactName: "Frau Peters",
    phone: "+49 173 88201947",
    description:
      "Zwei Steckdosen im Wohnzimmer liefern keinen Strom mehr. Die anderen Räume funktionieren normal.",
    accessNote: "1. OG, Klingel Peters. Parkplatz im Hof verfügbar.",
    photos: ["/fault-pipe.png"],
    laborHours: 0.75,
    hourlyRate: 92,
    travelCost: 35,
    materialCost: 18,
  },
  {
    id: "A-4805",
    title: "Klimaanlage kühlt nicht",
    category: "Klima",
    icon: ThermometerSnowflake,
    street: "Frankfurter Allee 110",
    plz: "10247",
    city: "Berlin",
    receivedAt: "vor 2 Std.",
    tags: ["wartung"],
    deposit: "paid",
    estMinutes: 90,
    contactName: "Café Sonnenschein",
    phone: "+49 30 29018475",
    description:
      "Die Klimaanlage im Gastraum kühlt seit Tagen nicht mehr richtig. Bitte um Prüfung von Kältemittel und Kompressor.",
    accessNote: "Ladenlokal EG, Öffnungszeiten ab 09:00 Uhr. Ansprechpartner: Inhaber vor Ort.",
    photos: ["/fault-faucet.png", "/fault-pipe.png"],
    laborHours: 1.5,
    hourlyRate: 95,
    travelCost: 35,
    materialCost: 96,
  },
]

export const technicians: Technician[] = [
  {
    id: "t1",
    name: "M. Weber",
    role: "Meister",
    initials: "MW",
    color: "var(--chart-1)",
    status: "vor-ort",
    vehicle: "B-HW 1024",
    visits: [
      { id: "v1", title: "Heizungswartung", street: "Choriner Str. 21", city: "Berlin", start: 8, end: 9.5, kind: "wartung" },
      { id: "v2", title: "Rohrbruch Bad", street: "Danziger Str. 60", city: "Berlin", start: 10, end: 12, kind: "notdienst" },
      { id: "v3", title: "Boiler Installation", street: "Greifswalder Str. 4", city: "Berlin", start: 13.5, end: 16, kind: "installation" },
    ],
  },
  {
    id: "t2",
    name: "J. Wagner",
    role: "Geselle",
    initials: "JW",
    color: "var(--chart-2)",
    status: "unterwegs",
    vehicle: "B-HW 2048",
    visits: [
      { id: "v4", title: "Steckdosen prüfen", street: "Kollwitzstr. 9", city: "Berlin", start: 8.5, end: 10 , kind: "reparatur" },
      { id: "v5", title: "Sicherungskasten", street: "Marienburger Str. 32", city: "Berlin", start: 11, end: 13, kind: "installation" },
      { id: "v6", title: "Notruf Kurzschluss", street: "Prenzlauer Allee 8", city: "Berlin", start: 14, end: 15, kind: "notdienst" },
    ],
  },
  {
    id: "t3",
    name: "S. Fischer",
    role: "Geselle",
    initials: "SF",
    color: "var(--chart-3)",
    status: "verfügbar",
    vehicle: "B-HW 3072",
    visits: [
      { id: "v7", title: "Abfluss reinigen", street: "Schönhauser Allee 118", city: "Berlin", start: 9, end: 10.5, kind: "reparatur" },
      { id: "v8", title: "Armatur tauschen", street: "Stargarder Str. 5", city: "Berlin", start: 12.5, end: 14, kind: "reparatur" },
    ],
  },
  {
    id: "t4",
    name: "A. Schulz",
    role: "Azubi",
    initials: "AS",
    color: "var(--chart-4)",
    status: "pause",
    vehicle: "B-HW 4096",
    visits: [
      { id: "v9", title: "Filterwechsel Klima", street: "Rykestr. 14", city: "Berlin", start: 8, end: 9, kind: "wartung" },
      { id: "v10", title: "Begleitung Wartung", street: "Husemannstr. 2", city: "Berlin", start: 10.5, end: 12.5, kind: "wartung" },
      { id: "v11", title: "Materiallager", street: "Zentrale", city: "Berlin", start: 15, end: 16.5, kind: "installation" },
    ],
  },
]

export const DAY_START = 8
export const DAY_END = 17

export const visitKindLabels: Record<Visit["kind"], string> = {
  installation: "Installation",
  reparatur: "Reparatur",
  wartung: "Wartung",
  notdienst: "Notdienst",
}
