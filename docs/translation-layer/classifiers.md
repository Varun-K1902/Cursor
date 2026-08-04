# Classifiers & Deterministic Scorecards

All scores are additive. Highest wins. Keep top-2 for `alternate` + rationale.

---

## 1. Workspace Pattern classifier

### Signal encoding

From `WorkspaceIntent.interactionProfile` + graph facts:

| Signal | Values |
|--------|--------|
| G | goalType |
| C | cognitiveMode |
| RW | readWriteRatio |
| DD | decisionDensity |
| AD | actionDensity |
| OS | objectSpan |
| T | timeOrientation |
| E | entryContext |
| RelN | count of related objects on primary |
| Vol | volume of primary collection if locate |

---

### SearchWorkspace

```
+4  G=locate
+3  Vol=large_set
+2  C=scan
+2  E=deep-link|journey-step with locate activity
+1  AD=low
-3  OS=single AND RelN≥3 AND G=comprehend
-2  G=guide
```

### ProfileWorkspace

```
+4  G=comprehend
+3  C=inspect
+3  OS=single
+2  RelN≥3
+2  RW≥0.7
+1  DD≤med
-3  G=locate AND Vol=large_set
-3  G=guide AND orderedSteps≥4
-2  G=decide AND DD=high AND AD≤med   # approval tends to win
```

### DashboardWorkspace

```
+4  G=monitor
+3  OS=fleet
+3  kpiCount≥3
+2  C=scan|compare
-2  OS=single AND RelN≤2
```

### InboxWorkspace

```
+4  E=task-queue|notification
+3  primary is work-item/task collection
+2  AD=med|high with inlineRow actions
+2  C=follow-up|scan
-2  OS=single identity profile
```

### ApprovalWorkspace

```
+4  G=decide
+3  C=approve
+3  DD=high
+2  writes include DecisionRecord|Approval
+1  dual control / requires_role ≥2
-2  G=mutate without decide
```

### WizardWorkspace

```
+4  G=guide
+3  ordered activity chain ≥3 in journey segment
+2  C=compose
+2  E=journey-step
-3  single activity with no precedes chain
```

### CaptureWorkspace

```
+4  G=mutate
+3  RW≤0.45
+2  OS=single|cluster with RelN≤2
+2  C=compose
+1  AD=low|med focused write
-3  RelN≥5 AND G=comprehend
-2  G=locate
```

### AnalyticsWorkspace

```
+4  G=monitor|compare with dimensional metrics
+3  C=compare
+3  aggregate measures dominate information nodes
-2  mutate write set non-empty as primary goal
```

### TimelineWorkspace

```
+4  T=stream|range AND temporal affinity majority on related
+3  C=inspect|follow-up
+2  collections are event-like
+1  Profile also scores high → alternate pairing
-2  no temporal relationships
```

---

## 2. Cognitive mode matrix

| goalType | default mode | upgrade when |
|----------|--------------|--------------|
| locate | scan | — |
| comprehend | inspect | ≥2 objects to contrast → compare |
| decide | approve | — |
| mutate | compose | — |
| verify | inspect | — |
| monitor | scan | dimensional → compare |
| guide | compose | — |

---

## 3. Navigation strategy scorecard (per related object R)

```
peerNav:
  +3 similar affinity to sibling set
  +2 declared switchFrequency high|med
  +1 volume small_set|large_set (collection)
  +1 priority important|critical
  -2 priority reference
  -2 nestedDepth≥2

sideNav:
  +3 total destinations ≥6
  +2 mixed affinity requiring groups
  +1 enterprise role with many tasks

relatedPanel:
  +4 cardinality one|small_set
  +2 priority supporting|important
  +1 affinity identity|clinical summary
  -3 volume large_set|stream

nested:
  +4 R itself has related cluster depth≥2
  +2 administrative hierarchy

expandable:
  +3 priority reference|supporting
  +2 switchFrequency low
  +1 volume large_set evidence/docs

temporalSpine:
  +4 affinity temporal AND pattern Timeline
  +2 volume stream
  +1 T=range|stream on workspace intent

sectionStack:           # same-object facets, not related objects
  used for primary object attribute groups by facet
```

### Global constraints (post-assignment)

1. If `peerNav` items ∈ [3,7] and affinity variance low → keep peerNav.
2. If `peerNav` items ≥8 → promote to sideNav with affinity groups.
3. If pattern is TimelineWorkspace → force temporalSpine for temporal collections; peerNav becomes filters on spine.
4. Always emit identityStrip from Critical∩facet(identity|status) on primary.
5. Family/guardian style 1:1 identity relations prefer relatedPanel + optional nested.

---

## 4. Action ranking

```
score(action) =
  +5  advances primaryGoal
  +3  outbound from activity
  +2  writes primaryObject
  +0..3 criticality (declared)
  +2  recommended by satisfied eligibility rule
  -4  destructive (move to destructive lane; cannot be sole primary unless goalType destructive)
  -2  admin/rare stereotype → overflow bias
  -∞  hard-blocked by rule (still listed, disabled)
```

Placement:

- `primary`: top 1 (allow 2 if scores within 1 and both advance goal)
- `secondary`: next 2–4 with score ≥ threshold
- `overflow`: remainder non-destructive
- `inlineRow`: actions whose object is collection row entity in Search/Inbox
- `destructive`: separate lane

---

## 5. Information priority

```
critical:
  identity of primary OR
  guards hard rule OR
  required input of primary action

important:
  read by decision in activity OR
  on goal success criteria OR
  KPI attached to workspace purpose

supporting:
  related summary aiding judgment OR
  non-key primary attributes

reference:
  history streams, audit, attachments, rare lookups
```

Conflict rule: max(priority) wins when multiple conditions match.

---

## 6. Pattern templates → section expectations

| Pattern | Expected regions | Default nav |
|---------|------------------|-------------|
| Search | query, filters, results, preview | none |
| Profile | identity, status, summary, peer collections, panels | peer/side |
| Dashboard | kpi strip, charts, breakdowns, shortcuts | side groups |
| Inbox | queue filters, item list, detail pane | list+detail |
| Approval | subject summary, decision panel, evidence, audit | section stack |
| Wizard | step progress, step capture, guardrails | step chrome |
| Capture | context, fields, validation, confirm | none |
| Analytics | measures, dimensions, table | side dims |
| Timeline | spine, event detail, filters | temporal spine |

Templates constrain WorkspaceAssembler; they still emit abstract sections, not widgets-as-pixels.
