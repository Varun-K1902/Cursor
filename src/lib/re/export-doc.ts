import type { BasisState } from "@/lib/types"
import { activeTemplate } from "@/lib/re/templates"

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function requirementsToCsv(state: BasisState) {
  const header = ["ID", "Title", "Description", "Type", "Source", "Priority", "Status", "Owner", "Updated"]
  const lines = [header.join(",")]
  for (const requirement of state.requirements) {
    const owner = state.stakeholders.find((person) => person.id === requirement.ownerId)?.name ?? ""
    lines.push(
      [
        requirement.code,
        requirement.title,
        requirement.statement,
        requirement.kind,
        requirement.source,
        requirement.priority,
        requirement.status,
        owner,
        requirement.updatedAt,
      ]
        .map((value) => csvCell(value ?? ""))
        .join(",")
    )
  }
  return lines.join("\n")
}

export function projectToJson(state: BasisState) {
  return JSON.stringify(state, null, 2)
}

export function projectSummary(state: BasisState) {
  const open = state.questions.filter((question) => question.status !== "answered" && question.status !== "resolved")
  return [
    state.initiative.name,
    state.initiative.problem,
    `${state.requirements.length} requirements, ${state.rules.length} rules, ${state.useCases.length} use cases, ${open.length} unresolved questions.`,
    state.initiative.recommendationReason,
  ].join("\n\n")
}

export function documentHtml(state: BasisState, view: "prd" | "brd" | "frd" | "srs" | "template") {
  const template = activeTemplate(state.initiative.templateIds, state.initiative.hiddenSectionIds)
  const title =
    view === "template" ? template.name : view === "prd" ? "Product requirements" : view === "brd" ? "Business requirements" : view === "frd" ? "Functional requirements" : "Software requirements specification"
  const sections = template.sections.filter((section) => {
    if (view === "frd") return ["business-context", "functional-requirements", "business-rules", "use-cases", "acceptance", "interfaces", "data-requirements"].includes(section.id)
    if (view === "prd") return ["product-overview", "business-context", "objectives", "user-stories", "acceptance", "assumptions-questions"].includes(section.id) || section.id === "business-context"
    if (view === "srs") return true
    if (view === "brd") return !section.id.includes("quality")
    return true
  })
  const body = sections
    .map((section) => {
      const answers = state.sectionAnswers[section.id] ?? {}
      const fields = section.fields
        .map((definition) => {
          const value = answers[definition.id]
          const text = value === undefined || value === "" ? "Not answered" : String(value)
          return `<h3>${escapeHtml(definition.label)}</h3><p>${escapeHtml(text)}</p>`
        })
        .join("")
      return `<section><h2>${escapeHtml(section.title)}</h2>${fields}</section>`
    })
    .join("")
  const requirements = state.requirements
    .map((requirement) => `<li><strong>${escapeHtml(requirement.code)}</strong> ${escapeHtml(requirement.title)} — ${escapeHtml(requirement.statement)}</li>`)
    .join("")
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(state.initiative.name)} · draft export of the saved record</p>${body}<h2>Requirements</h2><ul>${requirements}</ul></body></html>`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char)
}
