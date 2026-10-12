"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react"

import { buildCatalog, type CatalogItem } from "@/lib/catalog"
import { todayIso } from "@/lib/labels"
import { createRepository } from "@/lib/re/repository"
import { createProjectFromContext, createWorkspace } from "@/lib/re/project"
import { reduceWorkspace, type WorkspaceAction } from "@/lib/re/reduce"
import { createRequirement } from "@/lib/re/requirements"
import { freshRequirementId } from "@/lib/re/reduce"
import type {
  AcceptanceCriterion,
  BasisState,
  CriterionParent,
  CriterionStyle,
  QualityCharacteristic,
  Requirement,
  RequirementKind,
  WorkspaceState,
} from "@/lib/types"

interface BasisContextValue {
  state: BasisState
  workspace: WorkspaceState
  catalog: CatalogItem[]
  catalogById: Map<string, CatalogItem>
  dispatch: Dispatch<WorkspaceAction>
  hydrated: boolean
  saveMessage: string
  hasProject: boolean
}

const BasisContext = createContext<BasisContextValue | null>(null)

export function BasisProvider({ children }: { children: ReactNode }) {
  const [workspace, dispatch] = useReducer(reduceWorkspace, undefined, createWorkspace)
  const [hydrated, setHydrated] = useState(false)
  const [saveMessage, setSaveMessage] = useState("Saved in this browser")
  const skipSave = useRef(true)

  useEffect(() => {
    const repository = createRepository(localStorage)
    const loaded = repository.load()
    if (loaded.ok && loaded.state) dispatch({ type: "hydrate", state: loaded.state })
    if (!loaded.ok) {
      // Browser storage is read after mount so the server render stays stable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveMessage(loaded.message)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (!hydrated) return
    const repository = createRepository(localStorage)
    const saved = repository.save(workspace)
    // Persist outside render. The message reflects the storage result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveMessage(saved.ok ? "Saved in this browser" : saved.message)
  }, [workspace, hydrated])

  const placeholder = useMemo(
    () =>
      createProjectFromContext({
        id: "none",
        name: "No project",
        description: "",
        problem: "",
        outcome: "",
        ownerName: "",
        organization: "",
        context: { projectType: "other", startingPoint: "new", domain: "other", outcomes: [], detailLevel: "standard" },
        templateIds: ["brd"],
        collaboration: "individual",
        draft: true,
        now: "2026-01-01",
      }),
    []
  )
  const active = workspace.projects.find((project) => project.initiative.id === workspace.activeProjectId) ?? workspace.projects[0]
  const state = active ?? placeholder
  const catalog = useMemo(() => buildCatalog(state), [state])
  const catalogById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])
  const value = useMemo(
    () => ({
      state,
      workspace,
      catalog,
      catalogById,
      dispatch,
      hydrated,
      saveMessage,
      hasProject: Boolean(active),
    }),
    [state, workspace, catalog, catalogById, hydrated, saveMessage, active]
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
  return createRequirement(
    input.state,
    {
      title: input.title,
      statement: input.statement,
      kind: input.kind,
      ownerId: input.ownerId,
      quality: input.quality,
      source: "BA",
      rationale: "",
    },
    todayIso(),
    freshRequirementId()
  )
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
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`
  return { id: `ac-${value.slice(0, 8)}`, ...input }
}
