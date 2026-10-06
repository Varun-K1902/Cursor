"use client"

import { useState } from "react"

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
