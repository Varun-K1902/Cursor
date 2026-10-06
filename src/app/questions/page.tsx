"use client"

import { ObjectRef, PageHeader, PersonName, TypePill } from "@/components/basis/bits"
import { AddQuestionDialog, RecordDecisionDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function QuestionsPage() {
  const { state } = useBasis()
  const open = state.questions.filter((question) => question.status === "open")
  const answered = state.questions.filter((question) => question.status === "answered")

  return (
    <div>
      <PageHeader
        kicker="Control"
        title="Questions and decisions"
        description="An open question stays visible. A decision answers it and stays attached, so the baseline remembers why."
        action={<AddQuestionDialog />}
      />
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
    </div>
  )
}
