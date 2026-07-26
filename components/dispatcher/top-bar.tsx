"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Bell, Search, Plus, Settings, LogOut, Inbox } from "lucide-react"
import type { TopBarProps } from "@/types/props"

export function TopBar({
  currentUser,
  notificationCount = 0,
  notifications = [],
  onSearch,
  onCreateOrder,
  onSelectNotification,
  onOpenSettings,
  onLogout,
}: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

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

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false) }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:text-white"
            aria-label="Benachrichtigungen"
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" aria-hidden="true" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
              <div className="border-b border-border px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Neu eingegangen{notificationCount > 0 ? ` (${notificationCount})` : ""}
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                  <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">Keine neuen Anfragen</p>
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => { onSelectNotification?.(n.id); setNotifOpen(false) }}
                        className="flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/60"
                      >
                        <span className="text-sm font-medium text-popover-foreground">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{n.subtitle} · {n.time}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:text-white"
          aria-label="Einstellungen"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false) }}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
            aria-label={`Angemeldet als ${currentUser?.name ?? currentUser?.initials ?? "Disponent"}`}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {currentUser?.initials ?? "DP"}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
              <div className="border-b border-border px-3.5 py-2.5">
                <p className="truncate text-sm font-semibold text-popover-foreground">{currentUser?.name ?? "Disponent"}</p>
                {currentUser?.email && <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>}
              </div>
              <button
                onClick={() => { setMenuOpen(false); onLogout?.() }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
