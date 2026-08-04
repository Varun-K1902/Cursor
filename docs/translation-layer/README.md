# Business-to-UX Translation Layer

## Core IP Design

**Product stance:** This is not a page builder. Business users never author pages, forms, grids, tabs, layouts, or components. They describe how the business works. A compiler turns that description into an enterprise application.

**Principle:** UI is a *consequence* of business understanding — never a parallel design activity.

```
Business Exploration
        ↓
Specification Graph          ← semantic IR of the business
        ↓
Business-to-UX Translation Layer   ← THIS DOCUMENT (core IP)
        ↓
Application Model
        ↓
Navigation Model
        ↓
Workspace Model
        ↓
Layout Model                 ← still abstract (placement intents, not pixels)
        ↓
UI Components                ← framework-specific render later
        ↓
Running Application
```

---

## 1. Why an intermediate layer exists

Jumping from “Review Child” → “Child Profile Page with 5 tabs” collapses too many decisions into one opaque leap. That is how no-code tools force business users to think like designers.

The Translation Layer is a **multi-pass compiler**. Each pass lowers business semantics into UX semantics through named intermediate representations (IRs). Every decision is deterministic, explainable, and revisitable.

| Pass | Input | Output IR |
|------|-------|-----------|
| 0 | Exploration artefacts | Specification Graph |
| 1 | Activity + graph | Interaction Intent |
| 2 | Interaction Intent | Workspace Intent |
| 3 | Workspace Intent | Workspace Pattern |
| 4 | Objects + relationships + priorities | Information Architecture |
| 5 | IA + affinity + cardinality | Navigation Model |
| 6 | Actions + goals + frequency | Action Model |
| 7 | Business rules + intents | Affordance Bindings |
| 8 | All of the above | Workspace Definition |
| 9 | Workspace Definition | Layout Model (abstract) |

Passes 1–9 are the Translation Layer. Downstream renderers consume the Layout Model; they do not reinterpret business meaning.

---

## 2. Specification Graph (input IR)

The business has already been explored into a typed graph. The Translation Layer never talks to free text alone — it compiles from this graph.

### Node kinds

| Kind | Examples | UX relevance |
|------|----------|--------------|
| **Journey** | Child Immunization | Application module / journey shell |
| **Activity** | Search Child, Review Child, Administer Vaccine | Workspace candidates |
| **Goal** | Confirm eligibility, Complete dose | Primary goal of a workspace |
| **BusinessObject** | Child, Vaccination, GrowthRecord | Primary/supporting objects |
| **Information** | DOB, Weight, Vaccine due date | Fields with priority |
| **Decision** | Eligible for vaccine? | Decision surfaces / gates |
| **Rule** | No dose before eligibility | Affordance bindings |
| **Action** | Administer Vaccine, Refer | Action model |
| **Role** | ANM, MO, Parent | Permissions + actor framing |
| **Exception** | Duplicate dose attempt | Alerts, blocks, alternate paths |
| **Event** | Child arrived, Dose due | Inbox / timeline triggers |

### Edge kinds

`participates_in`, `operates_on`, `reads`, `writes`, `decides`, `guards`, `produces`, `related_to`, `requires_role`, `raises`, `precedes`, `supports_goal`

### Cardinality & affinity (on `related_to`)

- **Cardinality:** `1:1`, `1:N`, `N:M`
- **Affinity:** `identity` (same subject), `clinical`, `administrative`, `evidence`, `temporal`
- **Volatility:** `stable` | `session` | `realtime`
- **Volume hint:** `scalar` | `small-set` | `large-set` | `stream`

These annotations drive navigation and section choices later — still without mentioning tabs or panels in the business layer.

---

## 3. Pass 1 — Interaction Intent

**Question answered:** *What is the user trying to accomplish in this activity?*

```
Business Activity
        ↓
Interaction Intent
```

### Schema

```yaml
InteractionIntent:
  activityId: id
  activityName: string
  primaryGoal: GoalRef
  goalType: locate | comprehend | decide | mutate | verify | monitor | guide
  primaryObject: ObjectRef
  supportingObjects: ObjectRef[]
  operations:
    read: InformationRef[]
    write: InformationRef[]
  decisions: DecisionRef[]
  actions: ActionRef[]          # candidate actions in scope
  exceptions: ExceptionRef[]
  roles: RoleRef[]
  successSignal: string         # what “done” means in business terms
  cognitiveMode: scan | inspect | compare | compose | approve | follow-up
```

### Derivation rules (deterministic)

1. **Primary object** = BusinessObject with highest `operates_on` weight for the Activity; ties broken by Goal attachment.
2. **Goal type** from verb taxonomy on Activity + Goal:
   - search/find/locate → `locate`
   - review/view/assess → `comprehend`
   - approve/reject → `decide`
   - record/administer/update → `mutate`
   - confirm/validate → `verify`
   - track/overview → `monitor`
   - step-through/onboard → `guide`
3. **Cognitive mode** from goal type + object cardinality + decision count (see matrix in §4).
4. **Read/write sets** from `reads` / `writes` edges; write set non-empty ⇒ mutate bias.
5. **Frequent actions** ranked by: (a) attached to primary goal, (b) outbound from activity, (c) historical frequency if available, else declared `criticality`.

### Example — “Review Child”

```yaml
InteractionIntent:
  activityName: Review Child
  primaryGoal: Establish clinical readiness for immunization actions
  goalType: comprehend
  primaryObject: Child
  supportingObjects: [Vaccination, GrowthRecord, Visit, Document, Family]
  operations:
    read: [identity, DOB, age, nutritionStatus, vaccineSchedule, overdueFlags, lastVisit]
    write: []                      # review itself is read-dominant
  decisions: [EligibleForDose?, HasOverdueVaccines?]
  actions: [AdministerVaccine, RecordGrowth, ReferChild, OpenDocuments]
  exceptions: [RecordIncomplete, IdentityMismatch]
  roles: [ANM, MedicalOfficer]
  successSignal: Worker can correctly choose next clinical action
  cognitiveMode: inspect
```

---

## 4. Pass 2–3 — Workspace Intent → Workspace Pattern

**Question answered:** *What type of workspace is this?*

```
Interaction Intent
        ↓
Workspace Intent          ← still business-shaped (“why this surface exists”)
        ↓
Workspace Pattern         ← UX-shaped pattern family (not a page)
```

### Workspace Intent

```yaml
WorkspaceIntent:
  name: string
  purpose: string                 # one sentence, business language
  primaryObject: ObjectRef
  primaryGoal: GoalRef
  interactionProfile:
    goalType: ...
    cognitiveMode: ...
    readWriteRatio: 0..1          # 1 = pure read
    decisionDensity: low|med|high
    actionDensity: low|med|high
    objectSpan: single|cluster|fleet
    timeOrientation: none|point|range|stream
  entryContext: search-result | task-queue | deep-link | journey-step | notification
```

### Workspace Pattern catalogue

| Pattern | When it wins (signals) |
|---------|------------------------|
| **Search Workspace** | `locate` + large-set primary + high scan |
| **Profile Workspace** | `comprehend`/`inspect` + single primary + rich related cluster |
| **Dashboard Workspace** | `monitor` + fleet/aggregate + KPIs dominate |
| **Inbox Workspace** | entry from queue/notification + item list + act-per-row |
| **Approval Workspace** | `decide`/`approve` + high decision density + dual write (decision record) |
| **Wizard Workspace** | `guide` + ordered activities + mutate along steps |
| **Capture Workspace** | `mutate` + write-dominant + few supporting objects |
| **Analytics Workspace** | `monitor`/`compare` + metrics + dimensional breakdown |
| **Timeline Workspace** | temporal stream affinity dominates related objects |

Patterns are **not screens**. They are compilation targets that constrain later navigation, section, and action rules.

### Classifier (scoring)

Each pattern receives a score from weighted signals. Highest score wins; second place retained as `alternatePattern` for explainability.

```
score(Profile) =
  +3 comprehend|inspect
  +2 single primary object
  +2 related cluster size ≥ 3
  +1 readWriteRatio ≥ 0.7
  +1 decisionDensity ≤ med
  -2 locate with large-set
  -2 guide with ≥ 4 ordered steps
```

Similar scorecards exist per pattern (full tables in `docs/translation-layer/classifiers.md`).

### Example — Review Child

```yaml
WorkspaceIntent:
  name: Child Clinical Review
  purpose: Understand this child's status well enough to act safely
  primaryObject: Child
  interactionProfile:
    goalType: comprehend
    cognitiveMode: inspect
    readWriteRatio: 0.95
    decisionDensity: med
    actionDensity: med
    objectSpan: cluster
    timeOrientation: range
  entryContext: search-result

WorkspacePattern:
  selected: Profile Workspace
  confidence: 0.86
  alternate: Timeline Workspace      # because vaccination/growth are temporal
  rationale:
    - inspect + single Child
    - rich related cluster
    - read-dominant with outbound clinical actions
```

---

## 5. Pass 4 — Information Architecture

**Question answered:** *What information exists, and how important is it?*

Every Information node (and summarized related object) receives a **priority**:

| Priority | Meaning | Layout consequence (later) |
|----------|---------|----------------------------|
| **Critical** | Needed for the primary goal / safety | Persistent header / identity strip / mandatory section |
| **Important** | Needed for frequent decisions/actions | Primary column, above fold |
| **Supporting** | Context that improves judgment | Secondary column / progressive disclosure |
| **Reference** | Audit, history, rare lookup | Related rail / overflow / search-within |

### Priority assignment rules

```
Critical if:
  - guards a blocking Rule, OR
  - identity of primary object, OR
  - required input of primary Action for this workspace

Important if:
  - read by a Decision in this activity, OR
  - listed on Goal’s success criteria

Supporting if:
  - related object summary used occasionally, OR
  - non-key attributes of primary object

Reference if:
  - historical stream, attachments, audit, large-set listings not needed for goal
```

Business users set meaning (what matters clinically). They do **not** set “put this in the top bar.” Priority is the business-facing dial; placement is compiled.

### IA node

```yaml
IANode:
  ref: InformationRef | ObjectRef
  priority: critical|important|supporting|reference
  facet: identity|status|clinical|admin|evidence|temporal|relation
  displayRole: headline|metric|field|collection|signal
  relatedVia: edge?
```

---

## 6. Pass 5 — Navigation Model

**Question answered:** *How do related objects become traversable structure?*

**Never ask the business user to choose tabs vs sidebar.** Compile from IA + relationship metadata.

### Navigation strategies

| Strategy | Compile when |
|----------|--------------|
| **Identity strip** | Critical identity fields of primary object (always) |
| **Section stack** | Supporting facets of the *same* object (inline sections) |
| **Related panels** | 1:1 or small-set related objects with high affinity |
| **Peer navigation (tabs)** | 3–7 related collections, similar affinity weight, user switches often between peers |
| **Side navigation** | ≥ 6 destinations OR mixed affinity groups needing grouping |
| **Nested navigation** | Related object itself has a deep cluster (e.g. Family → members → documents) |
| **Expandable sections** | Supporting/reference, low visit frequency |
| **Temporal spine** | Timeline pattern or temporal affinity dominates |

### Deterministic selection algorithm

```
for each related object R of primary P:
  score_peer    = affinity_similarity_to_other_siblings + switch_frequency
  score_side    = groupable_by_affinity + count_bonus
  score_panel   = (cardinality in {1:1, small-set}) + high priority
  score_nested  = depth(R.cluster) ≥ 2
  score_expand  = priority in {supporting, reference} + low frequency
  score_timeline= temporal affinity ∧ volume stream|large-set

assign R to argmax(strategy scores)
constrain:
  if peer_count between 3 and 7 AND variance(affinity) low → prefer Peer navigation
  if peer_count ≥ 8 → Side navigation with affinity groups
  if pattern == Timeline Workspace → Temporal spine wins for temporal Rs
```

### Example — Child related objects

| Related | Cardinality | Affinity | Priority | Compiled as |
|---------|-------------|----------|----------|-------------|
| Vaccinations | 1:N | clinical + temporal | Important | Peer nav item (clinical group) |
| Growth | 1:N | clinical + temporal | Important | Peer nav item |
| Visits | 1:N | temporal | Supporting | Peer nav item |
| Family | 1:1 / small | identity | Supporting | Related panel (summary) + nested if deep |
| Documents | 1:N | evidence | Reference | Expandable / peer under Evidence |

```yaml
NavigationModel:
  primary: Child
  identityStrip: [name, age, sex, id, nutritionStatus]
  peerNavigation:
    group: Clinical
    items: [Overview, Vaccinations, Growth, Visits]
  sideGroups: []                    # not needed (only 4 peers)
  relatedPanels: [FamilySummary]
  expandable: [Documents]
  nested:
    Family: [Members, Guardians, Contact]
```

---

## 7. Pass 6 — Action Model

**Question answered:** *How should actions be surfaced without placing buttons?*

```yaml
ActionModel:
  primary: ActionRef[]            # 1, rarely 2
  secondary: ActionRef[]          # 2–4
  overflow: ActionRef[]
  inlineRow: ActionRef[]          # for collections / inbox rows
  destructive: ActionRef[]        # never primary unless goal is destructive
```

### Ranking signals

| Signal | Weight |
|--------|--------|
| Advances `primaryGoal` | +5 |
| Declared activity outbound action | +3 |
| Write on primary object | +2 |
| Frequency / criticality | +1..+3 |
| Behind blocking rule until satisfied | surface as **Recommended Next** when eligible, else disabled primary |
| Rare / admin / reverse ops | overflow |
| Destructive | destructive lane |

### Example — Review Child

```yaml
ActionModel:
  primary: [AdministerVaccine]         # goal: readiness to immunize
  secondary: [RecordGrowth, ReferChild]
  overflow: [PrintCard, TransferRecord]
  recommendedNext: AdministerVaccine   # if eligibility true & overdue exists
```

---

## 8. Pass 7 — Rule → Affordance Bindings

**Question answered:** *How do rules influence UX without designers wiring each control?*

Business Rule → **Affordance Binding** (UX semantic, not widget).

| Rule effect class | UX affordance |
|-------------------|---------------|
| Hard precondition fails | `disableAction` + `blockReason` |
| Soft warning | `warningBanner` or `alertBadge` |
| Field-level constraint | `inlineValidation` |
| Suggested remediation | `recommendedNextAction` |
| Hide irrelevant path | `conditionalVisibility` |
| Duplicate / conflict | `blockAction` + `exceptionWorkspace` link |
| Overdue / SLA | `alertBadge` on collection + `kpiSignal` |

### Binding schema

```yaml
AffordanceBinding:
  ruleId: id
  when: CEL-or-predicate          # evaluated against graph facts
  effects:
    - type: disableAction|warningBanner|alertBadge|inlineValidation|
            recommendedNextAction|conditionalVisibility|blockAction|kpiSignal
      target: ActionRef|SectionRef|FieldRef|NavItemRef
      severity: info|warning|critical
      messageKey: i18n
```

### Example rules

| Rule | Binding |
|------|---------|
| Cannot administer before eligibility | `disableAction(AdministerVaccine)` + message |
| Show overdue vaccines | `alertBadge(Vaccinations nav)` + `kpiSignal(overdueCount)` + `warningBanner` if count>0 |
| Block duplicate administration | `blockAction` + `inlineValidation` on dose selection |

Business authors maintain rules. The Translation Layer chooses affordances from effect class — designers do not.

---

## 9. Pass 8 — Workspace Definition (compiler output)

**Not HTML. Not React.** Framework-agnostic application semantics.

```yaml
WorkspaceDefinition:
  id: ws_review_child
  name: Child Clinical Review
  purpose: Understand this child's status well enough to act safely
  pattern: ProfileWorkspace
  primaryObject: Child
  primaryGoal: Establish clinical readiness for immunization actions

  permissions:
    roles: [ANM, MedicalOfficer]
    actionsAllowed: [...]

  navigation: NavigationModel           # from pass 5

  sections:                             # ordered by priority + pattern template
    - id: identity
      priority: critical
      purpose: Recognize the child
      contentRefs: [...]
    - id: clinical_status
      priority: critical
      purpose: Safety & eligibility signals
    - id: overview_summary
      priority: important
    - id: related_family
      priority: supporting
      presentationHint: panel

  quickActions: ActionModel
  alerts: AffordanceBinding[]           # banner/badge class only
  kpis:
    - overdueVaccines
    - lastVisitDays
    - growthZScore
  relatedInformation: [...]
  widgets:                              # abstract widget intents, not components
    - kind: statusSignal
    - kind: scheduleList
    - kind: measurementTrend
    - kind: relatedEntitySummary
  rules: AffordanceBinding[]
  trace:
    activityId: act_review_child
    journeyId: j_child_immunization
    classifierConfidence: 0.86
```

### Widget intents (still abstract)

`statusSignal`, `identityHeader`, `recordForm`, `scheduleList`, `measurementTrend`, `approvalCard`, `queueTable`, `searchFacet`, `stepProgress`, `timeline`, `relatedEntitySummary`, `documentList`, `kpiStrip`

A later **Layout Model** maps widget intents → sections → recommended component *types*. Pixel design and framework components remain outside this layer.

---

## 10. Pass 9 — Layout Model (abstract placement)

Still not UI toolkit. Placement intents only:

```yaml
LayoutModel:
  workspaceId: ws_review_child
  regions:
    header:
      embeds: [identityHeader, kpiStrip, alertRegion]
    primary:
      embeds: [statusSignal, scheduleList]
    secondary:
      embeds: [relatedEntitySummary, measurementTrend]
    actionRail:
      primary: [AdministerVaccine]
      secondary: [RecordGrowth, ReferChild]
    navigationChrome:
      kind: peerTabs
      items: [Overview, Vaccinations, Growth, Visits]
  disclosure:
    Documents: overflowDrawer
  priorityGate:
    critical: header|primary
    important: primary
    supporting: secondary
    reference: disclosure
```

Renderers (web, mobile, desktop) interpret regions differently — same Workspace Definition, different chrome.

---

## 11. Application Model (journey-level assembly)

Workspaces compile into an **Application Model**:

```yaml
ApplicationModel:
  journeys:
    - id: j_child_immunization
      workspaces:
        - SearchChild        → SearchWorkspace
        - ReviewChild        → ProfileWorkspace
        - AdministerVaccine  → CaptureWorkspace (or Wizard step)
        - RecordGrowth       → CaptureWorkspace
      transitions:
        - SearchChild.select → ReviewChild
        - ReviewChild.AdministerVaccine → AdministerVaccine
        - AdministerVaccine.complete → ReviewChild
      shellNavigation:
        compiled from journey activities + role task mix
```

Shell navigation (app-level) uses the same strategy engine as object navigation, with Journey/Activity nodes as destinations.

---

## 12. Compiler properties (non-negotiable)

1. **Deterministic** — same Specification Graph → same Workspace Definition.
2. **Explainable** — every pattern/nav/action choice carries `rationale[]`.
3. **Incremental** — change a Rule → rebind affordances without redesigning screens.
4. **Bidirectional trace** — UI semantic → Activity/Object/Rule IDs (audit for govt/enterprise).
5. **Framework agnostic** — output is data, not components.
6. **No business user escape hatches into layout** — overrides, if any, are semantic (“this information is Critical”), never “move widget to left column.”

---

## 13. What business users *never* see

Pages · Forms · Grids · Tabs · Sidebars · Layouts · Components · CSS · Screens · Buttons-as-design

They see: Journeys, Activities, Objects, People, Goals, Information, Decisions, Rules, Actions, Exceptions.

---

## 14. Document map

| File | Contents |
|------|----------|
| `docs/translation-layer/README.md` | This overview |
| `docs/translation-layer/architecture.md` | Pass pipeline & IR schemas |
| `docs/translation-layer/classifiers.md` | Pattern & navigation scorecards |
| `docs/translation-layer/workspace-definition.schema.yaml` | Output contract |
| `examples/child-immunization/README.md` | End-to-end compiled example |
| `examples/child-immunization/specification-graph.yaml` | Input graph |
| `examples/child-immunization/translation-output.yaml` | Full compiler output |

---

## 15. One-line thesis

> **The Translation Layer is a compiler from business meaning to UX meaning.**  
> Workspaces, navigation, actions, and alerts are *emitted artefacts* — not authored screens.
