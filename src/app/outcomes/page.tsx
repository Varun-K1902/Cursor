"use client"

import { ObjectRef, PageHeader, TypePill } from "@/components/basis/bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBasis } from "@/lib/store"

export default function OutcomesPage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="Intent"
        title="Outcomes and needs"
        description="Outcomes say what changes in the world. Needs say what a stakeholder must be able to rely on. Requirements derive from both."
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="grid gap-3">
          <h2 className="text-2xl font-medium text-ink">Business outcomes</h2>
          {state.outcomes.map((outcome) => {
            const owner = state.stakeholders.find((person) => person.id === outcome.ownerId)
            const derived = state.traces.filter((link) => link.relation === "derives-from" && link.toId === outcome.id)
            return (
              <Card key={outcome.id} id={outcome.id} className="scroll-mt-24">
                <CardHeader>
                  <TypePill className="bg-[oklch(0.93_0.04_275)] text-[oklch(0.36_0.08_275)]">Outcome {outcome.code}</TypePill>
                  <CardTitle className="text-2xl">{outcome.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="leading-relaxed">{outcome.statement}</p>
                  <p className="text-sm text-muted-foreground">Measure: {outcome.measure}</p>
                  <p className="text-sm text-muted-foreground">Owner: {owner?.name}</p>
                  {derived.length > 0 ? (
                    <div className="grid gap-2">
                      {derived.map((link) => (
                        <ObjectRef key={link.id} id={link.fromId} />
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </section>
        <section className="grid gap-3">
          <h2 className="text-2xl font-medium text-ink">Stakeholder needs</h2>
          {state.needs.map((need) => {
            const person = state.stakeholders.find((item) => item.id === need.stakeholderId)
            const derived = state.traces.filter((link) => link.relation === "derives-from" && link.toId === need.id)
            return (
              <Card key={need.id} id={need.id} className="scroll-mt-24">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <TypePill className="bg-[oklch(0.93_0.035_230)] text-[oklch(0.36_0.07_240)]">Need {need.code}</TypePill>
                    <span className="text-xs font-medium text-muted-foreground uppercase">{need.priority}</span>
                  </div>
                  <CardTitle className="text-xl leading-snug">{need.statement}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm text-muted-foreground">Spoken for by {person?.name}</p>
                  {derived.length > 0 ? (
                    <div className="grid gap-2">
                      {derived.map((link) => (
                        <ObjectRef key={link.id} id={link.fromId} />
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </section>
      </div>
    </div>
  )
}
