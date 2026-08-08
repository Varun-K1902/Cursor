import type { DerivedScreen, ProcessModel, ScreenType, Step } from '../model/types'
import { GapChip } from './shared'
import { statusLabel } from '../model/labels'

interface Props {
  model: ProcessModel
  screen: DerivedScreen | null
  step: Step | null
  onSelectStep: (id: string) => void
  onRemoveField: (stepId: string, fieldId: string) => void
  onAddField: (stepId: string, label: string) => void
  onAddAction: (stepId: string, label: string) => void
  onOverrideScreen: (stepId: string, type: ScreenType | null) => void
  onConfirmStep: (stepId: string) => void
}

const OVERRIDE_OPTIONS: ScreenType[] = [
  'LIST',
  'FORM',
  'WORKSPACE',
  'GRID',
  'REPORT',
  'DECISION',
  'BACKGROUND',
]

export function FunctionalPreview({
  model,
  screen,
  step,
  onSelectStep,
  onRemoveField,
  onAddField,
  onAddAction,
  onOverrideScreen,
  onConfirmStep,
}: Props) {
  if (!screen || !step) {
    return (
      <div className="preview-shell">
        <header className="preview-banner">
          <div>
            <div className="preview-kicker">Functional Preview</div>
            <p>
              This shows what the solution must do. Visual design and technical implementation come
              later.
            </p>
          </div>
        </header>
        <div className="preview-empty">
          <p>No step selected yet.</p>
          <p className="muted">Describe the process below — a rough functional surface will appear here.</p>
          {model.steps.length > 0 && (
            <ul className="preview-step-picks">
              {model.steps.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onSelectStep(s.id)}>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="preview-shell">
      <header className="preview-banner">
        <div>
          <div className="preview-kicker">Functional Preview</div>
          <p>
            This shows what the solution must do. Visual design and technical implementation come
            later.
          </p>
        </div>
        <div className={`badge badge-${step.provenance.confirmation}`}>
          {statusLabel(step.provenance.confirmation)}
        </div>
      </header>

      <div className="derivation-why">
        <strong>{screen.type}</strong>
        <span>because:</span>
        <ul>
          {screen.because.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        {screen.overridden && <em className="override-flag">Override tracked</em>}
        <label className="override-select">
          Override screen type
          <select
            value={step.screenOverride ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onOverrideScreen(step.id, v === '' ? null : (v as ScreenType))
            }}
          >
            <option value="">(use derivation)</option>
            {OVERRIDE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="wireframe" data-screen={screen.type}>
        <div className="wire-chrome">
          <span className="wire-role">{screen.role ?? 'Role?'}</span>
          <span className="wire-title">{screen.title}</span>
          <span className="wire-type">{screen.type}</span>
        </div>

        {screen.tabs && screen.tabs.length > 0 && (
          <div className="wire-tabs">
            {screen.tabs.map((t, i) => (
              <span key={t} className={i === 0 ? 'wire-tab active' : 'wire-tab'}>
                {t}
              </span>
            ))}
          </div>
        )}

        {screen.type === 'LIST' || (screen.type === 'FORM' && step.verbKind === 'search') ? (
          <div className="wire-body">
            <div className="wire-fields">
              {screen.fields.map((f) => (
                <label key={f.id} className="wire-field">
                  <span>
                    {f.label}{' '}
                    <em className="mode">[{f.mode}]</em>
                  </span>
                  <span className="wire-input" />
                  <button
                    type="button"
                    className="wire-x"
                    title="Remove field"
                    onClick={() => onRemoveField(step.id, f.id)}
                  >
                    ×
                  </button>
                </label>
              ))}
            </div>
            <div className="wire-actions">
              {screen.actions.map((a) => (
                <span
                  key={a}
                  className={
                    screen.disabledActions.includes(a) ? 'wire-btn disabled' : 'wire-btn'
                  }
                >
                  {a}
                </span>
              ))}
            </div>
            {step.hasRowAction && (
              <div className="wire-table">
                <div className="wire-row head">
                  {screen.fields.slice(0, 3).map((f) => (
                    <span key={f.id}>{f.label}</span>
                  ))}
                  <span>Action</span>
                </div>
                {[1, 2].map((row) => (
                  <div className="wire-row" key={row}>
                    {screen.fields.slice(0, 3).map((f) => (
                      <span key={f.id} className="skel" />
                    ))}
                    <span className="wire-link">Open</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {screen.type === 'WORKSPACE' && (
          <div className="wire-body workspace">
            <div className="wire-identity">
              {screen.fields.map((f) => (
                <div key={f.id} className="wire-field compact">
                  <span>
                    {f.label} <em className="mode">[{f.mode}]</em>
                  </span>
                  <span className="wire-input short" />
                  <button
                    type="button"
                    className="wire-x"
                    onClick={() => onRemoveField(step.id, f.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="wire-related">
              <div className="wire-subhead">Related sets</div>
              {screen.relatedSets.map((r) => (
                <div key={r.id} className="wire-related-item">
                  {r.label}
                </div>
              ))}
            </div>
            <div className="wire-actions">
              {screen.actions.map((a) => (
                <span
                  key={a}
                  className={
                    screen.disabledActions.includes(a) ? 'wire-btn disabled' : 'wire-btn'
                  }
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {(screen.type === 'FORM' || screen.type === 'GRID') && step.verbKind !== 'search' && (
          <div className="wire-body">
            <div className="wire-fields">
              {screen.fields.map((f) => (
                <label key={f.id} className="wire-field">
                  <span>
                    {f.label} <em className="mode">[{f.mode}]</em>
                  </span>
                  <span className="wire-input" />
                  <button
                    type="button"
                    className="wire-x"
                    onClick={() => onRemoveField(step.id, f.id)}
                  >
                    ×
                  </button>
                </label>
              ))}
            </div>
            <div className="wire-actions">
              {screen.actions.map((a) => (
                <span
                  key={a}
                  className={
                    screen.disabledActions.includes(a) ? 'wire-btn disabled' : 'wire-btn'
                  }
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {screen.type === 'DECISION' && (
          <div className="wire-body">
            <div className="wire-fields">
              {screen.fields.map((f) => (
                <div key={f.id} className="wire-field compact">
                  <span>
                    {f.label} <em className="mode">[{f.mode}]</em>
                  </span>
                  <span className="wire-input short" />
                </div>
              ))}
            </div>
            <div className="wire-actions decision">
              {step.outcomes.map((o) => (
                <span key={o.id} className={o.targetStepId ? 'wire-btn' : 'wire-btn gapish'}>
                  {o.label}
                  {!o.targetStepId && o.kind !== 'end' ? ' → ?' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {screen.type === 'UNKNOWN' && (
          <div className="wire-body">
            <p className="muted">Not enough signals to derive a screen. Add verb / cardinality / related sets.</p>
          </div>
        )}

        {screen.warnings.map((w) => (
          <div key={w} className="wire-warn">
            ⚠ {w}
          </div>
        ))}

        {screen.gaps.map((g) => (
          <GapChip key={g.id} gap={g} />
        ))}

        {/* Materialize unresolved outcomes inside the preview */}
        {step.outcomes
          .filter((o) => !o.targetStepId && o.kind !== 'end')
          .map((o) => (
            <div key={o.id} className="inline-unresolved">
              <strong>{o.label}</strong>
              <span>↓</span>
              <span className="gap-inline">⚠ Where does this go?</span>
            </div>
          ))}
      </div>

      <div className="preview-edit-bar">
        <button
          type="button"
          onClick={() => {
            const label = window.prompt('Field label to add')
            if (label) onAddField(step.id, label)
          }}
        >
          Add field
        </button>
        <button
          type="button"
          onClick={() => {
            const label = window.prompt('Action label to add')
            if (label) onAddAction(step.id, label)
          }}
        >
          Add action
        </button>
        <button type="button" className="btn-confirm" onClick={() => onConfirmStep(step.id)}>
          Confirm this interpretation
        </button>
      </div>
    </div>
  )
}
