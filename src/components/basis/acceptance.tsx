"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { criteriaFor, makeCriterion, useBasis } from "@/lib/store"
import type { CriterionParent, CriterionStyle } from "@/lib/types"

export function AcceptanceEditor({
  parentKind,
  parentId,
}: {
  parentKind: CriterionParent
  parentId: string
}) {
  const { state, dispatch } = useBasis()
  const criteria = criteriaFor(state, parentKind, parentId)
  const [style, setStyle] = useState<CriterionStyle>("plain")
  const [text, setText] = useState("")
  const [given, setGiven] = useState("")
  const [when, setWhen] = useState("")
  const [thenText, setThenText] = useState("")

  function add() {
    if (style === "plain" && !text.trim()) return
    if (style === "gwt" && (!given.trim() || !when.trim() || !thenText.trim())) return
    dispatch({
      type: "add-criterion",
      criterion: makeCriterion({
        parentKind,
        parentId,
        style,
        text: text.trim(),
        given: given.trim(),
        when: when.trim(),
        then: thenText.trim(),
      }),
    })
    setText("")
    setGiven("")
    setWhen("")
    setThenText("")
  }

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-medium text-ink">Acceptance</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Write what would convince you this is true. Plain language or Given / When / Then.
        </p>
      </div>
      <div className="grid gap-3">
        {criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground">No criteria yet. Add the first one below.</p>
        ) : (
          criteria.map((criterion) => (
            <article key={criterion.id} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              {criterion.style === "plain" ? (
                <p className="text-sm leading-relaxed">{criterion.text}</p>
              ) : (
                <div className="grid gap-1.5 text-sm leading-relaxed">
                  <p><span className="font-semibold text-primary">Given</span> {criterion.given}</p>
                  <p><span className="font-semibold text-primary">When</span> {criterion.when}</p>
                  <p><span className="font-semibold text-primary">Then</span> {criterion.then}</p>
                </div>
              )}
            </article>
          ))
        )}
      </div>
      <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex gap-2">
          <Button type="button" size="sm" variant={style === "plain" ? "default" : "outline"} onClick={() => setStyle("plain")}>
            Plain
          </Button>
          <Button type="button" size="sm" variant={style === "gwt" ? "default" : "outline"} onClick={() => setStyle("gwt")}>
            Given / When / Then
          </Button>
        </div>
        {style === "plain" ? (
          <div className="grid gap-1.5">
            <Label htmlFor={`plain-${parentId}`}>Criterion</Label>
            <Textarea
              id={`plain-${parentId}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="The resident is not asked to re-enter the household."
            />
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`given-${parentId}`}>Given</Label>
              <Input id={`given-${parentId}`} value={given} onChange={(event) => setGiven(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`when-${parentId}`}>When</Label>
              <Input id={`when-${parentId}`} value={when} onChange={(event) => setWhen(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`then-${parentId}`}>Then</Label>
              <Input id={`then-${parentId}`} value={thenText} onChange={(event) => setThenText(event.target.value)} />
            </div>
          </div>
        )}
        <Button type="button" className="mt-3" onClick={add}>
          Add criterion
        </Button>
      </div>
    </section>
  )
}
