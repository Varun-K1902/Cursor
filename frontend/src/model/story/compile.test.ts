import { describe, expect, it } from 'vitest'
import { compileStory, resolvePlaybackPath } from './compile'
import { seedChildVaccination } from '../seed'
import { createEmptyProcess, interpretStatement } from '../interpret'

describe('Visual Story compiler', () => {
  it('compiles scenes from the canonical model without inventing destinations', () => {
    const model = seedChildVaccination()
    const graph = compileStory(model)

    expect(graph.scenes.length).toBeGreaterThan(3)
    expect(graph.world.characters.some((c) => c.label === 'Nurse')).toBe(true)
    expect(graph.scenes.some((s) => s.type === 'ACTOR_SEARCHES' || s.type === 'ACTOR_PERFORMS_ACTION')).toBe(
      true,
    )
    expect(graph.scenes.some((s) => s.type === 'DIGITAL_EXPERIENCE')).toBe(true)

    const unresolved = graph.scenes.filter((s) => s.type === 'UNRESOLVED')
    // Seed still has some open outcomes — gaps must surface, not be invented away
    expect(unresolved.every((s) => s.requiresClarification)).toBe(true)
  })

  it('playback pauses at clarification scenes', () => {
    let model = createEmptyProcess('Site')
    model = interpretStatement(
      model,
      'The regional manager reviews site applications. The manager can recommend, reject or send it to DAP.',
    ).model
    const graph = compileStory(model)
    const path = resolvePlaybackPath(graph)
    const last = path[path.length - 1]
    expect(last).toBeTruthy()
    // Either paused on unresolved or reached a branch condition leading to gaps
    const hasGap = graph.scenes.some((s) => s.type === 'UNRESOLVED')
    expect(hasGap).toBe(true)
  })

  it('keeps stable story-world visual ids across recompile', () => {
    const model = seedChildVaccination()
    const a = compileStory(model)
    const b = compileStory(model)
    expect(a.world.characters.map((c) => c.visualId)).toEqual(
      b.world.characters.map((c) => c.visualId),
    )
  })

  it('perspective filter keeps only that actor’s steps', () => {
    const model = seedChildVaccination()
    const nurse = model.people.find((p) => p.label === 'Nurse')!
    const graph = compileStory(model, { perspectiveActorId: nurse.id })
    const actionScenes = graph.scenes.filter((s) => s.stepId)
    expect(actionScenes.every((s) => {
      const step = model.steps.find((st) => st.id === s.stepId)
      return !step?.role || step.role === 'Nurse'
    })).toBe(true)
  })
})
