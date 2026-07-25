import type { Order, PriceBreakdown, Visit } from "@/types/props"

export type {
  DepositStatus,
  OrderTag,
  Order,
  PriceBreakdown,
  Visit,
  TechnicianStatus,
  Technician,
} from "@/types/props"

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

export const visitKindLabels: Record<Visit["kind"], string> = {
  installation: "Installation",
  reparatur: "Reparatur",
  wartung: "Wartung",
  notdienst: "Notdienst",
}
