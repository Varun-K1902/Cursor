import type { Requirement } from "@/lib/types"
import { recommendTemplate, type ProjectContext, type Recommendation } from "@/lib/re/recommend"
import { visibleQuestions } from "@/lib/re/questions"
import type { TemplateDefinition, TemplateSection } from "@/lib/re/templates"
import type { AnswerValue } from "@/lib/types"
import { changeImpact } from "@/lib/re/impact"
import type { BasisState } from "@/lib/types"

export interface AiSuggestionDraft {
  kind: "suggestion" | "explanation" | "missing" | "proposed-edit"
  title: string
  body: string
  proposedText: string
}

const ambiguousTerms = [
  { term: "quickly", note: "“Quickly” is not measurable." },
  { term: "fast", note: "“Fast” is not measurable." },
  { term: "user-friendly", note: "“User-friendly” needs a confirmed behavior." },
  { term: "easy", note: "“Easy” is not a testable condition." },
  { term: "seamless", note: "“Seamless” does not say what the person should observe." },
  { term: "intuitive", note: "“Intuitive” needs a confirmed task and outcome." },
  { term: "as soon as possible", note: "“As soon as possible” has no deadline." },
  { term: "appropriate", note: "“Appropriate” hides the actual rule." },
  { term: "reasonable", note: "“Reasonable” hides the actual threshold." },
  { term: "etc", note: "“Etc.” leaves the list unfinished." },
]

export interface AiService {
  recommendTemplate(context: ProjectContext): Recommendation
  generateFollowUpQuestions(section: TemplateSection, answers: Record<string, AnswerValue> | undefined): string[]
  analyzeRequirement(requirement: Pick<Requirement, "title" | "statement">, knownRuleNames: string[]): AiSuggestionDraft[]
  suggestAcceptanceCriteria(requirement: Pick<Requirement, "title" | "statement">): AiSuggestionDraft
  detectPotentialDuplicates(requirements: Pick<Requirement, "id" | "code" | "title" | "statement">[]): AiSuggestionDraft[]
  detectPotentialConflicts(requirements: Pick<Requirement, "id" | "code" | "title" | "statement">[]): AiSuggestionDraft[]
  proposeTraceability(requirementCode: string, availableLabels: string[]): AiSuggestionDraft
  analyzeChangeImpact(state: BasisState, requirementId: string): AiSuggestionDraft[]
  draftDocument(projectName: string, template: TemplateDefinition, answers: BasisState["sectionAnswers"]): string
}

function findAmbiguous(text: string) {
  const lower = text.toLowerCase()
  return ambiguousTerms.filter((item) => lower.includes(item.term))
}

export const mockAi: AiService = {
  recommendTemplate,
  generateFollowUpQuestions(section, answers) {
    return visibleQuestions(section, answers)
      .filter((question) => question.visibleWhen)
      .map((question) => question.prompt)
  },
  analyzeRequirement(requirement, knownRuleNames) {
    const text = `${requirement.title} ${requirement.statement}`
    const found = findAmbiguous(text)
    const drafts: AiSuggestionDraft[] = found.map((item) => ({
      kind: "missing",
      title: `${item.note} No target was invented.`,
      body: "Ask the business for a measurable condition. Accepting this note does not write a number into the requirement.",
      proposedText: "",
    }))
    const mentionsRule = /rule|policy|balance/i.test(text)
    if (mentionsRule && knownRuleNames.length === 0) {
      drafts.push({
        kind: "missing",
        title: "This text depends on a business rule that is not in the register.",
        body: "Confirm the rule before treating the requirement as complete.",
        proposedText: "",
      })
    }
    if (drafts.length === 0) {
      drafts.push({
        kind: "explanation",
        title: "No ambiguous terms from the checklist were found.",
        body: "This is a checklist result, not an approval. A reviewer still needs to read the statement.",
        proposedText: "",
      })
    }
    return drafts
  },
  suggestAcceptanceCriteria(requirement) {
    const ambiguous = findAmbiguous(requirement.statement)
    const caution = ambiguous.length
      ? ` The words ${ambiguous.map((item) => `“${item.term}”`).join(", ")} need a business-confirmed measure. The assistant did not choose one.`
      : " Confirm the condition with the business before marking it approved."
    return {
      kind: "proposed-edit",
      title: "Draft acceptance criterion",
      body: `Given the requirement “${requirement.title}”, a stakeholder can observe the stated behavior.${caution}`,
      proposedText: `The requirement “${requirement.title}” is met when a stakeholder can observe the stated behavior and any measure in the statement has been confirmed by the business.`,
    }
  },
  detectPotentialDuplicates(requirements) {
    const drafts: AiSuggestionDraft[] = []
    for (let i = 0; i < requirements.length; i += 1) {
      for (let j = i + 1; j < requirements.length; j += 1) {
        const left = requirements[i]
        const right = requirements[j]
        if (overlap(left.title, right.title) > 0.6 || overlap(left.statement, right.statement) > 0.72) {
          drafts.push({
            kind: "suggestion",
            title: `${left.code} and ${right.code} may overlap`,
            body: "Compare the two statements before merging them. This is a text overlap check, not a decision.",
            proposedText: "",
          })
        }
      }
    }
    return drafts
  },
  detectPotentialConflicts(requirements) {
    const drafts: AiSuggestionDraft[] = []
    for (let i = 0; i < requirements.length; i += 1) {
      for (let j = i + 1; j < requirements.length; j += 1) {
        const left = requirements[i]
        const right = requirements[j]
        if (polarityClash(left.statement, right.statement)) {
          drafts.push({
            kind: "suggestion",
            title: `${left.code} and ${right.code} may conflict`,
            body: "One statement restricts an action the other appears to allow. Confirm with the business before changing either.",
            proposedText: "",
          })
        }
      }
    }
    return drafts
  },
  proposeTraceability(requirementCode, availableLabels) {
    return {
      kind: "suggestion",
      title: `Possible links for ${requirementCode}`,
      body:
        availableLabels.length > 0
          ? `Review these existing objects before linking them: ${availableLabels.slice(0, 6).join("; ")}. Nothing is linked until you accept a specific relationship.`
          : "No related objects were available to propose.",
      proposedText: "",
    }
  },
  analyzeChangeImpact(state, requirementId) {
    const hits = changeImpact(state, requirementId)
    if (hits.length === 0) {
      return [
        {
          kind: "explanation",
          title: "No linked objects were found.",
          body: "Semantic impact analysis is not connected. This result is only the stored relationship traversal.",
          proposedText: "",
        },
      ]
    }
    return hits.map((hit) => ({
      kind: "suggestion" as const,
      title: hit.targetLabel,
      body: `${hit.reason} Approved text was not changed.`,
      proposedText: "",
    }))
  },
  draftDocument(projectName, template, answers) {
    const lines = [`# ${template.name}`, "", `Project: ${projectName}`, ""]
    for (const section of template.sections) {
      lines.push(`## ${section.title}`, "")
      const sectionAnswers = answers[section.id] ?? {}
      for (const definition of section.fields) {
        const value = sectionAnswers[definition.id]
        lines.push(`**${definition.label}**`, value === undefined || value === "" ? "_Not answered_" : String(value), "")
      }
    }
    return lines.join("\n")
  },
}

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3)
  )
}

function overlap(left: string, right: string) {
  const a = tokens(left)
  const b = tokens(right)
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const token of a) if (b.has(token)) shared += 1
  return shared / Math.min(a.size, b.size)
}

function polarityClash(left: string, right: string) {
  const shared = overlap(left, right) > 0.45
  if (!shared) return false
  const neg = (value: string) => /\b(not|never|cannot|can't|must not|shall not)\b/i.test(value)
  return neg(left) !== neg(right)
}
