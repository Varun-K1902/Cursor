"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  collaborationOptions,
  detailLevels,
  domains,
  labelOf,
  outcomeOptions,
  projectTypes,
  startingPoints,
} from "@/lib/re/options"
import { createProjectFromContext } from "@/lib/re/project"
import { recommendTemplate } from "@/lib/re/recommend"
import { mergeTemplates, templateCatalog } from "@/lib/re/templates"
import { useBasis } from "@/lib/store"
import type { DetailLevel } from "@/lib/types"

const steps = ["Project type", "Starting point", "Domain", "Outcome", "Collaboration", "Template", "Project"]

function Wizard() {
  const router = useRouter()
  const params = useSearchParams()
  const editing = params.get("edit") === "1"
  const { state, dispatch } = useBasis()
  const [step, setStep] = useState(0)
  const [projectType, setProjectType] = useState(editing ? state.initiative.projectType : "")
  const [startingPoint, setStartingPoint] = useState(editing ? state.initiative.startingPoint : "")
  const [domain, setDomain] = useState(editing ? state.initiative.domain : "")
  const [domainQuery, setDomainQuery] = useState("")
  const [customDomain, setCustomDomain] = useState(editing ? state.initiative.customDomain : "")
  const [outcomes, setOutcomes] = useState<string[]>(editing ? state.initiative.desiredOutcomes : [])
  const [collaboration, setCollaboration] = useState(editing ? state.initiative.collaboration : "")
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(editing ? state.initiative.detailLevel : "standard")
  const [templateIds, setTemplateIds] = useState<string[]>(editing ? state.initiative.templateIds : [])
  const [name, setName] = useState(editing ? state.initiative.name : "")
  const [description, setDescription] = useState(editing ? state.initiative.description : "")
  const [problem, setProblem] = useState(editing ? state.initiative.problem : "")
  const [outcomeText, setOutcomeText] = useState(editing ? state.initiative.approach : "")
  const [owner, setOwner] = useState(editing ? state.initiative.ownerName : "")
  const [organization, setOrganization] = useState(editing ? state.initiative.organization : "")
  const [message, setMessage] = useState("")

  const context = useMemo(
    () => ({
      projectType: projectType || "other",
      startingPoint: startingPoint || "new",
      domain: domain || "other",
      outcomes,
      detailLevel,
      templateId: templateIds[0],
    }),
    [projectType, startingPoint, domain, outcomes, detailLevel, templateIds]
  )
  const recommendation = recommendTemplate(context)
  const selected = templateIds.length > 0 ? templateIds : [recommendation.templateId]
  const merged = mergeTemplates(selected)
  const visibleDomains = domains.filter((item) => item.label.toLowerCase().includes(domainQuery.toLowerCase()))

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  }

  function canAdvance() {
    if (step === 0) return Boolean(projectType)
    if (step === 1) return Boolean(startingPoint)
    if (step === 2) return Boolean(domain) && (domain !== "other" || customDomain.trim().length > 0 || true)
    if (step === 4) return Boolean(collaboration)
    if (step === 6) return name.trim().length > 0
    return true
  }

  function save(draft: boolean) {
    if (!name.trim()) {
      setMessage("Add a project name before saving. The other fields can wait.")
      setStep(6)
      return
    }
    const now = new Date().toISOString().slice(0, 10)
    if (editing) {
      dispatch({
        type: "update-initiative",
        patch: {
          name: name.trim(),
          shortName: name.trim().slice(0, 24),
          description,
          problem: problem || description,
          approach: outcomeText,
          ownerName: owner,
          organization,
          agency: organization || state.initiative.agency,
          domain,
          customDomain,
          projectType,
          startingPoint,
          desiredOutcomes: outcomes,
          collaboration,
          detailLevel,
          templateIds: selected,
          recommendationReason: recommendation.reason,
          draft,
        },
      })
      setMessage(draft ? "Draft saved." : "Setup updated. Existing answers were kept.")
      if (!draft) router.push("/overview")
      return
    }
    const id = `prj-${crypto.randomUUID().slice(0, 8)}`
    const project = createProjectFromContext({
      id,
      name,
      description,
      problem,
      outcome: outcomeText,
      ownerName: owner,
      organization,
      context,
      templateIds: selected,
      collaboration,
      draft,
      now,
    })
    project.initiative.customDomain = customDomain
    dispatch({ type: "add-project", project })
    router.push(draft ? "/projects" : "/overview")
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Project setup</p>
        <h1 className="mt-2 text-3xl font-medium text-ink">{editing ? "Edit setup answers" : "Create a project"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Step {step + 1} of {steps.length}: {steps[step]}. Only the project name is required before a draft can be saved.
        </p>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              className={index === step ? "font-semibold text-primary" : "text-muted-foreground"}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <ChoiceGrid
          options={projectTypes.map((item) => ({ id: item.id, label: item.label, detail: item.detail }))}
          value={[projectType]}
          onToggle={(id) => setProjectType(id)}
        />
      ) : null}
      {step === 1 ? (
        <ChoiceGrid
          options={startingPoints.map((item) => ({ id: item.id, label: item.label }))}
          value={[startingPoint]}
          onToggle={(id) => setStartingPoint(id)}
        />
      ) : null}
      {step === 2 ? (
        <div className="grid gap-3">
          <Input value={domainQuery} onChange={(event) => setDomainQuery(event.target.value)} placeholder="Search domains" aria-label="Search domains" />
          <ChoiceGrid
            options={visibleDomains.map((item) => ({ id: item.id, label: item.label }))}
            value={[domain]}
            onToggle={(id) => setDomain(id)}
          />
          {domain === "other" ? (
            <Input value={customDomain} onChange={(event) => setCustomDomain(event.target.value)} placeholder="Custom domain" aria-label="Custom domain" />
          ) : null}
        </div>
      ) : null}
      {step === 3 ? (
        <ChoiceGrid
          options={outcomeOptions.map((item) => ({ id: item.id, label: item.label }))}
          value={outcomes}
          onToggle={(id) => setOutcomes(toggle(outcomes, id))}
        />
      ) : null}
      {step === 4 ? (
        <ChoiceGrid
          options={collaborationOptions.map((item) => ({ id: item.id, label: item.label }))}
          value={[collaboration]}
          onToggle={(id) => setCollaboration(id)}
        />
      ) : null}
      {step === 5 ? (
        <div className="grid gap-4">
          <article className="rounded-xl bg-accent/60 p-4">
            <p className="text-sm font-medium">Recommended: {recommendation.template.name}</p>
            <p className="mt-2 text-sm leading-relaxed">{recommendation.reason}</p>
            <Button className="mt-3" onClick={() => setTemplateIds([recommendation.templateId])}>
              Use recommendation
            </Button>
          </article>
          <div className="grid gap-2">
            {detailLevels.map((level) => (
              <button
                key={level.id}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${detailLevel === level.id ? "border-primary bg-accent" : "border-border"}`}
                onClick={() => setDetailLevel(level.id)}
              >
                <span className="font-medium">{level.label}</span>
                <span className="mt-1 block text-muted-foreground">{level.detail}</span>
              </button>
            ))}
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Templates to combine</legend>
            {templateCatalog.map((template) => (
              <label key={template.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(template.id)}
                  onChange={() => setTemplateIds(toggle(selected, template.id))}
                />
                <span>
                  {template.name}
                  <span className="block text-muted-foreground">{template.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-muted-foreground">Combined structure: {merged.sections.map((section) => section.title).join(", ") || "None yet"}.</p>
        </div>
      ) : null}
      {step === 6 ? (
        <div className="grid max-w-xl gap-3">
          <label className="grid gap-1 text-sm">
            Project name
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Short description
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Business problem
            <Textarea value={problem} onChange={(event) => setProblem(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Desired business outcome
            <Textarea value={outcomeText} onChange={(event) => setOutcomeText(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Project owner
            <Input value={owner} onChange={(event) => setOwner(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Organization
            <Input value={organization} onChange={(event) => setOrganization(event.target.value)} />
          </label>
        </div>
      ) : null}

      {step === steps.length - 1 ? null : null}
      {step === 6 ? (
        <article className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-lg font-medium">Summary</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            <li>Type: {labelOf(projectTypes, projectType) || "Not selected"}</li>
            <li>Start: {labelOf(startingPoints, startingPoint) || "Not selected"}</li>
            <li>Domain: {customDomain || labelOf(domains, domain) || "Not selected"}</li>
            <li>Template: {merged.name}</li>
            <li>{recommendation.reason}</li>
          </ul>
        </article>
      ) : null}
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button disabled={!canAdvance()} onClick={() => setStep((value) => value + 1)}>
            Continue
          </Button>
        ) : (
          <Button onClick={() => save(false)}>{editing ? "Update workspace" : "Create workspace"}</Button>
        )}
        <Button variant="outline" onClick={() => save(true)}>
          Save draft
        </Button>
      </div>
    </div>
  )
}

function ChoiceGrid({
  options,
  value,
  onToggle,
}: {
  options: { id: string; label: string; detail?: string }[]
  value: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value.includes(option.id)
        return (
          <button
            key={option.id}
            className={`rounded-xl border px-3 py-3 text-left ${selected ? "border-primary bg-accent" : "border-border bg-card"}`}
            onClick={() => onToggle(option.id)}
            aria-pressed={selected}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            {option.detail ? <span className="mt-1 block text-sm text-muted-foreground">{option.detail}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Opening setup…</p>}>
      <Wizard />
    </Suspense>
  )
}
