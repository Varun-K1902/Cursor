import { useMemo, useState } from 'react'
import type { ProcessModel, ScreenType } from '../model/types'
import { deriveScreens } from '../model/derive'
import {
  addActionToStep,
  addFieldToStep,
  confirmStep,
  interpretStatement,
  overrideScreenType,
  removeFieldFromStep,
  resolveChallenge,
  resolveOutcomeDestination,
} from '../model/interpret'
import { ProcessHeader, type LayoutMode, type WorkspaceView } from './ProcessHeader'
import { BusinessModelPanel } from './BusinessModelPanel'
import { FunctionalPreview } from './FunctionalPreview'
import { FlowView } from './FlowView'
import { ConversationInput } from './ConversationInput'
import { ProvenancePanel } from './ProvenancePanel'
import { ChallengeBar } from './ChallengeBar'
import { InsightPanel } from './InsightPanel'
import { VisualStory } from './VisualStory'

interface Props {
  model: ProcessModel
  onChange: (model: ProcessModel) => void
  onBack: () => void
}

export function Workspace({ model, onChange, onBack }: Props) {
  const [summary, setSummary] = useState('')
  const [view, setView] = useState<WorkspaceView>('workshop')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('workshop')
  const [insightOpen, setInsightOpen] = useState(true)
  const [mobilePane, setMobilePane] = useState<'model' | 'flow' | 'preview'>('flow')
  const [focusChallengeId, setFocusChallengeId] = useState<string | null>(null)
  const [draftInput, setDraftInput] = useState<string | undefined>(undefined)

  const screens = useMemo(() => deriveScreens(model), [model])
  const selected =
    model.steps.find((s) => s.id === model.selectedStepId) ?? model.steps[0] ?? null
  const screen = selected ? (screens.find((s) => s.stepId === selected.id) ?? null) : null

  function selectStep(id: string) {
    onChange({ ...model, selectedStepId: id })
    setMobilePane('preview')
  }

  function handleInterpret(text: string, modality: 'typed' | 'voice' | 'paste') {
    if (model.frozen) return
    const result = interpretStatement(model, text, modality)
    onChange(result.model)
    setSummary(result.summary)
    setDraftInput(undefined)
  }

  function handleFreeze() {
    const ok = window.confirm(
      'Freeze only when the business has confirmed the functional solution. Continue?',
    )
    if (ok) onChange({ ...model, frozen: true, updatedAt: new Date().toISOString() })
  }

  function handleResolveGap(outcomeId: string) {
    const targets = model.steps.map((s) => s.label).join(', ')
    const choice = window.prompt(
      `Resolve destination for this outcome.\nExisting steps: ${targets || '(none)'}\nType an existing step label, or leave blank to keep unresolved.`,
    )
    if (choice == null) return
    const trimmed = choice.trim()
    if (!trimmed) return
    const target = model.steps.find((s) => s.label.toLowerCase() === trimmed.toLowerCase())
    onChange(resolveOutcomeDestination(model, outcomeId, target?.id ?? null))
  }

  const preview = (
    <FunctionalPreview
      model={model}
      screen={screen}
      step={selected}
      onSelectStep={selectStep}
      onRemoveField={(stepId, fieldId) =>
        onChange(removeFieldFromStep(model, stepId, fieldId))
      }
      onAddField={(stepId, label) =>
        onChange(addFieldToStep(model, stepId, label, `Add field “${label}” to the preview`))
      }
      onAddAction={(stepId, label) => onChange(addActionToStep(model, stepId, label))}
      onOverrideScreen={(stepId, type: ScreenType | null) =>
        onChange(overrideScreenType(model, stepId, type))
      }
      onConfirmStep={(stepId) => onChange(confirmStep(model, stepId))}
    />
  )

  const flow = (
    <FlowView
      model={model}
      selectedStepId={selected?.id ?? null}
      onSelectStep={selectStep}
      onResolveGap={handleResolveGap}
    />
  )

  const modelPanel = (
    <BusinessModelPanel
      model={model}
      selectedStepId={selected?.id ?? null}
      onSelectStep={selectStep}
      compact={layoutMode === 'density'}
    />
  )

  return (
    <div
      className={`workspace layout-${layoutMode}${insightOpen && view === 'workshop' ? ' insight-open' : ''}${view === 'story' ? ' view-story' : ''}`}
    >
      <ProcessHeader
        model={model}
        view={view}
        onView={setView}
        layoutMode={layoutMode}
        onLayoutMode={setLayoutMode}
        insightOpen={insightOpen}
        onToggleInsight={() => setInsightOpen((v) => !v)}
        onBack={onBack}
        onFreeze={handleFreeze}
      />

      <ChallengeBar
        model={model}
        focusId={focusChallengeId}
        onResolve={(cid, oid) => {
          onChange(resolveChallenge(model, cid, oid))
          setFocusChallengeId(null)
        }}
        onDismiss={(cid) => {
          onChange({
            ...model,
            challenges: model.challenges.map((c) =>
              c.id === cid ? { ...c, resolved: true } : c,
            ),
          })
          setFocusChallengeId(null)
        }}
      />

      {view === 'story' ? (
        <VisualStory
          model={model}
          screen={screen}
          onSelectStep={selectStep}
          onConfirmStep={(stepId) => onChange(confirmStep(model, stepId))}
          onCorrect={(hint) => {
            setDraftInput(hint)
            setSummary('Describe the correction below — the model, Flow, Preview and Story will update together.')
          }}
          onAskClarify={(question) => {
            setDraftInput(question)
            setSummary('Clarify in the input bar. AIBA will not invent the missing fact.')
          }}
          onClose={() => setView('workshop')}
        />
      ) : (
        <>
          <div className="mobile-tabs tri">
            <button
              type="button"
              className={mobilePane === 'model' ? 'active' : ''}
              onClick={() => setMobilePane('model')}
            >
              Model
            </button>
            <button
              type="button"
              className={mobilePane === 'flow' ? 'active' : ''}
              onClick={() => setMobilePane('flow')}
            >
              Flow
            </button>
            <button
              type="button"
              className={mobilePane === 'preview' ? 'active' : ''}
              onClick={() => setMobilePane('preview')}
            >
              Preview
            </button>
          </div>

          <div className="workspace-body">
            <div className={`tri-pane mobile-${mobilePane}`} data-layout={layoutMode}>
              <div className="pane-model">{modelPanel}</div>
              <div className="pane-flow">
                {flow}
                <p className="sync-strip">
                  Flow, Functional Preview and Visual Story are projections of the same canonical
                  model.
                </p>
              </div>
              <div className="pane-preview">
                {preview}
                <ProvenancePanel model={model} step={selected} compact />
              </div>
            </div>

            {insightOpen && (
              <InsightPanel
                model={model}
                onSelectStep={selectStep}
                onAskChallenge={(id) => setFocusChallengeId(id)}
              />
            )}
          </div>
        </>
      )}

      <ConversationInput
        onSubmit={handleInterpret}
        disabled={model.frozen}
        lastSummary={summary}
        draftText={draftInput}
        onDraftConsumed={() => setDraftInput(undefined)}
      />
    </div>
  )
}
