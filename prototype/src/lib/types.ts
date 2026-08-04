export type GoalType =
  | "locate"
  | "comprehend"
  | "decide"
  | "mutate"
  | "verify"
  | "monitor"
  | "guide";

export type Pattern =
  | "SearchWorkspace"
  | "ProfileWorkspace"
  | "DashboardWorkspace"
  | "InboxWorkspace"
  | "ApprovalWorkspace"
  | "WizardWorkspace"
  | "CaptureWorkspace"
  | "AnalyticsWorkspace"
  | "TimelineWorkspace";

export type Priority = "critical" | "important" | "supporting" | "reference";
export type Affinity =
  | "identity"
  | "clinical"
  | "administrative"
  | "evidence"
  | "temporal";
export type Cardinality = "one" | "small_set" | "large_set" | "stream";

export interface Ref {
  id: string;
  kind: string;
  label: string;
}

export interface Information {
  id: string;
  label: string;
  objectId: string;
  facet: string;
  identity?: boolean;
  kpi?: boolean;
  guardsRules?: string[];
}

export interface Relationship {
  from: string;
  to: string;
  cardinality: Cardinality;
  affinity: Affinity;
  temporal?: boolean;
  frequency?: "low" | "med" | "high";
}

export interface Rule {
  id: string;
  label: string;
  stereotype: "eligibility" | "sla.overdue" | "uniqueness" | "precondition.hard";
  hard: boolean;
  when: string;
  message: string;
  guards?: string[];
  enabled: boolean;
}

export interface ActionDef {
  id: string;
  label: string;
  criticality: number;
  stereotype?: "rare" | "admin" | "destructive";
  advances: string[];
  writes: string[];
}

export interface Activity {
  id: string;
  label: string;
  goalId: string;
  goalLabel: string;
  verb: string;
  primaryObjectId: string;
  supportingObjectIds: string[];
  readIds: string[];
  writeIds: string[];
  decisionIds: string[];
  actionIds: string[];
  entryContext: string;
  roles: string[];
}

export interface SpecGraph {
  journey: { id: string; label: string; goal: string };
  objects: Ref[];
  relationships: Relationship[];
  information: Information[];
  activities: Activity[];
  actions: ActionDef[];
  rules: Rule[];
  decisions: Ref[];
}

export interface InteractionIntent {
  activityId: string;
  goalType: GoalType;
  cognitiveMode: string;
  primaryObject: Ref;
  supportingObjects: Ref[];
  readWriteRatio: number;
  decisionDensity: "low" | "med" | "high";
  actionDensity: "low" | "med" | "high";
  objectSpan: "single" | "cluster" | "fleet";
  timeOrientation: "none" | "point" | "range" | "stream";
  entryContext: string;
  successSignal: string;
  rationale: string[];
}

export interface PatternResult {
  selected: Pattern;
  confidence: number;
  alternate?: Pattern;
  scores: Record<string, number>;
  rationale: string[];
}

export interface IANode {
  ref: Ref;
  priority: Priority;
  facet: string;
  displayRole: string;
}

export interface NavAssignment {
  target: Ref;
  strategy:
    | "peerNav"
    | "sideNav"
    | "relatedPanel"
    | "expandable"
    | "nested"
    | "temporalSpine";
  rationale: string[];
  badgeFrom?: Ref;
}

export interface NavigationModel {
  identityStrip: Ref[];
  peerNavigation: { group: string; items: { id: string; label: string; badgeFrom?: Ref }[] }[];
  relatedPanels: { target: Ref; priority: Priority }[];
  expandable: Ref[];
  nested: Record<string, string[]>;
  assignments: NavAssignment[];
}

export interface ActionModel {
  primary: Ref[];
  secondary: Ref[];
  overflow: Ref[];
  recommendedNext?: Ref;
  ranking: { action: Ref; score: number; reasons: string[] }[];
}

export interface AffordanceBinding {
  id: string;
  rule: Ref;
  when: string;
  enabled: boolean;
  effects: {
    type: string;
    target: Ref;
    severity: string;
    message: string;
  }[];
}

export interface Section {
  id: string;
  purpose: string;
  priority: Priority;
  presentationHint: string;
  contentLabels: string[];
}

export interface WorkspaceDefinition {
  id: string;
  name: string;
  purpose: string;
  pattern: Pattern;
  primaryObject: Ref;
  primaryGoal: Ref;
  navigation: NavigationModel;
  sections: Section[];
  quickActions: ActionModel;
  alerts: AffordanceBinding[];
  kpis: { id: string; label: string; priority: Priority }[];
  widgets: { kind: string; binds: string[]; priority: Priority }[];
  rules: AffordanceBinding[];
  trace: {
    activityId: string;
    confidence: number;
    alternatePattern?: Pattern;
    rationale: string[];
  };
}

export interface CompileResult {
  intent: InteractionIntent;
  pattern: PatternResult;
  ia: IANode[];
  navigation: NavigationModel;
  actions: ActionModel;
  bindings: AffordanceBinding[];
  workspace: WorkspaceDefinition;
  layout: {
    header: string[];
    primary: string[];
    secondary: string[];
    actionRail: { primary: string[]; secondary: string[]; overflow: string[] };
    navChrome: string[];
    disclosure: string[];
  };
  passes: { id: string; title: string; summary: string }[];
}
