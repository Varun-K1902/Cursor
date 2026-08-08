import type { ProcessModel } from '../model/types'
import { findStructuralGaps } from '../model/derive'
import { statusLabel } from '../model/labels'

interface Props {
  model: ProcessModel
  onSelectStep: (id: string) => void
  selectedStepId: string | null
  compact?: boolean
}

export function BusinessModelPanel({
  model,
  onSelectStep,
  selectedStepId,
  compact = false,
}: Props) {
  const gaps = findStructuralGaps(model)

  return (
    <aside className={compact ? 'business-panel compact' : 'business-panel'}>
      <div className="panel-section-label">Business Model</div>
      <p className="fine-print model-lede">
        Progressive discovery — not a form to fill. Sections appear as facts are found.
      </p>

      {model.people.length > 0 && (
        <section>
          <h3>People</h3>
          <ul className="tag-list">
            {model.people.map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
          </ul>
        </section>
      )}

      {model.things.length > 0 && (
        <section>
          <h3>Things</h3>
          <ul className="tag-list">
            {model.things.map((t) => (
              <li key={t.id}>
                {t.label}
                {!t.hasCreator && t.hasReader ? (
                  <span className="inline-gap" title="Read but no creator">
                    ⚠ no creator
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {model.rules.length > 0 && (
        <section>
          <h3>Rules</h3>
          <ul className="plain-list">
            {model.rules.map((r) => (
              <li key={r.id}>
                {r.label}
                {r.effect ? <span className="muted"> — {r.effect}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {model.actions.length > 0 && (
        <section>
          <h3>Actions</h3>
          <ul className="tag-list">
            {model.actions.map((a) => (
              <li key={a.id}>{a.label}</li>
            ))}
          </ul>
        </section>
      )}

      {model.steps.length > 0 && (
        <section>
          <h3>Steps</h3>
          <ul className="step-list">
            {[...model.steps]
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={selectedStepId === s.id ? 'step-item active' : 'step-item'}
                    onClick={() => onSelectStep(s.id)}
                  >
                    <span className="step-label">{s.label}</span>
                    <span className={`badge badge-${s.provenance.confirmation}`}>
                      {statusLabel(s.provenance.confirmation)}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      {!compact && gaps.length > 0 && (
        <section>
          <h3>Structural gaps</h3>
          <ul className="plain-list gap-list">
            {gaps.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className="gap-link"
                  onClick={() => g.stepId && onSelectStep(g.stepId)}
                >
                  ⚠ {g.message}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {model.people.length === 0 && model.steps.length === 0 && (
        <p className="empty-hint">
          Tell AIBA how this process works. People, things, rules and steps appear here as they are
          discovered.
        </p>
      )}
    </aside>
  )
}
