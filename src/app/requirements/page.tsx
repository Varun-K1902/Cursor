"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { RequirementAssistant } from "@/components/requirements/assistant"
import { PageHeader, StatusPill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { statusLabel } from "@/lib/labels"
import { canAuthor } from "@/lib/re/roles"
import { useBasis } from "@/lib/store"
import type { Requirement, RequirementPriority, RequirementStatus } from "@/lib/types"

const columns = ["id", "title", "description", "type", "source", "priority", "status", "owner", "process", "updated"] as const
const priorities: RequirementPriority[] = ["must", "should", "could", "wont"]
const statuses: RequirementStatus[] = ["draft", "in-review", "changes-requested", "approved", "deprecated", "baselined", "changed"]

export default function RequirementsPage() {
  const { state, dispatch, hydrated, workspace } = useBasis()
  const author = canAuthor(workspace.role)
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")
  const [owner, setOwner] = useState("all")
  const [source, setSource] = useState("all")
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "asc" })
  const [visible, setVisible] = useState<string[]>([...columns])
  const [selected, setSelected] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const open = state.requirements.find((item) => item.id === openId) ?? null

  const filtered = useMemo(() => {
    const rows = state.requirements.filter((requirement) => {
      const haystack = `${requirement.code} ${requirement.title} ${requirement.statement}`.toLowerCase()
      if (query && !haystack.includes(query.toLowerCase())) return false
      if (type !== "all" && requirement.kind !== type) return false
      if (status !== "all" && requirement.status !== status) return false
      if (priority !== "all" && requirement.priority !== priority) return false
      if (owner !== "all" && requirement.ownerId !== owner) return false
      if (source !== "all" && requirement.source !== source) return false
      return true
    })
    const value = (requirement: Requirement) => {
      if (sort.key === "title") return requirement.title
      if (sort.key === "status") return requirement.status
      if (sort.key === "priority") return requirement.priority
      if (sort.key === "updated") return requirement.updatedAt
      return requirement.code
    }
    return [...rows].sort((a, b) => {
      const result = String(value(a)).localeCompare(String(value(b)))
      return sort.dir === "asc" ? result : -result
    })
  }, [state.requirements, query, type, status, priority, owner, source, sort])

  function toggleSort(key: string) {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "asc" ? "desc" : "asc" }))
  }

  function addRequirement() {
    const ownerId = state.stakeholders[0]?.id ?? "owner"
    const requirement = {
      id: `req-${crypto.randomUUID().slice(0, 8)}`,
      code: "",
      kind: "functional" as const,
      title: "New requirement",
      statement: "Describe the behavior.",
      status: "draft" as const,
      version: "0.1",
      ownerId,
      source: "BA",
      priority: "should" as const,
      rationale: "",
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    const withCode = {
      ...requirement,
      code: nextCode(state.requirements.map((item) => item.code)),
    }
    dispatch({ type: "add-requirement", requirement: withCode })
    setOpenId(withCode.id)
  }

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading the requirements…</p>

  return (
    <div className="grid gap-4">
      <PageHeader
        kicker="Requirements"
        title="Requirements grid"
        description="Stable ids stay put when you sort, filter, or edit. The assistant only changes text that you accept."
        action={
          author ? (
            <Button onClick={addRequirement}>Add requirement</Button>
          ) : (
            <p className="text-xs text-muted-foreground">This role can read the grid. Switch to Business analyst to edit.</p>
          )
        }
      />
      <div className="flex flex-wrap gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search id, title, description" aria-label="Search requirements" className="max-w-xs" />
        <Filter label="Type" value={type} onChange={setType} options={["all", ...new Set(state.requirements.map((item) => item.kind))]} />
        <Filter label="Status" value={status} onChange={setStatus} options={["all", ...statuses]} />
        <Filter label="Priority" value={priority} onChange={setPriority} options={["all", ...priorities]} />
        <Filter label="Owner" value={owner} onChange={setOwner} options={["all", ...state.stakeholders.map((person) => person.id)]} labels={Object.fromEntries(state.stakeholders.map((person) => [person.id, person.name]))} />
        <Filter label="Source" value={source} onChange={setSource} options={["all", ...new Set(state.requirements.map((item) => item.source))]} />
        <Button
          variant="outline"
          onClick={() => {
            setQuery("")
            setType("all")
            setStatus("all")
            setPriority("all")
            setOwner("all")
            setSource("all")
          }}
        >
          Clear filters
        </Button>
      </div>
      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground">Columns</summary>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {columns.map((column) => (
            <label key={column} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={visible.includes(column)}
                onChange={() => setVisible((current) => (current.includes(column) ? current.filter((item) => item !== column) : [...current, column]))}
              />
              {column}
            </label>
          ))}
        </div>
      </details>
      {author && selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{selected.length} selected</span>
          <select
            aria-label="Bulk status"
            className="rounded-md border border-input bg-card px-2 py-1"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return
              dispatch({ type: "bulk-status", ids: selected, status: event.target.value as RequirementStatus })
              event.target.value = ""
            }}
          >
            <option value="">Set status</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabel[item]}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requirements match. Clear the filters or add a requirement.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="p-2" />
                {visible.includes("id") ? <SortHead label="ID" onClick={() => toggleSort("id")} /> : null}
                {visible.includes("title") ? <SortHead label="Title" onClick={() => toggleSort("title")} /> : null}
                {visible.includes("description") ? <th className="p-2 font-medium">Description</th> : null}
                {visible.includes("type") ? <th className="p-2 font-medium">Type</th> : null}
                {visible.includes("source") ? <th className="p-2 font-medium">Source</th> : null}
                {visible.includes("priority") ? <SortHead label="Priority" onClick={() => toggleSort("priority")} /> : null}
                {visible.includes("status") ? <SortHead label="Status" onClick={() => toggleSort("status")} /> : null}
                {visible.includes("owner") ? <th className="p-2 font-medium">Owner</th> : null}
                {visible.includes("process") ? <th className="p-2 font-medium">Related process</th> : null}
                {visible.includes("updated") ? <SortHead label="Updated" onClick={() => toggleSort("updated")} /> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((requirement) => (
                <tr key={requirement.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${requirement.code}`}
                      checked={selected.includes(requirement.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(requirement.id) ? current.filter((id) => id !== requirement.id) : [...current, requirement.id]
                        )
                      }
                    />
                  </td>
                  {visible.includes("id") ? (
                    <td className="p-2 font-mono text-xs">
                      <button className="underline-offset-2 hover:underline" onClick={() => setOpenId(requirement.id)}>
                        {requirement.code}
                      </button>
                    </td>
                  ) : null}
                  {visible.includes("title") ? (
                    <td className="p-2">
                      {author ? (
                        <input
                          className="w-full bg-transparent outline-none focus:ring-1 focus:ring-ring"
                          defaultValue={requirement.title}
                          aria-label={`Title ${requirement.code}`}
                          onBlur={(event) => {
                            if (event.target.value !== requirement.title) {
                              dispatch({ type: "edit-requirement", id: requirement.id, patch: { title: event.target.value } })
                            }
                          }}
                        />
                      ) : (
                        requirement.title
                      )}
                    </td>
                  ) : null}
                  {visible.includes("description") ? <td className="max-w-xs truncate p-2 text-muted-foreground">{requirement.statement}</td> : null}
                  {visible.includes("type") ? <td className="p-2">{requirement.kind}</td> : null}
                  {visible.includes("source") ? <td className="p-2">{requirement.source}</td> : null}
                  {visible.includes("priority") ? (
                    <td className="p-2">
                      {author ? (
                        <select
                          aria-label={`Priority ${requirement.code}`}
                          className="bg-transparent"
                          value={requirement.priority}
                          onChange={(event) => dispatch({ type: "edit-requirement", id: requirement.id, patch: { priority: event.target.value as RequirementPriority } })}
                        >
                          {priorities.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        requirement.priority
                      )}
                    </td>
                  ) : null}
                  {visible.includes("status") ? (
                    <td className="p-2">
                      <StatusPill status={requirement.status} />
                    </td>
                  ) : null}
                  {visible.includes("owner") ? <td className="p-2">{state.stakeholders.find((person) => person.id === requirement.ownerId)?.name ?? "—"}</td> : null}
                  {visible.includes("process") ? <td className="p-2">{requirement.relatedProcessId ?? "—"}</td> : null}
                  {visible.includes("updated") ? <td className="p-2">{requirement.updatedAt}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={Boolean(open)} onOpenChange={(value) => !value && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {open.code} {open.title}
                </SheetTitle>
              </SheetHeader>
              <RequirementDetail
                requirement={open}
                author={author}
                onDelete={() => setConfirmDelete(true)}
              />
              {confirmDelete ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      dispatch({ type: "delete-requirement", id: open.id })
                      setConfirmDelete(false)
                      setOpenId(null)
                    }}
                  >
                    Confirm delete
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function nextCode(codes: string[]) {
  let max = 0
  for (const code of codes) {
    const value = Number.parseInt(code.replace(/\D/g, ""), 10)
    if (!Number.isNaN(value)) max = Math.max(max, value)
  }
  return `REQ-${String(max + 1).padStart(3, "0")}`
}

function Filter({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  labels?: Record<string, string>
}) {
  return (
    <select aria-label={label} className="rounded-md border border-input bg-card px-2 py-1 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option === "all" ? `All ${label.toLowerCase()}` : labels?.[option] ?? option}
        </option>
      ))}
    </select>
  )
}

function SortHead({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="p-2 font-medium">
      <button onClick={onClick}>{label}</button>
    </th>
  )
}

function RequirementDetail({ requirement, author, onDelete }: { requirement: Requirement; author: boolean; onDelete: () => void }) {
  const { state, dispatch } = useBasis()
  const [tab, setTab] = useState("statement")
  const comments = state.comments.filter((comment) => comment.objectId === requirement.id)
  const history = state.changes.filter((change) => change.requirementId === requirement.id)
  const [comment, setComment] = useState("")
  return (
    <div className="grid gap-3 px-4 pb-6 text-sm">
      <div className="flex flex-wrap gap-2">
        {["statement", "links", "comments", "history", "assistant"].map((item) => (
          <button key={item} className={tab === item ? "font-semibold text-primary" : "text-muted-foreground"} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "statement" ? (
        <div className="grid gap-2">
          <label className="grid gap-1">
            Description
            <textarea
              className="min-h-28 rounded-md border border-input p-2"
              defaultValue={requirement.statement}
              disabled={!author}
              onBlur={(event) => {
                if (event.target.value !== requirement.statement) dispatch({ type: "edit-requirement", id: requirement.id, patch: { statement: event.target.value } })
              }}
            />
          </label>
          <label className="grid gap-1">
            Rationale
            <textarea
              className="min-h-16 rounded-md border border-input p-2"
              defaultValue={requirement.rationale}
              disabled={!author}
              onBlur={(event) => dispatch({ type: "edit-requirement", id: requirement.id, patch: { rationale: event.target.value } })}
            />
          </label>
          <p>Source: {requirement.source}</p>
          <p>Version {requirement.version}</p>
          <Link href={`/requirements/${requirement.id}`} className="text-primary">
            Open the full page
          </Link>
          {author ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => dispatch({ type: "duplicate-requirement", id: requirement.id })}>
                Duplicate
              </Button>
              <Button variant="outline" onClick={onDelete}>
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {tab === "links" ? (
        <div className="grid gap-1">
          {state.traces
            .filter((link) => link.fromId === requirement.id || link.toId === requirement.id)
            .map((link) => (
              <p key={link.id}>
                {link.relation}: {link.fromId} → {link.toId}
              </p>
            ))}
          {state.criteria
            .filter((item) => item.parentId === requirement.id)
            .map((item) => (
              <p key={item.id}>Acceptance: {item.text || `${item.given ?? ""} / ${item.when ?? ""} / ${item.then ?? ""}`}</p>
            ))}
        </div>
      ) : null}
      {tab === "comments" ? (
        <div className="grid gap-2">
          {comments.length === 0 ? <p className="text-muted-foreground">No comments yet.</p> : null}
          {comments.map((item) => (
            <article key={item.id} className="rounded-md bg-muted p-2">
              <p>{item.body}</p>
              <p className="text-xs text-muted-foreground">
                {item.authorRole} · {item.createdAt} {item.resolved ? "· resolved" : ""}
              </p>
            </article>
          ))}
          <textarea className="min-h-16 rounded-md border border-input p-2" value={comment} onChange={(event) => setComment(event.target.value)} aria-label="Comment" />
          <Button
            variant="outline"
            disabled={!comment.trim()}
            onClick={() => {
              dispatch({
                type: "add-comment",
                comment: {
                  id: `c-${crypto.randomUUID().slice(0, 8)}`,
                  objectId: requirement.id,
                  authorRole: "ba",
                  body: comment.trim(),
                  createdAt: new Date().toISOString().slice(0, 10),
                  resolved: false,
                },
              })
              setComment("")
            }}
          >
            Add comment
          </Button>
        </div>
      ) : null}
      {tab === "history" ? (
        <div className="grid gap-2">
          {history.length === 0 ? <p className="text-muted-foreground">No recorded statement changes yet.</p> : null}
          {history.map((change) => (
            <article key={change.id}>
              <p className="font-medium">
                {change.code} {change.fromVersion} → {change.toVersion}
              </p>
              <p>{change.fromStatement}</p>
              <p>{change.toStatement}</p>
            </article>
          ))}
        </div>
      ) : null}
      {tab === "assistant" ? <RequirementAssistant requirementId={requirement.id} /> : null}
    </div>
  )
}
