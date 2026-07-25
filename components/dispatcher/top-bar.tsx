import Image from "next/image"
import { Bell, Search, Plus, Settings } from "lucide-react"
import type { TopBarProps } from "@/types/props"

export function TopBar({
  currentUser,
  notificationCount = 0,
  onSearch,
  onCreateOrder,
  onOpenNotifications,
  onOpenSettings,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 py-2.5 text-sidebar-foreground">
      <div className="flex items-center gap-2.5">
        <Image
          src="/app-icon-192.png"
          alt="MeisterPlan"
          width={36}
          height={36}
          className="h-9 w-9 rounded-xl"
          priority
        />
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">MeisterPlan</p>
          <p className="text-[11px] text-sidebar-foreground/70">Leitstand · Disposition</p>
        </div>
      </div>

      <div className="hidden flex-1 items-center gap-2 md:flex md:max-w-md">
        <div className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-sidebar-foreground/60" aria-hidden="true" />
          <input
            type="search"
            placeholder="Aufträge, Kunden, Techniker suchen…"
            aria-label="Globale Suche"
            className="w-full bg-transparent text-white outline-none placeholder:text-sidebar-foreground/50"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCreateOrder}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Neuer Auftrag</span>
        </button>
        <button
          onClick={onOpenNotifications}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:text-white"
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onOpenSettings}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:text-white"
          aria-label="Einstellungen"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>
        <div
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-label={`Angemeldet als ${currentUser?.name ?? currentUser?.initials ?? "Disponent"}`}
        >
          {currentUser?.initials ?? "DP"}
        </div>
      </div>
    </header>
  )
}
