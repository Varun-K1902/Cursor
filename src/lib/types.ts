export const SCHEMA = 2

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

export type RequirementStatus =
  | "draft"
  | "in-review"
  | "changes-requested"
  | "approved"
  | "deprecated"
  | "baselined"
  | "changed"

export type RequirementPriority = "must" | "should" | "could" | "wont"
export type AppRole = "ba" | "reviewer" | "approver" | "architect" | "developer" | "tester"
export type QuestionStatus = "open" | "assigned" | "awaiting" | "answered" | "resolved"
export type DetailLevel = "simple" | "standard" | "comprehensive"
export type AnswerValue = string | number | boolean | string[]
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
  description: string
  ownerName: string
  organization: string
  sample: boolean
  draft: boolean
  domain: string
  customDomain: string
  projectType: string
  startingPoint: string
  desiredOutcomes: string[]
  collaboration: string
  detailLevel: DetailLevel
  templateIds: string[]
  hiddenSectionIds: string[]
  recommendationReason: string
  updatedAt: string
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
  source: string
  priority: RequirementPriority
  rationale: string
  relatedProcessId?: string
  updatedAt: string
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

export interface RuleClause {
  left: string
  operator: string
  right: string
  join?: "AND" | "OR"
}

export interface BusinessRule {
  id: string
  code: string
  kind: RuleKind
  title: string
  statement: string
  source: string
  clauses: RuleClause[]
  result: string
  exceptions: string
  ownerId: string
  status: "draft" | "unconfirmed" | "confirmed" | "retired"
  effectiveDate: string
  requirementIds: string[]
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
  status: QuestionStatus
  decisionId?: string
  relatedId?: string
  sectionId?: string
  priority: "high" | "medium" | "low"
  assignedStakeholderId?: string
  answer: string
  raisedOn: string
  resolvedOn: string
}

export interface Decision {
  id: string
  code: string
  title: string
  outcome: string
  decidedById: string
  decidedOn: string
  questionId?: string
  context: string
  options: string
  rationale: string
  relatedIds: string[]
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

export interface Assumption {
  id: string
  code: string
  statement: string
  reason: string
  relatedId?: string
  ownerId: string
  validation: "unconfirmed" | "validated" | "invalid"
  consequence: string
}

export interface Comment {
  id: string
  objectId: string
  authorRole: AppRole
  body: string
  createdAt: string
  resolved: boolean
}

export interface Review {
  id: string
  objectId: string
  reviewerRole: AppRole
  decision: "comment" | "changes-requested" | "approved"
  note: string
  at: string
}

export interface ActivityEvent {
  id: string
  at: string
  actorRole: AppRole
  message: string
  objectId?: string
}

export type ProcessNodeType =
  | "start"
  | "end"
  | "activity"
  | "decision"
  | "input-output"
  | "approval"
  | "system"
  | "exception"

export interface ProcessNode {
  id: string
  type: ProcessNodeType
  label: string
  x: number
  y: number
  linkedIds: string[]
}

export interface ProcessEdge {
  id: string
  from: string
  to: string
  label?: string
}

export interface ProcessModel {
  id: string
  name: string
  example: boolean
  nodes: ProcessNode[]
  edges: ProcessEdge[]
}

export interface UseCaseStep {
  id: string
  text: string
}

export interface UseCaseBranch {
  id: string
  name: string
  steps: UseCaseStep[]
}

export interface UseCase {
  id: string
  code: string
  name: string
  goal: string
  primaryActor: string
  supportingActors: string
  trigger: string
  preconditions: string
  postconditions: string
  mainFlow: UseCaseStep[]
  alternativeFlows: UseCaseBranch[]
  exceptionFlows: UseCaseBranch[]
  ruleIds: string[]
  requirementIds: string[]
  acceptance: string
  status: "draft" | "in-review" | "approved"
}

export type EntityFieldType =
  | "text"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "url"
  | "json"
  | "file"
  | "enum"

export interface EntityField {
  id: string
  name: string
  type: EntityFieldType
  required: boolean
  primaryKey: boolean
  unique: boolean
  description: string
  defaultValue: string
  enumValues: string[]
  foreignKeyEntityId: string
}

export interface DataEntity {
  id: string
  name: string
  description: string
  fields: EntityField[]
  requirementIds: string[]
  ruleIds: string[]
}

export interface EntityRelation {
  id: string
  fromId: string
  toId: string
  kind: "one-to-one" | "one-to-many" | "many-to-many"
  label: string
}

export interface UiComponent {
  id: string
  name: string
  description: string
  requirementIds: string[]
}

export interface TestScenario {
  id: string
  code: string
  title: string
  requirementId: string
  steps: string
}

export interface ImpactItem {
  id: string
  sourceId: string
  targetId: string
  targetLabel: string
  reason: string
  status: "needs-review" | "reviewed" | "updated"
}

export type SuggestionKind = "suggestion" | "explanation" | "missing" | "proposed-edit"

export interface AiSuggestion {
  id: string
  targetId: string
  operation: string
  kind: SuggestionKind
  title: string
  body: string
  proposedText: string
  status: "pending" | "accepted" | "dismissed"
}

export interface ImportRecord {
  id: string
  fileName: string
  format: string
  originalText: string
  savedAt: string
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
  assumptions: Assumption[]
  comments: Comment[]
  reviews: Review[]
  activity: ActivityEvent[]
  sectionAnswers: Record<string, Record<string, AnswerValue>>
  sectionFlags: Record<string, "needs-clarification" | "skipped">
  processModels: ProcessModel[]
  useCases: UseCase[]
  entities: DataEntity[]
  entityRelations: EntityRelation[]
  uiComponents: UiComponent[]
  testScenarios: TestScenario[]
  impacts: ImpactItem[]
  suggestions: AiSuggestion[]
  imports: ImportRecord[]
  issuedCodes: string[]
}

export interface WorkspaceState {
  schema: number
  activeProjectId: string
  role: AppRole
  projects: BasisState[]
}
