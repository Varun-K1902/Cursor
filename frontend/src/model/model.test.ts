import { describe, expect, it } from 'vitest'
import { deriveScreenType, findStructuralGaps, understandingPercent } from './derive'
import { deriveFlow } from './flow'
import { createEmptyProcess, interpretStatement } from './interpret'
import { seedChildVaccination } from './seed'

describe('canonical model dual projection', () => {
  it('updates flow and screen derivation from one interpret pass', () => {
    let model = createEmptyProcess('Child Vaccination')
    model = interpretStatement(
      model,
      'A nurse searches for a child. If the child exists, she opens the child record.',
    ).model

    expect(model.people.some((p) => p.label === 'Nurse')).toBe(true)
    expect(model.things.some((t) => t.label === 'Child')).toBe(true)
    expect(model.steps.some((s) => s.label === 'Search Child')).toBe(true)
    expect(model.steps.some((s) => s.label === 'Child Workspace')).toBe(true)

    const search = model.steps.find((s) => s.label === 'Search Child')!
    const { type } = deriveScreenType(search)
    expect(['LIST', 'FORM']).toContain(type)

    const flow = deriveFlow(model)
    expect(flow.nodes.some((n) => n.label === 'Search Child')).toBe(true)
    expect(flow.nodes.some((n) => n.label === 'Child Workspace')).toBe(true)
    expect(flow.edges.some((e) => e.source === search.id)).toBe(true)
  })

  it('keeps missing destinations as structural gaps, not invented routes', () => {
    let model = createEmptyProcess()
    model = interpretStatement(
      model,
      'The regional manager reviews site applications. The manager can recommend, reject or send it to DAP.',
    ).model

    const gaps = findStructuralGaps(model)
    expect(gaps.some((g) => g.kind === 'missing_destination')).toBe(true)

    const flow = deriveFlow(model)
    expect(flow.nodes.some((n) => n.kind === 'gap')).toBe(true)
  })

  it('child vaccination seed shares one model across projections', () => {
    const model = seedChildVaccination()
    expect(model.name).toBe('Child Vaccination')
    expect(model.steps.length).toBeGreaterThanOrEqual(4)
    const flow = deriveFlow(model)
    expect(flow.nodes.length).toBeGreaterThan(0)
    expect(understandingPercent(model)).toBeGreaterThan(20)
  })
})
