import { Suspense } from "react"

import { TraceView } from "@/app/trace/trace-view"

export default function TracePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Opening the trace…</p>}>
      <TraceView />
    </Suspense>
  )
}
