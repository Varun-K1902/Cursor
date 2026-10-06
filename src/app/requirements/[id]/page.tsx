"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { AcceptanceEditor } from "@/components/basis/acceptance"
import { CodeMark, PersonName, StatusPill, TraceList, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { qualityLabel, requirementKindLabel, requirementTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function RequirementPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { state } = useBasis()
  const requirement = state.requirements.find((item) => item.id === id)

  if (!requirement) {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl text-ink">This requirement is not in the record</h1>
        <Button asChild variant="outline">
          <Link href="/requirements">Back to requirements</Link>
        </Button>
      </div>
    )
  }

  const changes = state.changes.filter((change) => change.requirementId === requirement.id)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
      <div className="grid gap-8">
        <div>
          <Link href="/requirements" className="text-sm text-primary">
            All requirements
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypePill className={requirementTone(requirement.kind)}>
              {requirement.quality ? qualityLabel[requirement.quality] : requirementKindLabel[requirement.kind]}
            </TypePill>
            <StatusPill status={requirement.status} />
            <CodeMark>{requirement.code}</CodeMark>
            <span className="text-xs text-muted-foreground">v{requirement.version}</span>
          </div>
          <h1 className="mt-3 text-4xl leading-tight font-medium text-ink">{requirement.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed">{requirement.statement}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Owner <PersonName id={requirement.ownerId} />
          </p>
        </div>
        <AcceptanceEditor parentKind="requirement" parentId={requirement.id} />
        {changes.length > 0 ? (
          <section>
            <h2 className="text-2xl font-medium text-ink">Versions minted by change</h2>
            <div className="mt-3 grid gap-3">
              {changes.map((change) => (
                <article key={change.id} className="rounded-xl bg-card p-4 ring-1 ring-coral/40">
                  <p className="text-sm font-semibold text-coral-ink">
                    {change.code} · {change.fromVersion} → {change.toVersion}
                  </p>
                  <p className="mt-1 font-medium">{change.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{change.rationale}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <aside className="grid gap-6">
        <section>
          <h2 className="mb-3 text-lg font-medium text-ink">This comes from</h2>
          <TraceList id={requirement.id} direction="out" />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-medium text-ink">This carries forward</h2>
          <TraceList id={requirement.id} direction="in" />
        </section>
        <Button asChild variant="outline">
          <Link href={`/trace?focus=${requirement.id}`}>Open in the trace view</Link>
        </Button>
      </aside>
    </div>
  )
}
