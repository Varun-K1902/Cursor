"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBasis } from "@/lib/store"

export default function UiNotesPage() {
  const { state, dispatch } = useBasis()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [requirementId, setRequirementId] = useState(state.requirements[0]?.id ?? "")
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-medium">UI notes</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Record the interface behavior a requirement needs. A high-fidelity visual prototype is unavailable.
      </p>
      {state.uiComponents.length === 0 ? <p className="text-sm text-muted-foreground">No UI notes yet.</p> : null}
      {state.uiComponents.map((component) => (
        <article key={component.id} className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
          <h2 className="font-medium">{component.name}</h2>
          <p>{component.description}</p>
          <p className="text-muted-foreground">{component.requirementIds.join(", ")}</p>
        </article>
      ))}
      <form
        className="grid max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          dispatch({
            type: "add-ui",
            component: {
              id: `ui-${crypto.randomUUID().slice(0, 6)}`,
              name: name.trim(),
              description: description.trim(),
              requirementIds: requirementId ? [requirementId] : [],
            },
          })
          setName("")
          setDescription("")
        }}
      >
        <Input aria-label="UI note name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        <Input aria-label="UI note description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Behavior" />
        <select aria-label="Linked requirement" value={requirementId} onChange={(event) => setRequirementId(event.target.value)}>
          {state.requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>
              {requirement.code} {requirement.title}
            </option>
          ))}
        </select>
        <Button type="submit">Add UI note</Button>
      </form>
    </div>
  )
}
