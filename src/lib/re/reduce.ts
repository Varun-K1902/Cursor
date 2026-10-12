import { bumpVersion, nextCode, todayIso } from "@/lib/labels"
import { mockAi } from "@/lib/re/ai"
import { toImpactItems, changeImpact } from "@/lib/re/impact"
import { createWorkspace } from "@/lib/re/project"
import { bulkStatus, deleteRequirement, duplicateRequirement, updateRequirement } from "@/lib/re/requirements"
import { nextStableCode } from "@/lib/re/ids"
import type {
  AcceptanceCriterion,
  ActivityEvent,
  AiSuggestion,
  AppRole,
  Assumption,
  BasisState,
  BusinessRule,
  Comment,
  DataElement,
  DataEntity,
  EntityRelation,
  FlowStep,
  GlossaryTerm,
  ImpactItem,
  ProcessModel,
  Question,
  Requirement,
  RequirementStatus,
  Stakeholder,
  Story,
  TestScenario,
  TraceRelation,
  UiComponent,
  UseCase,
  UseCaseStep,
  WorkspaceState,
  AnswerValue,
} from "@/lib/types"

export type ProjectAction =
  | { type: "add-stakeholder"; stakeholder: Stakeholder; actorRole?: AppRole }
  | { type: "add-requirement"; requirement: Requirement; derivesFromId?: string; usesId?: string; actorRole?: AppRole }
  | { type: "add-criterion"; criterion: AcceptanceCriterion; actorRole?: AppRole }
  | { type: "add-glossary"; term: GlossaryTerm }
  | { type: "add-data"; element: DataElement }
  | { type: "add-rule"; rule: BusinessRule; constrainsId?: string; actorRole?: AppRole }
  | { type: "add-story"; story: Story }
  | { type: "add-question"; question: Question; actorRole?: AppRole }
  | { type: "add-step"; flowId: string; step: FlowStep }
  | { type: "record-decision"; questionId: string; title: string; outcome: string; decidedById: string; actorRole?: AppRole }
  | { type: "mint-change"; requirementId: string; title: string; rationale: string; statement: string; actorRole?: AppRole }
  | { type: "save-section"; sectionId: string; answers: Record<string, AnswerValue>; actorRole?: AppRole }
  | { type: "flag-section"; sectionId: string; flag: "needs-clarification" | "skipped" | null }
  | { type: "edit-requirement"; id: string; patch: Partial<Requirement>; actorRole?: AppRole }
  | { type: "duplicate-requirement"; id: string; actorRole?: AppRole }
  | { type: "delete-requirement"; id: string; actorRole?: AppRole }
  | { type: "bulk-status"; ids: string[]; status: RequirementStatus; actorRole?: AppRole }
  | { type: "save-process"; model: ProcessModel }
  | { type: "add-usecase"; useCase: UseCase; actorRole?: AppRole }
  | { type: "update-usecase"; useCase: UseCase }
  | { type: "add-entity"; entity: DataEntity }
  | { type: "update-entity"; entity: DataEntity }
  | { type: "add-relation"; relation: EntityRelation }
  | { type: "add-comment"; comment: Comment; actorRole?: AppRole }
  | { type: "resolve-comment"; id: string; actorRole?: AppRole }
  | { type: "transition-requirement"; id: string; status: RequirementStatus; note: string; actorRole?: AppRole }
  | { type: "add-suggestions"; suggestions: AiSuggestion[] }
  | { type: "suggestion-status"; id: string; status: "accepted" | "dismissed"; actorRole?: AppRole }
  | { type: "impact-status"; id: string; status: ImpactItem["status"]; actorRole?: AppRole }
  | { type: "add-assumption"; assumption: Assumption }
  | { type: "update-assumption"; assumption: Assumption }
  | { type: "add-decision"; title: string; outcome: string; context: string; options: string; rationale: string; ownerId: string; relatedIds: string[]; actorRole?: AppRole }
  | { type: "set-templates"; templateIds: string[]; hiddenSectionIds: string[]; reason: string }
  | { type: "update-initiative"; patch: Partial<BasisState["initiative"]> }
  | { type: "add-ui"; component: UiComponent }
  | { type: "add-test"; scenario: TestScenario }
  | { type: "commit-import"; fileName: string; format: string; originalText: string; requirements: Requirement[]; sectionId: string; sectionText: string; actorRole?: AppRole }
  | { type: "reorder-usecase-steps"; useCaseId: string; steps: UseCaseStep[] }

export type WorkspaceAction =
  | { type: "hydrate"; state: WorkspaceState }
  | { type: "reset" }
  | { type: "set-role"; role: AppRole }
  | { type: "set-active"; id: string }
  | { type: "add-project"; project: BasisState }
  | { type: "delete-project"; id: string }
  | ProjectAction

function uid(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `${prefix}-${value.slice(0, 8)}`
}

function log(state: BasisState, role: AppRole | undefined, message: string, objectId?: string): ActivityEvent {
  return { id: uid("act"), at: todayIso(), actorRole: role ?? "ba", message, objectId }
}

function withTrace(state: BasisState, relation: TraceRelation, fromId: string, toId: string): BasisState {
  return { ...state, traces: [...state.traces, { id: uid("tl"), relation, fromId, toId }] }
}

function baselineNumber(name: string) {
  const match = name.match(/(\d+)\.(\d+)\s*$/) ?? name.match(/2026\.(\d+)/)
  if (!match) return 0
  return match[2] ? Number(match[2]) : Number(match[1])
}

export function reduceProject(state: BasisState, action: ProjectAction): BasisState {
  switch (action.type) {
    case "add-stakeholder":
      return {
        ...state,
        stakeholders: [action.stakeholder, ...state.stakeholders],
        activity: [log(state, action.actorRole, `Added stakeholder ${action.stakeholder.name}.`), ...state.activity],
      }
    case "add-requirement": {
      let next = {
        ...state,
        requirements: [action.requirement, ...state.requirements],
        issuedCodes: [...new Set([...state.issuedCodes, action.requirement.code])],
        activity: [log(state, action.actorRole, `Added ${action.requirement.code}.`, action.requirement.id), ...state.activity],
      }
      if (action.derivesFromId) next = withTrace(next, "derives-from", action.requirement.id, action.derivesFromId)
      if (action.usesId) next = withTrace(next, "uses", action.requirement.id, action.usesId)
      return next
    }
    case "add-criterion":
      return { ...state, criteria: [action.criterion, ...state.criteria] }
    case "add-glossary":
      return { ...state, glossary: [action.term, ...state.glossary] }
    case "add-data":
      return { ...state, dataElements: [action.element, ...state.dataElements] }
    case "add-rule": {
      let next: BasisState = {
        ...state,
        rules: [action.rule, ...state.rules],
        activity: [log(state, action.actorRole, `Added rule ${action.rule.code}.`, action.rule.id), ...state.activity],
      }
      if (action.constrainsId) next = withTrace(next, "constrained-by", action.constrainsId, action.rule.id)
      return next
    }
    case "add-story":
      return withTrace(
        { ...state, stories: [action.story, ...state.stories] },
        "elaborates",
        action.story.id,
        action.story.requirementId
      )
    case "add-question":
      return {
        ...state,
        questions: [action.question, ...state.questions],
        activity: [log(state, action.actorRole, `Raised ${action.question.code}.`, action.question.id), ...state.activity],
      }
    case "add-step":
      return {
        ...state,
        flows: state.flows.map((flow) => (flow.id === action.flowId ? { ...flow, steps: [...flow.steps, action.step] } : flow)),
      }
    case "record-decision": {
      const decision = {
        id: uid("d"),
        code: nextCode(state.decisions.map((item) => item.code), "D-"),
        title: action.title,
        outcome: action.outcome,
        decidedById: action.decidedById,
        decidedOn: todayIso(),
        questionId: action.questionId,
        context: "",
        options: "",
        rationale: action.outcome,
        relatedIds: [] as string[],
      }
      return {
        ...state,
        decisions: [decision, ...state.decisions],
        questions: state.questions.map((question) =>
          question.id === action.questionId
            ? { ...question, status: "answered" as const, decisionId: decision.id, answer: action.outcome, resolvedOn: todayIso() }
            : question
        ),
        activity: [log(state, action.actorRole, `Recorded ${decision.code}.`, decision.id), ...state.activity],
      }
    }
    case "mint-change": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId)
      if (!requirement) return state
      const source = [...state.baselines].sort((a, b) => baselineNumber(b.name) - baselineNumber(a.name))[0]
      const approved = state.baselines.find((item) => item.status === "approved") ?? source
      if (!source || !approved) return state
      const toVersion = bumpVersion(requirement.version)
      const nextNumber = baselineNumber(source.name) + 1
      const baselineId = `bl-${uid("b")}`
      const change = {
        id: uid("crq"),
        code: nextCode(state.changes.map((item) => item.code), "CRQ-", 3),
        title: action.title,
        rationale: action.rationale,
        requirementId: requirement.id,
        fromVersion: requirement.version,
        toVersion,
        fromStatement: requirement.statement,
        toStatement: action.statement,
        fromBaselineId: approved.id,
        toBaselineId: baselineId,
        createdOn: todayIso(),
      }
      const edited = updateRequirement(state, requirement.id, { statement: action.statement }, todayIso(), (index) => uid(`imp${index}`))
      return {
        ...edited,
        requirements: edited.requirements.map((item) =>
          item.id === requirement.id ? { ...item, version: toVersion, status: "changed" } : item
        ),
        baselines: [
          {
            id: baselineId,
            name: `${state.initiative.shortName} 2026.${nextNumber}`,
            status: "proposed",
            note: `Minted by ${change.code}. ${approved.name} stays as approved.`,
            snapshots: source.snapshots.map((item) =>
              item.requirementId === requirement.id
                ? { ...item, version: toVersion, statement: action.statement, title: requirement.title }
                : item
            ),
          },
          ...state.baselines,
        ],
        changes: [change, ...state.changes],
        activity: [log(state, action.actorRole, `Minted ${change.code} for ${requirement.code}. Related objects were flagged, not overwritten.`, requirement.id), ...edited.activity],
      }
    }
    case "save-section":
      return {
        ...state,
        sectionAnswers: { ...state.sectionAnswers, [action.sectionId]: action.answers },
        initiative: { ...state.initiative, updatedAt: todayIso(), draft: false },
        activity: [log(state, action.actorRole, `Saved section ${action.sectionId}.`), ...state.activity],
      }
    case "flag-section": {
      const sectionFlags = { ...state.sectionFlags }
      if (action.flag) sectionFlags[action.sectionId] = action.flag
      else delete sectionFlags[action.sectionId]
      return { ...state, sectionFlags }
    }
    case "edit-requirement": {
      const next = updateRequirement(state, action.id, action.patch, todayIso(), (index) => uid(`imp${index}`))
      return { ...next, activity: [log(state, action.actorRole, `Edited a requirement.`, action.id), ...next.activity] }
    }
    case "duplicate-requirement": {
      const next = duplicateRequirement(state, action.id, todayIso(), uid("req"))
      return { ...next, activity: [log(state, action.actorRole, "Duplicated a requirement."), ...next.activity] }
    }
    case "delete-requirement": {
      const target = state.requirements.find((item) => item.id === action.id)
      const next = deleteRequirement(state, action.id)
      return { ...next, activity: [log(state, action.actorRole, `Deleted ${target?.code ?? "a requirement"}.`), ...next.activity] }
    }
    case "bulk-status":
      return {
        ...bulkStatus(state, action.ids, action.status, todayIso()),
        activity: [log(state, action.actorRole, `Set ${action.ids.length} requirements to ${action.status}.`), ...state.activity],
      }
    case "save-process":
      return {
        ...state,
        processModels: state.processModels.some((model) => model.id === action.model.id)
          ? state.processModels.map((model) => (model.id === action.model.id ? action.model : model))
          : [action.model, ...state.processModels],
      }
    case "add-usecase":
      return { ...state, useCases: [action.useCase, ...state.useCases], activity: [log(state, action.actorRole, `Added ${action.useCase.code}.`, action.useCase.id), ...state.activity] }
    case "update-usecase":
      return { ...state, useCases: state.useCases.map((item) => (item.id === action.useCase.id ? action.useCase : item)) }
    case "reorder-usecase-steps":
      return {
        ...state,
        useCases: state.useCases.map((item) => (item.id === action.useCaseId ? { ...item, mainFlow: action.steps } : item)),
      }
    case "add-entity":
      return { ...state, entities: [...state.entities, action.entity] }
    case "update-entity":
      return { ...state, entities: state.entities.map((item) => (item.id === action.entity.id ? action.entity : item)) }
    case "add-relation":
      return { ...state, entityRelations: [...state.entityRelations, action.relation] }
    case "add-comment":
      return { ...state, comments: [action.comment, ...state.comments], activity: [log(state, action.actorRole, "Added a review comment.", action.comment.objectId), ...state.activity] }
    case "resolve-comment":
      return {
        ...state,
        comments: state.comments.map((comment) => (comment.id === action.id ? { ...comment, resolved: true } : comment)),
        activity: [log(state, action.actorRole, "Resolved a comment.", action.id), ...state.activity],
      }
    case "transition-requirement": {
      const current = state.requirements.find((item) => item.id === action.id)
      if (!current) return state
      return {
        ...state,
        requirements: state.requirements.map((item) => (item.id === action.id ? { ...item, status: action.status, updatedAt: todayIso() } : item)),
        reviews: [
          {
            id: uid("rv"),
            objectId: action.id,
            reviewerRole: action.actorRole ?? "ba",
            decision: action.status === "approved" ? "approved" : action.status === "changes-requested" ? "changes-requested" : "comment",
            note: action.note,
            at: todayIso(),
          },
          ...state.reviews,
        ],
        activity: [log(state, action.actorRole, `${current.code} moved to ${action.status}.`, action.id), ...state.activity],
      }
    }
    case "add-suggestions":
      return { ...state, suggestions: [...action.suggestions, ...state.suggestions] }
    case "suggestion-status": {
      const suggestion = state.suggestions.find((item) => item.id === action.id)
      if (!suggestion) return state
      const next =
        action.status === "accepted" && suggestion.proposedText && suggestion.kind === "proposed-edit"
          ? updateRequirement(state, suggestion.targetId, { statement: suggestion.proposedText }, todayIso(), (index) => uid(`imp${index}`))
          : state
      return {
        ...next,
        suggestions: next.suggestions.map((item) => (item.id === action.id ? { ...item, status: action.status } : item)),
        activity: [log(state, action.actorRole, `${action.status === "accepted" ? "Accepted" : "Dismissed"} a suggestion.`, suggestion.targetId), ...next.activity],
      }
    }
    case "impact-status":
      return {
        ...state,
        impacts: state.impacts.map((item) => (item.id === action.id ? { ...item, status: action.status } : item)),
        activity: [log(state, action.actorRole, `Marked an impact item ${action.status}.`, action.id), ...state.activity],
      }
    case "add-assumption":
      return { ...state, assumptions: [action.assumption, ...state.assumptions] }
    case "update-assumption":
      return { ...state, assumptions: state.assumptions.map((item) => (item.id === action.assumption.id ? action.assumption : item)) }
    case "add-decision": {
      const decision = {
        id: uid("d"),
        code: nextCode(state.decisions.map((item) => item.code), "D-"),
        title: action.title,
        outcome: action.outcome,
        decidedById: action.ownerId,
        decidedOn: todayIso(),
        context: action.context,
        options: action.options,
        rationale: action.rationale,
        relatedIds: action.relatedIds,
      }
      return { ...state, decisions: [decision, ...state.decisions], activity: [log(state, action.actorRole, `Recorded ${decision.code}.`, decision.id), ...state.activity] }
    }
    case "set-templates":
      return {
        ...state,
        initiative: {
          ...state.initiative,
          templateIds: action.templateIds,
          hiddenSectionIds: action.hiddenSectionIds,
          recommendationReason: action.reason,
          updatedAt: todayIso(),
        },
      }
    case "update-initiative":
      return { ...state, initiative: { ...state.initiative, ...action.patch, updatedAt: todayIso() } }
    case "add-ui":
      return { ...state, uiComponents: [...state.uiComponents, action.component] }
    case "add-test":
      return { ...state, testScenarios: [...state.testScenarios, action.scenario] }
    case "commit-import":
      return {
        ...state,
        requirements: [...action.requirements, ...state.requirements],
        imports: [
          { id: uid("imp"), fileName: action.fileName, format: action.format, originalText: action.originalText, savedAt: todayIso() },
          ...state.imports,
        ],
        sectionAnswers: {
          ...state.sectionAnswers,
          [action.sectionId]: {
            ...(state.sectionAnswers[action.sectionId] ?? {}),
            body: [state.sectionAnswers[action.sectionId]?.body, action.sectionText]
              .filter((value) => value !== undefined && value !== "")
              .map((value) => (Array.isArray(value) ? value.join(", ") : String(value)))
              .join("\n"),
          },
        },
        activity: [log(state, action.actorRole, `Imported ${action.fileName}.`), ...state.activity],
      }
    default:
      return state
  }
}

export function reduceWorkspace(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "hydrate":
      return action.state.schema === 2 && action.state.projects.length > 0 ? action.state : state
    case "reset":
      return createWorkspace()
    case "set-role":
      return { ...state, role: action.role }
    case "set-active":
      return state.projects.some((project) => project.initiative.id === action.id) ? { ...state, activeProjectId: action.id } : state
    case "add-project":
      return { ...state, projects: [...state.projects, action.project], activeProjectId: action.project.initiative.id }
    case "delete-project": {
      const projects = state.projects.filter((project) => project.initiative.id !== action.id)
      if (projects.length === 0) return { ...state, projects, activeProjectId: "" }
      const activeProjectId = state.activeProjectId === action.id ? projects[0].initiative.id : state.activeProjectId
      return { ...state, projects, activeProjectId }
    }
    default:
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.initiative.id === state.activeProjectId ? reduceProject(project, action) : project
        ),
      }
  }
}

export function runAi(state: BasisState, operation: string, requirementId: string, role: AppRole): BasisState {
  const requirement = state.requirements.find((item) => item.id === requirementId)
  if (!requirement) return state
  const stamp = uid("sug")
  const drafts =
    operation === "suggestAcceptanceCriteria"
      ? [mockAi.suggestAcceptanceCriteria(requirement)]
      : operation === "detectPotentialDuplicates"
        ? mockAi.detectPotentialDuplicates(state.requirements)
        : operation === "detectPotentialConflicts"
          ? mockAi.detectPotentialConflicts(state.requirements)
          : operation === "proposeTraceability"
            ? [mockAi.proposeTraceability(requirement.code, [...state.rules.map((rule) => rule.code + " " + rule.title), ...state.entities.map((item) => item.name)])]
            : operation === "analyzeChangeImpact"
              ? mockAi.analyzeChangeImpact(state, requirementId)
              : operation === "findMissingQuestions"
                ? state.questions
                    .filter((question) => question.relatedId === requirementId && question.status !== "resolved" && question.status !== "answered")
                    .map((question) => ({
                      kind: "missing" as const,
                      title: question.prompt,
                      body: "This question is already in the register and is still unresolved.",
                      proposedText: "",
                    }))
                : mockAi.analyzeRequirement(requirement, state.rules.map((rule) => rule.title))
  const suggestions: AiSuggestion[] = (drafts.length > 0 ? drafts : [{
    kind: "explanation" as const,
    title: "Nothing new to add",
    body: "The check finished and did not produce a new item.",
    proposedText: "",
  }]).map((draft, index) => ({
    id: `${stamp}-${index}`,
    targetId: requirementId,
    operation,
    kind: draft.kind,
    title: draft.title,
    body: draft.body,
    proposedText: draft.proposedText,
    status: "pending" as const,
  }))
  void role
  return reduceProject(state, { type: "add-suggestions", suggestions })
}

export function freshRequirementId() {
  return uid("req")
}

export function previewImpact(state: BasisState, requirementId: string) {
  return toImpactItems(changeImpact(state, requirementId), requirementId, (index) => `preview-${index}`)
}

export function nextCodeFrom(state: BasisState, prefix: string, pad = 3) {
  return nextStableCode(
    [
      ...state.requirements.map((item) => item.code),
      ...state.questions.map((item) => item.code),
      ...state.assumptions.map((item) => item.code),
      ...state.useCases.map((item) => item.code),
      ...state.rules.map((item) => item.code),
      ...state.testScenarios.map((item) => item.code),
    ].filter((code) => code.startsWith(prefix)),
    prefix,
    pad
  )
}

