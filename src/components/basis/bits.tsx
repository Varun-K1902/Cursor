"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { relationIncoming, relationLabel, statusLabel } from "@/lib/labels"
import { useBasis } from "@/lib/store"
import type { RequirementStatus, TraceRelation } from "@/lib/types"

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-primary uppercase">
          {kicker}
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-medium tracking-tight text-ink">{title}</h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function TypePill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide",
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusPill({ status }: { status: RequirementStatus }) {
  const styles: Record<RequirementStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    "in-review": "bg-accent text-accent-foreground",
    "changes-requested": "bg-coral/80 text-coral-ink",
    approved: "bg-[oklch(0.93_0.04_155)] text-[oklch(0.34_0.07_155)]",
    deprecated: "bg-muted text-muted-foreground line-through",
    baselined: "bg-amber-reward/80 text-amber-ink",
    changed: "bg-coral/80 text-coral-ink",
  }
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", styles[status])}>{statusLabel[status]}</span>
}

export function ObjectRef({ id }: { id: string }) {
  const { catalogById } = useBasis()
  const item = catalogById.get(id)
  if (!item) return null
  return (
    <Link
      href={item.href}
      className="group flex items-start gap-3 rounded-xl bg-card px-3 py-2.5 ring-1 ring-foreground/10 transition-shadow hover:shadow-sm"
    >
      <TypePill className={cn("mt-0.5 shrink-0", item.tone)}>{item.kindLabel}</TypePill>
      <span className="min-w-0">
        <span className="block text-sm leading-snug font-medium break-words text-ink group-hover:text-primary">
          {item.code ? <span className="mr-1.5 font-mono text-xs text-muted-foreground">{item.code}</span> : null}
          {item.title}
        </span>
      </span>
    </Link>
  )
}

export function TraceList({
  id,
  direction,
}: {
  id: string
  direction: "out" | "in"
}) {
  const { state } = useBasis()
  const links = state.traces.filter((link) => (direction === "out" ? link.fromId === id : link.toId === id))
  if (links.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing linked this way yet.</p>
  }
  const grouped = new Map<TraceRelation, string[]>()
  for (const link of links) {
    const target = direction === "out" ? link.toId : link.fromId
    grouped.set(link.relation, [...(grouped.get(link.relation) ?? []), target])
  }
  return (
    <div className="grid gap-4">
      {[...grouped.entries()].map(([relation, ids]) => (
        <div key={relation}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {direction === "out" ? relationLabel[relation] : relationIncoming[relation]}
          </p>
          <div className="grid gap-2">
            {ids.map((target) => (
              <ObjectRef key={`${relation}-${target}`} id={target} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PersonName({ id }: { id: string }) {
  const { state } = useBasis()
  const person = state.stakeholders.find((item) => item.id === id)
  return <span>{person?.name ?? "Unassigned"}</span>
}

export function CodeMark({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs tracking-wide text-muted-foreground">{children}</span>
}

export function QuietBadge({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="border-border bg-card text-muted-foreground">
      {children}
    </Badge>
  )
}
