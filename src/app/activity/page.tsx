"use client"

import { useBasis } from "@/lib/store"

export default function ActivityPage() {
  const { state } = useBasis()
  return (
    <div className="grid gap-3">
      <h1 className="text-3xl font-medium">Activity history</h1>
      {state.activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet. Creating, reviewing, and importing will show up here.</p> : null}
      <ol className="grid gap-2">
        {state.activity.map((event) => (
          <li key={event.id} className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10">
            <span className="text-muted-foreground">{event.at}</span> · {event.actorRole} · {event.message}
          </li>
        ))}
      </ol>
    </div>
  )
}
