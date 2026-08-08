import type {
  FlowEdgeView,
  FlowNodeView,
  ProcessModel,
  ScreenType,
} from './types'
import { deriveScreenType, findStructuralGaps } from './derive'

/** Project the canonical model into Flow nodes/edges. Layout is presentation-only. */
export function deriveFlow(model: ProcessModel): {
  nodes: FlowNodeView[]
  edges: FlowEdgeView[]
} {
  const nodes: FlowNodeView[] = []
  const edges: FlowEdgeView[] = []
  const gaps = findStructuralGaps(model)
  const steps = [...model.steps].sort((a, b) => a.order - b.order)

  const roles = [...new Set(steps.map((s) => s.role).filter(Boolean))] as string[]
  for (const role of roles) {
    nodes.push({
      id: `role:${role}`,
      label: role,
      role,
      kind: 'role',
      confirmation: 'derived',
    })
  }

  for (const step of steps) {
    const { type } = deriveScreenType(step)
    const isDecision =
      type === 'DECISION' ||
      step.outcomes.filter((o) => o.kind === 'branch').length >= 2

    nodes.push({
      id: step.id,
      label: step.label,
      role: step.role,
      kind: isDecision ? 'decision' : 'step',
      confirmation: step.provenance.confirmation,
      screenType: type as ScreenType,
    })

    if (step.role) {
      const alreadyLinked = edges.some(
        (e) => e.source === `role:${step.role}` && e.target === step.id,
      )
      const firstForRole = steps.find((s) => s.role === step.role)
      if (firstForRole?.id === step.id && !alreadyLinked) {
        edges.push({
          id: `e-role-${step.role}-${step.id}`,
          source: `role:${step.role}`,
          target: step.id,
          isGap: false,
        })
      }
    }

    for (const outcome of step.outcomes) {
      if (outcome.targetStepId) {
        edges.push({
          id: `e-${outcome.id}`,
          source: step.id,
          target: outcome.targetStepId,
          label: outcome.label,
          isGap: false,
          outcomeId: outcome.id,
        })
      } else if (outcome.kind !== 'end') {
        const gapNodeId = `gap:${outcome.id}`
        nodes.push({
          id: gapNodeId,
          label: '?',
          role: null,
          kind: 'gap',
          confirmation: 'unresolved',
          gapMessage: `Where does “${outcome.label}” go?`,
        })
        edges.push({
          id: `e-${outcome.id}`,
          source: step.id,
          target: gapNodeId,
          label: outcome.label,
          isGap: true,
          outcomeId: outcome.id,
        })
      }
    }

    // Surface action-no-effect gaps on the step itself via gap nodes when no outcomes
    const stepGaps = gaps.filter(
      (g) => g.stepId === step.id && g.kind === 'action_no_effect',
    )
    for (const g of stepGaps) {
      const gapNodeId = `gap-effect:${step.id}`
      if (!nodes.some((n) => n.id === gapNodeId)) {
        nodes.push({
          id: gapNodeId,
          label: '⚠',
          role: null,
          kind: 'gap',
          confirmation: 'unresolved',
          gapMessage: g.message,
        })
        edges.push({
          id: `e-${gapNodeId}`,
          source: step.id,
          target: gapNodeId,
          label: 'next?',
          isGap: true,
        })
      }
    }
  }

  return { nodes, edges }
}

/** Simple top-down layout positions for xyflow. */
export function layoutFlow(
  nodes: FlowNodeView[],
  edges: FlowEdgeView[],
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const children = new Map<string, string[]>()
  const parents = new Map<string, string[]>()

  for (const e of edges) {
    if (!children.has(e.source)) children.set(e.source, [])
    children.get(e.source)!.push(e.target)
    if (!parents.has(e.target)) parents.set(e.target, [])
    parents.get(e.target)!.push(e.source)
  }

  const roots = nodes.filter((n) => !parents.has(n.id) || parents.get(n.id)!.length === 0)
  const visited = new Set<string>()
  let row = 0

  function place(id: string, col: number, depth: number) {
    if (visited.has(id)) return
    visited.add(id)
    positions[id] = { x: 40 + col * 220, y: 40 + depth * 110 }
    row = Math.max(row, depth)
    const kids = children.get(id) ?? []
    kids.forEach((kid, i) => place(kid, col + i, depth + 1))
  }

  roots.forEach((r, i) => place(r.id, i * 2, 0))

  // Place any disconnected
  nodes.forEach((n, i) => {
    if (!positions[n.id]) {
      positions[n.id] = { x: 40 + (i % 4) * 220, y: 40 + (Math.floor(i / 4) + row + 2) * 110 }
    }
  })

  return positions
}
