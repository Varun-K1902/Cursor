"use client"

import Link from "next/link"

import { CodeMark, PageHeader, TypePill } from "@/components/basis/bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { flowKindLabel, flowTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function FlowsPage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="Behavior"
        title="Flows"
        description="Journeys, the process as it is, the process as it should be, and the use-case path through them. Steps, not a diagram engine."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {state.flows.map((flow) => (
          <Link key={flow.id} href={`/flows/${flow.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <TypePill className={flowTone(flow.kind)}>{flowKindLabel[flow.kind]}</TypePill>
                <CardTitle className="text-2xl">
                  <CodeMark>{flow.code}</CodeMark> {flow.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{flow.intent}</p>
                <p className="mt-3 text-xs text-muted-foreground">{flow.steps.length} steps</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
