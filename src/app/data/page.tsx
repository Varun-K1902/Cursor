"use client"

import { ObjectRef, PageHeader } from "@/components/basis/bits"
import { AddDataDialog } from "@/components/basis/dialogs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useBasis } from "@/lib/store"

export default function DataPage() {
  const { state } = useBasis()

  return (
    <div>
      <PageHeader
        kicker="Language"
        title="Data register"
        description="Dictionary rows. Data requirements point at these. The row is not itself a requirement."
        action={<AddDataDialog />}
      />
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Element</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Pointed at by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.dataElements.map((element) => {
              const owner = state.stakeholders.find((person) => person.id === element.ownerId)
              const usedBy = state.traces.filter((link) => link.relation === "uses" && link.toId === element.id)
              return (
                <TableRow key={element.id} id={element.id} className="scroll-mt-24">
                  <TableCell className="w-[16%] whitespace-normal align-top">
                    <p className="font-mono text-xs text-muted-foreground">{element.code}</p>
                    <p className="font-medium">{element.name}</p>
                    <p className="text-xs text-muted-foreground">{owner?.name}</p>
                  </TableCell>
                  <TableCell className="w-[28%] whitespace-normal align-top text-sm leading-relaxed">{element.description}</TableCell>
                  <TableCell className="w-[22%] whitespace-normal align-top text-sm leading-relaxed text-muted-foreground">{element.format}</TableCell>
                  <TableCell className="w-[34%] whitespace-normal align-top">
                    <div className="grid min-w-52 gap-2">
                      {usedBy.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No requirement points here yet.</span>
                      ) : (
                        usedBy.map((link) => <ObjectRef key={link.id} id={link.fromId} />)
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
