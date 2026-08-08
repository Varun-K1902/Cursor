import type { ProcessModel } from '../model/types'
import { understandingPercent } from '../model/derive'

export type LayoutMode = 'workshop' | 'density'

interface Props {
  model: ProcessModel
  layoutMode: LayoutMode
  onLayoutMode: (mode: LayoutMode) => void
  insightOpen: boolean
  onToggleInsight: () => void
  onBack: () => void
  onFreeze: () => void
}

export function ProcessHeader({
  model,
  layoutMode,
  onLayoutMode,
  insightOpen,
  onToggleInsight,
  onBack,
  onFreeze,
}: Props) {
  const pct = understandingPercent(model)

  return (
    <header className="process-header">
      <div className="header-left">
        <button type="button" className="linkish" onClick={onBack}>
          ← Processes
        </button>
        <div className="process-title-block">
          <div className="brand-inline">AIBA</div>
          <h1>Process: {model.name}</h1>
          {model.frozen && <span className="frozen-pill">Frozen</span>}
        </div>
      </div>

      <div
        className="header-meter"
        title="Structural understanding only — not factual completeness"
      >
        <div className="header-meter-track">
          <div className="header-meter-fill" style={{ width: `${pct}%` }} />
        </div>
        <span>{pct}% understood</span>
      </div>

      <div className="header-actions">
        <div className="layout-toggle" role="group" aria-label="Workspace density">
          <button
            type="button"
            className={layoutMode === 'workshop' ? 'active' : ''}
            onClick={() => onLayoutMode('workshop')}
            title="Tri-pane: Model · Flow · Preview"
          >
            Workshop
          </button>
          <button
            type="button"
            className={layoutMode === 'density' ? 'active' : ''}
            onClick={() => onLayoutMode('density')}
            title="Flow-emphasized density mode"
          >
            Process density
          </button>
        </div>
        <button
          type="button"
          className={insightOpen ? 'btn-secondary active-toggle' : 'btn-secondary'}
          onClick={onToggleInsight}
        >
          Insight
        </button>
        <button
          type="button"
          className="btn-freeze"
          disabled={model.frozen || model.steps.length === 0}
          onClick={onFreeze}
          title="Freeze only after business confirmation — not AI confidence"
        >
          {model.frozen ? 'Frozen' : 'Freeze & Confirm'}
        </button>
      </div>
    </header>
  )
}
