import type { BasisState, Requirement, RequirementPriority, RequirementStatus } from "@/lib/types"
import { nextStableCode } from "@/lib/re/ids"
import { changeImpact, toImpactItems } from "@/lib/re/impact"

function knownCodes(state: BasisState) {
  return [...new Set([...state.issuedCodes, ...state.requirements.map((item) => item.code)])]
}

export function createRequirement(
  state: BasisState,
  input: {
    title: string
    statement: string
    kind: Requirement["kind"]
    ownerId: string
    source?: string
    priority?: RequirementPriority
    rationale?: string
    quality?: Requirement["quality"]
  },
  now: string,
  id: string
): Requirement {
  return {
    id,
    code: nextStableCode(knownCodes(state)),
    kind: input.kind,
    quality: input.kind === "quality" ? input.quality : undefined,
    title: input.title.trim(),
    statement: input.statement.trim(),
    status: "draft",
    version: "0.1",
    ownerId: input.ownerId,
    source: input.source?.trim() || "BA",
    priority: input.priority ?? "should",
    rationale: input.rationale?.trim() || "",
    updatedAt: now,
  }
}

export function duplicateRequirement(state: BasisState, sourceId: string, now: string, id: string) {
  const source = state.requirements.find((item) => item.id === sourceId)
  if (!source) return state
  const copy: Requirement = {
    ...source,
    id,
    code: nextStableCode(knownCodes(state)),
    title: `${source.title} (copy)`,
    status: "draft",
    version: "0.1",
    updatedAt: now,
  }
  return { ...state, requirements: [copy, ...state.requirements], issuedCodes: knownCodes({ ...state, requirements: [...state.requirements, copy] }) }
}

export function updateRequirement(
  state: BasisState,
  id: string,
  patch: Partial<Pick<Requirement, "title" | "statement" | "kind" | "status" | "priority" | "ownerId" | "source" | "rationale" | "relatedProcessId">>,
  now: string,
  impactId: (index: number) => string
) {
  const current = state.requirements.find((item) => item.id === id)
  if (!current) return state
  const statementChanged = patch.statement !== undefined && patch.statement !== current.statement
  const next: Requirement = {
    ...current,
    ...patch,
    code: current.code,
    id: current.id,
    updatedAt: now,
    status: statementChanged && (current.status === "approved" || current.status === "baselined") ? "changed" : (patch.status ?? current.status),
  }
  let impacts = state.impacts
  if (statementChanged) {
    const hits = toImpactItems(changeImpact(state, id), id, impactId)
    impacts = [...hits, ...state.impacts.filter((item) => item.sourceId !== id)]
  }
  return {
    ...state,
    requirements: state.requirements.map((item) => (item.id === id ? next : item)),
    impacts,
  }
}

export function deleteRequirement(state: BasisState, id: string) {
  return {
    ...state,
    requirements: state.requirements.filter((item) => item.id !== id),
    criteria: state.criteria.filter((item) => item.parentId !== id),
    traces: state.traces.filter((link) => link.fromId !== id && link.toId !== id),
    comments: state.comments.filter((comment) => comment.objectId !== id),
    impacts: state.impacts.filter((item) => item.sourceId !== id && item.targetId !== id),
    issuedCodes: knownCodes(state),
  }
}

export function bulkStatus(state: BasisState, ids: string[], status: RequirementStatus, now: string) {
  return {
    ...state,
    requirements: state.requirements.map((item) => (ids.includes(item.id) ? { ...item, status, updatedAt: now } : item)),
  }
}
