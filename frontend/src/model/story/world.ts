import type { ProcessModel } from '../types'
import type { StoryCharacter, StoryLocation, StoryObject, StoryWorld } from './types'

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
}

const ROLE_GLYPHS: Record<string, string> = {
  nurse: '👩‍⚕️',
  anm: '👩‍⚕️',
  chw: '🧑‍🤝‍🧑',
  mother: '👩',
  parent: '👩',
  caregiver: '🧑',
  child: '👶',
  employee: '🧑‍💼',
  manager: '🧑‍💼',
  'regional manager': '🧑‍💼',
  'branch manager': '🧑‍💼',
  hod: '🧑‍💼',
  qc: '🔬',
  default: '👤',
}

const ENTITY_GLYPHS: Record<string, string> = {
  child: '👶',
  vaccination: '💉',
  vaccine: '💉',
  growth: '📏',
  visit: '📋',
  attendance: '🗓️',
  'site application': '📄',
  sap: '📦',
  dap: '📦',
  default: '📦',
}

const LOCATION_BY_DOMAIN: Record<string, { label: string; glyph: string }> = {
  healthcare: { label: 'Clinic', glyph: '🏥' },
  approval: { label: 'Office', glyph: '🏢' },
  hrms: { label: 'Workplace', glyph: '🏢' },
  general: { label: 'Workplace', glyph: '🏢' },
}

function roleGlyph(label: string): string {
  const key = label.toLowerCase()
  for (const [k, g] of Object.entries(ROLE_GLYPHS)) {
    if (key.includes(k)) return g
  }
  return ROLE_GLYPHS.default!
}

function entityGlyph(label: string): string {
  const key = label.toLowerCase()
  for (const [k, g] of Object.entries(ENTITY_GLYPHS)) {
    if (key.includes(k)) return g
  }
  return ENTITY_GLYPHS.default!
}

/** Build a stable Story World from the canonical model — presentation identities only. */
export function buildStoryWorld(model: ProcessModel): StoryWorld {
  const characters: StoryCharacter[] = model.people.map((p) => {
    const s = slug(p.label)
    return {
      id: p.id,
      label: p.label,
      roleHint: p.label,
      visualId: `character_${s}`,
      glyph: roleGlyph(p.label),
    }
  })

  // Secondary participants often implied in healthcare narratives
  if (
    model.domainHint === 'healthcare' &&
    !characters.some((c) => /mother|parent|caregiver/i.test(c.label))
  ) {
    characters.push({
      id: 'char_caregiver_implied',
      label: 'Caregiver',
      roleHint: 'Caregiver (implied arrival context)',
      visualId: 'character_caregiver',
      glyph: '👩',
    })
  }

  const objects: StoryObject[] = model.things.map((t) => {
    const s = slug(t.label)
    return {
      id: t.id,
      label: t.label,
      visualId: `object_${s}`,
      glyph: entityGlyph(t.label),
      entityId: t.id,
    }
  })

  const locMeta = LOCATION_BY_DOMAIN[model.domainHint] ?? LOCATION_BY_DOMAIN.general!
  const locations: StoryLocation[] = [
    {
      id: `loc_${slug(locMeta.label)}`,
      label: locMeta.label,
      visualId: `location_${slug(locMeta.label)}`,
      glyph: locMeta.glyph,
    },
  ]

  return { characters, locations, objects }
}

export function characterById(world: StoryWorld, id: string | null): StoryCharacter | null {
  if (!id) return null
  return world.characters.find((c) => c.id === id) ?? null
}

export function locationById(world: StoryWorld, id: string | null): StoryLocation | null {
  if (!id) return null
  return world.locations.find((c) => c.id === id) ?? null
}

export function objectById(world: StoryWorld, id: string | null): StoryObject | null {
  if (!id) return null
  return world.objects.find((c) => c.id === id) ?? null
}
