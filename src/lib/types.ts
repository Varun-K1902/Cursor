export type Domain =
  | "inventory"
  | "hrms"
  | "franchise"
  | "custom";

export type NodeKind =
  | "trigger"
  | "process"
  | "decision"
  | "approval"
  | "system"
  | "data"
  | "outcome";

export type Priority = "must" | "should" | "could";
export type ReqStatus = "draft" | "agreed" | "deferred";

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  interest: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface RequirementDetail {
  summary: string;
  actors: string[];
  systems: string[];
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  acceptanceCriteria: string[];
  complianceTags: string[];
  priority: Priority;
  status: ReqStatus;
  notes: string;
}

export interface SpecNodeData extends RequirementDetail {
  kind: NodeKind;
  label: string;
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: import("@xyflow/react").Node<SpecNodeData>[];
  edges: import("@xyflow/react").Edge[];
}

export interface Solution {
  id: string;
  name: string;
  domain: Domain;
  tagline: string;
  description: string;
  customer: string;
  stakeholders: Stakeholder[];
  modules: string[];
  constraints: string[];
  complianceFrameworks: string[];
  successMetrics: string[];
  glossary: GlossaryTerm[];
  workflows: Workflow[];
  activeWorkflowId: string;
  createdAt: string;
  updatedAt: string;
}

export const NODE_KIND_META: Record<
  NodeKind,
  { label: string; hint: string; accent: string }
> = {
  trigger: {
    label: "Trigger",
    hint: "Event that starts the flow",
    accent: "#1F6F7A",
  },
  process: {
    label: "Process",
    hint: "Human or system activity",
    accent: "#0B3A44",
  },
  decision: {
    label: "Decision",
    hint: "Branching business rule",
    accent: "#C46B2C",
  },
  approval: {
    label: "Approval",
    hint: "Authority checkpoint",
    accent: "#8B4D2E",
  },
  system: {
    label: "System",
    hint: "Application or integration",
    accent: "#2F5D50",
  },
  data: {
    label: "Data",
    hint: "Record, ledger, or artifact",
    accent: "#3D5A80",
  },
  outcome: {
    label: "Outcome",
    hint: "Business result or SLA",
    accent: "#1B5E4A",
  },
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  inventory: "Inventory Management",
  hrms: "HRMS / People Ops",
  franchise: "Franchise Management",
  custom: "Custom Solution",
};
