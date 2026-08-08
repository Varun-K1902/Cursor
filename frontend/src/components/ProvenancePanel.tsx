import type { ProcessModel, Step } from '../model/types'
import { statusLabel } from '../model/labels'

interface Props {
  model: ProcessModel
  step: Step | null
}

export function ProvenancePanel({ model, step }: Props) {
  if (!step) {
    return (
      <div className="provenance-panel">
        <div className="preview-kicker">Provenance</div>
        <p className="muted">Select a step to see why it exists.</p>
      </div>
    )
  }

  const stmt = model.statements.find((s) => s.id === step.provenance.statementId)

  return (
    <div className="provenance-panel">
      <div className="preview-kicker">Provenance</div>
      <h3>Why is “{step.label}” here?</h3>
      <dl className="prov-dl">
        <dt>Status</dt>
        <dd>
          <span className={`badge badge-${step.provenance.confirmation}`}>
            {statusLabel(step.provenance.confirmation)}
          </span>
        </dd>
        <dt>Origin</dt>
        <dd>{step.provenance.origin}</dd>
        <dt>Source</dt>
        <dd className="quote">
          {stmt ? (
            <>
              <span className="speaker">{stmt.speaker}</span> ({stmt.modality}): “{stmt.text}”
            </>
          ) : (
            <>“{step.provenance.sourceText}”</>
          )}
        </dd>
        <dt>When</dt>
        <dd>{new Date(step.provenance.timestamp).toLocaleString()}</dd>
        {step.provenance.confirmedBy && (
          <>
            <dt>Confirmed by</dt>
            <dd>
              {step.provenance.confirmedBy} ·{' '}
              {step.provenance.confirmedAt
                ? new Date(step.provenance.confirmedAt).toLocaleString()
                : ''}
            </dd>
          </>
        )}
      </dl>
      <p className="fine-print">
        Editing a confirmed fact resets confirmation. Inference is visible — never silent invention
        treated as truth.
      </p>
    </div>
  )
}
