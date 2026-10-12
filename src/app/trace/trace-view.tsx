"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"

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
  const { catalog, state } = useBasis()
  const params = useSearchParams()
  const router = useRouter()
  const fallback = state.requirements[0]?.id ?? ""
  const focus = params.get("focus") ?? fallback
  const item = catalog.find((entry) => entry.id === focus) ?? catalog.find((entry) => entry.id === fallback)
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
      <Coverage />
    </div>
  )
}

function Coverage() {
  const { state, dispatch } = useBasis()
  const orphans = state.requirements.filter(
    (requirement) =>
      !state.traces.some((link) => link.fromId === requirement.id || link.toId === requirement.id) &&
      !state.useCases.some((useCase) => useCase.requirementIds.includes(requirement.id))
  )
  return (
    <section className="mt-10 grid gap-4">
      <h2 className="text-2xl font-medium">Relationships and impact</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="p-2">From</th>
              <th className="p-2">Relation</th>
              <th className="p-2">To</th>
            </tr>
          </thead>
          <tbody>
            {state.traces.map((link) => (
              <tr key={link.id} className="border-t">
                <td className="p-2">
                  <Link href={hrefFor(state, link.fromId)}>{link.fromId}</Link>
                </td>
                <td className="p-2">{link.relation}</td>
                <td className="p-2">
                  <Link href={hrefFor(state, link.toId)}>{link.toId}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="font-medium">Requirements with no trace link</h3>
        {orphans.length === 0 ? <p className="text-sm text-muted-foreground">Every requirement has a trace link or a use case.</p> : null}
        {orphans.map((requirement) => (
          <p key={requirement.id} className="text-sm">
            <Link href={`/requirements/${requirement.id}`}>{requirement.code} {requirement.title}</Link>
          </p>
        ))}
      </div>
      <div className="grid gap-2">
        <h3 className="font-medium">Change impact</h3>
        <p className="text-sm text-muted-foreground">Downstream items are flagged. Approved text is not overwritten.</p>
        {state.impacts.length === 0 ? <p className="text-sm text-muted-foreground">No impact items.</p> : null}
        {state.impacts.map((item) => (
          <article key={item.id} className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
            <p className="font-medium">{item.targetLabel}</p>
            <p>{item.reason}</p>
            <p className="text-xs text-muted-foreground">{item.status}</p>
            {item.status === "needs-review" ? (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => dispatch({ type: "impact-status", id: item.id, status: "reviewed" })}>
                  Mark reviewed
                </Button>
                <Button size="sm" asChild variant="outline">
                  <Link href={hrefFor(state, item.targetId)}>Open</Link>
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function hrefFor(state: ReturnType<typeof useBasis>["state"], id: string) {
  if (state.requirements.some((item) => item.id === id)) return `/requirements/${id}`
  if (state.rules.some((item) => item.id === id)) return `/rules#${id}`
  if (state.useCases.some((item) => item.id === id)) return "/use-cases"
  if (state.questions.some((item) => item.id === id)) return `/questions#${id}`
  return "/trace"
}
