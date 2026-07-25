import {
  Droplets,
  Flame,
  Zap,
  Wind,
  Wrench,
  PlugZap,
  ThermometerSnowflake,
  KeyRound,
  Sun,
  Sunset,
  type LucideIcon,
} from "lucide-react"

/**
 * Central place to resolve a backend-provided string key to a Lucide icon.
 * Add new keys here as new order/booking categories are introduced —
 * the backend should never need to know this mapping exists.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  sanitaer: Droplets,
  heizung: Flame,
  elektro: Zap,
  klima: Wind,
  schluessel: KeyRound,
}

export const orderIconMap: Record<string, LucideIcon> = {
  Sanitär: Droplets,
  Heizung: Flame,
  Elektro: Zap,
  Klima: Wind,
  Reparatur: Wrench,
}

export const timeWindowIconMap: Record<string, LucideIcon> = {
  morning: Sun,
  afternoon: Sunset,
}

export function resolveIcon(map: Record<string, LucideIcon>, key: string, fallback: LucideIcon = Wrench): LucideIcon {
  return map[key] ?? fallback
}
