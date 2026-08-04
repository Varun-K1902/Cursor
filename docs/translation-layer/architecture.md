# Translation Layer — Pass Pipeline & IR Schemas

## Pipeline

```
SpecificationGraph
   │
   ├─► P1 IntentExtractor ──────────► InteractionIntent
   │                                      │
   ├─► P2 WorkspaceIntentBuilder ◄────────┘
   │         │
   │         ▼
   │      WorkspaceIntent
   │         │
   ├─► P3 PatternClassifier ────────► WorkspacePattern
   │         │
   ├─► P4 IABuilder ────────────────► InformationArchitecture
   │         │
   ├─► P5 NavigationSynthesizer ◄──── IA + relationships
   │         │
   ├─► P6 ActionRanker ◄───────────── goals + actions + frequency
   │         │
   ├─► P7 RuleBinder ───────────────► AffordanceBindings
   │         │
   ├─► P8 WorkspaceAssembler ───────► WorkspaceDefinition
   │         │
   └─► P9 LayoutPlanner ────────────► LayoutModel
            │
            ▼
     ApplicationAssembler ──────────► ApplicationModel
```

Each pass is pure: `(graph, priorIRs) → newIR + diagnostics`.

---

## Shared primitives

```yaml
Ref: { id: string, kind: string, label: string }

Priority: critical | important | supporting | reference
Severity: info | warning | critical
Cardinality: one | small_set | large_set | stream
Affinity: identity | clinical | administrative | evidence | temporal | financial | other
```

---

## P1 — InteractionIntent

```yaml
InteractionIntent:
  activity: Ref
  primaryGoal: Ref
  goalType: locate | comprehend | decide | mutate | verify | monitor | guide
  primaryObject: Ref
  supportingObjects: Ref[]
  operations:
    read: Ref[]
    write: Ref[]
  decisions: Ref[]
  actions: Ref[]
  exceptions: Ref[]
  roles: Ref[]
  successSignal: string
  cognitiveMode: scan | inspect | compare | compose | approve | follow-up
  diagnostics: string[]
```

### Verb → goalType lexicon (extensible)

| Verb stems | goalType |
|------------|----------|
| search, find, locate, lookup | locate |
| review, view, assess, examine, inspect | comprehend |
| approve, reject, authorize, clear | decide |
| record, capture, enter, administer, update, create | mutate |
| confirm, validate, verify, reconcile | verify |
| monitor, track, overview, dashboard | monitor |
| onboard, enroll, guide, complete steps | guide |

---

## P2 — WorkspaceIntent

```yaml
WorkspaceIntent:
  name: string
  purpose: string
  primaryObject: Ref
  primaryGoal: Ref
  interactionProfile:
    goalType: ...
    cognitiveMode: ...
    readWriteRatio: number   # write/(read+write) inverted: 1=read-only
    decisionDensity: low | med | high
    actionDensity: low | med | high
    objectSpan: single | cluster | fleet
    timeOrientation: none | point | range | stream
  entryContext: search-result | task-queue | deep-link | journey-step | notification
```

### Density heuristics

- `decisionDensity`: 0 = low, 1–2 = med, ≥3 = high (decisions attached to activity)
- `actionDensity`: outbound actions 0–1 low, 2–3 med, ≥4 high
- `objectSpan`: 1 primary only = single; 2–6 related = cluster; aggregate/fleet metrics = fleet
- `readWriteRatio`: `reads / (reads + writes)` over information edges

---

## P3 — WorkspacePattern

```yaml
WorkspacePattern:
  selected:
    SearchWorkspace | ProfileWorkspace | DashboardWorkspace | InboxWorkspace |
    ApprovalWorkspace | WizardWorkspace | CaptureWorkspace | AnalyticsWorkspace |
    TimelineWorkspace
  confidence: number
  alternate: Pattern?
  scores: map[Pattern, number]
  rationale: string[]
```

See `classifiers.md` for scorecards.

---

## P4 — InformationArchitecture

```yaml
InformationArchitecture:
  primaryObject: Ref
  nodes:
    - ref: Ref
      priority: Priority
      facet: identity | status | clinical | admin | evidence | temporal | relation
      displayRole: headline | metric | field | collection | signal
      source: primary | related
      relatedVia: Ref?
  collections:
    - object: Ref
      priority: Priority
      volume: Cardinality
      affinity: Affinity
```

---

## P5 — NavigationModel

```yaml
NavigationModel:
  primary: Ref
  identityStrip: Ref[]              # critical identity information
  peerNavigation:
    - group: string
      items:
        - id: string
          label: string
          target: Ref | section
          badgeFrom: RuleRef?       # e.g. overdue count
  sideGroups:
    - group: string
      items: [...]
  relatedPanels:
    - target: Ref
      priority: Priority
  expandable:
    - target: Ref
  nested:
    map[Ref, NavItem[]]
  temporalSpine:
    enabled: boolean
    objects: Ref[]
  strategyAssignments:
    - target: Ref
      strategy: identityStrip | sectionStack | relatedPanel | peerNav |
                sideNav | nested | expandable | temporalSpine
      rationale: string[]
```

---

## P6 — ActionModel

```yaml
ActionModel:
  primary: Ref[]
  secondary: Ref[]
  overflow: Ref[]
  inlineRow: Ref[]
  destructive: Ref[]
  recommendedNext: Ref?
  ranking:
    - action: Ref
      score: number
      reasons: string[]
```

---

## P7 — AffordanceBinding

```yaml
AffordanceBinding:
  id: string
  rule: Ref
  when: string                      # predicate expression
  effects:
    - type:
        disableAction | blockAction | warningBanner | alertBadge |
        inlineValidation | recommendedNextAction | conditionalVisibility |
        kpiSignal
      target: Ref
      severity: Severity
      messageKey: string
```

### Effect-class resolver

| Rule stereotype (on Specification Graph) | Default effect |
|------------------------------------------|----------------|
| `precondition.hard` | disableAction / blockAction |
| `precondition.soft` | warningBanner |
| `uniqueness` | blockAction + inlineValidation |
| `sla.overdue` | alertBadge + kpiSignal (+ warningBanner if workspace profile) |
| `eligibility` | disableAction + recommendedNextAction when satisfied |
| `visibility` | conditionalVisibility |
| `field.constraint` | inlineValidation |

---

## P8 — WorkspaceDefinition

Canonical output contract: `workspace-definition.schema.yaml`.

Assemblers apply **pattern templates** — structural defaults per WorkspacePattern that dictate section order and region expectations without pixels.

### ProfileWorkspace template (excerpt)

```yaml
sectionsOrder:
  - identity          # critical
  - statusSignals     # critical rules/KPIs
  - goalSummary       # important
  - primaryCollections# important (via nav)
  - relatedPanels     # supporting
  - reference         # reference / expandable
actionPlacement: actionRail
navigationDefault: peerNavIf(3..7) else sideNav
```

### SearchWorkspace template

```yaml
sectionsOrder: [searchQuery, facetFilters, resultCollection, resultPreview]
actionPlacement: rowInline + bulkOverflow
navigationDefault: none
```

### CaptureWorkspace template

```yaml
sectionsOrder: [contextHeader, captureFields, validations, confirmActions]
actionPlacement: footerPrimary
navigationDefault: none (or wizard chrome if journey-step)
```

---

## P9 — LayoutModel

```yaml
LayoutModel:
  workspaceId: string
  regions:
    header: Region
    primary: Region
    secondary: Region
    actionRail: Region
    navigationChrome: Region
    disclosure: Region
  Region:
    embeds: WidgetIntent[]
  WidgetIntent:
    kind: statusSignal | identityHeader | recordForm | scheduleList |
          measurementTrend | approvalCard | queueTable | searchFacet |
          stepProgress | timeline | relatedEntitySummary | documentList | kpiStrip
    binds: Ref[]
    priority: Priority
  priorityGate:
    critical: [header, primary]
    important: [primary]
    supporting: [secondary]
    reference: [disclosure]
```

---

## ApplicationModel

```yaml
ApplicationModel:
  name: string
  journeys:
    - id: string
      label: string
      workspaces: WorkspaceDefinition[]
      transitions:
        - from: workspaceId
          on: actionId | eventId
          to: workspaceId
      shellNavigation: NavigationModel   # activities as destinations
```

---

## Diagnostics & explainability

Every pass emits:

```yaml
Diagnostic:
  code: string
  severity: info | warning | error
  message: string
  nodeIds: string[]
  pass: P1..P9
```

Examples:
- `PATTERN_LOW_CONFIDENCE` — top two scores within 10%
- `NAV_PEER_OVERFLOW` — peer items > 7, auto-promoted to side nav
- `ACTION_NO_PRIMARY` — no action advances primary goal
- `RULE_UNBOUND` — rule stereotype missing, skipped

---

## Override philosophy

Allowed overrides (semantic only):

- Information.priority
- Action.criticality
- Relationship.affinity / volume
- Rule.stereotype

Forbidden overrides:

- “Use tabs”
- “Primary button bottom-right”
- “Three-column layout”
- Component picks

If a customer insists on chrome preference (e.g. side nav over tabs), that is a **renderer theme policy**, not a Translation Layer input.
