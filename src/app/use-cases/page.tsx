"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { nextStableCode } from "@/lib/re/ids"
import { useBasis } from "@/lib/store"
import type { UseCase, UseCaseStep } from "@/lib/types"

export default function UseCasesPage() {
  const { state, dispatch } = useBasis()
  const [id, setId] = useState(state.useCases[0]?.id ?? "")
  const useCase = state.useCases.find((item) => item.id === id)
  const [notice, setNotice] = useState("")

  function save(next: UseCase) {
    dispatch({ type: "update-usecase", useCase: next })
    setNotice(next.status === "approved" ? "Saved as approved after review." : "Draft saved.")
  }

  function move(steps: UseCaseStep[], index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= steps.length) return steps
    const copy = [...steps]
    const [item] = copy.splice(index, 1)
    copy.splice(target, 0, item)
    return copy
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-medium">Use cases</h1>
          <p className="text-sm text-muted-foreground">A generated draft stays in review until you save it as approved.</p>
        </div>
        <Button
          onClick={() => {
            const created: UseCase = {
              id: `uc-${crypto.randomUUID().slice(0, 8)}`,
              code: nextStableCode(state.useCases.map((item) => item.code), "UC-"),
              name: "New use case",
              goal: "",
              primaryActor: "",
              supportingActors: "",
              trigger: "",
              preconditions: "",
              postconditions: "",
              mainFlow: [{ id: `s-${crypto.randomUUID().slice(0, 6)}`, text: "" }],
              alternativeFlows: [],
              exceptionFlows: [],
              ruleIds: [],
              requirementIds: [],
              acceptance: "",
              status: "draft",
            }
            dispatch({ type: "add-usecase", useCase: created })
            setId(created.id)
          }}
        >
          Add use case
        </Button>
      </div>
      {state.useCases.length === 0 ? <p className="text-sm text-muted-foreground">No use cases yet.</p> : null}
      <div className="flex flex-wrap gap-2">
        {state.useCases.map((item) => (
          <Button key={item.id} variant={item.id === id ? "default" : "outline"} onClick={() => setId(item.id)}>
            {item.code}
          </Button>
        ))}
      </div>
      {useCase ? (
        <div key={useCase.id} className="grid gap-3">
          <p className="text-xs uppercase text-muted-foreground">{useCase.status}</p>
          <Field label="Name" value={useCase.name} onBlur={(value) => save({ ...useCase, name: value })} />
          <Field label="Goal" value={useCase.goal} area onBlur={(value) => save({ ...useCase, goal: value })} />
          <Field label="Primary actor" value={useCase.primaryActor} onBlur={(value) => save({ ...useCase, primaryActor: value })} />
          <Field label="Supporting actors" value={useCase.supportingActors} onBlur={(value) => save({ ...useCase, supportingActors: value })} />
          <Field label="Trigger" value={useCase.trigger} onBlur={(value) => save({ ...useCase, trigger: value })} />
          <Field label="Preconditions" value={useCase.preconditions} area onBlur={(value) => save({ ...useCase, preconditions: value })} />
          <Field label="Postconditions" value={useCase.postconditions} area onBlur={(value) => save({ ...useCase, postconditions: value })} />
          <div className="grid gap-2">
            <p className="text-sm font-medium">Main flow</p>
            {useCase.mainFlow.map((step, index) => (
              <div key={step.id} className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-sm">{index + 1}.</span>
                <Input
                  aria-label={`Step ${index + 1}`}
                  defaultValue={step.text}
                  onBlur={(event) =>
                    save({
                      ...useCase,
                      mainFlow: useCase.mainFlow.map((item) => (item.id === step.id ? { ...item, text: event.target.value } : item)),
                    })
                  }
                />
                <Button size="sm" variant="outline" onClick={() => save({ ...useCase, mainFlow: move(useCase.mainFlow, index, -1) })}>
                  Up
                </Button>
                <Button size="sm" variant="outline" onClick={() => save({ ...useCase, mainFlow: move(useCase.mainFlow, index, 1) })}>
                  Down
                </Button>
                <Button size="sm" variant="outline" onClick={() => save({ ...useCase, mainFlow: useCase.mainFlow.filter((item) => item.id !== step.id) })}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => save({ ...useCase, mainFlow: [...useCase.mainFlow, { id: `s-${crypto.randomUUID().slice(0, 6)}`, text: "" }] })}
            >
              Add step
            </Button>
          </div>
          <Field label="Acceptance" value={useCase.acceptance} area onBlur={(value) => save({ ...useCase, acceptance: value })} />
          <Field
            label="Related requirement ids"
            value={useCase.requirementIds.join(", ")}
            onBlur={(value) => save({ ...useCase, requirementIds: value.split(",").map((item) => item.trim()).filter(Boolean) })}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const related = state.requirements.filter((item) => useCase.requirementIds.includes(item.id))
                const source = related.length > 0 ? related : state.requirements.slice(0, 2)
                const drafted: UseCase = {
                  ...useCase,
                  status: "draft",
                  goal: source.map((item) => item.title).join("; ") || useCase.goal,
                  mainFlow: source.map((item, index) => ({ id: `draft-${index}`, text: `Review: ${item.statement}` })),
                  acceptance: "Draft only. Confirm before approval. No business rule was invented.",
                }
                save(drafted)
                setNotice("Draft generated from the linked requirements. It is not approved.")
              }}
            >
              Generate draft from requirements
            </Button>
            <Button onClick={() => save({ ...useCase, status: "approved" })}>Save as approved</Button>
          </div>
          {notice ? <p className="text-sm text-primary">{notice}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, value, onBlur, area }: { label: string; value: string; onBlur: (value: string) => void; area?: boolean }) {
  const props = {
    "aria-label": label,
    defaultValue: value,
    onBlur: (event: { target: { value: string } }) => onBlur(event.target.value),
  }
  return (
    <label className="grid gap-1 text-sm">
      {label}
      {area ? <Textarea {...props} /> : <Input {...props} />}
    </label>
  )
}
