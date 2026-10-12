import type { DetailLevel } from "@/lib/types"

export type FieldType =
  | "short-text"
  | "long-text"
  | "single-select"
  | "multi-select"
  | "boolean"
  | "date"
  | "number"
  | "structured-list"
  | "repeatable-group"
  | "relationship"
  | "readonly"

export interface ValidationRule {
  kind: "required" | "minLength" | "maxLength"
  value?: number
  message: string
}

export interface ConditionalRule {
  questionId: string
  equals?: string | boolean
}

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  required: boolean
  help?: string
  options?: string[]
  validation?: ValidationRule[]
}

export interface QuestionDefinition {
  id: string
  prompt: string
  help?: string
  inputType: FieldType
  required: boolean
  mapsToField: string
  options?: string[]
  visibleWhen?: ConditionalRule
  relatedRequirementTypes: string[]
}

export interface TemplateSection {
  id: string
  title: string
  description: string
  order: number
  required: boolean
  fields: FieldDefinition[]
  questions: QuestionDefinition[]
  relatedArtifactTypes: string[]
  completionFieldIds: string[]
}

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  category: string
  projectTypes: string[]
  domains: string[]
  startingPoints: string[]
  outcomeTags: string[]
  audience: string[]
  complexity: DetailLevel
  sections: TemplateSection[]
  outputFormats: string[]
}

function requiredText(message: string): ValidationRule[] {
  return [
    { kind: "required", message },
    { kind: "minLength", value: 8, message: "Add enough detail for another BA to understand it." },
  ]
}

function field(
  id: string,
  label: string,
  type: FieldType,
  required: boolean,
  extra: Partial<FieldDefinition> = {}
): FieldDefinition {
  return {
    id,
    label,
    type,
    required,
    validation: required && (type === "short-text" || type === "long-text") ? requiredText(`${label} is required.`) : undefined,
    ...extra,
  }
}

function question(
  id: string,
  prompt: string,
  mapsToField: string,
  inputType: FieldType,
  required: boolean,
  extra: Partial<QuestionDefinition> = {}
): QuestionDefinition {
  return {
    id,
    prompt,
    mapsToField,
    inputType,
    required,
    relatedRequirementTypes: extra.relatedRequirementTypes ?? ["business"],
    ...extra,
  }
}

const businessContext: TemplateSection = {
  id: "business-context",
  title: "Business context",
  description: "Why the work exists, who feels the problem, and what better looks like.",
  order: 10,
  required: true,
  relatedArtifactTypes: ["outcome", "stakeholder", "assumption"],
  completionFieldIds: ["problem", "objectives", "outcomes"],
  fields: [
    field("problem", "Problem statement", "long-text", true),
    field("objectives", "Business objectives", "long-text", true),
    field("challenges", "Current challenges", "long-text", false),
    field("outcomes", "Desired outcomes", "long-text", true),
    field("stakeholders", "Stakeholders", "structured-list", false),
    field("scope", "Scope", "long-text", false),
    field("outOfScope", "Out of scope", "long-text", false),
    field("constraints", "Constraints", "long-text", false),
    field("assumptions", "Assumptions", "long-text", false),
  ],
  questions: [
    question("problem", "What problem are you trying to solve?", "problem", "long-text", true, {
      help: "Write it as the business experiences it. A heading is not required.",
    }),
    question("challenges", "What is inefficient or difficult about the current process?", "challenges", "long-text", false),
    question("stakeholders", "Who experiences this problem?", "stakeholders", "structured-list", false, {
      help: "One stakeholder or group per line.",
    }),
    question("objectives", "What should improve after the solution is introduced?", "objectives", "long-text", true),
    question("outcomes", "What outcome should be true when this succeeds?", "outcomes", "long-text", true),
    question("scope", "What is in scope for this effort?", "scope", "long-text", false),
    question("outOfScope", "What must the solution not do?", "outOfScope", "long-text", false),
    question("constraints", "What constraints already exist?", "constraints", "long-text", false),
    question("assumptions", "What are you assuming until someone confirms it?", "assumptions", "long-text", false),
  ],
}

const processSection: TemplateSection = {
  id: "processes",
  title: "Current and future processes",
  description: "How the work happens today, and how it should happen.",
  order: 40,
  required: false,
  relatedArtifactTypes: ["process", "requirement"],
  completionFieldIds: ["currentProcess"],
  fields: [
    field("currentProcess", "How the process works today", "long-text", true),
    field("futureProcess", "How the process should work", "long-text", false),
    field("approvals", "Does the process involve approvals?", "single-select", true, {
      options: ["yes", "no"],
    }),
    field("approvers", "Who can approve?", "long-text", false),
    field("approvalConditions", "When is approval required?", "long-text", false),
    field("escalation", "How does escalation work?", "long-text", false),
    field("rejection", "What happens when a request is rejected?", "long-text", false),
    field("delegation", "Who acts when the usual approver is unavailable?", "long-text", false),
    field("automation", "How automated is the process?", "single-select", true, {
      options: ["manual", "partial", "automated"],
    }),
    field("triggers", "What triggers the automated work?", "long-text", false),
    field("inputs", "What inputs does it need?", "long-text", false),
    field("outputs", "What outputs does it produce?", "long-text", false),
    field("integrations", "Which systems does it call?", "long-text", false),
    field("failureHandling", "What happens when the automation fails?", "long-text", false),
  ],
  questions: [
    question("currentProcess", "How is the process currently performed?", "currentProcess", "long-text", true),
    question("futureProcess", "What should the future process do differently?", "futureProcess", "long-text", false),
    question("approvals", "Does this process involve approvals?", "approvals", "single-select", true, {
      options: ["yes", "no"],
      help: "Yes reveals questions about approvers, conditions, escalation, rejection, and delegation.",
    }),
    question("approvers", "Who approves, and in what order?", "approvers", "long-text", false, {
      visibleWhen: { questionId: "approvals", equals: "yes" },
    }),
    question("approvalConditions", "Which conditions must be true before approval?", "approvalConditions", "long-text", false, {
      visibleWhen: { questionId: "approvals", equals: "yes" },
    }),
    question("escalation", "When should an approval escalate?", "escalation", "long-text", false, {
      visibleWhen: { questionId: "approvals", equals: "yes" },
    }),
    question("rejection", "How is a rejection explained and returned?", "rejection", "long-text", false, {
      visibleWhen: { questionId: "approvals", equals: "yes" },
    }),
    question("delegation", "Who approves when the usual approver is unavailable?", "delegation", "long-text", false, {
      visibleWhen: { questionId: "approvals", equals: "yes" },
    }),
    question("automation", "Is the process manual, partly automated, or automated?", "automation", "single-select", true, {
      options: ["manual", "partial", "automated"],
    }),
    question("triggers", "What event starts the automated step?", "triggers", "long-text", false, {
      visibleWhen: { questionId: "automation", equals: "automated" },
    }),
    question("inputs", "What data must be present before the automated step runs?", "inputs", "long-text", false, {
      visibleWhen: { questionId: "automation", equals: "automated" },
    }),
    question("outputs", "What does the automated step write or send?", "outputs", "long-text", false, {
      visibleWhen: { questionId: "automation", equals: "automated" },
    }),
    question("integrations", "Which systems are involved?", "integrations", "long-text", false, {
      visibleWhen: { questionId: "automation", equals: "automated" },
    }),
    question("failureHandling", "What should happen if the automated step fails?", "failureHandling", "long-text", false, {
      visibleWhen: { questionId: "automation", equals: "automated" },
    }),
  ],
}

function narrative(id: string, title: string, order: number, required: boolean, prompt: string, artifacts: string[]): TemplateSection {
  return {
    id,
    title,
    description: prompt,
    order,
    required,
    relatedArtifactTypes: artifacts,
    completionFieldIds: ["body"],
    fields: [field("body", title, "long-text", required)],
    questions: [question("body", prompt, "body", "long-text", required)],
  }
}

export const sectionLibrary = {
  businessContext,
  processSection,
  objectives: narrative("objectives", "Business objectives", 20, true, "Which business objectives does this work serve?", ["outcome"]),
  stakeholders: narrative("stakeholders", "Stakeholders", 30, false, "Who must be consulted, and what do they need from this work?", ["stakeholder"]),
  scope: narrative("scope", "Scope and exclusions", 35, true, "What is inside this effort, and what is explicitly out?", ["assumption"]),
  functional: narrative("functional-requirements", "Functional requirements", 50, true, "What must people be able to do?", ["requirement"]),
  rules: narrative("business-rules", "Business rules", 60, false, "Which rules constrain the behavior? Mark anything not yet confirmed.", ["rule"]),
  useCases: narrative("use-cases", "Use cases", 70, false, "Which goals do actors need to complete?", ["use-case"]),
  data: narrative("data-requirements", "Data requirements", 80, false, "Which information must the solution keep or exchange?", ["entity"]),
  nfr: narrative("non-functional", "Non-functional requirements", 90, false, "Which qualities matter, without inventing a target number?", ["requirement"]),
  acceptance: narrative("acceptance", "Acceptance criteria", 100, false, "How will a stakeholder judge that a requirement is met?", ["criterion"]),
  dependencies: narrative("dependencies", "Dependencies", 110, false, "What does this work depend on?", ["requirement"]),
  assumptions: narrative("assumptions-questions", "Assumptions and open questions", 120, false, "What is still unconfirmed?", ["question", "assumption"]),
  decisions: narrative("decisions", "Decisions and approvals", 130, false, "Which decisions are already made, and which still need an approver?", ["decision"]),
  product: narrative("product-overview", "Product overview", 15, true, "Who is the product for, and what job does it do?", ["outcome"]),
  stories: narrative("user-stories", "User stories", 55, false, "Which stories elaborate the requirements?", ["story"]),
  interfaces: narrative("interfaces", "Interfaces and integrations", 85, true, "Which systems exchange data, and what does each side provide?", ["requirement"]),
  transition: narrative("transition", "Transition", 95, false, "What temporary work is needed to move from the current state?", ["requirement"]),
  quality: narrative("quality-checklist", "Quality checklist", 92, true, "Which quality characteristics need a confirmed measure later?", ["requirement"]),
}

const S = sectionLibrary

function tpl(
  partial: Omit<TemplateDefinition, "sections" | "outputFormats"> & { sections: TemplateSection[]; outputFormats?: string[] }
): TemplateDefinition {
  return {
    ...partial,
    outputFormats: partial.outputFormats ?? ["HTML", "CSV", "JSON"],
  }
}

export const templateCatalog: TemplateDefinition[] = [
  tpl({
    id: "prd",
    name: "Product Requirements Document (PRD)",
    description: "Problem, users, outcomes, stories, and acceptance for a product effort.",
    category: "Product",
    projectTypes: ["product"],
    domains: ["any"],
    startingPoints: ["new"],
    outcomeTags: ["prd-brd", "ui", "baseline"],
    audience: ["Product BA", "Sponsor"],
    complexity: "standard",
    sections: [S.product, S.businessContext, S.objectives, S.stakeholders, S.scope, S.stories, S.acceptance, S.assumptions],
  }),
  tpl({
    id: "brd",
    name: "Business Requirements Document (BRD)",
    description: "Business context, objectives, scope, stakeholders, rules, and decisions.",
    category: "Business",
    projectTypes: ["enterprise", "digitization", "other"],
    domains: ["any"],
    startingPoints: ["new", "digitization"],
    outcomeTags: ["business-requirements", "prd-brd", "baseline"],
    audience: ["Project BA", "Sponsor"],
    complexity: "standard",
    sections: [S.businessContext, S.objectives, S.stakeholders, S.scope, S.rules, S.assumptions, S.decisions],
  }),
  tpl({
    id: "frd",
    name: "Functional Requirements Document (FRD)",
    description: "Functional behavior, rules, use cases, and acceptance.",
    category: "Solution",
    projectTypes: ["enterprise", "product", "enhancement"],
    domains: ["any"],
    startingPoints: ["new", "enhancement"],
    outcomeTags: ["frd-srs", "use-cases", "baseline"],
    audience: ["Project BA", "Developer", "Tester"],
    complexity: "standard",
    sections: [S.businessContext, S.functional, S.rules, S.useCases, S.acceptance],
  }),
  tpl({
    id: "srs",
    name: "Software Requirements Specification (SRS)",
    description: "Solution requirements, interfaces, data, quality, and verification content.",
    category: "Solution",
    projectTypes: ["enterprise", "product", "enhancement"],
    domains: ["any"],
    startingPoints: ["new", "enhancement"],
    outcomeTags: ["frd-srs", "baseline"],
    audience: ["Architect", "Developer", "Tester"],
    complexity: "comprehensive",
    sections: [S.businessContext, S.scope, S.functional, S.interfaces, S.data, S.nfr, S.acceptance, S.dependencies],
  }),
  tpl({
    id: "process-analysis",
    name: "Business Process Analysis",
    description: "Current and future process, actors, and the rules that constrain the flow.",
    category: "Process",
    projectTypes: ["digitization", "enterprise"],
    domains: ["any"],
    startingPoints: ["digitization"],
    outcomeTags: ["processes"],
    audience: ["Project BA", "Stakeholder"],
    complexity: "standard",
    sections: [S.businessContext, S.processSection, S.stakeholders, S.rules],
  }),
  tpl({
    id: "use-case-spec",
    name: "Use Case Specification",
    description: "Actors, goals, main flows, alternatives, and exceptions.",
    category: "Behavior",
    projectTypes: ["enterprise", "product", "digitization"],
    domains: ["any"],
    startingPoints: ["new", "digitization"],
    outcomeTags: ["use-cases"],
    audience: ["Project BA", "Tester"],
    complexity: "standard",
    sections: [S.stakeholders, S.useCases, S.functional, S.acceptance],
  }),
  tpl({
    id: "data-requirements",
    name: "Data Requirements Specification",
    description: "Entities, fields, relationships, and the requirements that use them.",
    category: "Data",
    projectTypes: ["enterprise", "enhancement"],
    domains: ["any"],
    startingPoints: ["new", "enhancement"],
    outcomeTags: ["data-rules"],
    audience: ["Project BA", "Architect"],
    complexity: "comprehensive",
    sections: [S.businessContext, S.data, S.rules, S.interfaces],
  }),
  tpl({
    id: "nfr-checklist",
    name: "Non-Functional Requirements Checklist",
    description: "Quality characteristics that need a confirmed measure. The checklist does not invent targets.",
    category: "Quality",
    projectTypes: ["enterprise", "product", "enhancement"],
    domains: ["any"],
    startingPoints: ["new", "enhancement"],
    outcomeTags: ["frd-srs", "improve"],
    audience: ["Architect", "Tester"],
    complexity: "simple",
    sections: [S.quality, S.nfr, S.acceptance],
  }),
  tpl({
    id: "enhancement",
    name: "Existing System Enhancement",
    description: "What changes in a system that already runs, including transition work.",
    category: "Change",
    projectTypes: ["enhancement"],
    domains: ["any"],
    startingPoints: ["enhancement", "import"],
    outcomeTags: ["improve", "frd-srs"],
    audience: ["Project BA", "Developer"],
    complexity: "standard",
    sections: [S.businessContext, S.scope, S.functional, S.transition, S.acceptance, S.assumptions],
  }),
  tpl({
    id: "workflow-digitization",
    name: "Workflow Digitization",
    description: "An existing business process moving into a system, with rules and acceptance.",
    category: "Process",
    projectTypes: ["digitization", "enterprise"],
    domains: ["hr", "finance", "public", "any"],
    startingPoints: ["digitization"],
    outcomeTags: ["processes", "business-requirements", "data-rules", "baseline"],
    audience: ["Project BA", "Stakeholder", "Tester"],
    complexity: "standard",
    sections: [S.businessContext, S.objectives, S.stakeholders, S.scope, S.processSection, S.functional, S.rules, S.useCases, S.data, S.nfr, S.acceptance, S.dependencies, S.assumptions, S.decisions],
  }),
  tpl({
    id: "api-integration",
    name: "API / Integration Requirements",
    description: "Interfaces, payloads, failures, and the requirements they satisfy.",
    category: "Integration",
    projectTypes: ["enterprise", "enhancement", "product"],
    domains: ["any"],
    startingPoints: ["new", "enhancement"],
    outcomeTags: ["frd-srs"],
    audience: ["Architect", "Developer"],
    complexity: "standard",
    sections: [S.interfaces, S.data, S.functional, S.nfr],
  }),
  tpl({
    id: "user-story-ac",
    name: "User Story and Acceptance Criteria",
    description: "Stories that elaborate requirements, with acceptance the BA writes.",
    category: "Product",
    projectTypes: ["product", "digitization"],
    domains: ["any"],
    startingPoints: ["new"],
    outcomeTags: ["ui", "use-cases"],
    audience: ["Product BA", "Tester"],
    complexity: "simple",
    sections: [S.stories, S.acceptance, S.functional],
  }),
  tpl({
    id: "org-custom",
    name: "Custom Organizational Template",
    description: "A house structure teams can start from and then hide or combine sections.",
    category: "Organization",
    projectTypes: ["other", "enterprise", "product", "digitization", "enhancement"],
    domains: ["any"],
    startingPoints: ["new", "import", "enhancement", "digitization"],
    outcomeTags: ["baseline"],
    audience: ["BA team"],
    complexity: "standard",
    sections: [S.businessContext, S.scope, S.functional, S.acceptance, S.decisions],
  }),
]

export function getTemplate(id: string) {
  return templateCatalog.find((template) => template.id === id)
}

export function mergeTemplates(ids: string[]): TemplateDefinition {
  const chosen = ids.map((id) => getTemplate(id)).filter((item): item is TemplateDefinition => Boolean(item))
  const sections: TemplateSection[] = []
  const seen = new Set<string>()
  for (const template of chosen) {
    for (const section of template.sections) {
      if (seen.has(section.id)) continue
      seen.add(section.id)
      sections.push(section)
    }
  }
  sections.sort((a, b) => a.order - b.order)
  const names = chosen.map((template) => template.name)
  return {
    id: ids.join("+") || "empty",
    name: names.length > 0 ? names.join(" + ") : "No template",
    description: "Sections merged by id so the same heading is not repeated.",
    category: "Combined",
    projectTypes: [],
    domains: [],
    startingPoints: [],
    outcomeTags: [],
    audience: [...new Set(chosen.flatMap((template) => template.audience))],
    complexity: "standard",
    sections,
    outputFormats: ["HTML", "CSV", "JSON"],
  }
}

export function activeTemplate(templateIds: string[], hiddenSectionIds: string[]) {
  const merged = mergeTemplates(templateIds)
  return {
    ...merged,
    sections: merged.sections.filter((section) => !hiddenSectionIds.includes(section.id)),
  }
}
