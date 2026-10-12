"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { ObjectRef, PageHeader, TypePill } from "@/components/basis/bits"
import { AddRuleDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ruleKindLabel, ruleTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"
import type { RuleKind } from "@/lib/types"

export default function RulesPage() {
  const { state } = useBasis()
  const [kind, setKind] = useState<RuleKind>("operative")
  const visible = state.rules.filter((rule) => rule.kind === kind)

  return (
    <div>
      <PageHeader
        kicker="Language"
        title="Business rules"
        description="Definitional rules fix what a word means. Operative rules constrain what a requirement is allowed to do."
        action={<AddRuleDialog />}
      />
      <Tabs value={kind} onValueChange={(value) => setKind(value as RuleKind)}>
        <TabsList>
          <TabsTrigger value="definitional">Definitional</TabsTrigger>
          <TabsTrigger value="operative">Operative</TabsTrigger>
        </TabsList>
      </Tabs>
      <ConditionBuilder />
      <div className="mt-5 grid gap-3">
        {visible.map((rule) => {
          const constrains = state.traces.filter(
            (link) => link.relation === "constrained-by" && link.toId === rule.id
          )
          const uses = state.traces.filter((link) => link.relation === "uses" && link.fromId === rule.id)
          return (
            <Card key={rule.id} id={rule.id} className="scroll-mt-24">
              <CardHeader>
                <TypePill className={ruleTone(rule.kind)}>{ruleKindLabel[rule.kind]} {rule.code}</TypePill>
                <CardTitle className="text-2xl">{rule.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="max-w-3xl leading-relaxed">{rule.statement}</p>
                {rule.clauses.length > 0 ? (
                  <p className="text-sm">
                    IF {rule.clauses.map((clause) => `${clause.join ? `${clause.join} ` : ""}${clause.left} ${clause.operator} ${clause.right}`).join(" ")} THEN {rule.result}
                    {rule.status === "unconfirmed" ? " This rule is unconfirmed." : ""}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">Source: {rule.source}</p>
                {uses.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {uses.map((link) => (
                      <ObjectRef key={link.id} id={link.toId} />
                    ))}
                  </div>
                ) : null}
                {constrains.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Constrains</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {constrains.map((link) => (
                        <ObjectRef key={link.id} id={link.fromId} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ConditionBuilder() {
  const { state, dispatch } = useBasis()
  const [left, setLeft] = useState("leave balance")
  const [operator, setOperator] = useState("is")
  const [right, setRight] = useState("sufficient")
  const [result, setResult] = useState("permit submission")
  return (
    <form
      className="mt-4 grid gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10"
      onSubmit={(event) => {
        event.preventDefault()
        const code = `BR-${String(state.rules.length + 1).padStart(2, "0")}`
        dispatch({
          type: "add-rule",
          rule: {
            id: `br-${crypto.randomUUID().slice(0, 6)}`,
            code,
            kind: "operative",
            title: `${left} ${operator} ${right}`,
            statement: `IF ${left} ${operator} ${right}, THEN ${result}. Unconfirmed until a decision records it.`,
            source: "Entered by the BA. Not a confirmed policy.",
            clauses: [{ left, operator, right }],
            result,
            exceptions: "",
            ownerId: state.stakeholders[0]?.id ?? "",
            status: "unconfirmed",
            effectiveDate: "",
            requirementIds: [],
          },
        })
      }}
    >
      <p className="font-medium">Condition builder</p>
      <p className="text-muted-foreground">The leave example in the sample is illustrative and unconfirmed. This form does not apply a real HR policy.</p>
      <div className="flex flex-wrap gap-2">
        <Input aria-label="Condition subject" value={left} onChange={(event) => setLeft(event.target.value)} />
        <Input aria-label="Operator" value={operator} onChange={(event) => setOperator(event.target.value)} />
        <Input aria-label="Condition value" value={right} onChange={(event) => setRight(event.target.value)} />
        <Input aria-label="Result" value={result} onChange={(event) => setResult(event.target.value)} />
        <Button type="submit">Add unconfirmed rule</Button>
      </div>
    </form>
  )
}
