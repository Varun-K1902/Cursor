"use client"

import Link from "next/link"
import { useState } from "react"

import { CodeMark, PageHeader, StatusPill, TypePill } from "@/components/basis/bits"
import { AddRequirementDialog } from "@/components/basis/dialogs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { qualityLabel, requirementKindLabel, requirementTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"
import type { RequirementKind } from "@/lib/types"

const filters = ["all", "functional", "interface", "data", "quality", "constraint", "transition"] as const

export default function RequirementsPage() {
  const { state } = useBasis()
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const visible = state.requirements.filter((requirement) => filter === "all" || requirement.kind === filter)

  return (
    <div>
      <PageHeader
        kicker="Intent"
        title="Solution requirements"
        description="Functional, interface, data, quality, constraint, and transition. Quality follows the nine ISO/IEC 25010:2023 characteristics."
        action={<AddRequirementDialog />}
      />
      <Tabs value={filter} onValueChange={(value) => setFilter(value as (typeof filters)[number])}>
        <TabsList className="h-auto flex-wrap justify-start">
          {filters.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item === "all" ? "All" : requirementKindLabel[item as RequirementKind]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {visible.map((requirement) => (
          <Link key={requirement.id} href={`/requirements/${requirement.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <TypePill className={requirementTone(requirement.kind)}>
                    {requirement.quality ? qualityLabel[requirement.quality] : requirementKindLabel[requirement.kind]}
                  </TypePill>
                  <StatusPill status={requirement.status} />
                </div>
                <CardTitle className="text-xl">
                  <CodeMark>{requirement.code}</CodeMark> {requirement.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{requirement.statement}</p>
                <p className="mt-3 text-xs text-muted-foreground">Version {requirement.version}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
