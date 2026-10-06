"use client"

import { useMemo, useState } from "react"

import { PageHeader, StatusPill, TypePill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, requirementKindLabel, requirementTone } from "@/lib/labels"
import { useBasis } from "@/lib/store"

export default function BaselinePage() {
  const { state, dispatch } = useBasis()
  const approved = state.baselines.find((baseline) => baseline.status === "approved")
  const [requirementId, setRequirementId] = useState(approved?.snapshots[0]?.requirementId ?? "")
  const selected = state.requirements.find((item) => item.id === requirementId)
  const [title, setTitle] = useState("")
  const [rationale, setRationale] = useState("")
  const [statement, setStatement] = useState(selected?.statement ?? "")
  const [minted, setMinted] = useState<string | null>(null)

  const ordered = useMemo(
    () => [...state.baselines].sort((a, b) => a.name.localeCompare(b.name)),
    [state.baselines]
  )

  function choose(id: string) {
    setRequirementId(id)
    const next = state.requirements.find((item) => item.id === id)
    setStatement(next?.statement ?? "")
    setMinted(null)
  }

  function mint() {
    if (!requirementId || !title.trim() || !rationale.trim() || !statement.trim()) return
    if (selected && statement.trim() === selected.statement) return
    dispatch({
      type: "mint-change",
      requirementId,
      title: title.trim(),
      rationale: rationale.trim(),
      statement: statement.trim(),
    })
    setMinted(title.trim())
    setTitle("")
    setRationale("")
  }

  return (
    <div>
      <PageHeader
        kicker="Control"
        title="Review and baseline"
        description="A baseline has a name. A change does not overwrite it. The change mints a new version and a new proposed baseline."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {ordered.map((baseline) => (
          <Card
            key={baseline.id}
            id={baseline.id}
            className={
              baseline.status === "approved"
                ? "scroll-mt-24 bg-[oklch(0.97_0.03_85)]"
                : baseline.status === "proposed"
                  ? "scroll-mt-24 ring-coral/50"
                  : "scroll-mt-24"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <TypePill
                  className={
                    baseline.status === "approved"
                      ? "bg-amber-reward text-amber-ink"
                      : baseline.status === "proposed"
                        ? "bg-coral/80 text-coral-ink"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {baseline.status}
                </TypePill>
                <span className="text-xs text-muted-foreground">{baseline.snapshots.length} requirement versions</span>
              </div>
              <CardTitle className="text-3xl">{baseline.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-sm leading-relaxed">{baseline.note}</p>
              {baseline.approvedOn ? (
                <p className="text-sm text-amber-ink">
                  Approved {formatDate(baseline.approvedOn)}
                  {baseline.approverId ? " by Helen Cho" : ""}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-medium text-ink">Inside {approved?.name}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          These are the versions that were approved. Later edits live on a proposed baseline until someone accepts them.
        </p>
        <div className="mt-4 grid gap-2">
          {approved?.snapshots.map((snapshot) => (
            <article key={snapshot.requirementId} className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <TypePill className={requirementTone(snapshot.kind)}>{requirementKindLabel[snapshot.kind]}</TypePill>
                <p className="mt-2 text-sm font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{snapshot.code}</span>
                  {snapshot.title}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">v{snapshot.version}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-medium text-ink">Changes</h2>
        <div className="mt-4 grid gap-3">
          {state.changes.map((change) => {
            const from = state.baselines.find((item) => item.id === change.fromBaselineId)
            const to = state.baselines.find((item) => item.id === change.toBaselineId)
            const requirement = state.requirements.find((item) => item.id === change.requirementId)
            return (
              <article key={change.id} id={change.id} className="scroll-mt-24 rounded-2xl bg-card p-4 ring-1 ring-coral/40">
                <div className="flex flex-wrap items-center gap-2">
                  <TypePill className="bg-coral/80 text-coral-ink">{change.code}</TypePill>
                  <span className="text-xs text-muted-foreground">{formatDate(change.createdOn)}</span>
                  {requirement ? <StatusPill status={requirement.status} /> : null}
                </div>
                <h3 className="mt-2 text-xl font-medium text-ink">{change.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{change.rationale}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {requirement?.code} moved from v{change.fromVersion} on {from?.name} to v{change.toVersion} on {to?.name}.
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="text-2xl font-medium text-ink">Mint a new version</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Edit the statement. Basis keeps the approved baseline and creates the next proposed one.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <Label>Requirement</Label>
            <Select value={requirementId} onValueChange={choose}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.requirements.map((requirement) => (
                  <SelectItem key={requirement.id} value={requirement.id}>
                    {requirement.code} · v{requirement.version} · {requirement.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="change-title">Change title</Label>
            <Input id="change-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="change-why">Why this change</Label>
            <Textarea id="change-why" value={rationale} onChange={(event) => setRationale(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="change-statement">New statement</Label>
            <Textarea id="change-statement" value={statement} onChange={(event) => setStatement(event.target.value)} />
          </div>
          <Button onClick={mint}>Mint version</Button>
          {minted ? (
            <p className="text-sm text-coral-ink">
              {minted} minted a new version. The approved baseline is still {approved?.name}.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
