"use client"

import { ObjectRef, PageHeader, PersonName, TypePill } from "@/components/basis/bits"
import { AddQuestionDialog, RecordDecisionDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/labels"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useBasis } from "@/lib/store"
import { useState } from "react"

export default function QuestionsPage() {
  const { state, dispatch } = useBasis()
  const [query, setQuery] = useState("")
  const matches = (text: string) => text.toLowerCase().includes(query.toLowerCase())
  const open = state.questions.filter((question) => question.status !== "answered" && question.status !== "resolved" && matches(question.prompt))
  const answered = state.questions.filter((question) => (question.status === "answered" || question.status === "resolved") && matches(question.prompt))

  return (
    <div>
      <PageHeader
        kicker="Control"
        title="Questions and decisions"
        description="An open question stays visible. A decision answers it and stays attached, so the baseline remembers why."
        action={<AddQuestionDialog />}
      />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, decisions, assumptions" aria-label="Search register" className="max-w-md" />
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="answered">Decided ({answered.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4 grid gap-3">
          {open.map((question) => (
            <Card key={question.id} id={question.id} className="scroll-mt-24">
              <CardHeader>
                <TypePill className="bg-[oklch(0.95_0.035_40)] text-[oklch(0.46_0.1_35)]">Question {question.code}</TypePill>
                <CardTitle className="text-xl">{question.prompt}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">Raised by <PersonName id={question.raisedById} /></p>
                {question.relatedId ? <ObjectRef id={question.relatedId} /> : null}
                <RecordDecisionDialog questionId={question.id} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="answered" className="mt-4 grid gap-3">
          {answered.map((question) => {
            const decision = state.decisions.find((item) => item.id === question.decisionId)
            return (
              <Card key={question.id} id={question.id} className="scroll-mt-24">
                <CardHeader>
                  <TypePill className="bg-amber-reward/80 text-amber-ink">Answered {question.code}</TypePill>
                  <CardTitle className="text-xl">{question.prompt}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {decision ? (
                    <article id={decision.id} className="rounded-xl bg-[oklch(0.97_0.03_85)] p-4">
                      <p className="text-xs font-semibold tracking-wide text-amber-ink uppercase">{decision.code} · {formatDate(decision.decidedOn)}</p>
                      <p className="mt-1 font-medium">{decision.title}</p>
                      <p className="mt-2 text-sm leading-relaxed">{decision.outcome}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Decided by <PersonName id={decision.decidedById} /></p>
                    </article>
                  ) : null}
                  {question.relatedId ? <ObjectRef id={question.relatedId} /> : null}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
      <section className="mt-8 grid gap-3">
        <h2 className="text-2xl font-medium">Assumptions</h2>
        {state.assumptions.filter((item) => matches(item.statement)).map((assumption) => (
          <Card key={assumption.id}>
            <CardHeader>
              <CardTitle className="text-xl">{assumption.code} {assumption.statement}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <p>{assumption.reason}</p>
              <p>If wrong: {assumption.consequence}</p>
              <p>Validation: {assumption.validation}</p>
              {assumption.validation === "unconfirmed" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dispatch({ type: "update-assumption", assumption: { ...assumption, validation: "validated" } })}
                >
                  Mark validated
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
        <AssumptionForm />
      </section>
      <section className="mt-8 grid gap-3">
        <h2 className="text-2xl font-medium">Decisions</h2>
        {state.decisions.filter((item) => matches(`${item.title} ${item.outcome}`)).map((decision) => (
          <article key={decision.id} className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <p className="font-medium">{decision.code} {decision.title}</p>
            <p>{decision.outcome}</p>
            <p className="text-muted-foreground">{decision.rationale}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

function AssumptionForm() {
  const { state, dispatch } = useBasis()
  const [statement, setStatement] = useState("")
  const [reason, setReason] = useState("")
  const [consequence, setConsequence] = useState("")
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!statement.trim()) return
        dispatch({
          type: "add-assumption",
          assumption: {
            id: `as-${crypto.randomUUID().slice(0, 6)}`,
            code: `AS-${String(state.assumptions.length + 1).padStart(2, "0")}`,
            statement: statement.trim(),
            reason: reason.trim(),
            ownerId: state.stakeholders[0]?.id ?? "",
            validation: "unconfirmed",
            consequence: consequence.trim(),
          },
        })
        setStatement("")
        setReason("")
        setConsequence("")
      }}
    >
      <Input aria-label="Assumption" value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Assumption" />
      <Input aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
      <Input aria-label="Consequence" value={consequence} onChange={(event) => setConsequence(event.target.value)} placeholder="Consequence if incorrect" />
      <Button type="submit" variant="outline">Add assumption</Button>
    </form>
  )
}
