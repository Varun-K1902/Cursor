import type {
  Activity,
  AffordanceBinding,
  ActionModel,
  CompileResult,
  GoalType,
  IANode,
  InteractionIntent,
  NavigationModel,
  Pattern,
  PatternResult,
  Priority,
  Ref,
  SpecGraph,
  WorkspaceDefinition,
} from "./types";

const VERB_GOAL: Record<string, GoalType> = {
  search: "locate",
  find: "locate",
  locate: "locate",
  review: "comprehend",
  view: "comprehend",
  assess: "comprehend",
  approve: "decide",
  reject: "decide",
  administer: "mutate",
  record: "mutate",
  update: "mutate",
  capture: "mutate",
  confirm: "verify",
  monitor: "monitor",
  guide: "guide",
};

function ref(id: string, kind: string, label: string): Ref {
  return { id, kind, label };
}

function density(n: number): "low" | "med" | "high" {
  if (n <= 1) return "low";
  if (n <= 3) return "med";
  return "high";
}

function extractIntent(graph: SpecGraph, activity: Activity): InteractionIntent {
  const goalType = VERB_GOAL[activity.verb] ?? "comprehend";
  const primary = graph.objects.find((o) => o.id === activity.primaryObjectId)!;
  const supporting = graph.objects.filter((o) =>
    activity.supportingObjectIds.includes(o.id),
  );
  const reads = activity.readIds.length;
  const writes = activity.writeIds.length;
  const readWriteRatio = reads + writes === 0 ? 1 : reads / (reads + writes);
  const temporalRels = graph.relationships.filter(
    (r) =>
      r.from === activity.primaryObjectId &&
      activity.supportingObjectIds.includes(r.to) &&
      r.temporal,
  ).length;

  let cognitiveMode = "inspect";
  if (goalType === "locate") cognitiveMode = "scan";
  if (goalType === "mutate") cognitiveMode = "compose";
  if (goalType === "decide") cognitiveMode = "approve";
  if (goalType === "monitor") cognitiveMode = "scan";
  if (goalType === "guide") cognitiveMode = "compose";

  const objectSpan =
    supporting.length === 0 ? "single" : supporting.length >= 6 ? "fleet" : "cluster";

  return {
    activityId: activity.id,
    goalType,
    cognitiveMode,
    primaryObject: primary,
    supportingObjects: supporting,
    readWriteRatio,
    decisionDensity: density(activity.decisionIds.length),
    actionDensity: density(activity.actionIds.length),
    objectSpan: objectSpan === "fleet" ? "fleet" : supporting.length <= 1 ? "single" : objectSpan,
    timeOrientation: temporalRels >= 2 ? "range" : temporalRels === 1 ? "point" : "none",
    entryContext: activity.entryContext,
    successSignal:
      goalType === "locate"
        ? "Correct record selected"
        : goalType === "mutate"
          ? "Business write completed under guards"
          : "User can correctly choose next action",
    rationale: [
      `verb “${activity.verb}” → goalType ${goalType}`,
      `primary object ${primary.label}`,
      `${supporting.length} supporting objects`,
      `read/write ratio ${readWriteRatio.toFixed(2)}`,
    ],
  };
}

function classifyPattern(intent: InteractionIntent): PatternResult {
  const scores: Record<string, number> = {
    SearchWorkspace: 0,
    ProfileWorkspace: 0,
    DashboardWorkspace: 0,
    InboxWorkspace: 0,
    ApprovalWorkspace: 0,
    WizardWorkspace: 0,
    CaptureWorkspace: 0,
    AnalyticsWorkspace: 0,
    TimelineWorkspace: 0,
  };

  const { goalType: G, cognitiveMode: C, readWriteRatio: RW, decisionDensity: DD, actionDensity: AD, objectSpan: OS, timeOrientation: T, entryContext: E, supportingObjects } = intent;
  const RelN = supportingObjects.length;

  if (G === "locate") scores.SearchWorkspace += 4;
  if (C === "scan") scores.SearchWorkspace += 2;
  if (G === "comprehend") scores.SearchWorkspace -= 3;

  if (G === "comprehend") scores.ProfileWorkspace += 4;
  if (C === "inspect") scores.ProfileWorkspace += 3;
  if (OS === "single" || OS === "cluster") scores.ProfileWorkspace += 3;
  if (RelN >= 3) scores.ProfileWorkspace += 2;
  if (RW >= 0.7) scores.ProfileWorkspace += 2;
  if (DD === "low" || DD === "med") scores.ProfileWorkspace += 1;
  if (G === "locate") scores.ProfileWorkspace -= 3;
  if (G === "guide") scores.ProfileWorkspace -= 3;

  if (G === "monitor") scores.DashboardWorkspace += 4;
  if (OS === "fleet") scores.DashboardWorkspace += 3;

  if (E === "task-queue" || E === "notification") scores.InboxWorkspace += 4;
  if (AD === "med" || AD === "high") scores.InboxWorkspace += 1;

  if (G === "decide") scores.ApprovalWorkspace += 4;
  if (C === "approve") scores.ApprovalWorkspace += 3;
  if (DD === "high") scores.ApprovalWorkspace += 3;

  if (G === "guide") scores.WizardWorkspace += 4;
  if (E === "journey-step" && G === "guide") scores.WizardWorkspace += 2;

  if (G === "mutate") scores.CaptureWorkspace += 4;
  if (RW <= 0.45) scores.CaptureWorkspace += 3;
  if (OS === "single" || (OS === "cluster" && RelN <= 2)) scores.CaptureWorkspace += 2;
  if (C === "compose") scores.CaptureWorkspace += 2;
  if (RelN >= 5 && G === "comprehend") scores.CaptureWorkspace -= 3;

  if (G === "monitor") scores.AnalyticsWorkspace += 2;
  if (C === "compare") scores.AnalyticsWorkspace += 3;

  if (T === "stream" || T === "range") scores.TimelineWorkspace += 4;
  if (C === "inspect" || C === "follow-up") scores.TimelineWorkspace += 2;
  if (RelN >= 2 && T !== "none") scores.TimelineWorkspace += 2;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, bestScore] = ranked[0];
  const [second, secondScore] = ranked[1];
  const maxPossible = 16;
  const confidence = Math.min(0.98, Math.max(0.4, bestScore / maxPossible));

  const rationale = [
    `Highest score: ${best} (${bestScore})`,
    `Runner-up: ${second} (${secondScore})`,
    `Signals: G=${G}, C=${C}, RW=${RW.toFixed(2)}, OS=${OS}, RelN=${RelN}, T=${T}`,
  ];

  return {
    selected: best as Pattern,
    confidence: Number(confidence.toFixed(2)),
    alternate: secondScore > 0 ? (second as Pattern) : undefined,
    scores,
    rationale,
  };
}

function buildIA(graph: SpecGraph, activity: Activity): IANode[] {
  const nodes: IANode[] = [];
  for (const infoId of activity.readIds) {
    const info = graph.information.find((i) => i.id === infoId);
    if (!info) continue;
    let priority: Priority = "supporting";
    let displayRole = "field";
    if (info.identity) {
      priority = "critical";
      displayRole = "headline";
    }
    if (info.guardsRules?.length) {
      priority = "critical";
      displayRole = "signal";
    }
    if (info.kpi) {
      priority = priority === "critical" ? "critical" : "important";
      displayRole = "metric";
    }
    if (info.facet === "clinical" && !info.kpi) {
      priority = priority === "critical" ? "critical" : "important";
      displayRole = info.label.toLowerCase().includes("schedule") ? "collection" : "field";
    }
    if (info.facet === "temporal") priority = "supporting";
    if (activity.decisionIds.length && info.facet === "status") {
      priority = "critical";
      displayRole = "signal";
    }
    nodes.push({
      ref: ref(info.id, "Information", info.label),
      priority,
      facet: info.facet,
      displayRole,
    });
  }
  return nodes;
}

function buildNavigation(
  graph: SpecGraph,
  activity: Activity,
  pattern: Pattern,
): NavigationModel {
  const primaryId = activity.primaryObjectId;
  const identityStrip = graph.information
    .filter((i) => i.objectId === primaryId && (i.identity || i.facet === "status"))
    .filter((i) => activity.readIds.includes(i.id) || i.identity)
    .slice(0, 5)
    .map((i) => ref(i.id, "Information", i.label));

  const related = graph.relationships.filter((r) => r.from === primaryId);
  const assignments: NavigationModel["assignments"] = [];
  const peerItems: { id: string; label: string; badgeFrom?: Ref }[] = [];
  const relatedPanels: NavigationModel["relatedPanels"] = [];
  const expandable: Ref[] = [];
  const nested: Record<string, string[]> = {};

  if (pattern === "ProfileWorkspace" || pattern === "TimelineWorkspace") {
    peerItems.push({ id: "nav_overview", label: "Overview" });
  }

  for (const rel of related) {
    if (!activity.supportingObjectIds.includes(rel.to)) continue;
    const obj = graph.objects.find((o) => o.id === rel.to)!;
    const target = ref(obj.id, "BusinessObject", obj.label);

    if (rel.cardinality === "one" && rel.affinity === "identity") {
      assignments.push({
        target,
        strategy: "relatedPanel",
        rationale: ["cardinality one", "identity affinity"],
      });
      relatedPanels.push({ target, priority: "supporting" });
      nested[obj.id] = ["Members", "Guardians", "Contact"];
      continue;
    }

    if (rel.affinity === "evidence" || rel.frequency === "low") {
      assignments.push({
        target,
        strategy: "expandable",
        rationale: ["reference/evidence", "low frequency"],
      });
      expandable.push(target);
      continue;
    }

    if (pattern === "TimelineWorkspace" && rel.temporal) {
      assignments.push({
        target,
        strategy: "temporalSpine",
        rationale: ["temporal affinity", "Timeline pattern"],
      });
      continue;
    }

    const badgeFrom =
      obj.id === "obj_vaccination"
        ? ref("rule_overdue", "Rule", "Show overdue vaccines")
        : undefined;

    assignments.push({
      target,
      strategy: "peerNav",
      rationale: [`${rel.affinity} affinity`, "collection", "peer window"],
      badgeFrom,
    });
    peerItems.push({
      id: `nav_${obj.id}`,
      label: obj.label,
      badgeFrom,
    });
  }

  // Constraint: if peers > 7 would side-nav; here typically 4
  return {
    identityStrip,
    peerNavigation:
      peerItems.length > 0
        ? [{ group: "Clinical", items: peerItems }]
        : [],
    relatedPanels,
    expandable,
    nested,
    assignments,
  };
}

function buildActions(graph: SpecGraph, activity: Activity): ActionModel {
  const ranking = activity.actionIds.map((id) => {
    const a = graph.actions.find((x) => x.id === id)!;
    let score = a.criticality;
    const reasons: string[] = [`criticality ${a.criticality}`];
    if (a.advances.includes(activity.goalId)) {
      score += 5;
      reasons.push("advances primary goal");
    }
    score += 3;
    reasons.push("outbound from activity");
    if (a.writes.includes(activity.primaryObjectId)) {
      score += 2;
      reasons.push("writes primary object");
    }
    if (a.stereotype === "rare" || a.stereotype === "admin") {
      score -= 2;
      reasons.push(`${a.stereotype} → overflow bias`);
    }
    return {
      action: ref(a.id, "Action", a.label),
      score,
      reasons,
      stereotype: a.stereotype,
    };
  });

  ranking.sort((a, b) => b.score - a.score);

  const primary: Ref[] = [];
  const secondary: Ref[] = [];
  const overflow: Ref[] = [];

  for (const row of ranking) {
    if (row.stereotype === "rare" || row.stereotype === "admin") {
      overflow.push(row.action);
      continue;
    }
    if (primary.length === 0) {
      primary.push(row.action);
      continue;
    }
    if (secondary.length < 3) {
      secondary.push(row.action);
      continue;
    }
    overflow.push(row.action);
  }

  return {
    primary,
    secondary,
    overflow,
    recommendedNext: primary[0],
    ranking: ranking.map(({ action, score, reasons }) => ({ action, score, reasons })),
  };
}

function bindRules(graph: SpecGraph, activity: Activity): AffordanceBinding[] {
  const bindings: AffordanceBinding[] = [];
  for (const rule of graph.rules) {
    if (!rule.enabled) continue;

    const effects: AffordanceBinding["effects"] = [];
    const ruleRef = ref(rule.id, "Rule", rule.label);

    if (rule.stereotype === "eligibility") {
      for (const gid of rule.guards ?? []) {
        if (!activity.actionIds.includes(gid) && activity.id !== "act_administer") continue;
        const action = graph.actions.find((a) => a.id === gid);
        if (!action) continue;
        if (!activity.actionIds.includes(gid)) continue;
        effects.push({
          type: "disableAction",
          target: ref(action.id, "Action", action.label),
          severity: "critical",
          message: rule.message,
        });
      }
    }

    if (rule.stereotype === "sla.overdue") {
      effects.push({
        type: "alertBadge",
        target: ref("nav_vaccinations", "NavItem", "Vaccinations"),
        severity: "warning",
        message: rule.message,
      });
      effects.push({
        type: "warningBanner",
        target: ref("sec_status", "Section", "Clinical Status"),
        severity: "warning",
        message: rule.message,
      });
      effects.push({
        type: "kpiSignal",
        target: ref("info_overdue_count", "Information", "Overdue Vaccine Count"),
        severity: "warning",
        message: rule.message,
      });
      if (activity.actionIds.includes("actn_administer")) {
        effects.push({
          type: "recommendedNextAction",
          target: ref("actn_administer", "Action", "Administer Vaccine"),
          severity: "info",
          message: "Address overdue vaccines",
        });
      }
    }

    if (rule.stereotype === "uniqueness") {
      for (const gid of rule.guards ?? []) {
        if (!activity.actionIds.includes(gid)) continue;
        const action = graph.actions.find((a) => a.id === gid);
        if (!action) continue;
        effects.push({
          type: "blockAction",
          target: ref(action.id, "Action", action.label),
          severity: "critical",
          message: rule.message,
        });
        effects.push({
          type: "inlineValidation",
          target: ref("info_dose_type", "Information", "Dose / Antigen"),
          severity: "critical",
          message: rule.message,
        });
      }
    }

    // Only include bindings that have effects for this activity
    // overdue applies to review; eligibility to review/administer; duplicate to administer
    const relevant =
      effects.length > 0 &&
      (rule.stereotype === "sla.overdue"
        ? activity.id === "act_review_child"
        : effects.some((e) => activity.actionIds.includes(e.target.id) || e.target.kind === "NavItem" || e.target.kind === "Section" || e.target.kind === "Information"));

    if (rule.stereotype === "sla.overdue" && activity.id !== "act_review_child") continue;
    if (effects.length === 0) continue;
    if (!relevant && rule.stereotype !== "eligibility") continue;

    // For eligibility on review: disable administer if in action list
    if (rule.stereotype === "eligibility" && effects.length === 0) continue;

    bindings.push({
      id: `bind_${rule.id}_${activity.id}`,
      rule: ruleRef,
      when: rule.when,
      enabled: true,
      effects,
    });
  }
  return bindings;
}

function assembleWorkspace(
  graph: SpecGraph,
  activity: Activity,
  intent: InteractionIntent,
  pattern: PatternResult,
  ia: IANode[],
  navigation: NavigationModel,
  actions: ActionModel,
  bindings: AffordanceBinding[],
): WorkspaceDefinition {
  const purposeMap: Record<string, string> = {
    locate: "Locate the correct business record",
    comprehend: "Understand status well enough to act safely",
    mutate: "Capture a business change under guards",
    decide: "Make an accountable decision",
    monitor: "Monitor fleet health and signals",
    guide: "Complete an ordered business path",
    verify: "Confirm correctness before proceeding",
  };

  const sections =
    pattern.selected === "SearchWorkspace"
      ? [
          {
            id: "search_query",
            purpose: "Express identity criteria",
            priority: "critical" as Priority,
            presentationHint: "stack",
            contentLabels: ia.map((n) => n.ref.label),
          },
          {
            id: "results",
            purpose: "Choose the matching record",
            priority: "critical" as Priority,
            presentationHint: "stack",
            contentLabels: [intent.primaryObject.label],
          },
        ]
      : pattern.selected === "CaptureWorkspace"
        ? [
            {
              id: "context",
              purpose: "Keep subject context visible while capturing",
              priority: "critical" as Priority,
              presentationHint: "chrome",
              contentLabels: navigation.identityStrip.map((r) => r.label).slice(0, 3),
            },
            {
              id: "capture",
              purpose: "Enter required business information",
              priority: "critical" as Priority,
              presentationHint: "stack",
              contentLabels: graph.information
                .filter((i) => activity.writeIds.includes(i.id) || activity.readIds.includes(i.id))
                .map((i) => i.label)
                .slice(0, 4),
            },
            {
              id: "guards",
              purpose: "Enforce business rules",
              priority: "critical" as Priority,
              presentationHint: "stack",
              contentLabels: bindings.map((b) => b.rule.label),
            },
          ]
        : [
            {
              id: "identity",
              purpose: "Recognize the subject",
              priority: "critical" as Priority,
              presentationHint: "chrome",
              contentLabels: navigation.identityStrip.map((r) => r.label),
            },
            {
              id: "sec_status",
              purpose: "Surface safety and eligibility signals",
              priority: "critical" as Priority,
              presentationHint: "stack",
              contentLabels: ia.filter((n) => n.priority === "critical" && n.displayRole !== "headline").map((n) => n.ref.label),
            },
            {
              id: "sec_overview",
              purpose: "Summarize context for judgment",
              priority: "important" as Priority,
              presentationHint: "stack",
              contentLabels: ia.filter((n) => n.priority === "important").map((n) => n.ref.label),
            },
            ...navigation.relatedPanels.map((p) => ({
              id: `sec_${p.target.id}`,
              purpose: "Related context",
              priority: p.priority,
              presentationHint: "panel",
              contentLabels: [p.target.label],
            })),
            ...navigation.expandable.map((e) => ({
              id: `sec_${e.id}`,
              purpose: "Reference evidence",
              priority: "reference" as Priority,
              presentationHint: "disclosure",
              contentLabels: [e.label],
            })),
          ];

  const kpis = ia
    .filter((n) => n.displayRole === "metric" || n.ref.id.includes("overdue") || n.ref.id.includes("growth"))
    .map((n) => ({
      id: `kpi_${n.ref.id}`,
      label: n.ref.label,
      priority: n.priority,
    }));

  const widgets =
    pattern.selected === "SearchWorkspace"
      ? [
          { kind: "searchFacet", binds: activity.readIds, priority: "critical" as Priority },
          { kind: "queueTable", binds: [activity.primaryObjectId], priority: "critical" as Priority },
        ]
      : pattern.selected === "CaptureWorkspace"
        ? [
            { kind: "identityHeader", binds: navigation.identityStrip.map((r) => r.id), priority: "critical" as Priority },
            { kind: "recordForm", binds: activity.writeIds, priority: "critical" as Priority },
            { kind: "statusSignal", binds: ["info_eligibility"], priority: "critical" as Priority },
          ]
        : [
            { kind: "identityHeader", binds: navigation.identityStrip.map((r) => r.id), priority: "critical" as Priority },
            { kind: "kpiStrip", binds: kpis.map((k) => k.id), priority: "critical" as Priority },
            { kind: "statusSignal", binds: ["info_eligibility", "info_overdue_count"], priority: "critical" as Priority },
            { kind: "scheduleList", binds: ["info_schedule", "obj_vaccination"], priority: "important" as Priority },
            { kind: "measurementTrend", binds: ["obj_growth"], priority: "important" as Priority },
            { kind: "relatedEntitySummary", binds: ["obj_family"], priority: "supporting" as Priority },
            { kind: "documentList", binds: ["obj_document"], priority: "reference" as Priority },
          ];

  return {
    id: `ws_${activity.id}`,
    name:
      pattern.selected === "ProfileWorkspace"
        ? `${intent.primaryObject.label} Clinical Review`
        : pattern.selected === "SearchWorkspace"
          ? `Find ${intent.primaryObject.label}`
          : activity.label,
    purpose: purposeMap[intent.goalType],
    pattern: pattern.selected,
    primaryObject: intent.primaryObject,
    primaryGoal: ref(activity.goalId, "Goal", activity.goalLabel),
    navigation,
    sections,
    quickActions: actions,
    alerts: bindings.filter((b) =>
      b.effects.some((e) => ["warningBanner", "alertBadge", "kpiSignal"].includes(e.type)),
    ),
    kpis,
    widgets,
    rules: bindings,
    trace: {
      activityId: activity.id,
      confidence: pattern.confidence,
      alternatePattern: pattern.alternate,
      rationale: [...pattern.rationale, ...intent.rationale],
    },
  };
}

function buildLayout(workspace: WorkspaceDefinition) {
  return {
    header: workspace.widgets
      .filter((w) => ["identityHeader", "kpiStrip"].includes(w.kind))
      .map((w) => w.kind)
      .concat(workspace.alerts.length ? ["alertRegion"] : []),
    primary: workspace.widgets
      .filter((w) => ["statusSignal", "scheduleList", "recordForm", "queueTable", "searchFacet"].includes(w.kind))
      .map((w) => w.kind),
    secondary: workspace.widgets
      .filter((w) => ["relatedEntitySummary", "measurementTrend"].includes(w.kind))
      .map((w) => w.kind),
    actionRail: {
      primary: workspace.quickActions.primary.map((a) => a.label),
      secondary: workspace.quickActions.secondary.map((a) => a.label),
      overflow: workspace.quickActions.overflow.map((a) => a.label),
    },
    navChrome: workspace.navigation.peerNavigation.flatMap((g) => g.items.map((i) => i.label)),
    disclosure: workspace.widgets.filter((w) => w.kind === "documentList").map((w) => w.kind),
  };
}

export function compileActivity(graph: SpecGraph, activityId: string): CompileResult {
  const activity = graph.activities.find((a) => a.id === activityId);
  if (!activity) throw new Error(`Unknown activity ${activityId}`);

  const intent = extractIntent(graph, activity);
  const pattern = classifyPattern(intent);
  const ia = buildIA(graph, activity);
  const navigation = buildNavigation(graph, activity, pattern.selected);
  const actions = buildActions(graph, activity);
  const bindings = bindRules(graph, activity);
  const workspace = assembleWorkspace(
    graph,
    activity,
    intent,
    pattern,
    ia,
    navigation,
    actions,
    bindings,
  );
  const layout = buildLayout(workspace);

  const passes = [
    {
      id: "P1",
      title: "Interaction Intent",
      summary: `${intent.goalType} / ${intent.cognitiveMode} on ${intent.primaryObject.label}`,
    },
    {
      id: "P2-3",
      title: "Workspace Pattern",
      summary: `${pattern.selected} (${Math.round(pattern.confidence * 100)}%)${pattern.alternate ? ` · alt ${pattern.alternate}` : ""}`,
    },
    {
      id: "P4",
      title: "Information Architecture",
      summary: `${ia.filter((n) => n.priority === "critical").length} critical · ${ia.filter((n) => n.priority === "important").length} important`,
    },
    {
      id: "P5",
      title: "Navigation Model",
      summary: `${navigation.peerNavigation[0]?.items.length ?? 0} peer · ${navigation.relatedPanels.length} panels · ${navigation.expandable.length} expandable`,
    },
    {
      id: "P6",
      title: "Action Model",
      summary: `Primary: ${actions.primary.map((a) => a.label).join(", ") || "—"}`,
    },
    {
      id: "P7",
      title: "Affordance Bindings",
      summary: `${bindings.length} rule bindings → ${bindings.reduce((n, b) => n + b.effects.length, 0)} effects`,
    },
    {
      id: "P8",
      title: "Workspace Definition",
      summary: `${workspace.name} · ${workspace.sections.length} sections · ${workspace.widgets.length} widgets`,
    },
    {
      id: "P9",
      title: "Layout Model",
      summary: `Regions: header / primary / secondary / actionRail`,
    },
  ];

  return {
    intent,
    pattern,
    ia,
    navigation,
    actions,
    bindings,
    workspace,
    layout,
    passes,
  };
}
