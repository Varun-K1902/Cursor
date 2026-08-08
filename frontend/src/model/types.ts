/** Canonical business model — single source of truth for Flow + Functional Preview. */

export type ConfirmationState =
  | 'explicit'
  | 'inferred'
  | 'derived'
  | 'assumed'
  | 'confirmed'
  | 'unresolved'

export type Cardinality = 'one' | 'many'

export type VerbKind =
  | 'read'
  | 'create'
  | 'update'
  | 'search'
  | 'decide'
  | 'administer'
  | 'record'
  | 'review'
  | 'handoff'
  | 'other'

export type ScreenType =
  | 'LIST'
  | 'REPORT'
  | 'WORKSPACE'
  | 'FORM'
  | 'GRID'
  | 'BACKGROUND'
  | 'DECISION'
  | 'UNKNOWN'

export type FieldMode = 'editable' | 'readonly' | 'hidden'

export interface Provenance {
  statementId: string
  sourceText: string
  speaker: string
  timestamp: string
  origin: 'explicit' | 'inferred' | 'derived' | 'assumed'
  confirmation: ConfirmationState
  confirmedBy?: string
  confirmedAt?: string
}

export interface Statement {
  id: string
  text: string
  modality: 'typed' | 'voice' | 'paste' | 'seed'
  timestamp: string
  speaker: string
}

export interface FieldDef {
  id: string
  label: string
  mode: FieldMode
  entityId?: string
  provenance?: Provenance
}

export interface Outcome {
  id: string
  label: string
  /** Target step id, or null when destination is unknown (structural gap). */
  targetStepId: string | null
  kind: 'happy' | 'exception' | 'branch' | 'end'
  provenance?: Provenance
}

export interface RelatedSet {
  id: string
  label: string
  entityId: string
}

export interface Step {
  id: string
  label: string
  role: string | null
  verb: string
  verbKind: VerbKind
  entityId: string | null
  cardinality: Cardinality
  fields: FieldDef[]
  outcomes: Outcome[]
  relatedSets: RelatedSet[]
  hasRowAction: boolean
  hasAggregation: boolean
  automated: boolean
  /** User override of derived screen type — tracked when set. */
  screenOverride: ScreenType | null
  tabs?: string[]
  actions: string[]
  warnings: string[]
  disabledActions: string[]
  provenance: Provenance
  /** Order in primary happy path (layout hint only). */
  order: number
}

export interface Person {
  id: string
  label: string
  provenance?: Provenance
}

export interface Entity {
  id: string
  label: string
  hasCreator: boolean
  hasReader: boolean
  provenance?: Provenance
}

export interface RuleDef {
  id: string
  label: string
  effect?: string
  provenance?: Provenance
}

export interface ActionDef {
  id: string
  label: string
  stepId?: string
  provenance?: Provenance
}

export interface StructuralGap {
  id: string
  kind:
    | 'missing_destination'
    | 'unreachable_step'
    | 'no_exit'
    | 'missing_exception'
    | 'entity_no_creator'
    | 'action_no_effect'
    | 'incomplete_branch'
  message: string
  stepId?: string
  outcomeId?: string
  entityId?: string
}

export interface Challenge {
  id: string
  question: string
  context: string
  options: { id: string; label: string }[]
  resolved: boolean
  relatedStepId?: string
  relatedOutcomeId?: string
}

export interface ProcessModel {
  id: string
  name: string
  domainHint: string
  statements: Statement[]
  people: Person[]
  things: Entity[]
  rules: RuleDef[]
  actions: ActionDef[]
  steps: Step[]
  challenges: Challenge[]
  selectedStepId: string | null
  frozen: boolean
  createdAt: string
  updatedAt: string
}

export interface DerivedScreen {
  stepId: string
  type: ScreenType
  because: string[]
  overridden: boolean
  title: string
  fields: FieldDef[]
  tabs?: string[]
  actions: string[]
  warnings: string[]
  disabledActions: string[]
  relatedSets: RelatedSet[]
  role: string | null
  gaps: StructuralGap[]
}

export interface FlowNodeView {
  id: string
  label: string
  role: string | null
  kind: 'step' | 'decision' | 'gap' | 'role'
  confirmation: ConfirmationState
  screenType?: ScreenType
  gapMessage?: string
}

export interface FlowEdgeView {
  id: string
  source: string
  target: string
  label?: string
  isGap: boolean
  outcomeId?: string
}
