"use client"

import { PageHeader } from "@/components/basis/bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { raciMeaning } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { useBasis } from "@/lib/store"

const letterTone: Record<string, string> = {
  R: "bg-[oklch(0.93_0.04_275)] text-[oklch(0.36_0.08_275)]",
  A: "bg-amber-reward/80 text-amber-ink",
  C: "bg-accent text-accent-foreground",
  I: "bg-muted text-muted-foreground",
}

export default function RolesPage() {
  const { state } = useBasis()
  const columns = state.roles.filter((role) =>
    state.raci.some((row) => row.assignments.some((assignment) => assignment.roleId === role.id))
  )

  return (
    <div>
      <PageHeader
        kicker="People"
        title="Roles and RACI"
        description="Roles are stable. People change. The matrix says who does the work, who owns it, and who must be heard."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {state.roles.map((role) => {
          const person = state.stakeholders.find((item) => item.id === role.stakeholderId)
          return (
            <Card key={role.id} id={role.id} className="scroll-mt-24">
              <CardHeader>
                <CardTitle>{role.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 text-sm leading-relaxed">
                <p>{role.mission}</p>
                <p className="text-muted-foreground">Held by {person?.name ?? "unassigned"}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-medium text-ink">RACI for this baseline</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Responsible does the work. Accountable owns the outcome. Consulted shapes it. Informed needs to know.
        </p>
        <ScrollArea className="mt-4 rounded-2xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 min-w-56 bg-card">Activity</TableHead>
                {columns.map((role) => (
                  <TableHead key={role.id} className="min-w-28 text-center">
                    {role.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.raci.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="sticky left-0 z-10 bg-card whitespace-normal">
                    <p className="font-medium">{row.activity}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.note}</p>
                  </TableCell>
                  {columns.map((role) => {
                    const letter = row.assignments.find((item) => item.roleId === role.id)?.letter
                    return (
                      <TableCell key={role.id} className="text-center">
                        {letter ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold", letterTone[letter])}>
                                {letter}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{raciMeaning[letter]}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    </div>
  )
}
