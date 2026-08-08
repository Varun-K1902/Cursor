import type {
  Challenge,
  ConfirmationState,
  Entity,
  FieldDef,
  Person,
  ProcessModel,
  Provenance,
  Statement,
  Step,
  VerbKind,
} from './types'
import { verbKindFromVerb } from './derive'

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

function provenance(
  statement: Statement,
  origin: Provenance['origin'],
  confirmation: ConfirmationState = origin === 'explicit' ? 'explicit' : 'inferred',
): Provenance {
  return {
    statementId: statement.id,
    sourceText: statement.text,
    speaker: statement.speaker,
    timestamp: statement.timestamp,
    origin,
    confirmation,
  }
}

export interface InterpretResult {
  model: ProcessModel
  summary: string
  challenges: Challenge[]
}

function ensurePerson(model: ProcessModel, label: string, prov: Provenance): ProcessModel {
  if (model.people.some((p) => p.label.toLowerCase() === label.toLowerCase())) return model
  const person: Person = { id: id('person'), label, provenance: prov }
  return { ...model, people: [...model.people, person] }
}

function ensureEntity(
  model: ProcessModel,
  label: string,
  flags: Partial<Pick<Entity, 'hasCreator' | 'hasReader'>>,
  prov: Provenance,
): ProcessModel {
  const existing = model.things.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (existing) {
    return {
      ...model,
      things: model.things.map((t) =>
        t.id === existing.id
          ? {
              ...t,
              hasCreator: t.hasCreator || !!flags.hasCreator,
              hasReader: t.hasReader || !!flags.hasReader,
            }
          : t,
      ),
    }
  }
  const entity: Entity = {
    id: id('entity'),
    label,
    hasCreator: !!flags.hasCreator,
    hasReader: !!flags.hasReader,
    provenance: prov,
  }
  return { ...model, things: [...model.things, entity] }
}

function entityId(model: ProcessModel, label: string): string | null {
  return model.things.find((t) => t.label.toLowerCase() === label.toLowerCase())?.id ?? null
}

function addOrUpdateStep(model: ProcessModel, step: Step): ProcessModel {
  const existing = model.steps.find(
    (s) => s.label.toLowerCase() === step.label.toLowerCase(),
  )
  if (existing) {
    return {
      ...model,
      steps: model.steps.map((s) =>
        s.id === existing.id
          ? {
              ...s,
              ...step,
              id: s.id,
              fields: mergeFields(s.fields, step.fields),
              outcomes: mergeOutcomes(s.outcomes, step.outcomes),
              actions: [...new Set([...s.actions, ...step.actions])],
              relatedSets: mergeRelated(s.relatedSets, step.relatedSets),
              tabs: step.tabs ?? s.tabs,
            }
          : s,
      ),
      selectedStepId: existing.id,
    }
  }
  return {
    ...model,
    steps: [...model.steps, step],
    selectedStepId: step.id,
  }
}

function mergeFields(a: FieldDef[], b: FieldDef[]): FieldDef[] {
  const map = new Map(a.map((f) => [f.label.toLowerCase(), f]))
  for (const f of b) {
    if (!map.has(f.label.toLowerCase())) map.set(f.label.toLowerCase(), f)
  }
  return [...map.values()]
}

function mergeOutcomes(a: Step['outcomes'], b: Step['outcomes']): Step['outcomes'] {
  const map = new Map(a.map((o) => [o.label.toLowerCase(), o]))
  for (const o of b) {
    const prev = map.get(o.label.toLowerCase())
    if (!prev) map.set(o.label.toLowerCase(), o)
    else if (!prev.targetStepId && o.targetStepId) map.set(o.label.toLowerCase(), { ...prev, targetStepId: o.targetStepId })
  }
  return [...map.values()]
}

function mergeRelated(a: Step['relatedSets'], b: Step['relatedSets']): Step['relatedSets'] {
  const map = new Map(a.map((r) => [r.label.toLowerCase(), r]))
  for (const r of b) {
    if (!map.has(r.label.toLowerCase())) map.set(r.label.toLowerCase(), r)
  }
  return [...map.values()]
}

function nextOrder(model: ProcessModel): number {
  return model.steps.reduce((m, s) => Math.max(m, s.order), -1) + 1
}

function linkHappyPath(model: ProcessModel, fromLabel: string, toLabel: string, outcomeLabel = 'then'): ProcessModel {
  const from = model.steps.find((s) => s.label.toLowerCase() === fromLabel.toLowerCase())
  const to = model.steps.find((s) => s.label.toLowerCase() === toLabel.toLowerCase())
  if (!from || !to) return model
  const outcomes = [...from.outcomes]
  const happy = outcomes.find((o) => o.kind === 'happy')
  if (happy) {
    return {
      ...model,
      steps: model.steps.map((s) =>
        s.id === from.id
          ? {
              ...s,
              outcomes: s.outcomes.map((o) =>
                o.id === happy.id ? { ...o, targetStepId: to.id, label: outcomeLabel } : o,
              ),
            }
          : s,
      ),
    }
  }
  return {
    ...model,
    steps: model.steps.map((s) =>
      s.id === from.id
        ? {
            ...s,
            outcomes: [
              ...s.outcomes,
              {
                id: id('out'),
                label: outcomeLabel,
                targetStepId: to.id,
                kind: 'happy' as const,
              },
            ],
          }
        : s,
    ),
  }
}

function makeStep(partial: {
  label: string
  role: string | null
  verb: string
  verbKind?: VerbKind
  entityLabel?: string
  model: ProcessModel
  cardinality?: Step['cardinality']
  fields?: FieldDef[]
  actions?: string[]
  relatedSets?: Step['relatedSets']
  tabs?: string[]
  hasRowAction?: boolean
  outcomes?: Step['outcomes']
  prov: Provenance
}): Step {
  const entityIdVal = partial.entityLabel
    ? entityId(partial.model, partial.entityLabel)
    : null
  return {
    id: id('step'),
    label: partial.label,
    role: partial.role,
    verb: partial.verb,
    verbKind: partial.verbKind ?? verbKindFromVerb(partial.verb),
    entityId: entityIdVal,
    cardinality: partial.cardinality ?? 'one',
    fields: partial.fields ?? [],
    outcomes: partial.outcomes ?? [],
    relatedSets: partial.relatedSets ?? [],
    hasRowAction: partial.hasRowAction ?? false,
    hasAggregation: false,
    automated: false,
    screenOverride: null,
    tabs: partial.tabs,
    actions: partial.actions ?? [],
    warnings: [],
    disabledActions: [],
    provenance: partial.prov,
    order: nextOrder(partial.model),
  }
}

/**
 * Deterministic interpreter — turns business statements into model updates.
 * Intentionally hypothesis-driven: prefers SHOW → CONFIRM over ASK → FILL.
 */
export function interpretStatement(
  model: ProcessModel,
  text: string,
  modality: Statement['modality'] = 'typed',
): InterpretResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { model, summary: 'Empty statement ignored.', challenges: [] }
  }

  const statement: Statement = {
    id: id('stmt'),
    text: trimmed,
    modality,
    timestamp: now(),
    speaker: 'Business user',
  }

  let next: ProcessModel = {
    ...model,
    statements: [...model.statements, statement],
    updatedAt: now(),
  }
  const prov = provenance(statement, 'explicit')
  const inferred = provenance(statement, 'inferred')
  const challenges: Challenge[] = []
  const notes: string[] = []
  const lower = trimmed.toLowerCase()

  // Role detection
  const rolePatterns: [RegExp, string][] = [
    [/\bnurses?\b/, 'Nurse'],
    [/\bchw\b|community health/, 'CHW'],
    [/\banm\b/, 'ANM'],
    [/\bregional manager\b|\brm\b/, 'Regional Manager'],
    [/\bbranch manager\b|\bbm\b/, 'Branch Manager'],
    [/\bhod\b|head of department/, 'HOD'],
    [/\bemployee\b/, 'Employee'],
    [/\bmanager\b/, 'Manager'],
  ]
  let detectedRole: string | null = null
  for (const [re, label] of rolePatterns) {
    if (re.test(lower)) {
      next = ensurePerson(next, label, prov)
      detectedRole = label
      notes.push(`Recognized role: ${label}`)
    }
  }

  // Entity detection
  const entityPatterns: [RegExp, string][] = [
    [/\bchild(?:ren)?\b/, 'Child'],
    [/\bvaccine|vaccination\b/, 'Vaccination'],
    [/\bgrowth|weight\b/, 'Growth'],
    [/\bvisit\b/, 'Visit'],
    [/\bsite application|site assessment|site\b/, 'Site Application'],
    [/\battendance\b/, 'Attendance'],
    [/\bdap\b/, 'DAP'],
    [/\bsap\b/, 'SAP'],
  ]
  for (const [re, label] of entityPatterns) {
    if (re.test(lower)) {
      const isCreate = /register|create|add|new/.test(lower)
      const isRead = /search|find|open|review|see|check|look/.test(lower)
      next = ensureEntity(next, label, { hasCreator: isCreate, hasReader: isRead || !isCreate }, prov)
      notes.push(`Recognized thing: ${label}`)
    }
  }

  // Search child
  if (/search.*child|find.*child|look.*up.*child|locate.*child/.test(lower)) {
    const fields: FieldDef[] = []
    if (/child id|id/.test(lower)) {
      fields.push({ id: id('fld'), label: 'Child ID', mode: 'editable', provenance: prov })
    }
    if (/mother|mom/.test(lower)) {
      fields.push({ id: id('fld'), label: "Mother's Name", mode: 'editable', provenance: prov })
    }
    if (/name/.test(lower) && !/mother/.test(lower)) {
      fields.push({ id: id('fld'), label: 'Name', mode: 'editable', provenance: inferred })
    }
    if (fields.length === 0) {
      fields.push(
        { id: id('fld'), label: 'Child ID', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Name', mode: 'editable', provenance: inferred },
      )
      notes.push('Inferred search fields (Child ID, Name) — confirm or correct')
    }

    const step = makeStep({
      label: 'Search Child',
      role: detectedRole ?? 'Nurse',
      verb: 'search',
      verbKind: 'search',
      entityLabel: 'Child',
      model: next,
      cardinality: 'many',
      fields,
      actions: ['Search'],
      hasRowAction: true,
      outcomes: [
        {
          id: id('out'),
          label: 'Child exists',
          targetStepId: null,
          kind: 'branch',
          provenance: inferred,
        },
        {
          id: id('out'),
          label: 'Child not found',
          targetStepId: null,
          kind: 'exception',
          provenance: inferred,
        },
      ],
      prov,
    })
    next = ensurePerson(next, step.role!, inferred)
    next = ensureEntity(next, 'Child', { hasReader: true }, prov)
    next = addOrUpdateStep(next, { ...step, entityId: entityId(next, 'Child') })
    notes.push('Hypothesis: Search Child as a LIST/FORM search surface')

    if (/if.*(exists|found)|when.*(exists|found)|opens? the child|child record|child workspace/.test(lower)) {
      const ws = makeStep({
        label: 'Child Workspace',
        role: detectedRole ?? 'Nurse',
        verb: 'review',
        verbKind: 'review',
        entityLabel: 'Child',
        model: next,
        cardinality: 'one',
        fields: [
          { id: id('fld'), label: 'Child ID', mode: 'readonly', provenance: inferred },
          { id: id('fld'), label: 'Name', mode: 'readonly', provenance: inferred },
          { id: id('fld'), label: 'Date of Birth', mode: 'readonly', provenance: inferred },
          { id: id('fld'), label: 'Eligibility', mode: 'readonly', provenance: inferred },
        ],
        tabs: ['Overview', 'Vaccines', 'Growth', 'Visits'],
        relatedSets: [
          { id: id('rel'), label: 'Vaccinations', entityId: entityId(next, 'Vaccination') ?? 'pending' },
          { id: id('rel'), label: 'Growth records', entityId: entityId(next, 'Growth') ?? 'pending' },
          { id: id('rel'), label: 'Visits', entityId: entityId(next, 'Visit') ?? 'pending' },
        ],
        actions: [],
        outcomes: [{ id: id('out'), label: 'continue', targetStepId: null, kind: 'happy' }],
        prov: /workspace|record/.test(lower) ? prov : inferred,
      })
      next = ensureEntity(next, 'Vaccination', { hasReader: true }, inferred)
      next = ensureEntity(next, 'Growth', { hasReader: true }, inferred)
      next = ensureEntity(next, 'Visit', { hasReader: true }, inferred)
      next = addOrUpdateStep(next, {
        ...ws,
        entityId: entityId(next, 'Child'),
        relatedSets: [
          { id: id('rel'), label: 'Vaccinations', entityId: entityId(next, 'Vaccination')! },
          { id: id('rel'), label: 'Growth records', entityId: entityId(next, 'Growth')! },
          { id: id('rel'), label: 'Visits', entityId: entityId(next, 'Visit')! },
        ],
      })
      next = linkHappyPath(next, 'Search Child', 'Child Workspace', 'Child exists')

      // Register child for not-found — gap if not described
      if (/register|create.*child|new child/.test(lower)) {
        const reg = makeStep({
          label: 'Register Child',
          role: detectedRole ?? 'Nurse',
          verb: 'create',
          verbKind: 'create',
          entityLabel: 'Child',
          model: next,
          cardinality: 'one',
          fields: [
            { id: id('fld'), label: 'Name', mode: 'editable', provenance: inferred },
            { id: id('fld'), label: "Mother's Name", mode: 'editable', provenance: inferred },
            { id: id('fld'), label: 'Date of Birth', mode: 'editable', provenance: inferred },
          ],
          actions: ['Register'],
          outcomes: [
            {
              id: id('out'),
              label: 'Registered',
              targetStepId: next.steps.find((s) => s.label === 'Child Workspace')?.id ?? null,
              kind: 'happy',
            },
          ],
          prov,
        })
        next = ensureEntity(next, 'Child', { hasCreator: true, hasReader: true }, prov)
        next = addOrUpdateStep(next, { ...reg, entityId: entityId(next, 'Child') })
        const search = next.steps.find((s) => s.label === 'Search Child')
        if (search) {
          next = {
            ...next,
            steps: next.steps.map((s) =>
              s.id === search.id
                ? {
                    ...s,
                    outcomes: s.outcomes.map((o) =>
                      o.label.toLowerCase().includes('not')
                        ? {
                            ...o,
                            targetStepId:
                              next.steps.find((x) => x.label === 'Register Child')?.id ?? null,
                          }
                        : o,
                    ),
                  }
                : s,
            ),
          }
        }
        notes.push('Linked: Child not found → Register Child → Child Workspace')
      } else {
        challenges.push({
          id: id('ch'),
          question: 'If the child is not found, what should happen?',
          context: 'Search Child has an unresolved “Child not found” outcome.',
          options: [
            { id: 'register', label: 'Register Child' },
            { id: 'end', label: 'End / refer elsewhere' },
            { id: 'describe', label: 'I will describe it' },
          ],
          resolved: false,
          relatedStepId: next.steps.find((s) => s.label === 'Search Child')?.id,
        })
        notes.push('Structural gap kept visible: Child not found → ?')
      }
    }
  }

  // Vaccination schedule
  if (/vaccination schedule|immunization schedule|check.*schedule|vaccine schedule/.test(lower)) {
    const step = makeStep({
      label: 'Vaccination Schedule',
      role: detectedRole ?? next.people[0]?.label ?? 'Nurse',
      verb: 'review',
      verbKind: 'review',
      entityLabel: 'Vaccination',
      model: next,
      cardinality: 'many',
      fields: [
        { id: id('fld'), label: 'Antigen / Dose', mode: 'readonly', provenance: inferred },
        { id: id('fld'), label: 'Due date', mode: 'readonly', provenance: inferred },
        { id: id('fld'), label: 'Status', mode: 'readonly', provenance: inferred },
      ],
      actions: [],
      hasRowAction: true,
      outcomes: [{ id: id('out'), label: 'continue', targetStepId: null, kind: 'happy' }],
      prov,
    })
    next = ensureEntity(next, 'Vaccination', { hasReader: true }, prov)
    next = addOrUpdateStep(next, { ...step, entityId: entityId(next, 'Vaccination') })
    if (next.steps.some((s) => s.label === 'Child Workspace')) {
      next = linkHappyPath(next, 'Child Workspace', 'Vaccination Schedule', 'check schedule')
    }
    notes.push('Added Vaccination Schedule (LIST of doses)')
  }

  // Administer vaccine
  if (/administer|give.*(vaccine|dose)|vaccinate/.test(lower)) {
    const step = makeStep({
      label: 'Administer Vaccine',
      role: detectedRole ?? next.people[0]?.label ?? 'Nurse',
      verb: 'administer',
      verbKind: 'administer',
      entityLabel: 'Vaccination',
      model: next,
      cardinality: 'one',
      fields: [
        { id: id('fld'), label: 'Vaccine', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Dose', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Batch / Lot', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Site', mode: 'editable', provenance: inferred },
      ],
      actions: ['Confirm administration', 'Cancel'],
      outcomes: [
        { id: id('out'), label: 'Recorded', targetStepId: null, kind: 'happy' },
        { id: id('out'), label: 'Not eligible', targetStepId: null, kind: 'exception' },
      ],
      prov,
    })
    next = ensureEntity(next, 'Vaccination', { hasCreator: true, hasReader: true }, prov)
    next = addOrUpdateStep(next, { ...step, entityId: entityId(next, 'Vaccination') })

    // Add action onto schedule / workspace
    next = {
      ...next,
      steps: next.steps.map((s) => {
        if (s.label === 'Vaccination Schedule' || s.label === 'Child Workspace') {
          return {
            ...s,
            actions: [...new Set([...s.actions, 'Administer Vaccine'])],
          }
        }
        return s
      }),
      actions: next.actions.some((a) => a.label === 'Administer Vaccine')
        ? next.actions
        : [
            ...next.actions,
            {
              id: id('act'),
              label: 'Administer Vaccine',
              provenance: prov,
            },
          ],
    }

    if (next.steps.some((s) => s.label === 'Vaccination Schedule')) {
      next = linkHappyPath(next, 'Vaccination Schedule', 'Administer Vaccine', 'administer')
    } else if (next.steps.some((s) => s.label === 'Child Workspace')) {
      next = linkHappyPath(next, 'Child Workspace', 'Administer Vaccine', 'administer')
    }

    // Always challenge eligibility rather than inventing rules
    if (/eligib|interval|previous dose|block|disable|cannot|must not/.test(lower)) {
      if (!next.rules.some((r) => /eligib/i.test(r.label))) {
        next = {
          ...next,
          rules: [
            ...next.rules,
            {
              id: id('rule'),
              label: 'Vaccine eligibility',
              effect: 'Disables Administer when not eligible',
              provenance: prov,
            },
          ],
          steps: next.steps.map((s) =>
            s.label === 'Administer Vaccine' || s.label === 'Vaccination Schedule'
              ? {
                  ...s,
                  warnings: [...new Set([...s.warnings, 'Eligibility rule may block administration'])],
                  disabledActions: /block|disable|cannot/.test(lower)
                    ? [...new Set([...s.disabledActions, 'Administer Vaccine'])]
                    : s.disabledActions,
                }
              : s,
          ),
        }
        notes.push('Recorded eligibility rule (explicit)')
      }
    } else {
      challenges.push({
        id: id('ch'),
        question: 'Can the nurse always administer, or do eligibility rules apply?',
        context: 'I will not invent eligibility rules unless you confirm.',
        options: [
          { id: 'always', label: 'Always allowed' },
          { id: 'eligibility', label: 'Eligibility / interval rules apply' },
          { id: 'later', label: 'Decide later' },
        ],
        resolved: false,
        relatedStepId: next.steps.find((s) => s.label === 'Administer Vaccine')?.id,
      })
    }

    // Unresolved: not eligible destination
    challenges.push({
      id: id('ch'),
      question: 'Where does “Not eligible” go after Administer Vaccine?',
      context: 'Exception outcome has no destination yet.',
      options: [
        { id: 'schedule', label: 'Back to Vaccination Schedule' },
        { id: 'workspace', label: 'Back to Child Workspace' },
        { id: 'end', label: 'End visit' },
        { id: 'describe', label: 'I will describe it' },
      ],
      resolved: false,
      relatedStepId: next.steps.find((s) => s.label === 'Administer Vaccine')?.id,
    })

    notes.push('Added Administer Vaccine and linked from schedule/workspace')
  }

  // Growth / weight
  if (/growth|weight|height|nutrition/.test(lower) && /record|capture|enter|measure/.test(lower)) {
    const step = makeStep({
      label: 'Record Growth',
      role: detectedRole ?? next.people[0]?.label ?? 'Nurse',
      verb: 'record',
      verbKind: 'record',
      entityLabel: 'Growth',
      model: next,
      cardinality: 'one',
      fields: [
        { id: id('fld'), label: 'Weight', mode: 'editable', provenance: prov },
        { id: id('fld'), label: 'Height', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Date', mode: 'editable', provenance: inferred },
      ],
      actions: ['Save growth'],
      outcomes: [{ id: id('out'), label: 'Saved', targetStepId: null, kind: 'happy' }],
      prov,
    })
    next = ensureEntity(next, 'Growth', { hasCreator: true, hasReader: true }, prov)
    next = addOrUpdateStep(next, { ...step, entityId: entityId(next, 'Growth') })
    next = {
      ...next,
      steps: next.steps.map((s) =>
        s.label === 'Child Workspace'
          ? { ...s, actions: [...new Set([...s.actions, 'Record Growth'])] }
          : s,
      ),
      actions: next.actions.some((a) => a.label === 'Record Growth')
        ? next.actions
        : [...next.actions, { id: id('act'), label: 'Record Growth', provenance: prov }],
    }
    if (next.steps.some((s) => s.label === 'Child Workspace')) {
      next = linkHappyPath(next, 'Child Workspace', 'Record Growth', 'record growth')
    }
    notes.push('Added Record Growth')
  }

  // Field-only corrections: "also need X" / "search by Y"
  if (/search by|also need|should (?:also )?see|add field|include/.test(lower)) {
    const fieldMatches = trimmed.match(/(?:by|need|see|field|include)\s+([A-Za-z][A-Za-z0-9' ]{1,40})/i)
    // Multiple known fields
    const known = ['Child ID', "Mother's Name", 'Name', 'Date of Birth', 'Assessment Score', 'Site', 'Applicant']
    const added: string[] = []
    for (const k of known) {
      if (lower.includes(k.toLowerCase()) || (k === "Mother's Name" && /mother/.test(lower))) {
        added.push(k)
      }
    }
    if (/assessment score|score/.test(lower)) added.push('Assessment Score')
    if (added.length && next.selectedStepId) {
      next = {
        ...next,
        steps: next.steps.map((s) =>
          s.id === next.selectedStepId || s.label === 'Search Child'
            ? {
                ...s,
                fields: mergeFields(
                  s.fields,
                  added.map((label) => ({
                    id: id('fld'),
                    label,
                    mode: 'editable' as const,
                    provenance: prov,
                  })),
                ),
                provenance: { ...s.provenance, confirmation: 'explicit' as const },
              }
            : s,
        ),
      }
      notes.push(`Updated fields: ${[...new Set(added)].join(', ')}`)
    } else if (fieldMatches) {
      void fieldMatches
    }
  }

  // Remove / shouldn't see
  if (/shouldn'?t see|remove|don'?t (?:need|show|include)|hide/.test(lower)) {
    const hideCandidates = ['financial', 'salary', 'assessment score', 'batch', 'mother']
    for (const c of hideCandidates) {
      if (lower.includes(c)) {
        next = {
          ...next,
          steps: next.steps.map((s) => ({
            ...s,
            fields: s.fields.filter((f) => !f.label.toLowerCase().includes(c.split(' ')[0]!)),
          })),
        }
        notes.push(`Removed fields matching “${c}”`)
      }
    }
  }

  // Manager review / pending applications (SAP-ish / site approval)
  if (/pending application|reviews? (?:the )?(?:site|application)|manager (?:should )?see/.test(lower)) {
    const role = detectedRole ?? 'Regional Manager'
    next = ensurePerson(next, role, prov)
    next = ensureEntity(next, 'Site Application', { hasReader: true }, prov)
    const list = makeStep({
      label: 'Pending Applications',
      role,
      verb: 'read',
      verbKind: 'read',
      entityLabel: 'Site Application',
      model: next,
      cardinality: 'many',
      fields: [
        { id: id('fld'), label: 'Site', mode: 'readonly', provenance: inferred },
        { id: id('fld'), label: 'Applicant', mode: 'readonly', provenance: inferred },
        { id: id('fld'), label: 'Submitted', mode: 'readonly', provenance: inferred },
      ],
      actions: ['Review'],
      hasRowAction: true,
      outcomes: [
        { id: id('out'), label: 'Open review', targetStepId: null, kind: 'happy' },
      ],
      prov,
    })
    next = addOrUpdateStep(next, { ...list, entityId: entityId(next, 'Site Application') })
    notes.push('Hypothesis: Pending Applications LIST for the manager')
    challenges.push({
      id: id('ch'),
      question: 'Is this what the manager needs to see?',
      context: 'I inferred Site, Applicant, Submitted. Correct the fields if needed.',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'change', label: 'Change fields' },
      ],
      resolved: false,
      relatedStepId: next.steps.find((s) => s.label === 'Pending Applications')?.id,
    })
  }

  if (/recommend|reject|send (?:it )?to dap|send to dap/.test(lower)) {
    const role = detectedRole ?? next.people.find((p) => /manager/i.test(p.label))?.label ?? 'Regional Manager'
    next = ensurePerson(next, role, prov)
    const review = makeStep({
      label: 'Site Review',
      role,
      verb: 'decide',
      verbKind: 'decide',
      entityLabel: 'Site Application',
      model: next,
      cardinality: 'one',
      fields: [
        { id: id('fld'), label: 'Site', mode: 'readonly', provenance: inferred },
        { id: id('fld'), label: 'Assessment', mode: 'readonly', provenance: inferred },
      ],
      actions: ['Recommend', 'Reject', 'Send to DAP'].filter((a) => {
        if (a === 'Recommend') return /recommend/.test(lower)
        if (a === 'Reject') return /reject/.test(lower)
        if (a === 'Send to DAP') return /dap/.test(lower)
        return false
      }),
      outcomes: [
        /recommend/.test(lower)
          ? {
              id: id('out'),
              label: 'Recommend',
              targetStepId: null,
              kind: 'branch' as const,
              provenance: prov,
            }
          : null,
        /reject/.test(lower)
          ? {
              id: id('out'),
              label: 'Reject',
              targetStepId: null,
              kind: 'exception' as const,
              provenance: prov,
            }
          : null,
        /dap/.test(lower)
          ? {
              id: id('out'),
              label: 'Send to DAP',
              targetStepId: null,
              kind: 'branch' as const,
              provenance: prov,
            }
          : null,
      ].filter(Boolean) as Step['outcomes'],
      prov,
    })
    next = ensureEntity(next, 'Site Application', { hasReader: true }, prov)
    if (/dap/.test(lower)) next = ensureEntity(next, 'DAP', { hasReader: true }, prov)
    next = addOrUpdateStep(next, { ...review, entityId: entityId(next, 'Site Application') })
    if (next.steps.some((s) => s.label === 'Pending Applications')) {
      next = linkHappyPath(next, 'Pending Applications', 'Site Review', 'Review')
    }
    notes.push('Site Review outcomes materialized — destinations left unresolved where unknown')
    if (/reject/.test(lower)) {
      challenges.push({
        id: id('ch'),
        question: 'Where does rejection go?',
        context: 'Reject has no destination. I will not invent one.',
        options: [
          { id: 'employee', label: 'Return to employee' },
          { id: 'previous', label: 'Previous reviewer' },
          { id: 'end', label: 'End process' },
          { id: 'describe', label: 'Describe it' },
        ],
        resolved: false,
        relatedStepId: next.steps.find((s) => s.label === 'Site Review')?.id,
      })
    }
  }

  // Attendance regularisation (light support for multi-domain proof)
  if (/attendance regularisation|attendance regularization|regularise attendance|regularize attendance/.test(lower)) {
    next = ensurePerson(next, 'Employee', prov)
    next = ensureEntity(next, 'Attendance', { hasCreator: true, hasReader: true }, prov)
    const step = makeStep({
      label: 'Attendance Regularisation',
      role: 'Employee',
      verb: 'create',
      verbKind: 'create',
      entityLabel: 'Attendance',
      model: next,
      cardinality: 'one',
      fields: [
        { id: id('fld'), label: 'Date', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'Reason', mode: 'editable', provenance: inferred },
        { id: id('fld'), label: 'In / Out time', mode: 'editable', provenance: inferred },
      ],
      actions: ['Submit'],
      outcomes: [{ id: id('out'), label: 'Submitted', targetStepId: null, kind: 'happy' }],
      prov,
    })
    next = addOrUpdateStep(next, { ...step, entityId: entityId(next, 'Attendance') })
    challenges.push({
      id: id('ch'),
      question: 'Who is the final approver for this regularisation?',
      context: 'Approver may vary by scale/context (BM / RM / HOD / GM / Chairman).',
      options: [
        { id: 'bm', label: 'Branch Manager' },
        { id: 'rm', label: 'Regional Manager' },
        { id: 'hod', label: 'HOD' },
        { id: 'describe', label: 'Depends — I will describe rules' },
      ],
      resolved: false,
      relatedStepId: next.steps.find((s) => s.label === 'Attendance Regularisation')?.id,
    })
    notes.push('Attendance Regularisation captured; approver left as an open challenge')
  }

  // Generic confirm yes
  if (/^(yes|correct|that'?s right|confirmed)\.?$/i.test(trimmed)) {
    if (next.selectedStepId) {
      next = {
        ...next,
        steps: next.steps.map((s) =>
          s.id === next.selectedStepId
            ? {
                ...s,
                provenance: {
                  ...s.provenance,
                  confirmation: 'confirmed',
                  confirmedBy: 'Business user',
                  confirmedAt: now(),
                },
              }
            : s,
        ),
        challenges: next.challenges.map((c) =>
          c.relatedStepId === next.selectedStepId ? { ...c, resolved: true } : c,
        ),
      }
      notes.push('Confirmed selected step')
    }
  }

  // If nothing matched much
  if (notes.length === 0) {
    notes.push(
      'I heard you, but need a clearer process statement to update the model. Try describing who does what to which thing.',
    )
    challenges.push({
      id: id('ch'),
      question: 'Can you describe one concrete step? (role + action + thing)',
      context: `Received: “${trimmed}”`,
      options: [
        { id: 'child', label: 'Use Child Vaccination starter' },
        { id: 'retry', label: 'I will rephrase' },
      ],
      resolved: false,
    })
  }

  // Merge new challenges
  next = {
    ...next,
    challenges: [
      ...next.challenges.filter((c) => !c.resolved),
      ...challenges,
    ],
  }

  // Process name nudge
  if (next.name === 'Untitled process' && /vaccin|immun|child/.test(lower)) {
    next = { ...next, name: 'Child Vaccination', domainHint: 'healthcare' }
  }
  if (next.name === 'Untitled process' && /site|dap|sap/.test(lower)) {
    next = { ...next, name: 'SAP → DAP Site Approval', domainHint: 'approval' }
  }
  if (next.name === 'Untitled process' && /attendance/.test(lower)) {
    next = { ...next, name: 'Attendance Regularisation', domainHint: 'hrms' }
  }

  return {
    model: next,
    summary: notes.join(' · '),
    challenges: next.challenges.filter((c) => !c.resolved),
  }
}

export function createEmptyProcess(name = 'Untitled process'): ProcessModel {
  const t = now()
  return {
    id: id('proc'),
    name,
    domainHint: 'general',
    statements: [],
    people: [],
    things: [],
    rules: [],
    actions: [],
    steps: [],
    challenges: [],
    selectedStepId: null,
    frozen: false,
    createdAt: t,
    updatedAt: t,
  }
}

export function confirmStep(model: ProcessModel, stepId: string): ProcessModel {
  return {
    ...model,
    updatedAt: now(),
    steps: model.steps.map((s) =>
      s.id === stepId
        ? {
            ...s,
            provenance: {
              ...s.provenance,
              confirmation: 'confirmed',
              confirmedBy: 'Business user',
              confirmedAt: now(),
            },
          }
        : s,
    ),
  }
}

export function resetConfirmationOnEdit(model: ProcessModel, stepId: string): ProcessModel {
  return {
    ...model,
    updatedAt: now(),
    steps: model.steps.map((s) =>
      s.id === stepId &&
      (s.provenance.confirmation === 'confirmed' || s.provenance.confirmation === 'explicit')
        ? {
            ...s,
            provenance: {
              ...s.provenance,
              confirmation: 'inferred',
              confirmedBy: undefined,
              confirmedAt: undefined,
            },
          }
        : s,
    ),
  }
}

export function resolveOutcomeDestination(
  model: ProcessModel,
  outcomeId: string,
  targetStepId: string | null,
  label?: string,
): ProcessModel {
  return {
    ...model,
    updatedAt: now(),
    steps: model.steps.map((s) => ({
      ...s,
      outcomes: s.outcomes.map((o) =>
        o.id === outcomeId
          ? {
              ...o,
              targetStepId,
              label: label ?? o.label,
              provenance: o.provenance
                ? { ...o.provenance, confirmation: 'confirmed', confirmedBy: 'Business user', confirmedAt: now() }
                : undefined,
            }
          : o,
      ),
    })),
    challenges: model.challenges.map((c) =>
      c.relatedOutcomeId === outcomeId ||
      (c.question.toLowerCase().includes('where') && !c.resolved)
        ? { ...c, resolved: true }
        : c,
    ),
  }
}

export function addFieldToStep(
  model: ProcessModel,
  stepId: string,
  label: string,
  statementText: string,
): ProcessModel {
  const statement: Statement = {
    id: id('stmt'),
    text: statementText,
    modality: 'typed',
    timestamp: now(),
    speaker: 'Business user',
  }
  const prov = provenance(statement, 'explicit', 'explicit')
  return resetConfirmationOnEdit(
    {
      ...model,
      statements: [...model.statements, statement],
      updatedAt: now(),
      steps: model.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              fields: mergeFields(s.fields, [
                { id: id('fld'), label, mode: 'editable', provenance: prov },
              ]),
            }
          : s,
      ),
    },
    stepId,
  )
}

export function removeFieldFromStep(
  model: ProcessModel,
  stepId: string,
  fieldId: string,
): ProcessModel {
  return resetConfirmationOnEdit(
    {
      ...model,
      updatedAt: now(),
      steps: model.steps.map((s) =>
        s.id === stepId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s,
      ),
    },
    stepId,
  )
}

export function addActionToStep(
  model: ProcessModel,
  stepId: string,
  actionLabel: string,
): ProcessModel {
  return resetConfirmationOnEdit(
    {
      ...model,
      updatedAt: now(),
      steps: model.steps.map((s) =>
        s.id === stepId
          ? { ...s, actions: [...new Set([...s.actions, actionLabel])] }
          : s,
      ),
      actions: model.actions.some((a) => a.label === actionLabel)
        ? model.actions
        : [...model.actions, { id: id('act'), label: actionLabel }],
    },
    stepId,
  )
}

export function overrideScreenType(
  model: ProcessModel,
  stepId: string,
  screen: Step['screenOverride'],
): ProcessModel {
  return {
    ...model,
    updatedAt: now(),
    steps: model.steps.map((s) =>
      s.id === stepId ? { ...s, screenOverride: screen } : s,
    ),
  }
}

export function resolveChallenge(
  model: ProcessModel,
  challengeId: string,
  optionId: string,
): ProcessModel {
  const challenge = model.challenges.find((c) => c.id === challengeId)
  if (!challenge) return model

  let next: ProcessModel = {
    ...model,
    updatedAt: now(),
    challenges: model.challenges.map((c) =>
      c.id === challengeId ? { ...c, resolved: true } : c,
    ),
  }

  // Apply a few known resolutions without inventing destinations silently
  if (optionId === 'register' && challenge.relatedStepId) {
    const result = interpretStatement(
      next,
      'If the child is not found, the nurse registers a new child, then opens the child workspace.',
      'typed',
    )
    next = {
      ...result.model,
      challenges: result.model.challenges.map((c) =>
        c.id === challengeId ? { ...c, resolved: true } : c,
      ),
    }
  }

  if (optionId === 'eligibility') {
    next = {
      ...next,
      rules: next.rules.some((r) => /eligib/i.test(r.label))
        ? next.rules
        : [
            ...next.rules,
            {
              id: id('rule'),
              label: 'Vaccine eligibility',
              effect: 'Disables Administer when not eligible',
            },
          ],
      steps: next.steps.map((s) =>
        s.label === 'Administer Vaccine'
          ? {
              ...s,
              warnings: [...new Set([...s.warnings, 'Blocked when eligibility fails'])],
            }
          : s,
      ),
    }
  }

  if (optionId === 'schedule' || optionId === 'workspace') {
    const targetLabel = optionId === 'schedule' ? 'Vaccination Schedule' : 'Child Workspace'
    const target = next.steps.find((s) => s.label === targetLabel)
    const admin = next.steps.find((s) => s.label === 'Administer Vaccine')
    if (target && admin) {
      next = {
        ...next,
        steps: next.steps.map((s) =>
          s.id === admin.id
            ? {
                ...s,
                outcomes: s.outcomes.map((o) =>
                  /not eligible/i.test(o.label)
                    ? { ...o, targetStepId: target.id }
                    : o,
                ),
              }
            : s,
        ),
      }
    }
  }

  if (optionId === 'yes' && challenge.relatedStepId) {
    next = confirmStep(next, challenge.relatedStepId)
  }

  if (['employee', 'previous', 'end'].includes(optionId)) {
    const review = next.steps.find((s) => s.label === 'Site Review')
    if (review) {
      const destLabel =
        optionId === 'employee'
          ? 'Return to employee'
          : optionId === 'previous'
            ? 'Previous reviewer'
            : 'End process'
      // Create end/gap resolution as labeled end outcome — still honest
      next = {
        ...next,
        steps: next.steps.map((s) =>
          s.id === review.id
            ? {
                ...s,
                outcomes: s.outcomes.map((o) =>
                  /reject/i.test(o.label)
                    ? {
                        ...o,
                        kind: optionId === 'end' ? 'end' : o.kind,
                        targetStepId: null,
                        label: `Reject → ${destLabel}`,
                        provenance: {
                          statementId: 'challenge',
                          sourceText: destLabel,
                          speaker: 'Business user',
                          timestamp: now(),
                          origin: 'explicit',
                          confirmation: 'confirmed',
                          confirmedBy: 'Business user',
                          confirmedAt: now(),
                        },
                      }
                    : o,
                ),
              }
            : s,
        ),
      }
      // For non-end, create a destination step so gap closes
      if (optionId !== 'end') {
        const dest = makeStep({
          label: destLabel,
          role: null,
          verb: 'handoff',
          verbKind: 'handoff',
          model: next,
          outcomes: [{ id: id('out'), label: 'done', targetStepId: null, kind: 'end' }],
          prov: {
            statementId: 'challenge',
            sourceText: destLabel,
            speaker: 'Business user',
            timestamp: now(),
            origin: 'explicit',
            confirmation: 'confirmed',
          },
        })
        next = addOrUpdateStep(next, dest)
        const destStep = next.steps.find((s) => s.label === destLabel)
        const review2 = next.steps.find((s) => s.label === 'Site Review')
        if (destStep && review2) {
          next = {
            ...next,
            steps: next.steps.map((s) =>
              s.id === review2.id
                ? {
                    ...s,
                    outcomes: s.outcomes.map((o) =>
                      /reject/i.test(o.label)
                        ? { ...o, targetStepId: destStep.id, label: 'Reject' }
                        : o,
                    ),
                  }
                : s,
            ),
          }
        }
      }
    }
  }

  if (optionId === 'child') {
    // handled by UI loading seed
  }

  return next
}
