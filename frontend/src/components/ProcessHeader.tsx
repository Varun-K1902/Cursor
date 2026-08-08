import type { ProcessModel } from '../model/types'
import { understandingPercent } from '../model/derive'

interface Props {
  model: ProcessModel
  onBack: () => void
  onFreeze: () => void
}

export function ProcessHeader({ model, onBack, onFreeze }: Props) {
  const pct = understandingPercent(model)
  return (
    <header className="process-header">
      <button type="button" className="linkish" onClick={onBack}>
        ← Processes
      </button>
      <div className="process-title-block">
        <h1>{model.name}</h1>
        <span className="pct">{pct}% understood</span>
        {model.frozen && <span className="frozen-pill">Functional requirements frozen</span>}
      </div>
      <button
        type="button"
        className="btn-secondary"
        disabled={model.frozen || model.steps.length === 0}
        onClick={onFreeze}
        title="Freeze only after business confirmation — not AI confidence"
      >
        {model.frozen ? 'Frozen' : 'Freeze functional solution'}
      </button>
    </header>
  )
}
