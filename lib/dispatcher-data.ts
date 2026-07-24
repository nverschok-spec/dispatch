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
