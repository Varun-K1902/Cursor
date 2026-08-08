import type { ProcessModel, Step, VerbKind } from '../types'
import { deriveScreenType } from '../derive'
import type { Scene, SceneGraph, SceneType, VisualConfig } from './types'
import { buildStoryWorld } from './world'

function visual(glyph: string, key: string): VisualConfig {
  return {
    illustrationKey: key,
    glyph,
    camera: 'medium',
    transition: 'fade',
  }
}

function sceneTypeForVerb(verbKind: VerbKind, label: string): SceneType {
  const l = label.toLowerCase()
  if (verbKind === 'search') return 'ACTOR_SEARCHES'
  if (verbKind === 'create' || /register|create/.test(l)) return 'ACTOR_CREATES_OBJECT'
  if (verbKind === 'update' || verbKind === 'record' || verbKind === 'administer') {
    if (/reject/.test(l)) return 'ACTOR_REJECTS'
    if (/approve|recommend/.test(l)) return 'ACTOR_APPROVES'
    if (/submit/.test(l)) return 'ACTOR_SUBMITS'
    return verbKind === 'record' || verbKind === 'administer'
      ? 'ACTOR_EDITS_OBJECT'
      : 'ACTOR_EDITS_OBJECT'
  }
  if (verbKind === 'review') return 'ACTOR_REVIEWS_OBJECT'
  if (verbKind === 'decide') {
    if (/reject/.test(l)) return 'ACTOR_REJECTS'
    if (/approve|recommend/.test(l)) return 'ACTOR_APPROVES'
    return 'CONDITION'
  }
  if (verbKind === 'handoff') return 'HANDOFF'
  if (verbKind === 'read') return 'ACTOR_SELECTS'
  return 'ACTOR_PERFORMS_ACTION'
}

function sid(prefix: string, raw: string): string {
  return `${prefix}_${raw}`
}

/**
 * Deterministic Visual Story Compiler.
 * Canonical model → Scene Graph. Never invents business facts.
 */
export function compileStory(
  model: ProcessModel,
  options?: { perspectiveActorId?: string | null },
): SceneGraph {
  const world = buildStoryWorld(model)
  const locationId = world.locations[0]?.id ?? null
  const scenes: Scene[] = []
  const perspective =
    options?.perspectiveActorId ??
    null

  const steps = [...model.steps]
    .sort((a, b) => a.order - b.order)
    .filter((s) => {
      if (!perspective) return true
      const person = model.people.find((p) => p.id === perspective)
      if (!person) return true
      return !s.role || s.role.toLowerCase() === person.label.toLowerCase()
    })

  if (steps.length === 0) {
    return {
      processId: model.id,
      processName: model.name,
      world,
      scenes: [],
      startSceneIds: [],
      compiledAt: new Date().toISOString(),
      perspectiveActorId: perspective,
    }
  }

  // Opening: actor enters location (derived framing, marked derived)
  const first = steps[0]!
  const firstActor = model.people.find((p) => p.label === first.role) ?? model.people[0]
  const caregiver = world.characters.find((c) => /caregiver|mother|parent/i.test(c.label))

  if (model.domainHint === 'healthcare' && caregiver) {
    const enterId = sid('sc', 'enter')
    scenes.push({
      id: enterId,
      type: 'ACTOR_ENTERS',
      caption: `${caregiver.label} and child arrive at the ${world.locations[0]?.label ?? 'clinic'}`,
      actorId: caregiver.id,
      secondaryActorIds: world.objects
        .filter((o) => /child/i.test(o.label))
        .map((o) => o.id)
        .slice(0, 1),
      locationId,
      objectId: world.objects.find((o) => /child/i.test(o.label))?.id ?? null,
      actionLabel: 'Arrive',
      stepId: null,
      outcomeId: null,
      precedingSceneIds: [],
      followingSceneIds: [],
      requiresClarification: false,
      showsDigitalExperience: false,
      evidence: null,
      status: 'derived',
      visualConfig: visual('🏥', 'arrive_clinic'),
    })
  }

  const stepSceneIds = new Map<string, string>()

  for (const step of steps) {
    const actor = model.people.find((p) => p.label === step.role)
    const entity = model.things.find((t) => t.id === step.entityId)
    const type = sceneTypeForVerb(step.verbKind, step.label)
    const actionSceneId = sid('sc', step.id)
    stepSceneIds.set(step.id, actionSceneId)

    const glyph =
      world.characters.find((c) => c.id === actor?.id)?.glyph ??
      (type === 'ACTOR_SEARCHES' ? '🔍' : '👤')

    scenes.push({
      id: actionSceneId,
      type,
      caption: captionForStep(step, actor?.label ?? step.role, entity?.label ?? null),
      actorId: actor?.id ?? null,
      secondaryActorIds: [],
      locationId,
      objectId: entity?.id ?? null,
      actionLabel: step.label,
      stepId: step.id,
      outcomeId: null,
      precedingSceneIds: [],
      followingSceneIds: [],
      requiresClarification: false,
      showsDigitalExperience: false,
      evidence: step.provenance,
      status: step.provenance.confirmation,
      visualConfig: visual(glyph, `step_${step.id}`),
    })

    // Real world → digital experience transition
    const { type: screenType } = deriveScreenType(step)
    if (screenType !== 'BACKGROUND' && screenType !== 'UNKNOWN') {
      const digitalId = sid('sc', `digital_${step.id}`)
      scenes.push({
        id: digitalId,
        type: 'DIGITAL_EXPERIENCE',
        caption: `This real-world activity requires a ${screenType}: ${step.label}`,
        actorId: actor?.id ?? null,
        secondaryActorIds: [],
        locationId,
        objectId: entity?.id ?? null,
        actionLabel: step.label,
        stepId: step.id,
        outcomeId: null,
        precedingSceneIds: [actionSceneId],
        followingSceneIds: [],
        requiresClarification: false,
        showsDigitalExperience: true,
        evidence: step.provenance,
        status: 'derived',
        visualConfig: visual('💻', `digital_${step.id}`),
      })
      const action = scenes.find((s) => s.id === actionSceneId)!
      action.followingSceneIds.push(digitalId)
    }

    // Conditions / branches from outcomes
    const branchOutcomes = step.outcomes.filter((o) => o.kind !== 'end')
    if (branchOutcomes.length >= 2 || step.verbKind === 'decide') {
      const condId = sid('sc', `cond_${step.id}`)
      const lastOfStep =
        scenes.find((s) => s.id === sid('sc', `digital_${step.id}`))?.id ?? actionSceneId

      scenes.push({
        id: condId,
        type: 'CONDITION',
        caption: branchOutcomes.map((o) => o.label).join(' / ') || `${step.label}?`,
        actorId: actor?.id ?? null,
        secondaryActorIds: [],
        locationId,
        objectId: entity?.id ?? null,
        actionLabel: step.label,
        stepId: step.id,
        outcomeId: null,
        precedingSceneIds: [lastOfStep],
        followingSceneIds: [],
        requiresClarification: false,
        showsDigitalExperience: false,
        evidence: step.provenance,
        status: step.provenance.confirmation,
        visualConfig: visual('❓', `cond_${step.id}`),
      })

      const prev = scenes.find((s) => s.id === lastOfStep)!
      if (!prev.followingSceneIds.includes(condId)) prev.followingSceneIds.push(condId)

      for (const outcome of branchOutcomes) {
        if (outcome.targetStepId) {
          // Wire later once all step scenes exist
          continue
        }
        // Unresolved destination — pause for discovery
        const gapId = sid('sc', `gap_${outcome.id}`)
        scenes.push({
          id: gapId,
          type: 'UNRESOLVED',
          caption: `What happens after “${outcome.label}”?`,
          actorId: actor?.id ?? null,
          secondaryActorIds: [],
          locationId,
          objectId: entity?.id ?? null,
          actionLabel: outcome.label,
          stepId: step.id,
          outcomeId: outcome.id,
          precedingSceneIds: [condId],
          followingSceneIds: [],
          branchLabel: outcome.label,
          requiresClarification: true,
          clarificationQuestion: `Where does “${outcome.label}” go?`,
          showsDigitalExperience: false,
          evidence: outcome.provenance ?? step.provenance,
          status: 'unresolved',
          visualConfig: visual('⚠', `gap_${outcome.id}`),
        })
        const cond = scenes.find((s) => s.id === condId)!
        cond.followingSceneIds.push(gapId)
      }
    } else if (branchOutcomes.length === 1 && !branchOutcomes[0]!.targetStepId) {
      const gapId = sid('sc', `gap_${branchOutcomes[0]!.id}`)
      const lastOfStep =
        scenes.find((s) => s.id === sid('sc', `digital_${step.id}`))?.id ?? actionSceneId
      scenes.push({
        id: gapId,
        type: 'UNRESOLVED',
        caption: `What happens after “${branchOutcomes[0]!.label}”?`,
        actorId: actor?.id ?? null,
        secondaryActorIds: [],
        locationId,
        objectId: entity?.id ?? null,
        actionLabel: branchOutcomes[0]!.label,
        stepId: step.id,
        outcomeId: branchOutcomes[0]!.id,
        precedingSceneIds: [lastOfStep],
        followingSceneIds: [],
        branchLabel: branchOutcomes[0]!.label,
        requiresClarification: true,
        clarificationQuestion: `Where does “${branchOutcomes[0]!.label}” go?`,
        showsDigitalExperience: false,
        evidence: branchOutcomes[0]!.provenance ?? step.provenance,
        status: 'unresolved',
        visualConfig: visual('⚠', `gap_${branchOutcomes[0]!.id}`),
      })
      const prev = scenes.find((s) => s.id === lastOfStep)!
      prev.followingSceneIds.push(gapId)
    }
  }

  // Wire happy-path / branch links between known step targets
  for (const step of steps) {
    const actionSceneId = stepSceneIds.get(step.id)
    if (!actionSceneId) continue
    const digitalId = sid('sc', `digital_${step.id}`)
    const condId = sid('sc', `cond_${step.id}`)
    const fromId = scenes.some((s) => s.id === condId)
      ? condId
      : scenes.some((s) => s.id === digitalId)
        ? digitalId
        : actionSceneId

    for (const outcome of step.outcomes) {
      if (!outcome.targetStepId) continue
      const targetActionId = stepSceneIds.get(outcome.targetStepId)
      if (!targetActionId) continue
      const from = scenes.find((s) => s.id === fromId)
      if (from && !from.followingSceneIds.includes(targetActionId)) {
        from.followingSceneIds.push(targetActionId)
      }
      const target = scenes.find((s) => s.id === targetActionId)
      if (target && !target.precedingSceneIds.includes(fromId)) {
        target.precedingSceneIds.push(fromId)
      }
      // annotate branch on a lightweight edge via optional scene clone note — store on target if from condition
      if (from?.type === 'CONDITION') {
        // Represent branch as a tiny labeled state scene only if multiple targets — caption already on condition
        void outcome.label
      }
    }
  }

  // Chain opening enter → first action if present
  const enter = scenes.find((s) => s.type === 'ACTOR_ENTERS')
  const firstActionId = stepSceneIds.get(first.id)
  if (enter && firstActionId) {
    enter.followingSceneIds = [firstActionId]
    const firstScene = scenes.find((s) => s.id === firstActionId)!
    firstScene.precedingSceneIds = [enter.id]
  }

  // Linear fallback: connect consecutive steps that have no outgoing links
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i]!
    const b = steps[i + 1]!
    const aDigital = scenes.find((s) => s.id === sid('sc', `digital_${a.id}`))
    const aAction = scenes.find((s) => s.id === stepSceneIds.get(a.id))
    const aCond = scenes.find((s) => s.id === sid('sc', `cond_${a.id}`))
    const from = aCond ?? aDigital ?? aAction
    const toId = stepSceneIds.get(b.id)
    if (!from || !toId) continue
    if (from.followingSceneIds.length === 0) {
      from.followingSceneIds.push(toId)
      const to = scenes.find((s) => s.id === toId)!
      if (!to.precedingSceneIds.includes(from.id)) to.precedingSceneIds.push(from.id)
    }
  }

  // Close with PROCESS_COMPLETE when terminal happy path has end outcomes
  const terminals = steps.filter((s) =>
    s.outcomes.some((o) => o.kind === 'end' || (o.targetStepId == null && o.kind === 'happy')),
  )
  if (terminals.length && scenes.every((s) => s.type !== 'PROCESS_COMPLETE')) {
    const last = steps[steps.length - 1]!
    const lastDigital = scenes.find((s) => s.id === sid('sc', `digital_${last.id}`))
    const lastAction = scenes.find((s) => s.id === stepSceneIds.get(last.id))
    const from = lastDigital ?? lastAction
    if (from && from.followingSceneIds.length === 0 && !from.requiresClarification) {
      const doneId = sid('sc', 'complete')
      scenes.push({
        id: doneId,
        type: 'PROCESS_COMPLETE',
        caption: 'Process complete (as currently understood)',
        actorId: firstActor?.id ?? null,
        secondaryActorIds: [],
        locationId,
        objectId: null,
        actionLabel: null,
        stepId: null,
        outcomeId: null,
        precedingSceneIds: [from.id],
        followingSceneIds: [],
        requiresClarification: false,
        showsDigitalExperience: false,
        evidence: null,
        status: 'derived',
        visualConfig: visual('✓', 'complete'),
      })
      from.followingSceneIds.push(doneId)
    }
  }

  const startSceneIds = enter
    ? [enter.id]
    : firstActionId
      ? [firstActionId]
      : scenes[0]
        ? [scenes[0].id]
        : []

  return {
    processId: model.id,
    processName: model.name,
    world,
    scenes,
    startSceneIds,
    compiledAt: new Date().toISOString(),
    perspectiveActorId: perspective,
  }
}

function captionForStep(
  step: Step,
  role: string | null,
  entity: string | null,
): string {
  const who = role ?? 'Someone'
  const what = entity ?? 'the work'
  switch (step.verbKind) {
    case 'search':
      return `${who} searches for ${what}`
    case 'create':
      return `${who} registers / creates ${what}`
    case 'review':
      return `${who} opens / reviews ${what}`
    case 'administer':
      return `${who} administers ${what}`
    case 'record':
      return `${who} records ${what}`
    case 'decide':
      return `${who} decides on ${what}`
    case 'handoff':
      return `${who} hands off ${what}`
    default:
      return `${who}: ${step.label}`
  }
}

/** Ordered playback path following first followingScene, with optional branch choices. */
export function resolvePlaybackPath(
  graph: SceneGraph,
  branchChoices: Record<string, string> = {},
): Scene[] {
  const byId = new Map(graph.scenes.map((s) => [s.id, s]))
  const path: Scene[] = []
  const visited = new Set<string>()
  let current = graph.startSceneIds[0] ? byId.get(graph.startSceneIds[0]) : undefined

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.push(current)
    if (current.requiresClarification) break

    const choice = branchChoices[current.id]
    const nextId =
      (choice && current.followingSceneIds.includes(choice)
        ? choice
        : current.followingSceneIds[0]) ?? null
    current = nextId ? byId.get(nextId) : undefined
  }
  return path
}
