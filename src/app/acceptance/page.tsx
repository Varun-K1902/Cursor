"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { nextStableCode } from "@/lib/re/ids"
import { useBasis } from "@/lib/store"

export default function AcceptancePage() {
  const { state, dispatch } = useBasis()
  const [title, setTitle] = useState("")
  const [requirementId, setRequirementId] = useState(state.requirements[0]?.id ?? "")
  const [steps, setSteps] = useState("")
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-medium">Acceptance and tests</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Acceptance criteria stay on the requirement. Test scenarios here are the BA’s conditions, not a test-management tool. Executing tests is out of scope.
      </p>
      <section className="grid gap-2">
        {state.criteria.length === 0 ? <p className="text-sm text-muted-foreground">No acceptance criteria yet. Add them on a requirement.</p> : null}
        {state.criteria.map((criterion) => (
          <article key={criterion.id} className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">{criterion.parentId}</p>
            <p>{criterion.text || `Given ${criterion.given}. When ${criterion.when}. Then ${criterion.then}.`}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-2">
        <h2 className="text-lg font-medium">Test scenarios</h2>
        {state.testScenarios.map((scenario) => (
          <article key={scenario.id} className="text-sm">
            {scenario.code} {scenario.title} · {scenario.requirementId}
            <p className="text-muted-foreground">{scenario.steps}</p>
          </article>
        ))}
        <form
          className="grid max-w-xl gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim() || !requirementId) return
            dispatch({
              type: "add-test",
              scenario: {
                id: `ts-${crypto.randomUUID().slice(0, 6)}`,
                code: nextStableCode(state.testScenarios.map((item) => item.code), "TS-"),
                title: title.trim(),
                requirementId,
                steps: steps.trim(),
              },
            })
            setTitle("")
            setSteps("")
          }}
        >
          <Input aria-label="Scenario title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Scenario title" />
          <select aria-label="Requirement" value={requirementId} onChange={(event) => setRequirementId(event.target.value)}>
            {state.requirements.map((requirement) => (
              <option key={requirement.id} value={requirement.id}>
                {requirement.code}
              </option>
            ))}
          </select>
          <Input aria-label="Steps" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="Steps" />
          <Button type="submit">Add scenario</Button>
        </form>
      </section>
    </div>
  )
}
