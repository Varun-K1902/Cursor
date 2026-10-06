import {
  flowKindLabel,
  flowTone,
  qualityLabel,
  requirementKindLabel,
  requirementTone,
  ruleKindLabel,
  ruleTone,
  tones,
} from "@/lib/labels"
import type { BasisState } from "@/lib/types"

export interface CatalogItem {
  id: string
  code?: string
  title: string
  summary: string
  href: string
  group: string
  kindLabel: string
  tone: string
}

export function buildCatalog(state: BasisState): CatalogItem[] {
  const items: CatalogItem[] = []

  for (const person of state.stakeholders) {
    items.push({
      id: person.id,
      title: person.name,
      summary: person.interest,
      href: `/people#${person.id}`,
      group: "People",
      kindLabel: "Stakeholder",
      tone: tones.teal,
    })
  }
  for (const role of state.roles) {
    items.push({
      id: role.id,
      title: role.name,
      summary: role.mission,
      href: `/roles#${role.id}`,
      group: "People",
      kindLabel: "Role",
      tone: tones.indigo,
    })
  }
  for (const outcome of state.outcomes) {
    items.push({
      id: outcome.id,
      code: outcome.code,
      title: outcome.title,
      summary: outcome.statement,
      href: `/outcomes#${outcome.id}`,
      group: "Intent",
      kindLabel: "Outcome",
      tone: tones.indigo,
    })
  }
  for (const need of state.needs) {
    items.push({
      id: need.id,
      code: need.code,
      title: need.statement,
      summary: need.statement,
      href: `/outcomes#${need.id}`,
      group: "Intent",
      kindLabel: "Need",
      tone: tones.sky,
    })
  }
  for (const requirement of state.requirements) {
    items.push({
      id: requirement.id,
      code: requirement.code,
      title: requirement.title,
      summary: requirement.quality
        ? `${qualityLabel[requirement.quality]}. ${requirement.statement}`
        : requirement.statement,
      href: `/requirements/${requirement.id}`,
      group: "Requirements",
      kindLabel: requirement.quality
        ? qualityLabel[requirement.quality]
        : requirementKindLabel[requirement.kind],
      tone: requirementTone(requirement.kind),
    })
  }
  for (const term of state.glossary) {
    items.push({
      id: term.id,
      title: term.term,
      summary: term.definition,
      href: `/glossary#${term.id}`,
      group: "Language",
      kindLabel: "Glossary",
      tone: tones.olive,
    })
  }
  for (const element of state.dataElements) {
    items.push({
      id: element.id,
      code: element.code,
      title: element.name,
      summary: element.description,
      href: `/data#${element.id}`,
      group: "Language",
      kindLabel: "Data",
      tone: tones.green,
    })
  }
  for (const rule of state.rules) {
    items.push({
      id: rule.id,
      code: rule.code,
      title: rule.title,
      summary: rule.statement,
      href: `/rules#${rule.id}`,
      group: "Language",
      kindLabel: ruleKindLabel[rule.kind],
      tone: ruleTone(rule.kind),
    })
  }
  for (const flow of state.flows) {
    items.push({
      id: flow.id,
      code: flow.code,
      title: flow.title,
      summary: flow.intent,
      href: `/flows/${flow.id}`,
      group: "Behavior",
      kindLabel: flowKindLabel[flow.kind],
      tone: flowTone(flow.kind),
    })
  }
  for (const epic of state.epics) {
    items.push({
      id: epic.id,
      code: epic.code,
      title: epic.title,
      summary: epic.statement,
      href: `/stories#${epic.id}`,
      group: "Behavior",
      kindLabel: "Epic",
      tone: tones.indigo,
    })
  }
  for (const story of state.stories) {
    items.push({
      id: story.id,
      code: story.code,
      title: story.title,
      summary: story.statement,
      href: `/stories/${story.id}`,
      group: "Behavior",
      kindLabel: "Story",
      tone: tones.sky,
    })
  }
  for (const question of state.questions) {
    items.push({
      id: question.id,
      code: question.code,
      title: question.prompt,
      summary: question.prompt,
      href: `/questions#${question.id}`,
      group: "Control",
      kindLabel: "Question",
      tone: tones.coral,
    })
  }
  for (const decision of state.decisions) {
    items.push({
      id: decision.id,
      code: decision.code,
      title: decision.title,
      summary: decision.outcome,
      href: `/questions#${decision.id}`,
      group: "Control",
      kindLabel: "Decision",
      tone: tones.amber,
    })
  }
  for (const baseline of state.baselines) {
    items.push({
      id: baseline.id,
      title: baseline.name,
      summary: baseline.note,
      href: `/baseline#${baseline.id}`,
      group: "Control",
      kindLabel: "Baseline",
      tone: baseline.status === "proposed" ? tones.coral : tones.amber,
    })
  }
  for (const change of state.changes) {
    items.push({
      id: change.id,
      code: change.code,
      title: change.title,
      summary: change.rationale,
      href: `/baseline#${change.id}`,
      group: "Control",
      kindLabel: "Change",
      tone: tones.coral,
    })
  }

  return items
}
