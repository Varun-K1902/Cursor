import type {
  Cardinality,
  DerivedScreen,
  ProcessModel,
  ScreenType,
  Step,
  StructuralGap,
  VerbKind,
} from './types'

export function verbKindFromVerb(verb: string): VerbKind {
  const v = verb.toLowerCase()
  if (/search|find|locate|lookup/.test(v)) return 'search'
  if (/create|register|add|capture|enter/.test(v)) return 'create'
  if (/update|edit|change|amend/.test(v)) return 'update'
  if (/administer|give|record|save|submit/.test(v)) return 'administer'
  if (/record|capture|log/.test(v)) return 'record'
  if (/review|assess|examine|inspect|open|view/.test(v)) return 'review'
  if (/approve|reject|recommend|decide|authorize/.test(v)) return 'decide'
  if (/send|handoff|forward|route/.test(v)) return 'handoff'
  if (/read|list|see|browse/.test(v)) return 'read'
  return 'other'
}

export function deriveScreenType(step: Step): {
  type: ScreenType
  because: string[]
} {
  if (step.screenOverride) {
    return {
      type: step.screenOverride,
      because: [`User override → ${step.screenOverride}`],
    }
  }

  if (step.automated) {
    return {
      type: 'BACKGROUND',
      because: ['create/update × many × automated rule → no user screen'],
    }
  }

  if (step.verbKind === 'decide' || step.outcomes.filter((o) => o.kind === 'branch').length >= 2) {
    const because = ['DECIDE × outcomes → DECISION surface']
    return { type: 'DECISION', because }
  }

  const op =
    step.verbKind === 'search' || step.verbKind === 'read' || step.verbKind === 'review'
      ? 'READ'
      : step.verbKind === 'create'
        ? 'CREATE'
        : step.verbKind === 'update' ||
            step.verbKind === 'administer' ||
            step.verbKind === 'record'
          ? 'CREATE/UPDATE'
          : step.verbKind.toUpperCase()

  const card: Cardinality = step.cardinality
  const cardLabel = card === 'many' ? 'MANY' : 'ONE'

  if (
    (step.verbKind === 'search' || step.verbKind === 'read') &&
    card === 'many' &&
    step.hasAggregation
  ) {
    return {
      type: 'REPORT',
      because: [`${op} × ${cardLabel} × AGGREGATION → REPORT`],
    }
  }

  if (
    (step.verbKind === 'search' || step.verbKind === 'read') &&
    card === 'many' &&
    step.hasRowAction
  ) {
    return {
      type: 'LIST',
      because: [`${op} × ${cardLabel} × ROW ACTION → LIST`],
    }
  }

  if (
    (step.verbKind === 'review' || step.verbKind === 'read') &&
    card === 'one' &&
    step.relatedSets.length > 0
  ) {
    return {
      type: 'WORKSPACE',
      because: [`${op} × ${cardLabel} × RELATED SETS → WORKSPACE`],
    }
  }

  if (
    (step.verbKind === 'create' ||
      step.verbKind === 'update' ||
      step.verbKind === 'administer' ||
      step.verbKind === 'record') &&
    card === 'many'
  ) {
    return {
      type: 'GRID',
      because: [`${op} × ${cardLabel} → GRID`],
    }
  }

  if (
    step.verbKind === 'create' ||
    step.verbKind === 'update' ||
    step.verbKind === 'administer' ||
    step.verbKind === 'record' ||
    step.verbKind === 'search'
  ) {
    return {
      type: 'FORM',
      because: [
        step.verbKind === 'search'
          ? 'SEARCH × criteria → FORM (search criteria)'
          : `${op} × ${cardLabel} → FORM`,
      ],
    }
  }

  if (step.relatedSets.length > 0 && card === 'one') {
    return {
      type: 'WORKSPACE',
      because: [`READ × ONE × RELATED SETS → WORKSPACE`],
    }
  }

  return {
    type: 'UNKNOWN',
    because: ['Insufficient signals to derive a screen type'],
  }
}

export function deriveScreens(model: ProcessModel): DerivedScreen[] {
  const gaps = findStructuralGaps(model)
  return model.steps.map((step) => {
    const { type, because } = deriveScreenType(step)
    return {
      stepId: step.id,
      type,
      because,
      overridden: step.screenOverride != null,
      title: step.label,
      fields: step.fields,
      tabs: step.tabs,
      actions: step.actions,
      warnings: step.warnings,
      disabledActions: step.disabledActions,
      relatedSets: step.relatedSets,
      role: step.role,
      gaps: gaps.filter((g) => g.stepId === step.id),
    }
  })
}

export function findStructuralGaps(model: ProcessModel): StructuralGap[] {
  const gaps: StructuralGap[] = []
  const stepIds = new Set(model.steps.map((s) => s.id))
  const targeted = new Set<string>()

  for (const step of model.steps) {
    for (const outcome of step.outcomes) {
      if (outcome.targetStepId) {
        targeted.add(outcome.targetStepId)
      } else if (outcome.kind !== 'end') {
        gaps.push({
          id: `gap-dest-${outcome.id}`,
          kind: 'missing_destination',
          message: `Where does “${outcome.label}” go?`,
          stepId: step.id,
          outcomeId: outcome.id,
        })
      }
    }

    const human =
      step.role != null && !step.automated && step.verbKind !== 'other'
    const hasException = step.outcomes.some(
      (o) => o.kind === 'exception' || o.kind === 'branch',
    )
    if (human && step.outcomes.length > 0 && !hasException && step.verbKind === 'decide') {
      gaps.push({
        id: `gap-exc-${step.id}`,
        kind: 'missing_exception',
        message: `“${step.label}” has no non-happy-path outcome`,
        stepId: step.id,
      })
    }

    for (const actionLabel of step.actions) {
      const hasEffect =
        step.outcomes.length > 0 ||
        model.rules.some((r) => r.label.toLowerCase().includes(actionLabel.toLowerCase()))
      if (!hasEffect && step.outcomes.every((o) => !o.targetStepId)) {
        // only flag if step has actions but zero outcomes
      }
    }

    if (step.actions.length > 0 && step.outcomes.length === 0) {
      gaps.push({
        id: `gap-effect-${step.id}`,
        kind: 'action_no_effect',
        message: `Action(s) on “${step.label}” have no defined effect / next step`,
        stepId: step.id,
      })
    }
  }

  // Unreachable (except first / role entry steps)
  const ordered = [...model.steps].sort((a, b) => a.order - b.order)
  const entry = ordered[0]
  for (const step of model.steps) {
    if (entry && step.id === entry.id) continue
    if (!targeted.has(step.id) && stepIds.has(step.id)) {
      gaps.push({
        id: `gap-unreach-${step.id}`,
        kind: 'unreachable_step',
        message: `“${step.label}” is not reachable from any outcome`,
        stepId: step.id,
      })
    }
  }

  for (const entity of model.things) {
    if (entity.hasReader && !entity.hasCreator) {
      gaps.push({
        id: `gap-create-${entity.id}`,
        kind: 'entity_no_creator',
        message: `“${entity.label}” is read but nothing creates it`,
        entityId: entity.id,
      })
    }
  }

  return gaps
}

export function understandingPercent(model: ProcessModel): number {
  if (model.steps.length === 0) return 0
  const gaps = findStructuralGaps(model)
  const confirmed = model.steps.filter(
    (s) =>
      s.provenance.confirmation === 'confirmed' ||
      s.provenance.confirmation === 'explicit',
  ).length
  const inferred = model.steps.filter(
    (s) =>
      s.provenance.confirmation === 'inferred' ||
      s.provenance.confirmation === 'derived' ||
      s.provenance.confirmation === 'assumed',
  ).length
  const unresolvedOutcomes = model.steps.reduce(
    (n, s) => n + s.outcomes.filter((o) => o.targetStepId == null && o.kind !== 'end').length,
    0,
  )
  const base = (confirmed * 1 + inferred * 0.45) / Math.max(model.steps.length, 1)
  const penalty = Math.min(0.4, gaps.length * 0.06 + unresolvedOutcomes * 0.05)
  const peopleBonus = model.people.length > 0 ? 0.05 : 0
  const thingsBonus = model.things.length > 0 ? 0.05 : 0
  return Math.round(Math.max(0, Math.min(0.95, base + peopleBonus + thingsBonus - penalty)) * 100)
}
