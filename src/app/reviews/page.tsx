"use client"

import { useState } from "react"

import { StatusPill } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { canApprove, canAuthor, canReview } from "@/lib/re/roles"
import { useBasis } from "@/lib/store"
import type { RequirementStatus } from "@/lib/types"

export default function ReviewsPage() {
  const { state, workspace, dispatch } = useBasis()
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const role = workspace.role

  function transition(id: string, status: RequirementStatus) {
    if (!note.trim()) {
      setMessage("Add a note so the transition is recorded with a reason.")
      return
    }
    dispatch({ type: "transition-requirement", id, status, note: note.trim() })
    setMessage(`Recorded ${status}.`)
    setNote("")
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-medium">Reviews and approvals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The role switcher in the header is a local simulation, not authentication. A developer or tester can read. A reviewer can request changes. An approver can approve.
        </p>
      </div>
      <label className="grid max-w-xl gap-1 text-sm">
        Note for the next transition
        <textarea className="min-h-20 rounded-md border border-input p-2" value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      <div className="grid gap-3">
        {state.requirements.map((requirement) => {
          const comments = state.comments.filter((comment) => comment.objectId === requirement.id)
          return (
            <article key={requirement.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{requirement.code}</span>
                <StatusPill status={requirement.status} />
              </div>
              <h2 className="mt-1 text-lg font-medium">{requirement.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {canAuthor(role) && requirement.status === "draft" ? (
                  <Button size="sm" onClick={() => transition(requirement.id, "in-review")}>
                    Submit for review
                  </Button>
                ) : null}
                {canReview(role) && requirement.status === "in-review" ? (
                  <Button size="sm" variant="outline" onClick={() => transition(requirement.id, "changes-requested")}>
                    Request changes
                  </Button>
                ) : null}
                {canApprove(role) && (requirement.status === "in-review" || requirement.status === "changes-requested") ? (
                  <Button size="sm" onClick={() => transition(requirement.id, "approved")}>
                    Approve
                  </Button>
                ) : null}
                {canAuthor(role) && requirement.status === "approved" ? (
                  <Button size="sm" variant="outline" onClick={() => transition(requirement.id, "deprecated")}>
                    Deprecate
                  </Button>
                ) : null}
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="mt-3 text-sm">
                  <p>{comment.body}</p>
                  {!comment.resolved && canReview(role) ? (
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => dispatch({ type: "resolve-comment", id: comment.id })}>
                      Resolve comment
                    </Button>
                  ) : null}
                </div>
              ))}
            </article>
          )
        })}
      </div>
      <section>
        <h2 className="text-lg font-medium">Approval history</h2>
        {state.reviews.length === 0 ? <p className="text-sm text-muted-foreground">No review decisions yet.</p> : null}
        {state.reviews.map((review) => (
          <p key={review.id} className="text-sm">
            {review.at} · {review.reviewerRole} · {review.decision} · {review.note}
          </p>
        ))}
      </section>
    </div>
  )
}
