"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"

import { AcceptanceEditor } from "@/components/basis/acceptance"
import { TraceList, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { flowKindLabel, flowTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function FlowPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { state, dispatch } = useBasis()
  const flow = state.flows.find((item) => item.id === id)
  const [actor, setActor] = useState("")
  const [action, setAction] = useState("")

  if (!flow) {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl text-ink">This flow is not in the record</h1>
        <Button asChild variant="outline">
          <Link href="/flows">Back to flows</Link>
        </Button>
      </div>
    )
  }

  function addStep() {
    if (!flow || !actor.trim() || !action.trim()) return
    dispatch({
      type: "add-step",
      flowId: flow.id,
      step: {
        id: `step-${crypto.randomUUID().slice(0, 8)}`,
        actor: actor.trim(),
        action: action.trim(),
      },
    })
    setActor("")
    setAction("")
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
      <div className="grid gap-8">
        <div>
          <Link href="/flows" className="text-sm text-primary">All flows</Link>
          <div className="mt-3">
            <TypePill className={flowTone(flow.kind)}>{flowKindLabel[flow.kind]}</TypePill>
          </div>
          <h1 className="mt-3 text-4xl font-medium text-ink">{flow.title}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{flow.intent}</p>
        </div>
        <ol className="grid gap-0">
          {flow.steps.map((step, index) => (
            <li key={step.id} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <div className="flex flex-col items-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                {index < flow.steps.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
              </div>
              <div className="pb-6">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">{step.actor}</p>
                <p className="mt-1 leading-relaxed">{step.action}</p>
                {step.note ? <p className="mt-1 text-sm text-muted-foreground">{step.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-lg font-medium text-ink">Add a step</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="actor">Actor</Label>
              <Input id="actor" value={actor} onChange={(event) => setActor(event.target.value)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="action">What happens</Label>
              <Input id="action" value={action} onChange={(event) => setAction(event.target.value)} />
            </div>
          </div>
          <Button className="mt-3" onClick={addStep}>Add step</Button>
        </div>
        <AcceptanceEditor parentKind="flow" parentId={flow.id} />
      </div>
      <aside>
        <h2 className="mb-3 text-lg font-medium text-ink">Linked objects</h2>
        <TraceList id={flow.id} direction="out" />
      </aside>
    </div>
  )
}
