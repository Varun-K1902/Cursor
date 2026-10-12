"use client"

import Link from "next/link"

import { CodeMark, PageHeader, StatusPill, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/labels"
import { activeTemplate } from "@/lib/re/templates"
import { useBasis } from "@/lib/store"

const unresolved = new Set(["open", "assigned", "awaiting"])

export default function OverviewPage() {
  const { state, hasProject } = useBasis()
  if (!hasProject) {
    return (
      <PageHeader
        kicker="Workspace"
        title="No project is open"
        description="Create a project or open the sample from Home."
      />
    )
  }
  const approved = state.baselines.find((baseline) => baseline.status === "approved")
  const proposed = state.baselines.find((baseline) => baseline.status === "proposed")
  const openQuestions = state.questions.filter((question) => unresolved.has(question.status))
  const inReview = state.requirements.find((requirement) => requirement.status === "in-review")
  const template = activeTemplate(state.initiative.templateIds, state.initiative.hiddenSectionIds)
  const impacts = state.impacts.filter((item) => item.status === "needs-review")

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker={state.initiative.sample ? "Sample project" : state.initiative.agency}
        title={state.initiative.name}
        description={state.initiative.problem}
        action={
          <Button asChild>
            <Link href="/discovery">Continue discovery</Link>
          </Button>
        }
      />
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {state.initiative.recommendationReason} Structure: {template.name}.{" "}
        <Link href="/projects/new?edit=1" className="text-primary">
          Edit the setup answers
        </Link>
        . Sample policies stay unconfirmed until someone records a decision.
      </p>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Unresolved questions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {openQuestions.length === 0 ? <p className="text-sm text-muted-foreground">No unresolved questions.</p> : null}
            {openQuestions.map((question) => (
              <Link key={question.id} href={`/questions#${question.id}`} className="text-sm leading-relaxed hover:text-primary">
                <CodeMark>{question.code}</CodeMark> {question.prompt}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Impact waiting</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {impacts.length === 0 ? <p className="text-sm text-muted-foreground">No open impact items.</p> : null}
            {impacts.map((item) => (
              <Link key={item.id} href="/trace" className="text-sm leading-relaxed hover:text-primary">
                {item.targetLabel}
              </Link>
            ))}
            {inReview ? (
              <Link href={`/requirements/${inReview.id}`} className="flex items-center gap-2 text-sm">
                <CodeMark>{inReview.code}</CodeMark>
                <StatusPill status={inReview.status} />
              </Link>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Working set</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{state.requirements.length} requirements</p>
            <p>{state.rules.length} business rules</p>
            <p>{state.useCases.length} use cases</p>
            <p>{state.entities.length} entities</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <TypePill className="bg-accent text-accent-foreground">{template.sections.length} sections</TypePill>
              {approved ? <TypePill className="bg-amber-reward/80 text-amber-ink">{approved.name}</TypePill> : null}
            </div>
            {approved ? (
              <p className="text-xs text-muted-foreground">
                Approved {approved.approvedOn ? formatDate(approved.approvedOn) : ""}
                {proposed ? ` ${proposed.name} is proposed and has not replaced it.` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No baseline has been approved yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
