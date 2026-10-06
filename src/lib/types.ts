export const SCHEMA = 1

export type RequirementKind =
  | "functional"
  | "interface"
  | "data"
  | "quality"
  | "constraint"
  | "transition"

export type QualityCharacteristic =
  | "functional-suitability"
  | "performance-efficiency"
  | "compatibility"
  | "interaction-capability"
  | "reliability"
  | "security"
  | "maintainability"
  | "flexibility"
  | "safety"

export type RequirementStatus = "draft" | "in-review" | "baselined" | "changed"
export type StakeholderKind = "author" | "sponsor" | "owner" | "consulted"
export type Influence = "high" | "medium" | "low"
export type RuleKind = "definitional" | "operative"
export type FlowKind = "journey" | "current" | "future" | "use-case"
export type CriterionStyle = "plain" | "gwt"
export type CriterionParent = "requirement" | "story" | "flow"
export type TraceRelation = "derives-from" | "constrained-by" | "elaborates" | "uses"
export type RaciLetter = "R" | "A" | "C" | "I"
export type BaselineStatus = "approved" | "proposed" | "superseded"

export interface Initiative {
  id: string
  name: string
  shortName: string
  agency: string
  problem: string
  approach: string
}

export interface Team {
  id: string
  name: string
  purpose: string
}

export interface Stakeholder {
  id: string
  name: string
  roleTitle: string
  teamId: string
  kind: StakeholderKind
  influence: Influence
  interest: string
}

export interface Role {
  id: string
  name: string
  mission: string
  stakeholderId: string
}

export interface RaciAssignment {
  roleId: string
  letter: RaciLetter
}

export interface RaciRow {
  id: string
  activity: string
  note: string
  assignments: RaciAssignment[]
}

export interface Outcome {
  id: string
  code: string
  title: string
  statement: string
  measure: string
  ownerId: string
}

export interface Need {
  id: string
  code: string
  stakeholderId: string
  statement: string
  priority: "must" | "should"
}

export interface Requirement {
  id: string
  code: string
  kind: RequirementKind
  quality?: QualityCharacteristic
  title: string
  statement: string
  status: RequirementStatus
  version: string
  ownerId: string
}

export interface AcceptanceCriterion {
  id: string
  parentKind: CriterionParent
  parentId: string
  style: CriterionStyle
  text?: string
  given?: string
  when?: string
  then?: string
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  aliases: string[]
}

export interface DataElement {
  id: string
  code: string
  name: string
  description: string
  format: string
  ownerId: string
}

export interface BusinessRule {
  id: string
  code: string
  kind: RuleKind
  title: string
  statement: string
  source: string
}

export interface FlowStep {
  id: string
  actor: string
  action: string
  note?: string
}

export interface Flow {
  id: string
  code: string
  kind: FlowKind
  title: string
  intent: string
  steps: FlowStep[]
}

export interface Epic {
  id: string
  code: string
  title: string
  statement: string
  requirementId: string
}

export interface Story {
  id: string
  code: string
  epicId: string
  title: string
  statement: string
  requirementId: string
}

export interface Question {
  id: string
  code: string
  prompt: string
  raisedById: string
  status: "open" | "answered"
  decisionId?: string
  relatedId?: string
}

export interface Decision {
  id: string
  code: string
  title: string
  outcome: string
  decidedById: string
  decidedOn: string
  questionId?: string
}

export interface TraceLink {
  id: string
  relation: TraceRelation
  fromId: string
  toId: string
}

export interface BaselineSnapshot {
  requirementId: string
  code: string
  title: string
  version: string
  statement: string
  kind: RequirementKind
}

export interface Baseline {
  id: string
  name: string
  status: BaselineStatus
  approvedOn?: string
  approverId?: string
  note: string
  snapshots: BaselineSnapshot[]
}

export interface ChangeRequest {
  id: string
  code: string
  title: string
  rationale: string
  requirementId: string
  fromVersion: string
  toVersion: string
  fromStatement: string
  toStatement: string
  fromBaselineId: string
  toBaselineId: string
  createdOn: string
}

export interface BasisState {
  schema: number
  initiative: Initiative
  teams: Team[]
  stakeholders: Stakeholder[]
  roles: Role[]
  raci: RaciRow[]
  outcomes: Outcome[]
  needs: Need[]
  requirements: Requirement[]
  criteria: AcceptanceCriterion[]
  glossary: GlossaryTerm[]
  dataElements: DataElement[]
  rules: BusinessRule[]
  flows: Flow[]
  epics: Epic[]
  stories: Story[]
  questions: Question[]
  decisions: Decision[]
  traces: TraceLink[]
  baselines: Baseline[]
  changes: ChangeRequest[]
}
