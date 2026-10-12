"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { roleOptions } from "@/lib/re/roles"
import { useBasis } from "@/lib/store"

export default function SettingsPage() {
  const { workspace, dispatch, saveMessage } = useBasis()
  const [notice, setNotice] = useState("")
  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className="text-3xl font-medium">Settings</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This prototype stores the workspace in this browser only. It is not enterprise-secure, and it does not send requirements to a model. {saveMessage}.
      </p>
      <label className="grid gap-1 text-sm">
        Simulated role
        <select
          className="rounded-md border border-input bg-card px-2 py-1"
          value={workspace.role}
          onChange={(event) => dispatch({ type: "set-role", role: event.target.value as typeof workspace.role })}
        >
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label} — {role.note}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="outline"
        onClick={() => {
          dispatch({ type: "reset" })
          setNotice("Demo data restored, including the Employee Leave Management sample.")
        }}
      >
        Reset demo data
      </Button>
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
      <p className="text-sm text-muted-foreground">
        High-fidelity UI prototyping, PDF text extraction, OCR, and a live language model are unavailable. Word-compatible DOCX export is unavailable; use the HTML document export.
      </p>
    </div>
  )
}
