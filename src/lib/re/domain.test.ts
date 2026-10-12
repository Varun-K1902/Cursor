import { describe, expect, it } from "vitest"

import { mockAi } from "@/lib/re/ai"
import { documentHtml, projectToJson, requirementsToCsv } from "@/lib/re/export-doc"
import { nextStableCode } from "@/lib/re/ids"
import { changeImpact } from "@/lib/re/impact"
import { extractBlocks, mapBlocks, rowsToRequirements } from "@/lib/re/import-map"
import { createElmProject } from "@/lib/re/project"
import { isQuestionVisible } from "@/lib/re/questions"
import { recommendTemplate } from "@/lib/re/recommend"
import { createMemoryStore, createRepository } from "@/lib/re/repository"
import { createRequirement, deleteRequirement, duplicateRequirement, updateRequirement } from "@/lib/re/requirements"
import { reduceProject } from "@/lib/re/reduce"
import { activeTemplate, getTemplate, mergeTemplates } from "@/lib/re/templates"
import { fieldError, sectionCompletion } from "@/lib/re/validation"
import { createWorkspace } from "@/lib/re/project"
import { reduceWorkspace } from "@/lib/re/reduce"

describe("template recommendation", () => {
  it("recommends workflow digitization for an HR process that is being digitized", () => {
    const result = recommendTemplate({
      projectType: "digitization",
      startingPoint: "digitization",
      domain: "hr",
      outcomes: ["processes", "business-requirements", "data-rules"],
      detailLevel: "standard",
    })
    expect(result.templateId).toBe("workflow-digitization")
    expect(result.reason.toLowerCase()).toContain("digitiz")
  })

  it("recommends a PRD for a new product that asks for a PRD", () => {
    const result = recommendTemplate({
      projectType: "product",
      startingPoint: "new",
      domain: "other",
      outcomes: ["prd-brd"],
      detailLevel: "standard",
    })
    expect(result.templateId).toBe("prd")
  })
})

describe("conditional questions", () => {
  const section = getTemplate("workflow-digitization")?.sections.find((item) => item.id === "processes")
  const approvers = section?.questions.find((question) => question.id === "approvers")
  const triggers = section?.questions.find((question) => question.id === "triggers")

  it("shows approval follow-ups only when approvals are yes", () => {
    expect(approvers).toBeTruthy()
    expect(isQuestionVisible(approvers!, { approvals: "no" })).toBe(false)
    expect(isQuestionVisible(approvers!, { approvals: "yes" })).toBe(true)
  })

  it("shows automation follow-ups only when the process is automated", () => {
    expect(triggers).toBeTruthy()
    expect(isQuestionVisible(triggers!, { automation: "manual" })).toBe(false)
    expect(isQuestionVisible(triggers!, { automation: "automated" })).toBe(true)
  })
})

describe("required field validation", () => {
  const section = getTemplate("brd")?.sections.find((item) => item.id === "business-context")
  const problem = section?.fields.find((field) => field.id === "problem")

  it("rejects an empty required field and accepts a complete section", () => {
    expect(problem).toBeTruthy()
    expect(fieldError(problem!, "")).toMatch(/required/i)
    expect(sectionCompletion(section!, {})).toBe("not-started")
    expect(sectionCompletion(section!, { problem: "Leave is tracked in a spreadsheet." })).toBe("in-progress")
    expect(
      sectionCompletion(section!, {
        problem: "Leave is tracked in a spreadsheet.",
        objectives: "Record every request in one place.",
        outcomes: "Employees can see status without emailing a manager.",
      })
    ).toBe("complete")
  })

  it("does not treat text entry alone as complete when required fields are missing", () => {
    expect(sectionCompletion(section!, { challenges: "Managers check a spreadsheet by hand." })).toBe("in-progress")
  })
})

describe("requirement ids and crud", () => {
  it("keeps the id stable when a requirement is edited", () => {
    const project = createElmProject()
    const before = project.requirements.find((item) => item.id === "req-001")
    const next = updateRequirement(project, "req-001", { title: "Employees submit leave" }, "2026-10-12", (index) => `i-${index}`)
    const after = next.requirements.find((item) => item.id === "req-001")
    expect(after?.code).toBe(before?.code)
    expect(after?.code).toBe("REQ-001")
    expect(nextStableCode(next.requirements.map((item) => item.code))).toBe("REQ-006")
  })

  it("creates, duplicates, and deletes without reusing the deleted code", () => {
    let project = createElmProject()
    const created = createRequirement(
      project,
      { title: "Notify the employee", statement: "The employee is told when a decision is recorded.", kind: "functional", ownerId: "sh-maya" },
      "2026-10-12",
      "req-new"
    )
    project = { ...project, requirements: [created, ...project.requirements] }
    expect(created.code).toBe("REQ-006")
    project = duplicateRequirement(project, "req-new", "2026-10-12", "req-copy")
    expect(project.requirements.find((item) => item.id === "req-copy")?.code).toBe("REQ-007")
    project = deleteRequirement(project, "req-copy")
    expect(project.requirements.some((item) => item.id === "req-copy")).toBe(false)
    project = { ...project, issuedCodes: [...new Set([...project.issuedCodes, "REQ-006", "REQ-007"])] }
    const another = createRequirement(
      project,
      { title: "Another", statement: "Another requirement with enough text.", kind: "functional", ownerId: "sh-maya" },
      "2026-10-12",
      "req-another"
    )
    expect(another.code).toBe("REQ-008")
  })
})

describe("persistence", () => {
  it("restores a workspace after save", () => {
    const repository = createRepository(createMemoryStore())
    const workspace = createWorkspace()
    const edited = reduceWorkspace(workspace, { type: "edit-requirement", id: "req-004", patch: { title: "Status is visible" } })
    expect(repository.save(edited).ok).toBe(true)
    const loaded = repository.load()
    expect(loaded.ok).toBe(true)
    if (!loaded.ok || !loaded.state) throw new Error("expected a workspace")
    expect(loaded.state.projects[0].requirements.find((item) => item.id === "req-004")?.title).toBe("Status is visible")
    expect(loaded.state.projects[0].requirements.find((item) => item.id === "req-004")?.code).toBe("REQ-004")
  })
})

describe("traceability and impact", () => {
  it("creates a trace link and traverses downstream impact without rewriting the target", () => {
    const project = reduceProject(createElmProject(), {
      type: "add-requirement",
      requirement: createRequirement(
        createElmProject(),
        { title: "Linked", statement: "A linked requirement for the test.", kind: "functional", ownerId: "sh-maya" },
        "2026-10-12",
        "req-link"
      ),
      derivesFromId: "oc-01",
    })
    expect(project.traces.some((link) => link.fromId === "req-link" && link.toId === "oc-01" && link.relation === "derives-from")).toBe(true)
    const ruleBefore = project.rules.find((rule) => rule.id === "br-balance")?.statement
    const hits = changeImpact(project, "req-003")
    expect(hits.some((hit) => hit.targetId === "br-balance")).toBe(true)
    expect(project.rules.find((rule) => rule.id === "br-balance")?.statement).toBe(ruleBefore)
  })
})

describe("import and export", () => {
  it("maps requirement lines and keeps ambiguous paragraphs flagged", () => {
    const template = activeTemplate(["frd"], [])
    const blocks = extractBlocks("Functional requirements\nREQ-010 Employees can submit leave requests\nSome unlabeled note")
    const rows = mapBlocks(blocks, template)
    expect(rowsToRequirements(rows)).toHaveLength(1)
    expect(rows.some((row) => row.confidence === "ambiguous")).toBe(true)
  })

  it("exports the saved requirements rather than a fixed sample string", () => {
    const project = createElmProject()
    const csv = requirementsToCsv(project)
    expect(csv).toContain("REQ-001")
    expect(csv).toContain("Employees can submit leave requests")
    const html = documentHtml(project, "brd")
    expect(html).toContain("Employee Leave Management")
    expect(html).toContain("REQ-004")
    const json = projectToJson(project)
    expect(json).toContain("HolidayCalendar")
  })
})

describe("mock assistant", () => {
  it("flags quickly and does not invent a response-time target", () => {
    const drafts = mockAi.analyzeRequirement(
      { title: "Speed", statement: "The system should process requests quickly." },
      []
    )
    const text = drafts.map((draft) => `${draft.title} ${draft.body} ${draft.proposedText}`).join(" ")
    expect(text.toLowerCase()).toContain("quickly")
    expect(text).not.toMatch(/\d+\s*(ms|seconds|second)/i)
    expect(drafts.every((draft) => !/\b\d+\b/.test(draft.proposedText))).toBe(true)
  })
})

describe("template merge", () => {
  it("does not duplicate a shared section", () => {
    const merged = mergeTemplates(["brd", "frd"])
    const ids = merged.sections.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.filter((id) => id === "business-context")).toHaveLength(1)
  })
})
