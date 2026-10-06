"use client"

import Link from "next/link"

import { CodeMark, PageHeader, StatusPill, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function HomePage() {
  const { state } = useBasis()
  const approved = state.baselines.find((baseline) => baseline.status === "approved")
  const proposed = state.baselines.find((baseline) => baseline.status === "proposed")
  const openQuestions = state.questions.filter((question) => question.status === "open")
  const inReview = state.requirements.find((requirement) => requirement.status === "in-review")
  const authors = state.stakeholders.filter((person) => person.kind === "author")

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker={state.initiative.agency}
        title={state.initiative.shortName}
        description={state.initiative.problem}
        action={
          <Button asChild>
            <Link href="/requirements/fr-02">Continue with FR-02</Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How this record is held</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-[0.98rem] leading-relaxed">
            <p>{state.initiative.approach}</p>
            <p>
              First authors: {authors.map((person) => `${person.name}, ${person.roleTitle}`).join(" and ")}.
              Other SDLC roles read the same baseline.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Word", "PDF", "Excel"].map((view) => (
                <span key={view} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground line-through decoration-foreground/30">
                  {view} as the record
                </span>
              ))}
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                Structured objects are the record
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[oklch(0.96_0.03_82)]">
          <CardHeader>
            <CardTitle className="text-2xl">Named baseline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="font-heading text-3xl text-amber-ink">{approved?.name}</p>
            <p className="text-sm leading-relaxed text-amber-ink/80">
              Approved {approved?.approvedOn ? formatDate(approved.approvedOn) : ""} by Helen Cho.
              {proposed ? ` ${proposed.name} is proposed and has not replaced it.` : ""}
            </p>
            <Button asChild variant="outline">
              <Link href="/baseline">Review the baseline</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open questions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {openQuestions.map((question) => (
              <Link key={question.id} href={`/questions#${question.id}`} className="text-sm leading-relaxed hover:text-primary">
                <CodeMark>{question.code}</CodeMark> {question.prompt}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Still in review</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {inReview ? (
              <Link href={`/requirements/${inReview.id}`} className="grid gap-2">
                <span className="flex items-center gap-2">
                  <CodeMark>{inReview.code}</CodeMark>
                  <StatusPill status={inReview.status} />
                </span>
                <span className="text-sm leading-relaxed">{inReview.title}</span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing is waiting in review.</p>
            )}
            <p className="text-sm text-muted-foreground">
              Quality uses the nine ISO/IEC 25010:2023 characteristics, including interaction capability and safety.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Working set</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <TypePill className="bg-[oklch(0.93_0.04_275)] text-[oklch(0.36_0.08_275)]">{state.requirements.length} requirements</TypePill>
            <TypePill className="bg-[oklch(0.94_0.04_130)] text-[oklch(0.36_0.06_140)]">{state.glossary.length} terms</TypePill>
            <TypePill className="bg-[oklch(0.93_0.04_155)] text-[oklch(0.34_0.07_155)]">{state.dataElements.length} data rows</TypePill>
            <TypePill className="bg-[oklch(0.95_0.05_85)] text-[oklch(0.42_0.09_68)]">{state.rules.length} rules</TypePill>
            <TypePill className="bg-[oklch(0.93_0.035_196)] text-[oklch(0.34_0.07_200)]">{state.flows.length} flows</TypePill>
            <TypePill className="bg-[oklch(0.93_0.035_230)] text-[oklch(0.36_0.07_240)]">{state.stories.length} stories</TypePill>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
