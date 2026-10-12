import { getTemplate, templateCatalog, type TemplateDefinition } from "@/lib/re/templates"
import { labelOf, outcomeOptions, projectTypes, startingPoints } from "@/lib/re/options"

export interface ProjectContext {
  projectType: string
  startingPoint: string
  domain: string
  outcomes: string[]
  detailLevel: "simple" | "standard" | "comprehensive"
  templateId?: string
}

export interface Recommendation {
  templateId: string
  template: TemplateDefinition
  score: number
  reason: string
  alternatives: { templateId: string; name: string; score: number }[]
}

export function scoreTemplate(template: TemplateDefinition, context: ProjectContext) {
  let score = 0
  if (template.projectTypes.includes(context.projectType)) score += 5
  if (template.domains.includes(context.domain) || template.domains.includes("any")) score += 2
  if (template.domains.includes(context.domain)) score += 2
  if (template.startingPoints.includes(context.startingPoint)) score += 4
  if (template.complexity === context.detailLevel) score += 2
  for (const outcome of context.outcomes) {
    if (template.outcomeTags.includes(outcome)) score += 2
  }
  if (context.templateId && template.id === context.templateId) score += 3
  return score
}

export function recommendTemplate(context: ProjectContext): Recommendation {
  const ranked = templateCatalog
    .map((template) => ({ template, score: scoreTemplate(template, context) }))
    .sort((a, b) => b.score - a.score || a.template.name.localeCompare(b.template.name))
  const best = ranked[0]
  const template = best?.template ?? templateCatalog[0]
  return {
    templateId: template.id,
    template,
    score: best?.score ?? 0,
    reason: reasonFor(template, context),
    alternatives: ranked.slice(1, 4).map((item) => ({
      templateId: item.template.id,
      name: item.template.name,
      score: item.score,
    })),
  }
}

export function reasonFor(template: TemplateDefinition, context: ProjectContext) {
  const type = labelOf(projectTypes, context.projectType).toLowerCase()
  const start = labelOf(startingPoints, context.startingPoint).toLowerCase()
  const outcomes = context.outcomes
    .map((id) => labelOf(outcomeOptions, id).toLowerCase())
    .slice(0, 3)
  const outcomeText = outcomes.length > 0 ? ` The requested outcomes include ${outcomes.join(", ")}.` : ""
  return `Recommended because this work is ${type}, starting from ${start}, and ${template.name} matches that context.${outcomeText}`
}

export function recommendationForIds(context: ProjectContext, templateId: string) {
  const template = getTemplate(templateId) ?? recommendTemplate(context).template
  return reasonFor(template, context)
}
