"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBasis } from "@/lib/store"
import type { ProcessModel, ProcessNode, ProcessNodeType } from "@/lib/types"

const types: ProcessNodeType[] = ["start", "end", "activity", "decision", "input-output", "approval", "system", "exception"]

export default function ProcessesPage() {
  const { state, dispatch } = useBasis()
  const [modelId, setModelId] = useState(state.processModels[0]?.id ?? "")
  const model = state.processModels.find((item) => item.id === modelId)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [notice, setNotice] = useState("")

  function save(next: ProcessModel) {
    dispatch({ type: "save-process", model: next })
    setNotice("Process saved.")
  }

  function updateNode(id: string, patch: Partial<ProcessNode>) {
    if (!model) return
    save({ ...model, nodes: model.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)) })
  }

  if (!model) {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl font-medium">Processes</h1>
        <p className="text-sm text-muted-foreground">No process yet.</p>
        <Button
          onClick={() => {
            const created: ProcessModel = {
              id: `pm-${crypto.randomUUID().slice(0, 8)}`,
              name: "New process",
              example: false,
              nodes: [{ id: `n-${crypto.randomUUID().slice(0, 6)}`, type: "start", label: "Start", x: 40, y: 40, linkedIds: [] }],
              edges: [],
            }
            dispatch({ type: "save-process", model: created })
            setModelId(created.id)
          }}
        >
          Create a process
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-medium">Processes</h1>
          <p className="text-sm text-muted-foreground">
            {model.example ? "Sample diagram. The policy it shows is unconfirmed. You can edit it." : "Editable process."} Drag a node, or connect two nodes.
          </p>
        </div>
        <select className="rounded-md border border-input bg-card px-2 py-1 text-sm" value={model.id} aria-label="Process" onChange={(event) => setModelId(event.target.value)}>
          {state.processModels.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            onClick={() =>
              save({
                ...model,
                nodes: [
                  ...model.nodes,
                  { id: `n-${crypto.randomUUID().slice(0, 6)}`, type, label: type, x: 80 + model.nodes.length * 16, y: 80, linkedIds: [] },
                ],
              })
            }
          >
            Add {type}
          </Button>
        ))}
      </div>
      <div
        className="relative h-[28rem] overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
        onPointerMove={(event) => {
          if (!drag) return
          const bounds = event.currentTarget.getBoundingClientRect()
          updateNode(drag.id, { x: event.clientX - bounds.left - drag.dx, y: event.clientY - bounds.top - drag.dy })
        }}
        onPointerUp={() => setDrag(null)}
      >
        <svg className="absolute inset-0 h-full w-full">
          {model.edges.map((edge) => {
            const from = model.nodes.find((node) => node.id === edge.from)
            const to = model.nodes.find((node) => node.id === edge.to)
            if (!from || !to) return null
            return (
              <g key={edge.id}>
                <line x1={from.x + 60} y1={from.y + 20} x2={to.x} y2={to.y + 20} stroke="currentColor" strokeWidth="1.5" />
                {edge.label ? <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2} className="fill-current text-[10px]">{edge.label}</text> : null}
              </g>
            )
          })}
        </svg>
        {model.nodes.map((node) => (
          <button
            key={node.id}
            className="absolute w-36 rounded-md border border-border bg-background px-2 py-1 text-left text-xs shadow-sm"
            style={{ left: node.x, top: node.y }}
            onPointerDown={(event) => {
              const bounds = (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
              setDrag({ id: node.id, dx: event.clientX - bounds.left - node.x, dy: event.clientY - bounds.top - node.y })
            }}
            onClick={() => {
              if (connectFrom && connectFrom !== node.id) {
                save({ ...model, edges: [...model.edges, { id: `e-${crypto.randomUUID().slice(0, 6)}`, from: connectFrom, to: node.id }] })
                setConnectFrom(null)
              }
            }}
          >
            <span className="block text-[10px] uppercase text-muted-foreground">{node.type}</span>
            {node.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {model.nodes.map((node) => (
          <div key={node.id} className="grid gap-2 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
            <Input aria-label={`Label ${node.id}`} defaultValue={node.label} onBlur={(event) => updateNode(node.id, { label: event.target.value })} />
            <Input
              aria-label={`Links ${node.id}`}
              defaultValue={node.linkedIds.join(", ")}
              placeholder="Linked requirement or rule ids"
              onBlur={(event) => updateNode(node.id, { linkedIds: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConnectFrom(node.id)}>
                {connectFrom === node.id ? "Choose the target node" : "Connect from here"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => save({ ...model, nodes: model.nodes.filter((item) => item.id !== node.id), edges: model.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id) })}
              >
                Delete node
              </Button>
            </div>
          </div>
        ))}
      </div>
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
    </div>
  )
}
