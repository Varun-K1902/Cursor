/** Visual Story — Scene Graph types. Business truth lives in the canonical model only. */

import type { ConfirmationState, Provenance } from '../types'

/** Finite scene grammar — LLM must not invent new types. */
export type SceneType =
  | 'ACTOR_ENTERS'
  | 'ACTOR_PERFORMS_ACTION'
  | 'ACTOR_RECEIVES_OBJECT'
  | 'ACTOR_CREATES_OBJECT'
  | 'ACTOR_EDITS_OBJECT'
  | 'ACTOR_REVIEWS_OBJECT'
  | 'ACTOR_APPROVES'
  | 'ACTOR_REJECTS'
  | 'ACTOR_RETURNS'
  | 'ACTOR_SEARCHES'
  | 'ACTOR_SELECTS'
  | 'ACTOR_SUBMITS'
  | 'HANDOFF'
  | 'STATE_CHANGE'
  | 'CONDITION'
  | 'PARALLEL_ACTIVITY'
  | 'WAIT'
  | 'NOTIFICATION'
  | 'SYSTEM_INTEGRATION'
  | 'EXCEPTION'
  | 'LOOP'
  | 'PROCESS_COMPLETE'
  | 'DIGITAL_EXPERIENCE'
  | 'UNRESOLVED'

export type SceneStatus = ConfirmationState

export interface VisualConfig {
  illustrationKey: string
  glyph: string
  camera: 'wide' | 'medium' | 'close'
  transition: 'cut' | 'fade' | 'push'
  /** Presentation only — never business truth. */
  notes?: string
}

export interface Scene {
  id: string
  type: SceneType
  /** Human-readable caption derived from the model (not invented). */
  caption: string
  actorId: string | null
  secondaryActorIds: string[]
  locationId: string | null
  objectId: string | null
  actionLabel: string | null
  /** Canonical step this scene projects. */
  stepId: string | null
  outcomeId: string | null
  inputState?: string
  outputState?: string
  precedingSceneIds: string[]
  followingSceneIds: string[]
  /** Branch label when leaving a CONDITION. */
  branchLabel?: string
  /** Pause story for discovery when true. */
  requiresClarification: boolean
  clarificationQuestion?: string
  /** Show Live Sketch transition for this scene. */
  showsDigitalExperience: boolean
  evidence: Provenance | null
  status: SceneStatus
  visualConfig: VisualConfig
  /** Scenario / what-if tagging — never silently merges into confirmed model. */
  scenarioId?: string
}

export interface StoryCharacter {
  id: string
  label: string
  roleHint: string
  visualId: string
  glyph: string
}

export interface StoryLocation {
  id: string
  label: string
  visualId: string
  glyph: string
}

export interface StoryObject {
  id: string
  label: string
  visualId: string
  glyph: string
  entityId?: string
}

export interface StoryWorld {
  characters: StoryCharacter[]
  locations: StoryLocation[]
  objects: StoryObject[]
}

export interface SceneGraph {
  processId: string
  processName: string
  world: StoryWorld
  scenes: Scene[]
  /** Entry scene ids (usually one). */
  startSceneIds: string[]
  compiledAt: string
  perspectiveActorId: string | null
}

export interface WhatIfScenario {
  id: string
  question: string
  branchFromSceneId: string
  temporaryGraph: SceneGraph
  kept: boolean
}

export const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  ACTOR_ENTERS: 'Arrives',
  ACTOR_PERFORMS_ACTION: 'Acts',
  ACTOR_RECEIVES_OBJECT: 'Receives',
  ACTOR_CREATES_OBJECT: 'Creates',
  ACTOR_EDITS_OBJECT: 'Edits',
  ACTOR_REVIEWS_OBJECT: 'Reviews',
  ACTOR_APPROVES: 'Approves',
  ACTOR_REJECTS: 'Rejects',
  ACTOR_RETURNS: 'Returns',
  ACTOR_SEARCHES: 'Searches',
  ACTOR_SELECTS: 'Selects',
  ACTOR_SUBMITS: 'Submits',
  HANDOFF: 'Handoff',
  STATE_CHANGE: 'State change',
  CONDITION: 'Decision',
  PARALLEL_ACTIVITY: 'Parallel',
  WAIT: 'Wait',
  NOTIFICATION: 'Notification',
  SYSTEM_INTEGRATION: 'System',
  EXCEPTION: 'Exception',
  LOOP: 'Loop',
  PROCESS_COMPLETE: 'Complete',
  DIGITAL_EXPERIENCE: 'Software experience',
  UNRESOLVED: 'Unresolved',
}
