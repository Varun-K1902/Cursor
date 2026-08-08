import type { ProcessModel } from '../model/types'
import { findStructuralGaps, understandingPercent } from '../model/derive'

interface Props {
  model: ProcessModel
  onSelectStep: (id: string) => void
  onAskChallenge: (challengeId: string) => void
}

export function InsightPanel({ model, onSelectStep, onAskChallenge }: Props) {
  const gaps = findStructuralGaps(model)
  const openChallenges = model.challenges.filter((c) => !c.resolved)
  const pct = understandingPercent(model)
  const confirmed = model.steps.filter(
    (s) =>
      s.provenance.confirmation === 'confirmed' || s.provenance.confirmation === 'explicit',
  ).length
  const inferred = model.steps.filter((s) =>
    ['inferred', 'derived', 'assumed'].includes(s.provenance.confirmation),
  ).length
  const recent = [...model.statements].slice(-4).reverse()

  return (
    <aside className="insight-panel">
      <div className="panel-section-label">Insight</div>

      <section className="insight-block">
        <h3>Discovered so far</h3>
        <dl className="discover-grid">
          <div>
            <dt>People</dt>
            <dd>{model.people.length}</dd>
          </div>
          <div>
            <dt>Things</dt>
            <dd>{model.things.length}</dd>
          </div>
          <div>
            <dt>Actions</dt>
            <dd>{model.actions.length}</dd>
          </div>
          <div>
            <dt>Rules</dt>
            <dd>{model.rules.length}</dd>
          </div>
          <div>
            <dt>Steps</dt>
            <dd>{model.steps.length}</dd>
          </div>
          <div>
            <dt>Gaps</dt>
            <dd className={gaps.length ? 'warn-num' : ''}>{gaps.length}</dd>
          </div>
        </dl>
      </section>

      <section className="insight-block">
        <h3>Confirmation state</h3>
        <ul className="plain-list compact">
          <li>
            <span className="badge badge-confirmed">Confirmed / stated</span> {confirmed}
          </li>
          <li>
            <span className="badge badge-inferred">Inferred</span> {inferred}
          </li>
          <li className="fine-print" style={{ border: 'none', paddingTop: 8 }}>
            {pct}% structurally understood — not factual completeness.
          </li>
        </ul>
      </section>

      {(openChallenges.length > 0 || gaps.length > 0) && (
        <section className="insight-block">
          <h3>Unresolved</h3>
          <p className="fine-print">Also shown in Flow / Preview where they occur.</p>
          <ul className="plain-list gap-list">
            {openChallenges.map((c) => (
              <li key={c.id}>
                <button type="button" className="gap-link" onClick={() => onAskChallenge(c.id)}>
                  ⚠ {c.question}
                </button>
              </li>
            ))}
            {gaps.slice(0, 6).map((g) => (
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

      {recent.length > 0 && (
        <section className="insight-block">
          <h3>Recent input</h3>
          <ul className="recent-list">
            {recent.map((s) => (
              <li key={s.id}>
                <span className="recent-mod">{s.modality}</span>
                <span className="recent-text">“{s.text}”</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="fine-print insight-foot">
        Conversation is an input method. This panel indexes uncertainty — it is not a second model.
      </p>
    </aside>
  )
}
