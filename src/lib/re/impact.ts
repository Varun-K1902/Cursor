import type { BasisState, ImpactItem, TraceLink } from "@/lib/types"

export interface ImpactHit {
  targetId: string
  targetLabel: string
  reason: string
}

function labelFor(state: BasisState, id: string) {
  const requirement = state.requirements.find((item) => item.id === id)
  if (requirement) return `${requirement.code} ${requirement.title}`
  const rule = state.rules.find((item) => item.id === id)
  if (rule) return `${rule.code} ${rule.title}`
  const useCase = state.useCases.find((item) => item.id === id)
  if (useCase) return `${useCase.code} ${useCase.name}`
  const entity = state.entities.find((item) => item.id === id)
  if (entity) return entity.name
  const ui = state.uiComponents.find((item) => item.id === id)
  if (ui) return ui.name
  const test = state.testScenarios.find((item) => item.id === id)
  if (test) return `${test.code} ${test.title}`
  const criterion = state.criteria.find((item) => item.id === id)
  if (criterion) return criterion.text || criterion.then || "Acceptance criterion"
  const outcome = state.outcomes.find((item) => item.id === id)
  if (outcome) return `${outcome.code} ${outcome.title}`
  const node = state.processModels.flatMap((model) => model.nodes).find((item) => item.id === id)
  if (node) return node.label
  return id
}

function push(hits: ImpactHit[], seen: Set<string>, targetId: string, targetLabel: string, reason: string) {
  if (seen.has(targetId)) return
  seen.add(targetId)
  hits.push({ targetId, targetLabel, reason })
}

export function traceNeighbors(traces: TraceLink[], id: string) {
  return traces.filter((link) => link.fromId === id || link.toId === id)
}

export function changeImpact(state: BasisState, requirementId: string): ImpactHit[] {
  const hits: ImpactHit[] = []
  const seen = new Set<string>([requirementId])
  for (const link of state.traces) {
    if (link.toId === requirementId && (link.relation === "elaborates" || link.relation === "derives-from")) {
      push(
        hits,
        seen,
        link.fromId,
        labelFor(state, link.fromId),
        link.relation === "elaborates"
          ? "This object elaborates the changed requirement, so its wording may now be out of date."
          : "This object derives from the changed requirement."
      )
    }
    if (link.fromId === requirementId && link.relation === "constrained-by") {
      push(hits, seen, link.toId, labelFor(state, link.toId), "The changed requirement is constrained by this object. Confirm the constraint still holds.")
    }
    if (link.fromId === requirementId && link.relation === "uses") {
      push(hits, seen, link.toId, labelFor(state, link.toId), "The changed requirement uses this object. Confirm the usage is still right.")
    }
    if (link.toId === requirementId && link.relation === "uses") {
      push(hits, seen, link.fromId, labelFor(state, link.fromId), "This object uses the changed requirement.")
    }
  }
  for (const criterion of state.criteria.filter((item) => item.parentId === requirementId)) {
    push(hits, seen, criterion.id, labelFor(state, criterion.id), "Acceptance criteria on this requirement need review after the statement changes.")
  }
  for (const scenario of state.testScenarios.filter((item) => item.requirementId === requirementId)) {
    push(hits, seen, scenario.id, `${scenario.code} ${scenario.title}`, "This test scenario is tied to the changed requirement.")
  }
  for (const component of state.uiComponents.filter((item) => item.requirementIds.includes(requirementId))) {
    push(hits, seen, component.id, component.name, "This UI note is linked to the changed requirement.")
  }
  for (const model of state.processModels) {
    for (const node of model.nodes.filter((item) => item.linkedIds.includes(requirementId))) {
      push(hits, seen, node.id, node.label, `Process step in ${model.name} links to the changed requirement.`)
    }
  }
  for (const useCase of state.useCases.filter((item) => item.requirementIds.includes(requirementId))) {
    push(hits, seen, useCase.id, `${useCase.code} ${useCase.name}`, "This use case cites the changed requirement.")
  }
  return hits
}

export function toImpactItems(hits: ImpactHit[], sourceId: string, idFor: (index: number) => string): ImpactItem[] {
  return hits.map((hit, index) => ({
    id: idFor(index),
    sourceId,
    targetId: hit.targetId,
    targetLabel: hit.targetLabel,
    reason: hit.reason,
    status: "needs-review",
  }))
}

export function orphanRequirements(state: BasisState) {
  return state.requirements.filter((requirement) => {
    const linked = state.traces.some((link) => link.fromId === requirement.id || link.toId === requirement.id)
    const inUseCase = state.useCases.some((item) => item.requirementIds.includes(requirement.id))
    const inUi = state.uiComponents.some((item) => item.requirementIds.includes(requirement.id))
    return !linked && !inUseCase && !inUi
  })
}
