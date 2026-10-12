"use client"

import { useState } from "react"

import { PageHeader } from "@/components/basis/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { recommendTemplate } from "@/lib/re/recommend"
import { mergeTemplates, templateCatalog } from "@/lib/re/templates"
import { useBasis } from "@/lib/store"

export default function TemplatesPage() {
  const { state, hasProject, dispatch } = useBasis()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [previewId, setPreviewId] = useState(templateCatalog[0].id)
  const [picked, setPicked] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const categories = ["all", ...new Set(templateCatalog.map((template) => template.category))]
  const visible = templateCatalog.filter((template) => {
    const haystack = `${template.name} ${template.description} ${template.category}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (category === "all" || template.category === category)
  })
  const preview = templateCatalog.find((template) => template.id === previewId) ?? visible[0]
  const recommendation = hasProject
    ? recommendTemplate({
        projectType: state.initiative.projectType,
        startingPoint: state.initiative.startingPoint,
        domain: state.initiative.domain,
        outcomes: state.initiative.desiredOutcomes,
        detailLevel: state.initiative.detailLevel,
      })
    : null

  function apply(ids: string[]) {
    if (!hasProject) {
      setNotice("Create a project before applying a template. Exploring the catalog does not need one.")
      return
    }
    const merged = mergeTemplates(ids)
    const reason = recommendation?.templateId === ids[0] ? recommendation.reason : `Selected ${merged.name}. Sections were merged without repeating a heading.`
    dispatch({ type: "set-templates", templateIds: ids, hiddenSectionIds: state.initiative.hiddenSectionIds, reason })
    setNotice(`Workspace now uses ${merged.name}.`)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Templates"
        title="Template catalog"
        description="Templates define sections and fields. The recommendation uses project context, not the project name."
      />
      {recommendation ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm">
          For the open project: {recommendation.template.name}. {recommendation.reason}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates" aria-label="Search templates" className="max-w-sm" />
        <select className="rounded-md border border-input bg-card px-2 text-sm" value={category} aria-label="Category" onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-2">
          {visible.length === 0 ? <p className="text-sm text-muted-foreground">No template matches that search.</p> : null}
          {visible.map((template) => (
            <article key={template.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-medium">{template.name}</h2>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{template.complexity}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewId(template.id)}>
                  Preview
                </Button>
                <Button size="sm" onClick={() => apply([template.id])}>
                  Use template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPicked((current) => (current.includes(template.id) ? current.filter((id) => id !== template.id) : [...current, template.id]))}
                >
                  {picked.includes(template.id) ? "Selected to combine" : "Combine"}
                </Button>
              </div>
            </article>
          ))}
        </div>
        {preview ? (
          <aside className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="text-lg font-medium">{preview.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{preview.audience.join(", ")} · {preview.outputFormats.join(", ")}</p>
            <ol className="mt-3 grid gap-2 text-sm">
              {preview.sections.map((section) => (
                <li key={section.id}>
                  <span className="font-medium">{section.title}</span>
                  <span className="block text-muted-foreground">{section.fields.length} fields · {section.required ? "Required section" : "Optional section"}</span>
                </li>
              ))}
            </ol>
            <Button className="mt-3" variant="outline" onClick={() => apply([preview.id])}>
              Start with this template and customize
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Customization hides optional sections from Discovery after you apply it.</p>
            {preview.sections.filter((section) => !section.required).map((section) => (
              <label key={section.id} className="mt-1 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={hasProject ? !state.initiative.hiddenSectionIds.includes(section.id) : true}
                  onChange={() => {
                    if (!hasProject) return
                    const hidden = state.initiative.hiddenSectionIds.includes(section.id)
                      ? state.initiative.hiddenSectionIds.filter((id) => id !== section.id)
                      : [...state.initiative.hiddenSectionIds, section.id]
                    dispatch({
                      type: "set-templates",
                      templateIds: state.initiative.templateIds,
                      hiddenSectionIds: hidden,
                      reason: state.initiative.recommendationReason,
                    })
                  }}
                />
                Show {section.title}
              </label>
            ))}
          </aside>
        ) : null}
      </div>
      {picked.length > 0 ? (
        <Button onClick={() => apply(picked)}>Combine {picked.length} templates</Button>
      ) : null}
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
    </div>
  )
}
