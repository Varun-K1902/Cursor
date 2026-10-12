import type {
  Assumption,
  BasisState,
  DataEntity,
  DetailLevel,
  Initiative,
  Requirement,
  WorkspaceState,
} from "@/lib/types"
import { recommendTemplate, type ProjectContext } from "@/lib/re/recommend"

export function emptyCollections(): Omit<BasisState, "schema" | "initiative"> {
  return {
    teams: [],
    stakeholders: [],
    roles: [],
    raci: [],
    outcomes: [],
    needs: [],
    requirements: [],
    criteria: [],
    glossary: [],
    dataElements: [],
    rules: [],
    flows: [],
    epics: [],
    stories: [],
    questions: [],
    decisions: [],
    traces: [],
    baselines: [],
    changes: [],
    assumptions: [],
    comments: [],
    reviews: [],
    activity: [],
    sectionAnswers: {},
    sectionFlags: {},
    processModels: [],
    useCases: [],
    entities: [],
    entityRelations: [],
    uiComponents: [],
    testScenarios: [],
    impacts: [],
    suggestions: [],
    imports: [],
    issuedCodes: [],
  }
}

export function createProjectFromContext(input: {
  id: string
  name: string
  description: string
  problem: string
  outcome: string
  ownerName: string
  organization: string
  context: ProjectContext
  templateIds: string[]
  collaboration: string
  draft: boolean
  now: string
}): BasisState {
  const recommendation = recommendTemplate({ ...input.context, templateId: input.templateIds[0] })
  const templateIds = input.templateIds.length > 0 ? input.templateIds : [recommendation.templateId]
  const initiative: Initiative = {
    id: input.id,
    name: input.name.trim() || "Untitled project",
    shortName: (input.name.trim() || "Project").slice(0, 24),
    agency: input.organization.trim() || "Unspecified organization",
    problem: input.problem.trim() || input.description.trim() || "Problem still to be captured.",
    approach: input.outcome.trim() || "Outcome still to be captured.",
    description: input.description.trim(),
    ownerName: input.ownerName.trim() || "Unassigned",
    organization: input.organization.trim(),
    sample: false,
    draft: input.draft,
    domain: input.context.domain,
    customDomain: "",
    projectType: input.context.projectType,
    startingPoint: input.context.startingPoint,
    desiredOutcomes: input.context.outcomes,
    collaboration: input.collaboration,
    detailLevel: input.context.detailLevel,
    templateIds,
    hiddenSectionIds: [],
    recommendationReason: recommendation.reason,
    updatedAt: input.now,
  }
  const ownerId = `${input.id}-owner`
  return {
    schema: 2,
    initiative,
    ...emptyCollections(),
    teams: [{ id: `${input.id}-team`, name: "Analysis team", purpose: "Authors the requirements record." }],
    stakeholders: [
      {
        id: ownerId,
        name: initiative.ownerName,
        roleTitle: "Business analyst",
        teamId: `${input.id}-team`,
        kind: "author",
        influence: "high",
        interest: "Keeps the requirements record.",
      },
    ],
    activity: [
      {
        id: `${input.id}-created`,
        at: input.now,
        actorRole: "ba",
        message: input.draft ? "Draft workspace saved." : "Workspace created from the recommended template.",
      },
    ],
    sectionAnswers: {
      "business-context": {
        problem: initiative.problem,
        outcomes: initiative.approach,
        objectives: initiative.approach,
      },
    },
  }
}

function requirement(partial: Requirement): Requirement {
  return partial
}

function entity(name: string, description: string, fields: DataEntity["fields"], requirementIds: string[], ruleIds: string[] = []): DataEntity {
  return { id: `ent-${name.toLowerCase()}`, name, description, fields, requirementIds, ruleIds }
}

function column(
  name: string,
  type: DataEntity["fields"][number]["type"],
  extra: Partial<DataEntity["fields"][number]> = {}
): DataEntity["fields"][number] {
  return {
    id: `fld-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    type,
    required: false,
    primaryKey: false,
    unique: false,
    description: "",
    defaultValue: "",
    enumValues: [],
    foreignKeyEntityId: "",
    ...extra,
  }
}

export function createElmProject(): BasisState {
  const assumptions: Assumption[] = [
    {
      id: "as-01",
      code: "AS-01",
      statement: "Weekends are excluded from leave duration.",
      reason: "Mentioned in a workshop, not confirmed by HR policy.",
      relatedId: "req-003",
      ownerId: "sh-hr",
      validation: "unconfirmed",
      consequence: "Balances and duration could be wrong for every request.",
    },
    {
      id: "as-02",
      code: "AS-02",
      statement: "An approved request can be cancelled by the employee until the leave starts.",
      reason: "The current spreadsheet allows it. Policy is not cited.",
      relatedId: "req-001",
      ownerId: "sh-maya",
      validation: "unconfirmed",
      consequence: "Managers may see a cancellation the system refuses, or the reverse.",
    },
  ]
  return {
    schema: 2,
    initiative: {
      id: "elm",
      name: "Employee Leave Management",
      shortName: "Leave",
      agency: "People operations",
      problem: "Leave requests move through email and a shared spreadsheet. Balances are checked by hand, and employees cannot see status without asking.",
      approach: "Digitize employee leave requests and approvals so submission, balance checks, and decisions are recorded in one place.",
      description: "Sample project. Policies in this record are illustrative until HR confirms them.",
      ownerName: "Maya Chen",
      organization: "People operations",
      sample: true,
      draft: false,
      domain: "hr",
      customDomain: "",
      projectType: "digitization",
      startingPoint: "digitization",
      desiredOutcomes: ["business-requirements", "processes", "data-rules", "baseline"],
      collaboration: "ba-team",
      detailLevel: "standard",
      templateIds: ["workflow-digitization"],
      hiddenSectionIds: [],
      recommendationReason:
        "Recommended because this project involves digitizing an existing business process and requires functional requirements, process flows, business rules, and acceptance criteria.",
      updatedAt: "2026-10-01",
    },
    teams: [
      { id: "tm-hr", name: "People operations", purpose: "Owns leave policy and the employee experience." },
      { id: "tm-delivery", name: "HR systems", purpose: "Builds and tests the leave workflow." },
    ],
    stakeholders: [
      { id: "sh-maya", name: "Maya Chen", roleTitle: "Project BA", teamId: "tm-delivery", kind: "author", influence: "high", interest: "Holds the requirements record." },
      { id: "sh-owen", name: "Owen Patel", roleTitle: "Line manager", teamId: "tm-hr", kind: "owner", influence: "high", interest: "Approves or rejects team leave." },
      { id: "sh-lena", name: "Lena Ortiz", roleTitle: "Employee", teamId: "tm-hr", kind: "consulted", influence: "medium", interest: "Submits leave and checks status." },
      { id: "sh-hr", name: "HR Policy", roleTitle: "Policy partner", teamId: "tm-hr", kind: "consulted", influence: "high", interest: "Confirms which rules are real policy." },
      { id: "sh-sam", name: "Sam Ibrahim", roleTitle: "Sponsor", teamId: "tm-hr", kind: "sponsor", influence: "high", interest: "Wants a single recorded decision for each request." },
    ],
    roles: [
      { id: "role-employee", name: "Employee", mission: "Requests leave and reads the decision.", stakeholderId: "sh-lena" },
      { id: "role-manager", name: "Approver", mission: "Approves or rejects a request.", stakeholderId: "sh-owen" },
      { id: "role-ba", name: "Business analyst", mission: "Keeps the record current.", stakeholderId: "sh-maya" },
    ],
    raci: [
      {
        id: "raci-1",
        activity: "Confirm leave policy",
        note: "Unconfirmed sample. HR still has to sign the rules.",
        assignments: [
          { roleId: "role-ba", letter: "R" },
          { roleId: "role-manager", letter: "C" },
        ],
      },
    ],
    outcomes: [
      {
        id: "oc-01",
        code: "BO-01",
        title: "Digitize leave requests and approvals",
        statement: "Employees submit leave, managers decide, and the decision is recorded without a side spreadsheet.",
        measure: "A request has one visible status from submission to decision.",
        ownerId: "sh-sam",
      },
    ],
    needs: [
      { id: "nd-01", code: "SN-01", stakeholderId: "sh-lena", statement: "Employees need to submit a request and see its status.", priority: "must" },
      { id: "nd-02", code: "SN-02", stakeholderId: "sh-owen", statement: "Managers need to approve or reject with the balance check visible.", priority: "must" },
    ],
    requirements: [
      requirement({
        id: "req-001",
        code: "REQ-001",
        kind: "functional",
        title: "Employees can submit leave requests",
        statement: "An employee can submit a leave request with the leave type, start date, and end date.",
        status: "approved",
        version: "1.0",
        ownerId: "sh-maya",
        source: "Workshop 12 Mar 2026",
        priority: "must",
        rationale: "Submission is the start of the digitized process.",
        relatedProcessId: "node-submit",
        updatedAt: "2026-09-12",
      }),
      requirement({
        id: "req-002",
        code: "REQ-002",
        kind: "functional",
        title: "Managers can approve or reject requests",
        statement: "A manager can approve or reject a submitted request and must record a reason when rejecting.",
        status: "in-review",
        version: "0.3",
        ownerId: "sh-maya",
        source: "Workshop 12 Mar 2026",
        priority: "must",
        rationale: "The decision has to be explicit.",
        relatedProcessId: "node-decide",
        updatedAt: "2026-09-20",
      }),
      requirement({
        id: "req-003",
        code: "REQ-003",
        kind: "functional",
        title: "The system validates leave balance",
        statement: "The system validates leave balance according to configured rules before a request can be submitted.",
        status: "changed",
        version: "0.4",
        ownerId: "sh-maya",
        source: "HR policy, unconfirmed",
        priority: "must",
        rationale: "Balance checks are policy, and the policy is not confirmed in this sample.",
        updatedAt: "2026-10-02",
      }),
      requirement({
        id: "req-004",
        code: "REQ-004",
        kind: "functional",
        title: "Employees can view request status",
        statement: "An employee can view the status of each request they submitted.",
        status: "draft",
        version: "0.1",
        ownerId: "sh-maya",
        source: "Employee interview",
        priority: "should",
        rationale: "Status should not require an email to the manager.",
        updatedAt: "2026-09-18",
      }),
      requirement({
        id: "req-005",
        code: "REQ-005",
        kind: "functional",
        title: "The system records approval decisions",
        statement: "The system records the approver, the decision, and the time of the decision.",
        status: "draft",
        version: "0.1",
        ownerId: "sh-maya",
        source: "Sponsor",
        priority: "must",
        rationale: "The record replaces the spreadsheet history.",
        updatedAt: "2026-09-18",
      }),
    ],
    criteria: [
      {
        id: "ac-001",
        parentKind: "requirement",
        parentId: "req-001",
        style: "gwt",
        given: "an employee with access to the leave form",
        when: "they submit type, start, and end",
        then: "the request is stored and its status is Submitted",
      },
    ],
    glossary: [
      { id: "g-leave", term: "Leave request", definition: "An employee's ask to be absent for a period. The policy behind it is unconfirmed in this sample.", aliases: ["request"] },
    ],
    dataElements: [
      { id: "de-balance", code: "DE-01", name: "Leave balance", description: "Remaining units for a leave type. The unit is unconfirmed.", format: "decimal", ownerId: "sh-hr" },
      { id: "de-status", code: "DE-02", name: "Request status", description: "Submitted, approved, or rejected.", format: "enumerated", ownerId: "sh-maya" },
    ],
    rules: [
      {
        id: "br-balance",
        code: "BR-01",
        kind: "operative",
        title: "Sufficient balance before submission",
        statement: "IF leave balance is sufficient AND the request meets the configured policy, THEN permit submission. This example is unconfirmed.",
        source: "Illustrative only — HR has not confirmed this policy.",
        clauses: [
          { left: "leave balance", operator: "is", right: "sufficient" },
          { left: "request", operator: "meets", right: "configured policy", join: "AND" },
        ],
        result: "Permit submission",
        exceptions: "Unknown until HR confirms exception cases.",
        ownerId: "sh-hr",
        status: "unconfirmed",
        effectiveDate: "",
        requirementIds: ["req-003"],
      },
    ],
    flows: [
      {
        id: "fl-future",
        code: "FL-01",
        kind: "future",
        title: "Future leave request",
        intent: "Employee submits, balance is checked, manager decides, employee sees the result.",
        steps: [
          { id: "fs-1", actor: "Employee", action: "Submits a leave request." },
          { id: "fs-2", actor: "System", action: "Checks the configured balance rule." },
          { id: "fs-3", actor: "Manager", action: "Approves or rejects." },
        ],
      },
    ],
    epics: [{ id: "ep-01", code: "EP-01", title: "Request and decide", statement: "Cover submission through a recorded decision.", requirementId: "req-001" }],
    stories: [
      {
        id: "us-01",
        code: "US-01",
        epicId: "ep-01",
        title: "Submit leave",
        statement: "As an employee, I can submit a leave request so that my manager can decide it.",
        requirementId: "req-001",
      },
    ],
    questions: [
      { id: "q-01", code: "Q-01", prompt: "Are weekends excluded from leave calculations?", raisedById: "sh-maya", status: "open", relatedId: "req-003", sectionId: "business-rules", priority: "high", assignedStakeholderId: "sh-hr", answer: "", raisedOn: "2026-09-01", resolvedOn: "" },
      { id: "q-02", code: "Q-02", prompt: "Which holidays apply to each employee location?", raisedById: "sh-maya", status: "assigned", relatedId: "req-003", priority: "high", assignedStakeholderId: "sh-hr", answer: "", raisedOn: "2026-09-01", resolvedOn: "" },
      { id: "q-03", code: "Q-03", prompt: "Can an approved request be cancelled?", raisedById: "sh-lena", status: "awaiting", relatedId: "req-001", priority: "medium", assignedStakeholderId: "sh-hr", answer: "", raisedOn: "2026-09-04", resolvedOn: "" },
      { id: "q-04", code: "Q-04", prompt: "Who approves requests when the manager is unavailable?", raisedById: "sh-owen", status: "open", relatedId: "req-002", priority: "high", assignedStakeholderId: "sh-sam", answer: "", raisedOn: "2026-09-04", resolvedOn: "" },
      { id: "q-05", code: "Q-05", prompt: "What happens when an employee has insufficient leave balance?", raisedById: "sh-maya", status: "open", relatedId: "req-003", priority: "high", assignedStakeholderId: "sh-hr", answer: "", raisedOn: "2026-09-04", resolvedOn: "" },
    ],
    decisions: [
      {
        id: "d-01",
        code: "D-01",
        title: "Sample policies stay unconfirmed",
        outcome: "No leave policy in this sample is treated as approved fact.",
        decidedById: "sh-maya",
        decidedOn: "2026-09-02",
        context: "The sample needs realistic rules without pretending HR has signed them.",
        options: "Mark the sample confirmed, or keep every policy unconfirmed.",
        rationale: "A BA should see the confirmation gap.",
        relatedIds: ["br-balance"],
      },
    ],
    traces: [
      { id: "tl-1", relation: "derives-from", fromId: "nd-01", toId: "oc-01" },
      { id: "tl-2", relation: "derives-from", fromId: "req-001", toId: "nd-01" },
      { id: "tl-3", relation: "derives-from", fromId: "req-002", toId: "nd-02" },
      { id: "tl-4", relation: "derives-from", fromId: "req-003", toId: "oc-01" },
      { id: "tl-5", relation: "constrained-by", fromId: "req-003", toId: "br-balance" },
      { id: "tl-6", relation: "elaborates", fromId: "us-01", toId: "req-001" },
      { id: "tl-7", relation: "elaborates", fromId: "fl-future", toId: "req-001" },
      { id: "tl-8", relation: "uses", fromId: "req-003", toId: "de-balance" },
      { id: "tl-9", relation: "uses", fromId: "req-004", toId: "de-status" },
    ],
    baselines: [
      {
        id: "bl-2026-1",
        name: "Leave 2026.1",
        status: "approved",
        approvedOn: "2026-09-15",
        approverId: "sh-sam",
        note: "Approved sample baseline for submission only. Balance policy is not in this baseline as confirmed policy.",
        snapshots: [
          {
            requirementId: "req-001",
            code: "REQ-001",
            title: "Employees can submit leave requests",
            version: "1.0",
            statement: "An employee can submit a leave request with the leave type, start date, and end date.",
            kind: "functional",
          },
        ],
      },
    ],
    changes: [
      {
        id: "crq-001",
        code: "CRQ-001",
        title: "Say the balance check uses configured rules",
        rationale: "The earlier wording said the system checks balance without naming that the rule is configured and unconfirmed.",
        requirementId: "req-003",
        fromVersion: "0.3",
        toVersion: "0.4",
        fromStatement: "The system checks leave balance before submission.",
        toStatement: "The system validates leave balance according to configured rules before a request can be submitted.",
        fromBaselineId: "bl-2026-1",
        toBaselineId: "",
        createdOn: "2026-10-02",
      },
    ],
    assumptions,
    comments: [
      {
        id: "c-01",
        objectId: "req-002",
        authorRole: "reviewer",
        body: "Please say whether a rejection reason is required. I cannot approve this until that is explicit.",
        createdAt: "2026-09-21",
        resolved: false,
      },
    ],
    reviews: [
      {
        id: "rv-01",
        objectId: "req-001",
        reviewerRole: "approver",
        decision: "approved",
        note: "Submission scope is clear enough for this baseline.",
        at: "2026-09-15",
      },
    ],
    activity: [
      { id: "act-1", at: "2026-09-15", actorRole: "approver", message: "Approved REQ-001.", objectId: "req-001" },
      { id: "act-2", at: "2026-10-02", actorRole: "ba", message: "Updated REQ-003 and flagged related objects for review.", objectId: "req-003" },
    ],
    sectionAnswers: {
      "business-context": {
        problem: "Leave requests move through email and a shared spreadsheet.",
        objectives: "Digitize employee leave requests and approvals.",
        challenges: "Balance is checked by hand, and status is invisible to the employee.",
        outcomes: "Every request has a recorded status and decision.",
        stakeholders: "Employee\nLine manager\nHR policy",
        scope: "Submission, balance check, approval or rejection, and status.",
        outOfScope: "Payroll calculation and recruitment.",
        constraints: "Policy text is not confirmed.",
        assumptions: "Weekends and holiday calendars are still open questions.",
      },
      processes: {
        currentProcess: "The employee emails a manager. The manager checks a spreadsheet.",
        futureProcess: "The employee submits in the system. The system applies the configured rule. The manager decides.",
        approvals: "yes",
        approvers: "The line manager. Delegation is an open question.",
        approvalConditions: "A submitted request with dates. The balance rule is unconfirmed.",
        escalation: "Not confirmed.",
        rejection: "The manager records a reason. The employee can see it.",
        delegation: "Open question Q-04.",
        automation: "partial",
      },
    },
    sectionFlags: {},
    processModels: [
      {
        id: "pm-leave",
        name: "Leave request example",
        example: true,
        nodes: [
          { id: "node-start", type: "start", label: "Start", x: 40, y: 80, linkedIds: [] },
          { id: "node-submit", type: "activity", label: "Submit request", x: 180, y: 70, linkedIds: ["req-001"] },
          { id: "node-balance", type: "decision", label: "Balance sufficient?", x: 360, y: 60, linkedIds: ["req-003", "br-balance"] },
          { id: "node-decide", type: "approval", label: "Manager decides", x: 560, y: 40, linkedIds: ["req-002"] },
          { id: "node-record", type: "system", label: "Record decision", x: 760, y: 40, linkedIds: ["req-005"] },
          { id: "node-reject", type: "exception", label: "Return to employee", x: 560, y: 180, linkedIds: ["req-004"] },
          { id: "node-end", type: "end", label: "End", x: 960, y: 50, linkedIds: [] },
        ],
        edges: [
          { id: "e1", from: "node-start", to: "node-submit" },
          { id: "e2", from: "node-submit", to: "node-balance" },
          { id: "e3", from: "node-balance", to: "node-decide", label: "yes" },
          { id: "e4", from: "node-balance", to: "node-reject", label: "no" },
          { id: "e5", from: "node-decide", to: "node-record" },
          { id: "e6", from: "node-record", to: "node-end" },
        ],
      },
    ],
    useCases: [
      {
        id: "uc-001",
        code: "UC-001",
        name: "Submit leave request",
        goal: "An employee files a leave request for a date range.",
        primaryActor: "Employee",
        supportingActors: "Line manager, HR policy",
        trigger: "The employee needs to be absent.",
        preconditions: "The employee can sign in. The leave types are configured.",
        postconditions: "A request exists with status Submitted, or the employee sees why it was not accepted.",
        mainFlow: [
          { id: "uc-s1", text: "The employee opens the leave form." },
          { id: "uc-s2", text: "The employee enters type, start date, and end date." },
          { id: "uc-s3", text: "The system stores the request and shows status Submitted." },
        ],
        alternativeFlows: [{ id: "uc-a1", name: "Manager unavailable", steps: [{ id: "uc-a1s", text: "Delegation is not specified. See Q-04." }] }],
        exceptionFlows: [{ id: "uc-x1", name: "Insufficient balance", steps: [{ id: "uc-x1s", text: "The outcome is unconfirmed. See Q-05." }] }],
        ruleIds: ["br-balance"],
        requirementIds: ["req-001", "req-003"],
        acceptance: "The stored request shows the dates the employee entered.",
        status: "draft",
      },
    ],
    entities: [
      entity("Employee", "A person who can request leave.", [
        column("employeeId", "text", { primaryKey: true, required: true, unique: true, description: "Stable employee id." }),
        column("name", "text", { required: true }),
        column("email", "email"),
        column("location", "text", { description: "Used once holiday calendars are confirmed." }),
      ], ["req-001"]),
      entity("LeaveRequest", "A submitted request. Status values are a working list.", [
        column("requestId", "text", { primaryKey: true, required: true, unique: true }),
        column("employeeId", "text", { required: true, foreignKeyEntityId: "ent-employee" }),
        column("startDate", "date", { required: true }),
        column("endDate", "date", { required: true }),
        column("status", "enum", { enumValues: ["submitted", "approved", "rejected"], required: true }),
      ], ["req-001", "req-004"]),
      entity("LeaveBalance", "Remaining leave. The unit and the policy are unconfirmed.", [
        column("balanceId", "text", { primaryKey: true, required: true }),
        column("employeeId", "text", { required: true, foreignKeyEntityId: "ent-employee" }),
        column("units", "decimal", { required: true, description: "Unit is unconfirmed." }),
      ], ["req-003"], ["br-balance"]),
      entity("Approval", "A recorded decision.", [
        column("approvalId", "text", { primaryKey: true, required: true }),
        column("requestId", "text", { required: true, foreignKeyEntityId: "ent-leaverequest" }),
        column("decision", "enum", { enumValues: ["approved", "rejected"], required: true }),
        column("decidedAt", "datetime", { required: true }),
      ], ["req-005", "req-002"]),
      entity("HolidayCalendar", "Location holidays. Which calendar applies is an open question.", [
        column("holidayId", "text", { primaryKey: true, required: true }),
        column("location", "text", { required: true }),
        column("date", "date", { required: true }),
      ], ["req-003"]),
    ],
    entityRelations: [
      { id: "rel-1", fromId: "ent-employee", toId: "ent-leaverequest", kind: "one-to-many", label: "submits" },
      { id: "rel-2", fromId: "ent-employee", toId: "ent-leavebalance", kind: "one-to-many", label: "has" },
      { id: "rel-3", fromId: "ent-leaverequest", toId: "ent-approval", kind: "one-to-many", label: "decided by" },
    ],
    uiComponents: [
      { id: "ui-form", name: "Leave request form", description: "Type, start, end, and submit. High-fidelity visual design is unavailable.", requirementIds: ["req-001"] },
      { id: "ui-status", name: "Request status list", description: "The employee sees status for their own requests.", requirementIds: ["req-004"] },
    ],
    testScenarios: [
      { id: "ts-001", code: "TS-001", title: "Submit a dated request", requirementId: "req-001", steps: "Sign in as an employee, enter dates, submit, and read the stored status." },
    ],
    impacts: [
      {
        id: "imp-1",
        sourceId: "req-003",
        targetId: "br-balance",
        targetLabel: "BR-01 Sufficient balance before submission",
        reason: "REQ-003 now says the balance check uses configured rules. The sample rule is still unconfirmed, so it needs review. The rule text was not overwritten.",
        status: "needs-review",
      },
      {
        id: "imp-2",
        sourceId: "req-003",
        targetId: "uc-001",
        targetLabel: "UC-001 Submit leave request",
        reason: "The use case cites the balance check. Review the exception flow. The use case was not overwritten.",
        status: "needs-review",
      },
    ],
    suggestions: [
      {
        id: "sug-1",
        targetId: "req-003",
        operation: "analyzeRequirement",
        kind: "missing",
        title: "The balance rule is not confirmed.",
        body: "REQ-003 depends on configured rules. BR-01 is marked unconfirmed. Accepting this note does not invent the policy.",
        proposedText: "",
        status: "pending",
      },
    ],
    imports: [],
    issuedCodes: ["REQ-001", "REQ-002", "REQ-003", "REQ-004", "REQ-005"],
  }
}

export function createWorkspace(): WorkspaceState {
  const project = createElmProject()
  return { schema: 2, activeProjectId: project.initiative.id, role: "ba", projects: [project] }
}

export function detailLevelOr(value: string): DetailLevel {
  if (value === "simple" || value === "comprehensive") return value
  return "standard"
}
