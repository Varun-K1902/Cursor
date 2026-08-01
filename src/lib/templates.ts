import type { Edge, Node } from "@xyflow/react";
import { createId } from "./ids";
import { makeNodeData } from "./defaults";
import type { Solution, SpecNodeData, Workflow } from "./types";

type N = Node<SpecNodeData>;

function n(
  id: string,
  kind: SpecNodeData["kind"],
  label: string,
  x: number,
  y: number,
  detail: Parameters<typeof makeNodeData>[2] = {},
): N {
  return {
    id,
    type: "spec",
    position: { x, y },
    data: makeNodeData(kind, label, detail),
  };
}

function e(
  id: string,
  source: string,
  target: string,
  label?: string,
): Edge {
  return {
    id,
    source,
    target,
    label,
    type: "smoothstep",
    animated: false,
  };
}

function workflow(
  name: string,
  description: string,
  nodes: N[],
  edges: Edge[],
): Workflow {
  return {
    id: createId("wf"),
    name,
    description,
    nodes,
    edges,
  };
}

function stamp(partial: Omit<Solution, "id" | "createdAt" | "updatedAt" | "activeWorkflowId">): Solution {
  const id = createId("sol");
  const now = new Date().toISOString();
  return {
    ...partial,
    id,
    activeWorkflowId: partial.workflows[0]?.id ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export function inventoryTemplate(): Solution {
  const receive = workflow(
    "Goods Receipt & Putaway",
    "From vendor arrival to bin placement with QC and exception handling.",
    [
      n("inv-1", "trigger", "Shipment arrives", 40, 180, {
        summary: "Inbound ASN or gate entry starts receiving.",
        actors: ["Warehouse Clerk", "Security"],
        inputs: ["ASN / PO reference", "Vehicle seal number"],
        outputs: ["Gate entry log"],
        acceptanceCriteria: [
          "Shipment is linked to an open PO within 5 minutes of gate-in",
          "Seal mismatch blocks putaway until supervisor override",
        ],
        complianceTags: ["Audit trail", "Chain of custody"],
        priority: "must",
        status: "agreed",
      }),
      n("inv-2", "process", "Verify against PO", 280, 180, {
        summary: "Match delivered lines to purchase order quantities and SKUs.",
        actors: ["Receiving Officer"],
        systems: ["WMS", "ERP"],
        inputs: ["PO lines", "Physical counts"],
        outputs: ["Receiving variance report"],
        businessRules: [
          "Variance > 2% requires supervisor review",
          "Expired goods cannot be accepted",
        ],
        acceptanceCriteria: [
          "All lines are marked received, short, or over before putaway",
        ],
        complianceTags: ["Segregation of duties"],
        priority: "must",
        status: "agreed",
      }),
      n("inv-3", "decision", "QC required?", 520, 180, {
        summary: "Route high-risk or regulated SKUs through quality check.",
        actors: ["QC Inspector"],
        businessRules: [
          "Pharma, food, and serialized assets always require QC",
          "Trusted vendor + historical pass rate may skip QC",
        ],
        acceptanceCriteria: [
          "Decision reason is logged for every receipt",
        ],
        priority: "must",
        status: "draft",
      }),
      n("inv-4", "approval", "QC disposition", 760, 60, {
        summary: "Accept, quarantine, or reject after inspection.",
        actors: ["QC Lead"],
        outputs: ["Disposition certificate"],
        complianceTags: ["ISO / GMP evidence"],
        acceptanceCriteria: [
          "Rejected lots are blocked from available stock",
        ],
        priority: "must",
        status: "draft",
      }),
      n("inv-5", "system", "Allocate bin location", 760, 300, {
        summary: "WMS suggests putaway location by zone rules.",
        systems: ["WMS"],
        businessRules: [
          "Hazardous goods only in hazmat zones",
          "FEFO for perishables",
        ],
        outputs: ["Putaway task"],
        priority: "should",
        status: "draft",
      }),
      n("inv-6", "data", "Update stock ledger", 1000, 180, {
        summary: "Post inventory and financial quantities.",
        systems: ["WMS", "ERP GL"],
        outputs: ["Stock balance", "GRN document"],
        complianceTags: ["Immutable ledger"],
        acceptanceCriteria: [
          "Stock and financial postings reconcile within the same posting period",
        ],
        priority: "must",
        status: "agreed",
      }),
      n("inv-7", "outcome", "Stock available", 1240, 180, {
        summary: "Inventory is pickable for fulfilment.",
        acceptanceCriteria: [
          "Available-to-promise reflects putaway within 1 minute",
        ],
        priority: "must",
        status: "agreed",
      }),
    ],
    [
      e("ie1", "inv-1", "inv-2"),
      e("ie2", "inv-2", "inv-3"),
      e("ie3", "inv-3", "inv-4", "Yes"),
      e("ie4", "inv-3", "inv-5", "No"),
      e("ie5", "inv-4", "inv-5", "Accepted"),
      e("ie6", "inv-5", "inv-6"),
      e("ie7", "inv-6", "inv-7"),
    ],
  );

  const issue = workflow(
    "Issue & Replenishment",
    "Store / dept issue requests through pick, issue, and min-max replenishment.",
    [
      n("iss-1", "trigger", "Issue request raised", 60, 160, {
        summary: "Consuming unit requests stock against cost centre.",
        actors: ["Store Indentor"],
        inputs: ["SKU", "Qty", "Cost centre"],
        priority: "must",
        status: "agreed",
      }),
      n("iss-2", "approval", "Budget / authority check", 300, 160, {
        summary: "Validate entitlement and spending limits.",
        actors: ["Store Officer", "Budget Controller"],
        businessRules: ["Requests above threshold need dual approval"],
        complianceTags: ["Financial control"],
        priority: "must",
        status: "draft",
      }),
      n("iss-3", "process", "Pick & issue", 540, 160, {
        summary: "Pick by FEFO/FIFO and hand over with acknowledgement.",
        actors: ["Picker"],
        systems: ["WMS"],
        outputs: ["Issue voucher", "Bin decrement"],
        priority: "must",
        status: "agreed",
      }),
      n("iss-4", "decision", "Below reorder point?", 780, 160, {
        summary: "Evaluate min-max after issue.",
        systems: ["WMS"],
        priority: "should",
        status: "draft",
      }),
      n("iss-5", "system", "Create replenishment PR", 1020, 80, {
        summary: "Auto-raise purchase requisition for depleted SKUs.",
        systems: ["ERP Procurement"],
        outputs: ["PR draft"],
        priority: "should",
        status: "draft",
      }),
      n("iss-6", "outcome", "Issue closed", 1020, 240, {
        summary: "Consuming unit has stock; ledger updated.",
        priority: "must",
        status: "agreed",
      }),
    ],
    [
      e("ise1", "iss-1", "iss-2"),
      e("ise2", "iss-2", "iss-3", "Approved"),
      e("ise3", "iss-3", "iss-4"),
      e("ise4", "iss-4", "iss-5", "Yes"),
      e("ise5", "iss-4", "iss-6", "No"),
      e("ise6", "iss-5", "iss-6"),
    ],
  );

  return stamp({
    name: "Central Stores Inventory",
    domain: "inventory",
    tagline: "Governed stock from gate to ledger",
    description:
      "Enterprise inventory control for multi-warehouse government / PSU stores — receiving, QC, putaway, issue, and replenishment with full auditability.",
    customer: "State Central Procurement & Stores",
    stakeholders: [
      {
        id: createId("st"),
        name: "Chief Stores Officer",
        role: "Business Owner",
        organization: "Central Stores",
        interest: "Stock accuracy and service levels",
      },
      {
        id: createId("st"),
        name: "Finance Controller",
        role: "Approver",
        organization: "Accounts",
        interest: "Valuation, GR/IR, and spend control",
      },
      {
        id: createId("st"),
        name: "IT Programme Manager",
        role: "Delivery Sponsor",
        organization: "e-Governance Cell",
        interest: "Integration with ERP and identity stack",
      },
    ],
    modules: [
      "Masters & SKU governance",
      "Inbound receiving",
      "Quality control",
      "Putaway & binning",
      "Issues & transfers",
      "Cycle count",
      "Replenishment",
      "Audit & reconciliation",
    ],
    constraints: [
      "Must integrate with existing ERP purchase orders",
      "Offline-capable gate entry for low-connectivity sites",
      "Bilingual UI (English + regional language)",
      "Role-based access via government SSO",
    ],
    complianceFrameworks: [
      "GFR / financial propriety",
      "ISO 9001 process evidence",
      "Data retention for 7 years",
    ],
    successMetrics: [
      "Inventory accuracy ≥ 98%",
      "GRN cycle time < 4 hours",
      "Zero untraced high-value assets",
    ],
    glossary: [
      {
        id: createId("gl"),
        term: "GRN",
        definition: "Goods Receipt Note confirming physical receipt against PO.",
      },
      {
        id: createId("gl"),
        term: "FEFO",
        definition: "First Expired, First Out picking strategy for dated stock.",
      },
      {
        id: createId("gl"),
        term: "ASN",
        definition: "Advance Shipping Notice from vendor prior to arrival.",
      },
    ],
    workflows: [receive, issue],
  });
}

export function hrmsTemplate(): Solution {
  const hire = workflow(
    "Hire-to-Onboard",
    "From approved vacancy to day-one access provisioning.",
    [
      n("hr-1", "trigger", "Vacancy approved", 40, 160, {
        summary: "Budgeted headcount is released for recruitment.",
        actors: ["Hiring Manager", "HRBP"],
        inputs: ["Job description", "Grade", "Cost centre"],
        complianceTags: ["Sanctioned strength"],
        priority: "must",
        status: "agreed",
      }),
      n("hr-2", "process", "Post & shortlist", 280, 160, {
        summary: "Publish requisition and shortlist eligible candidates.",
        actors: ["Recruiter"],
        systems: ["ATS"],
        businessRules: ["Reservation / diversity policy applied to shortlist"],
        priority: "must",
        status: "draft",
      }),
      n("hr-3", "approval", "Selection panel", 520, 160, {
        summary: "Panel interview and score consolidation.",
        actors: ["Selection Committee"],
        outputs: ["Score sheet", "Offer recommendation"],
        complianceTags: ["Fairness & transparency"],
        acceptanceCriteria: [
          "Panel composition matches grade policy",
          "Conflict-of-interest declarations captured",
        ],
        priority: "must",
        status: "agreed",
      }),
      n("hr-4", "system", "Background & medical", 760, 80, {
        summary: "Trigger verification workflows for selected candidate.",
        systems: ["Background vendor", "Occupational health"],
        priority: "must",
        status: "draft",
      }),
      n("hr-5", "process", "Offer & joining", 760, 240, {
        summary: "Issue offer, collect docs, set joining date.",
        actors: ["HR Operations"],
        outputs: ["Appointment letter", "Employee ID"],
        priority: "must",
        status: "agreed",
      }),
      n("hr-6", "system", "Provision access", 1000, 160, {
        summary: "Create identity, payroll, and workplace access.",
        systems: ["IAM", "Payroll", "ITSM"],
        acceptanceCriteria: [
          "Day-one access ready 24h before joining for pre-cleared hires",
        ],
        priority: "should",
        status: "draft",
      }),
      n("hr-7", "outcome", "Employee active", 1240, 160, {
        summary: "Employee appears on roster with correct entitlements.",
        priority: "must",
        status: "agreed",
      }),
    ],
    [
      e("hre1", "hr-1", "hr-2"),
      e("hre2", "hr-2", "hr-3"),
      e("hre3", "hr-3", "hr-4", "Selected"),
      e("hre4", "hr-4", "hr-5", "Cleared"),
      e("hre5", "hr-5", "hr-6"),
      e("hre6", "hr-6", "hr-7"),
    ],
  );

  const leave = workflow(
    "Leave & Attendance Exception",
    "Employee leave request through policy engine and payroll impact.",
    [
      n("lv-1", "trigger", "Leave requested", 60, 140, {
        actors: ["Employee"],
        systems: ["ESS Portal"],
        inputs: ["Leave type", "Dates", "Handover notes"],
        priority: "must",
        status: "agreed",
      }),
      n("lv-2", "decision", "Policy eligible?", 300, 140, {
        systems: ["HRMS Policy Engine"],
        businessRules: [
          "Insufficient balance blocks casual leave",
          "Blackout dates require director override",
        ],
        priority: "must",
        status: "agreed",
      }),
      n("lv-3", "approval", "Manager approval", 540, 60, {
        actors: ["Reporting Manager"],
        priority: "must",
        status: "agreed",
      }),
      n("lv-4", "data", "Update balances & roster", 780, 140, {
        systems: ["HRMS", "Time & Attendance"],
        outputs: ["Balance ledger", "Roster gap flag"],
        priority: "must",
        status: "draft",
      }),
      n("lv-5", "outcome", "Leave recorded", 1020, 140, {
        acceptanceCriteria: ["Payroll cut-off sees approved leave same day"],
        priority: "must",
        status: "agreed",
      }),
      n("lv-6", "outcome", "Request rejected", 540, 240, {
        summary: "Employee notified with policy reason.",
        priority: "should",
        status: "draft",
      }),
    ],
    [
      e("lve1", "lv-1", "lv-2"),
      e("lve2", "lv-2", "lv-3", "Yes"),
      e("lve3", "lv-2", "lv-6", "No"),
      e("lve4", "lv-3", "lv-4", "Approved"),
      e("lve5", "lv-3", "lv-6", "Denied"),
      e("lve6", "lv-4", "lv-5"),
    ],
  );

  return stamp({
    name: "Enterprise HRMS",
    domain: "hrms",
    tagline: "People processes that auditors can follow",
    description:
      "End-to-end HR operating model for large enterprises and government departments — hiring, onboarding, leave, and compliance checkpoints as executable flows.",
    customer: "Ministry / Corporate HR Shared Services",
    stakeholders: [
      {
        id: createId("st"),
        name: "CHRO",
        role: "Sponsor",
        organization: "Corporate HR",
        interest: "Policy adherence and employee experience",
      },
      {
        id: createId("st"),
        name: "Establishment Officer",
        role: "Process Owner",
        organization: "Establishment Wing",
        interest: "Cadre strength and service rules",
      },
      {
        id: createId("st"),
        name: "Internal Audit",
        role: "Assurance",
        organization: "Audit",
        interest: "Traceable approvals and retention",
      },
    ],
    modules: [
      "Organisation & positions",
      "Recruitment",
      "Onboarding",
      "Time & attendance",
      "Leave",
      "Payroll interfaces",
      "Performance",
      "Separations",
    ],
    constraints: [
      "Must honour existing service rules / standing orders",
      "SSO with government / enterprise IdP",
      "Immutable approval history",
      "Works for field offices with intermittent connectivity",
    ],
    complianceFrameworks: [
      "Labour & employment statutes",
      "Reservation / equal opportunity policy",
      "Personal data protection",
    ],
    successMetrics: [
      "Offer-to-join cycle ≤ 21 days",
      "Leave auto-rejection rate explained 100%",
      "Zero orphan identities after separation",
    ],
    glossary: [
      {
        id: createId("gl"),
        term: "ESS",
        definition: "Employee Self Service portal for HR transactions.",
      },
      {
        id: createId("gl"),
        term: "Sanctioned strength",
        definition: "Approved headcount ceiling for a cadre or unit.",
      },
    ],
    workflows: [hire, leave],
  });
}

export function franchiseTemplate(): Solution {
  const onboard = workflow(
    "Franchise Onboarding",
    "From lead qualification to store go-live with brand compliance.",
    [
      n("fr-1", "trigger", "Franchise lead", 40, 170, {
        actors: ["Franchise Development"],
        inputs: ["Territory interest", "Capital proof"],
        priority: "must",
        status: "agreed",
      }),
      n("fr-2", "process", "Score & due diligence", 280, 170, {
        actors: ["Credit Analyst"],
        systems: ["CRM", "KYC vendor"],
        businessRules: ["Minimum liquid capital and credit score thresholds"],
        complianceTags: ["KYC / AML"],
        priority: "must",
        status: "agreed",
      }),
      n("fr-3", "approval", "Territory & brand board", 520, 170, {
        actors: ["Franchise Board"],
        outputs: ["LOI", "Territory grant"],
        acceptanceCriteria: [
          "No overlapping exclusive territory without exception log",
        ],
        priority: "must",
        status: "draft",
      }),
      n("fr-4", "system", "Agreement & fees", 760, 80, {
        systems: ["Contract CLM", "Billing"],
        outputs: ["Signed franchise agreement", "Fee invoice"],
        priority: "must",
        status: "agreed",
      }),
      n("fr-5", "process", "Fit-out & training", 760, 260, {
        actors: ["Operations Coach", "Franchisee"],
        inputs: ["Brand fit-out checklist", "Training curriculum"],
        priority: "should",
        status: "draft",
      }),
      n("fr-6", "decision", "Pre-opening audit pass?", 1000, 170, {
        actors: ["Brand Standards Auditor"],
        complianceTags: ["Brand standards"],
        priority: "must",
        status: "agreed",
      }),
      n("fr-7", "outcome", "Store live", 1240, 100, {
        systems: ["POS", "Inventory hub"],
        acceptanceCriteria: ["POS reporting to HQ within 15 minutes of open"],
        priority: "must",
        status: "agreed",
      }),
      n("fr-8", "outcome", "Remediation plan", 1240, 240, {
        summary: "Failed audit items tracked to closure before go-live.",
        priority: "should",
        status: "draft",
      }),
    ],
    [
      e("fre1", "fr-1", "fr-2"),
      e("fre2", "fr-2", "fr-3"),
      e("fre3", "fr-3", "fr-4", "Approved"),
      e("fre4", "fr-4", "fr-5"),
      e("fre5", "fr-5", "fr-6"),
      e("fre6", "fr-6", "fr-7", "Pass"),
      e("fre7", "fr-6", "fr-8", "Fail"),
    ],
  );

  const royalty = workflow(
    "Royalty & Performance Review",
    "Monthly sales capture, royalty calculation, and underperformance interventions.",
    [
      n("ry-1", "trigger", "Month close", 60, 150, {
        systems: ["POS aggregator"],
        inputs: ["Store sales feed"],
        priority: "must",
        status: "agreed",
      }),
      n("ry-2", "system", "Compute royalty", 300, 150, {
        systems: ["Franchise Finance"],
        businessRules: [
          "Royalty = net sales × contracted rate",
          "Promotional carve-outs require HQ campaign code",
        ],
        outputs: ["Royalty invoice"],
        priority: "must",
        status: "agreed",
      }),
      n("ry-3", "decision", "KPI below threshold?", 540, 150, {
        businessRules: ["Same-store sales, mystery shopper, stock-out rate"],
        priority: "should",
        status: "draft",
      }),
      n("ry-4", "process", "Coaching plan", 780, 60, {
        actors: ["Area Manager", "Franchisee"],
        outputs: ["30-day action plan"],
        priority: "should",
        status: "draft",
      }),
      n("ry-5", "data", "Post collections", 780, 240, {
        systems: ["AR"],
        outputs: ["Payment receipt", "Aging update"],
        complianceTags: ["Revenue recognition"],
        priority: "must",
        status: "agreed",
      }),
      n("ry-6", "outcome", "Period closed", 1020, 150, {
        acceptanceCriteria: ["All stores settled or escalated within T+5"],
        priority: "must",
        status: "agreed",
      }),
    ],
    [
      e("rye1", "ry-1", "ry-2"),
      e("rye2", "ry-2", "ry-3"),
      e("rye3", "ry-3", "ry-4", "Yes"),
      e("rye4", "ry-3", "ry-5", "No"),
      e("rye5", "ry-4", "ry-5"),
      e("rye6", "ry-5", "ry-6"),
    ],
  );

  return stamp({
    name: "Franchise Network Ops",
    domain: "franchise",
    tagline: "Brand control without the binder",
    description:
      "Visual operating system for franchise networks — onboarding, brand compliance, royalty, and performance interventions as the living specification.",
    customer: "National Franchise Brand HQ",
    stakeholders: [
      {
        id: createId("st"),
        name: "VP Franchise",
        role: "Sponsor",
        organization: "HQ",
        interest: "Network growth with brand integrity",
      },
      {
        id: createId("st"),
        name: "Legal Counsel",
        role: "Risk",
        organization: "Legal",
        interest: "Agreement enforceability and KYC",
      },
      {
        id: createId("st"),
        name: "Area Manager",
        role: "Operator",
        organization: "Field Ops",
        interest: "Clear playbooks and escalations",
      },
    ],
    modules: [
      "Lead & territory",
      "Due diligence",
      "Contracting",
      "Store build & training",
      "POS & inventory link",
      "Royalty & billing",
      "Brand audits",
      "Performance coaching",
    ],
    constraints: [
      "Multi-country tax and fee rules",
      "Franchisee portal with limited data visibility",
      "POS vendors vary by market",
    ],
    complianceFrameworks: [
      "Franchise disclosure rules",
      "KYC / AML",
      "Brand standards handbook",
    ],
    successMetrics: [
      "Onboarding cycle ≤ 90 days",
      "Royalty leakage < 1%",
      "Audit pass rate ≥ 92%",
    ],
    glossary: [
      {
        id: createId("gl"),
        term: "LOI",
        definition: "Letter of Intent prior to definitive franchise agreement.",
      },
      {
        id: createId("gl"),
        term: "Royalty",
        definition: "Contractual fee payable to brand HQ on net sales.",
      },
    ],
    workflows: [onboard, royalty],
  });
}

export function blankSolution(name = "Untitled Solution"): Solution {
  const wf = workflow(
    "Core Process",
    "Start mapping the business process that replaces your BRD narrative.",
    [
      n("b1", "trigger", "Business need", 80, 160, {
        summary: "Describe what initiates this value stream.",
        priority: "must",
        status: "draft",
      }),
      n("b2", "process", "Key activity", 360, 160, {
        summary: "Capture who does what, with which system.",
        priority: "must",
        status: "draft",
      }),
      n("b3", "outcome", "Business outcome", 640, 160, {
        summary: "Define the measurable result and acceptance.",
        priority: "must",
        status: "draft",
      }),
    ],
    [e("be1", "b1", "b2"), e("be2", "b2", "b3")],
  );

  return stamp({
    name,
    domain: "custom",
    tagline: "Living specification",
    description:
      "A blank canvas for modelling an enterprise or government solution as visual, testable requirements.",
    customer: "Your organisation",
    stakeholders: [],
    modules: [],
    constraints: [],
    complianceFrameworks: [],
    successMetrics: [],
    glossary: [],
    workflows: [wf],
  });
}

export const TEMPLATE_CATALOG = [
  {
    id: "inventory" as const,
    title: "Inventory Management",
    blurb:
      "Receiving, QC, putaway, issue, and replenishment with audit-ready controls.",
    factory: inventoryTemplate,
  },
  {
    id: "hrms" as const,
    title: "HRMS / People Ops",
    blurb:
      "Hire-to-onboard and leave exceptions with policy, panel, and payroll hooks.",
    factory: hrmsTemplate,
  },
  {
    id: "franchise" as const,
    title: "Franchise Management",
    blurb:
      "Onboarding, brand audits, royalty, and performance coaching as one map.",
    factory: franchiseTemplate,
  },
];
