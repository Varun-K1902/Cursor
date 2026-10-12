"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBasis } from "@/lib/store"
import type { DataEntity, EntityField, EntityFieldType, EntityRelation } from "@/lib/types"

const fieldTypes: EntityFieldType[] = ["text", "integer", "decimal", "boolean", "date", "datetime", "email", "url", "json", "file", "enum"]

export default function DataModelPage() {
  const { state, dispatch } = useBasis()
  const [id, setId] = useState(state.entities[0]?.id ?? "")
  const entity = state.entities.find((item) => item.id === id)
  const [notice, setNotice] = useState("")

  function save(next: DataEntity) {
    dispatch({ type: "update-entity", entity: next })
    setNotice("Entity saved. This is metadata, not a database.")
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-medium">Data model</h1>
          <p className="text-sm text-muted-foreground">Entities and fields for the BA. Nothing here creates a production schema.</p>
        </div>
        <Button
          onClick={() => {
            const created: DataEntity = {
              id: `ent-${crypto.randomUUID().slice(0, 6)}`,
              name: "New entity",
              description: "",
              fields: [{ id: `fld-${crypto.randomUUID().slice(0, 6)}`, name: "id", type: "text", required: true, primaryKey: true, unique: true, description: "", defaultValue: "", enumValues: [], foreignKeyEntityId: "" }],
              requirementIds: [],
              ruleIds: [],
            }
            dispatch({ type: "add-entity", entity: created })
            setId(created.id)
          }}
        >
          Add entity
        </Button>
      </div>
      {state.entities.length === 0 ? <p className="text-sm text-muted-foreground">No entities yet.</p> : null}
      <div className="overflow-x-auto rounded-xl bg-muted/40 p-4">
        <svg className="h-56 min-w-[40rem]">
          {state.entityRelations.map((relation) => {
            const from = state.entities.findIndex((item) => item.id === relation.fromId)
            const to = state.entities.findIndex((item) => item.id === relation.toId)
            if (from < 0 || to < 0) return null
            return <line key={relation.id} x1={40 + from * 160} y1={40} x2={40 + to * 160} y2={140} stroke="currentColor" />
          })}
          {state.entities.map((item, index) => (
            <g key={item.id} onClick={() => setId(item.id)} className="cursor-pointer">
              <rect x={index * 160} y={20} width="140" height="48" rx="8" className="fill-card stroke-current" />
              <text x={index * 160 + 12} y={48} className="fill-current text-xs">
                {item.name}
              </text>
            </g>
          ))}
        </svg>
        <ul className="text-xs text-muted-foreground">
          {state.entityRelations.map((relation) => (
            <li key={relation.id}>
              {relation.fromId} {relation.kind} {relation.toId} ({relation.label})
            </li>
          ))}
        </ul>
      </div>
      <RelationshipForm
        entities={state.entities}
        onAdd={(relation) => {
          dispatch({ type: "add-relation", relation })
          setNotice("Relationship saved.")
        }}
      />
      {entity ? (
        <div key={entity.id} className="grid gap-3">
          <Input aria-label="Entity name" defaultValue={entity.name} onBlur={(event) => save({ ...entity, name: event.target.value })} />
          <Input aria-label="Entity description" defaultValue={entity.description} onBlur={(event) => save({ ...entity, description: event.target.value })} />
          <Input
            aria-label="Related requirements"
            defaultValue={entity.requirementIds.join(", ")}
            onBlur={(event) => save({ ...entity, requirementIds: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
          />
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
                <th>Key</th>
                <th>Unique</th>
              </tr>
            </thead>
            <tbody>
              {entity.fields.map((field) => (
                <tr key={field.id}>
                  <td>
                    <Input aria-label={`Field ${field.name}`} defaultValue={field.name} onBlur={(event) => save(patchField(entity, field.id, { name: event.target.value }))} />
                  </td>
                  <td>
                    <select
                      aria-label={`Type ${field.name}`}
                      value={field.type}
                      onChange={(event) => save(patchField(entity, field.id, { type: event.target.value as EntityFieldType }))}
                    >
                      {fieldTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="checkbox" checked={field.required} aria-label={`Required ${field.name}`} onChange={(event) => save(patchField(entity, field.id, { required: event.target.checked }))} />
                  </td>
                  <td>
                    <input type="checkbox" checked={field.primaryKey} aria-label={`Primary key ${field.name}`} onChange={(event) => save(patchField(entity, field.id, { primaryKey: event.target.checked }))} />
                  </td>
                  <td>
                    <input type="checkbox" checked={field.unique} aria-label={`Unique ${field.name}`} onChange={(event) => save(patchField(entity, field.id, { unique: event.target.checked }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            variant="outline"
            onClick={() =>
              save({
                ...entity,
                fields: [
                  ...entity.fields,
                  { id: `fld-${crypto.randomUUID().slice(0, 6)}`, name: "field", type: "text", required: false, primaryKey: false, unique: false, description: "", defaultValue: "", enumValues: [], foreignKeyEntityId: "" },
                ],
              })
            }
          >
            Add field
          </Button>
        </div>
      ) : null}
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
    </div>
  )
}

function patchField(entity: DataEntity, fieldId: string, patch: Partial<EntityField>): DataEntity {
  return { ...entity, fields: entity.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)) }
}

function RelationshipForm({ entities, onAdd }: { entities: DataEntity[]; onAdd: (relation: EntityRelation) => void }) {
  const [fromId, setFromId] = useState(entities[0]?.id ?? "")
  const [toId, setToId] = useState(entities[1]?.id ?? entities[0]?.id ?? "")
  const [kind, setKind] = useState<EntityRelation["kind"]>("one-to-many")
  const [label, setLabel] = useState("")
  if (entities.length < 2) return null
  return (
    <form
      className="flex flex-wrap items-end gap-2 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onAdd({ id: `rel-${crypto.randomUUID().slice(0, 6)}`, fromId, toId, kind, label: label || kind })
        setLabel("")
      }}
    >
      <select aria-label="From entity" value={fromId} onChange={(event) => setFromId(event.target.value)}>
        {entities.map((entity) => (
          <option key={entity.id} value={entity.id}>
            {entity.name}
          </option>
        ))}
      </select>
      <select aria-label="Relationship" value={kind} onChange={(event) => setKind(event.target.value as EntityRelation["kind"])}>
        <option value="one-to-one">one-to-one</option>
        <option value="one-to-many">one-to-many</option>
        <option value="many-to-many">many-to-many</option>
      </select>
      <select aria-label="To entity" value={toId} onChange={(event) => setToId(event.target.value)}>
        {entities.map((entity) => (
          <option key={entity.id} value={entity.id}>
            {entity.name}
          </option>
        ))}
      </select>
      <Input aria-label="Relationship label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label" />
      <Button type="submit" variant="outline">
        Add relationship
      </Button>
    </form>
  )
}
