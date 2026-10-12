"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { runAi } from "@/lib/re/reduce"
import { useBasis } from "@/lib/store"

const actions = [
  ["analyzeRequirement", "Improve clarity"],
  ["identifyAmbiguity", "Identify ambiguity"],
  ["suggestAcceptanceCriteria", "Suggest acceptance criteria"],
  ["findMissingQuestions", "Find missing questions"],
  ["detectPotentialDuplicates", "Check for duplicates"],
  ["detectPotentialConflicts", "Find potential conflicts"],
  ["proposeTraceability", "Identify dependencies"],
] as const

export function RequirementAssistant({ requirementId }: { requirementId: string }) {
  const { state, workspace, dispatch } = useBasis()
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const suggestions = state.suggestions.filter((item) => item.targetId === requirementId || item.operation === "detectPotentialDuplicates" || item.operation === "detectPotentialConflicts")
  const mine = suggestions.filter((item) => item.targetId === requirementId || item.title.includes(state.requirements.find((requirement) => requirement.id === requirementId)?.code ?? "___"))

  function run(operation: string) {
    const next = runAi(state, operation === "identifyAmbiguity" ? "analyzeRequirement" : operation, requirementId, workspace.role)
    const added = next.suggestions.filter((item) => !state.suggestions.some((existing) => existing.id === item.id))
    dispatch({ type: "add-suggestions", suggestions: added })
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">Suggestions stay unapproved until you accept them. The assistant is a local mock and will not invent a measure.</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(([operation, label]) => (
          <Button key={operation} size="sm" variant="outline" onClick={() => run(operation)}>
            {label}
          </Button>
        ))}
      </div>
      {mine.length === 0 ? <p className="text-sm text-muted-foreground">No suggestions for this requirement yet.</p> : null}
      {mine.map((suggestion) => (
        <article key={suggestion.id} className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{suggestion.kind} · {suggestion.status}</p>
          <p className="mt-1 font-medium">{suggestion.title}</p>
          <p className="mt-1 leading-relaxed">{suggestion.body}</p>
          {suggestion.proposedText ? <p className="mt-2 whitespace-pre-wrap">Proposed edit: {suggestion.proposedText}</p> : null}
          {suggestion.status === "pending" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => dispatch({ type: "suggestion-status", id: suggestion.id, status: "accepted" })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditId(suggestion.id)
                  setEditText(suggestion.proposedText)
                }}
              >
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => dispatch({ type: "suggestion-status", id: suggestion.id, status: "dismissed" })}>
                Dismiss
              </Button>
            </div>
          ) : null}
          {editId === suggestion.id ? (
            <div className="mt-2 grid gap-2">
              <textarea className="min-h-20 rounded-md border border-input bg-card p-2" value={editText} onChange={(event) => setEditText(event.target.value)} />
              <Button
                size="sm"
                onClick={() => {
                  dispatch({
                    type: "add-suggestions",
                    suggestions: [{ ...suggestion, id: `${suggestion.id}-edit`, proposedText: editText, kind: "proposed-edit", status: "pending", title: "Edited suggestion" }],
                  })
                  dispatch({ type: "suggestion-status", id: suggestion.id, status: "dismissed" })
                  setEditId(null)
                }}
              >
                Save edited suggestion
              </Button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
