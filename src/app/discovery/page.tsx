"use client"

import { useState } from "react"

import { DynamicField } from "@/components/forms/dynamic-field"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { mockAi } from "@/lib/re/ai"
import { visibleQuestions } from "@/lib/re/questions"
import { activeTemplate } from "@/lib/re/templates"
import { fieldError, sectionCompletion } from "@/lib/re/validation"
import { useBasis } from "@/lib/store"
import type { AnswerValue } from "@/lib/types"

const labels: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  "needs-clarification": "Needs clarification",
  complete: "Complete",
  skipped: "Skipped",
}

export default function DiscoveryPage() {
  const { state, dispatch, hasProject } = useBasis()
  const template = activeTemplate(state.initiative.templateIds, state.initiative.hiddenSectionIds)
  const [index, setIndex] = useState(0)
  const [notice, setNotice] = useState("")
  const [review, setReview] = useState(false)
  const section = template.sections[index]
  const answers = section ? state.sectionAnswers[section.id] ?? {} : {}
  const [draft, setDraft] = useState<Record<string, AnswerValue>>(answers)
  const shown = section ? visibleQuestions(section, draft) : []
  const status = section ? sectionCompletion(section, draft, state.sectionFlags[section.id]) : "not-started"
  const followUps = section ? mockAi.generateFollowUpQuestions(section, draft) : []

  function load(nextIndex: number) {
    const next = template.sections[nextIndex]
    setIndex(nextIndex)
    setDraft({ ...(next ? state.sectionAnswers[next.id] ?? {} : {}) })
    setNotice("")
  }

  function persist() {
    if (!section) return
    dispatch({ type: "save-section", sectionId: section.id, answers: draft })
    setNotice("Section saved.")
  }

  if (!hasProject || !section) {
    return <p className="text-sm text-muted-foreground">Create a project before discovery. The template supplies the sections.</p>
  }

  const structure = (
    <ol className="grid gap-1">
      {template.sections.map((item, itemIndex) => {
        const itemStatus = sectionCompletion(item, itemIndex === index ? draft : state.sectionAnswers[item.id], state.sectionFlags[item.id])
        return (
          <li key={item.id}>
            <button className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${itemIndex === index ? "bg-accent" : "hover:bg-muted"}`} onClick={() => load(itemIndex)}>
              <span className="block font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{labels[itemStatus]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )

  const assistant = (
    <div className="grid gap-3 text-sm">
      <p className="font-medium">Assistant · mock, not a live model</p>
      <p>Status: {labels[status]}. A section is complete only when its required fields pass validation.</p>
      {shown
        .filter((question) => fieldError(section.fields.find((field) => field.id === question.mapsToField) ?? section.fields[0], draft[question.mapsToField]))
        .map((question) => (
          <p key={question.id} className="rounded-md bg-muted px-2 py-1">
            Missing: {question.prompt}
          </p>
        ))}
      {followUps.length > 0 ? (
        <div>
          <p className="font-medium">Follow-up questions now visible</p>
          {followUps.map((prompt) => (
            <p key={prompt}>{prompt}</p>
          ))}
        </div>
      ) : (
        <p>No extra follow-up questions for the current answers.</p>
      )}
    </div>
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_18rem]">
      <aside className="hidden lg:block">{structure}</aside>
      <section className="grid gap-4">
        <div className="flex flex-wrap gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sections</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Sections</SheetTitle>
              </SheetHeader>
              {structure}
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Assistant</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Assistant</SheetTitle>
              </SheetHeader>
              {assistant}
            </SheetContent>
          </Sheet>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{labels[status]}</p>
          <h1 className="mt-1 text-3xl font-medium">{section.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
        </div>
        {shown.map((question) => {
          const field = section.fields.find((item) => item.id === question.mapsToField)
          if (!field) return null
          const error = fieldError(field, draft[field.id])
          return (
            <div key={question.id} className="grid gap-1.5">
              <label className="text-sm font-medium">
                {question.prompt}
                {question.required ? " *" : ""}
              </label>
              {question.help ? <p className="text-xs text-muted-foreground">{question.help}</p> : null}
              <DynamicField field={field} value={draft[field.id]} onChange={(value) => setDraft({ ...draft, [field.id]: value })} />
              {error && draft[field.id] ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          )
        })}
        {notice ? <p className="text-sm text-primary">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={index === 0} onClick={() => load(index - 1)}>
            Previous section
          </Button>
          <Button variant="outline" onClick={persist}>
            Save draft
          </Button>
          <Button
            onClick={() => {
              persist()
              if (index < template.sections.length - 1) load(index + 1)
            }}
          >
            Save and continue
          </Button>
          {!section.required ? (
            <Button
              variant="outline"
              onClick={() => {
                dispatch({ type: "flag-section", sectionId: section.id, flag: "skipped" })
                if (index < template.sections.length - 1) load(index + 1)
              }}
            >
              Skip optional section
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => dispatch({ type: "flag-section", sectionId: section.id, flag: "needs-clarification" })}>
            Mark for stakeholder confirmation
          </Button>
          <Button variant="outline" onClick={() => setReview((value) => !value)}>
            Review all answers
          </Button>
        </div>
        {review ? (
          <div className="grid gap-3 text-sm">
            {template.sections.map((item) => (
              <article key={item.id} className="rounded-lg bg-card p-3 ring-1 ring-foreground/10">
                <h2 className="font-medium">{item.title}</h2>
                {item.fields.map((field) => (
                  <p key={field.id}>
                    <span className="text-muted-foreground">{field.label}: </span>
                    {String((item.id === section.id ? draft : state.sectionAnswers[item.id])?.[field.id] ?? "Not answered")}
                  </p>
                ))}
              </article>
            ))}
          </div>
        ) : null}
      </section>
      <aside className="hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:block">{assistant}</aside>
    </div>
  )
}
