"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react"

import { buildCatalog, type CatalogItem } from "@/lib/catalog"
import { bumpVersion, nextCode, requirementPrefix, todayIso } from "@/lib/labels"
import { createSeed } from "@/lib/seed"
import type {
  AcceptanceCriterion,
  Baseline,
  BasisState,
  BusinessRule,
  CriterionParent,
  CriterionStyle,
  DataElement,
  FlowStep,
  GlossaryTerm,
  QualityCharacteristic,
  Question,
  Requirement,
  RequirementKind,
  Stakeholder,
  Story,
  TraceRelation,
} from "@/lib/types"

const STORAGE_KEY = "basis.cbam.v1"

type Action =
  | { type: "hydrate"; state: BasisState }
  | { type: "reset" }
  | { type: "add-stakeholder"; stakeholder: Stakeholder }
  | { type: "add-requirement"; requirement: Requirement; derivesFromId?: string; usesId?: string }
  | { type: "add-criterion"; criterion: AcceptanceCriterion }
  | { type: "add-glossary"; term: GlossaryTerm }
  | { type: "add-data"; element: DataElement }
  | { type: "add-rule"; rule: BusinessRule; constrainsId?: string }
  | { type: "add-story"; story: Story }
  | { type: "add-question"; question: Question }
  | { type: "add-step"; flowId: string; step: FlowStep }
  | {
      type: "record-decision"
      questionId: string
      title: string
      outcome: string
      decidedById: string
    }
  | {
      type: "mint-change"
      requirementId: string
      title: string
      rationale: string
      statement: string
    }

function uid(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `${prefix}-${value.slice(0, 8)}`
}

function withTrace(
  state: BasisState,
  relation: TraceRelation,
  fromId: string,
  toId: string
): BasisState {
  return {
    ...state,
    traces: [...state.traces, { id: uid("tl"), relation, fromId, toId }],
  }
}

function reducer(state: BasisState, action: Action): BasisState {
  switch (action.type) {
    case "hydrate":
      return action.state.schema === 1 ? action.state : state
    case "reset":
      return createSeed()
    case "add-stakeholder":
      return { ...state, stakeholders: [action.stakeholder, ...state.stakeholders] }
    case "add-requirement": {
      let next = { ...state, requirements: [action.requirement, ...state.requirements] }
      if (action.derivesFromId) {
        next = withTrace(next, "derives-from", action.requirement.id, action.derivesFromId)
      }
      if (action.usesId) {
        next = withTrace(next, "uses", action.requirement.id, action.usesId)
      }
      return next
    }
    case "add-criterion":
      return { ...state, criteria: [action.criterion, ...state.criteria] }
    case "add-glossary":
      return { ...state, glossary: [action.term, ...state.glossary] }
    case "add-data":
      return { ...state, dataElements: [action.element, ...state.dataElements] }
    case "add-rule": {
      let next = { ...state, rules: [action.rule, ...state.rules] }
      if (action.constrainsId) {
        next = withTrace(next, "constrained-by", action.constrainsId, action.rule.id)
      }
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
      return { ...state, questions: [action.question, ...state.questions] }
    case "add-step":
      return {
        ...state,
        flows: state.flows.map((flow) =>
          flow.id === action.flowId ? { ...flow, steps: [...flow.steps, action.step] } : flow
        ),
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
      }
      return {
        ...state,
        decisions: [decision, ...state.decisions],
        questions: state.questions.map((question) =>
          question.id === action.questionId
            ? { ...question, status: "answered", decisionId: decision.id }
            : question
        ),
      }
    }
    case "mint-change": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId)
      if (!requirement) return state
      const source = [...state.baselines].sort((a, b) => baselineNumber(b.name) - baselineNumber(a.name))[0]
      const approved = state.baselines.find((item) => item.status === "approved") ?? source
      if (!source) return state
      const toVersion = bumpVersion(requirement.version)
      const nextNumber = baselineNumber(source.name) + 1
      const baselineId = `bl-2026-${nextNumber}-${uid("b").slice(-4)}`
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
      const baseline: Baseline = {
        id: baselineId,
        name: `Eligibility Core 2026.${nextNumber}`,
        status: "proposed",
        note: `Minted by ${change.code} from the current record. ${approved.name} stays as it was approved.`,
        snapshots: source.snapshots.map((item) =>
          item.requirementId === requirement.id
            ? { ...item, version: toVersion, statement: action.statement, title: requirement.title }
            : item
        ),
      }
      return {
        ...state,
        requirements: state.requirements.map((item) =>
          item.id === requirement.id
            ? { ...item, statement: action.statement, version: toVersion, status: "changed" }
            : item
        ),
        baselines: [baseline, ...state.baselines],
        changes: [change, ...state.changes],
      }
    }
    default:
      return state
  }
}

function baselineNumber(name: string) {
  const match = name.match(/2026\.(\d+)/)
  return match ? Number(match[1]) : 0
}

interface BasisContextValue {
  state: BasisState
  catalog: CatalogItem[]
  catalogById: Map<string, CatalogItem>
  dispatch: Dispatch<Action>
}

const BasisContext = createContext<BasisContextValue | null>(null)

export function BasisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createSeed)
  const skipSave = useRef(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as BasisState
        if (parsed?.schema === 1 && parsed.initiative) {
          dispatch({ type: "hydrate", state: parsed })
        }
      }
    } catch {
      // Keep the seeded record if storage is unreadable.
    }
  }, [])

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const catalog = useMemo(() => buildCatalog(state), [state])
  const catalogById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])

  const value = useMemo(
    () => ({ state, catalog, catalogById, dispatch }),
    [state, catalog, catalogById]
  )

  return <BasisContext.Provider value={value}>{children}</BasisContext.Provider>
}

export function useBasis() {
  const value = useContext(BasisContext)
  if (!value) throw new Error("useBasis must be used inside BasisProvider")
  return value
}

export function criteriaFor(state: BasisState, parentKind: CriterionParent, parentId: string) {
  return state.criteria.filter((item) => item.parentKind === parentKind && item.parentId === parentId)
}

export function makeRequirement(input: {
  state: BasisState
  kind: RequirementKind
  title: string
  statement: string
  quality?: QualityCharacteristic
  ownerId: string
}): Requirement {
  const prefix = requirementPrefix(input.kind)
  return {
    id: uid(prefix.toLowerCase().replace("-", "")),
    code: nextCode(input.state.requirements.map((item) => item.code), prefix),
    kind: input.kind,
    quality: input.kind === "quality" ? input.quality : undefined,
    title: input.title.trim(),
    statement: input.statement.trim(),
    status: "draft",
    version: "0.1",
    ownerId: input.ownerId,
  }
}

export function makeCriterion(input: {
  parentKind: CriterionParent
  parentId: string
  style: CriterionStyle
  text?: string
  given?: string
  when?: string
  then?: string
}): AcceptanceCriterion {
  return { id: uid("ac"), ...input }
}
