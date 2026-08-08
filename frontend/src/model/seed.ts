import type { ProcessModel } from './types'
import { createEmptyProcess, interpretStatement } from './interpret'

/** Seed Child Vaccination by replaying business statements — same path as live input. */
export function seedChildVaccination(): ProcessModel {
  let model = createEmptyProcess('Child Vaccination')
  model = { ...model, domainHint: 'healthcare' }

  const lines = [
    'A nurse searches for a child. If the child exists, she opens the child record. If not found, she registers the child.',
    'The nurse should search by child ID or mother\'s name.',
    'The nurse then checks the vaccination schedule.',
    'She can administer the vaccine from there. Eligibility and previous dose interval rules can block administration when not eligible.',
    'The nurse can also record growth and weight from the child workspace.',
  ]

  for (const line of lines) {
    model = interpretStatement(model, line, 'seed').model
  }

  // Confirm core steps that were explicitly stated
  model = {
    ...model,
    steps: model.steps.map((s) =>
      ['Search Child', 'Child Workspace', 'Vaccination Schedule', 'Administer Vaccine', 'Record Growth', 'Register Child'].includes(
        s.label,
      )
        ? {
            ...s,
            provenance: {
              ...s.provenance,
              confirmation: 'confirmed',
              confirmedBy: 'Business user',
              confirmedAt: new Date().toISOString(),
            },
          }
        : s,
    ),
  }

  return model
}

export const DEMO_PROMPTS = [
  'A nurse searches for a child. If the child exists, she opens the child record.',
  'The nurse should search by child ID or mother\'s name.',
  'The nurse then checks the vaccination schedule.',
  'She can administer the vaccine from there.',
  'Eligibility rules can block administration when the child is not eligible.',
  'The nurse can also record growth and weight from the child workspace.',
]
