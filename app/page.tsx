import { TopBar } from "@/components/dispatcher/top-bar"
import { UnassignedColumn } from "@/components/dispatcher/unassigned-column"
import { Timeline } from "@/components/dispatcher/timeline"
import { AnalyticsPanel } from "@/components/dispatcher/analytics-panel"

export default function DispatcherPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar />
      <main className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <div className="hidden min-h-0 lg:block">
          <UnassignedColumn />
        </div>
        <div className="min-h-0">
          <Timeline />
        </div>
        <div className="hidden min-h-0 xl:block">
          <AnalyticsPanel />
        </div>
      </main>
    </div>
  )
}
