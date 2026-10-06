"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { PageHeader, TraceList, TypePill } from "@/components/basis/bits"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBasis } from "@/lib/store"

export function TraceView() {
  const { catalog } = useBasis()
  const params = useSearchParams()
  const router = useRouter()
  const focus = params.get("focus") ?? "fr-02"
  const item = catalog.find((entry) => entry.id === focus) ?? catalog.find((entry) => entry.id === "fr-02")
  const groups = [...new Set(catalog.map((entry) => entry.group))]

  return (
    <div>
      <PageHeader
        kicker="Control"
        title="Trace"
        description="Follow one object upstream and downstream. Derives from, constrained by, elaborates, and uses — as a path, not a grid of cells."
      />
      <div className="max-w-xl">
        <Select value={item?.id} onValueChange={(value) => router.replace(`/trace?focus=${value}`)}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Choose an object" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {catalog
                  .filter((entry) => entry.group === group)
                  .map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.code ? `${entry.code} · ` : ""}
                      {entry.title}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {item ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="mb-4 text-lg font-medium text-ink">Comes from</h2>
            <TraceList id={item.id} direction="out" />
          </section>
          <article className="rounded-2xl bg-ink px-5 py-6 text-sidebar-foreground lg:mt-10 lg:w-64">
            <TypePill className={item.tone}>{item.kindLabel}</TypePill>
            <p className="mt-4 font-mono text-xs text-sidebar-primary">{item.code}</p>
            <h2 className="mt-1 text-2xl leading-snug">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-sidebar-foreground/75">{item.summary}</p>
          </article>
          <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="mb-4 text-lg font-medium text-ink">Carries forward</h2>
            <TraceList id={item.id} direction="in" />
          </section>
        </div>
      ) : null}
    </div>
  )
}
