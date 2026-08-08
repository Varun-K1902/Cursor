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
import { ProcessHeader } from './ProcessHeader'
import { BusinessModelPanel } from './BusinessModelPanel'
import { FunctionalPreview } from './FunctionalPreview'
import { FlowView } from './FlowView'
import { ConversationInput } from './ConversationInput'
import { ProvenancePanel } from './ProvenancePanel'
import { ChallengeBar } from './ChallengeBar'

interface Props {
  model: ProcessModel
  onChange: (model: ProcessModel) => void
  onBack: () => void
}

export function Workspace({ model, onChange, onBack }: Props) {
  const [summary, setSummary] = useState('')
  const [mobileTab, setMobileTab] = useState<'preview' | 'flow'>('preview')

  const screens = useMemo(() => deriveScreens(model), [model])
  const selected =
    model.steps.find((s) => s.id === model.selectedStepId) ?? model.steps[0] ?? null
  const screen = selected ? (screens.find((s) => s.stepId === selected.id) ?? null) : null

  function selectStep(id: string) {
    onChange({ ...model, selectedStepId: id })
  }

  function handleInterpret(text: string, modality: 'typed' | 'voice' | 'paste') {
    if (model.frozen) return
    const result = interpretStatement(model, text, modality)
    onChange(result.model)
    setSummary(result.summary)
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

  return (
    <div className="workspace">
      <ProcessHeader model={model} onBack={onBack} onFreeze={handleFreeze} />

      <ChallengeBar
        model={model}
        onResolve={(cid, oid) => onChange(resolveChallenge(model, cid, oid))}
        onDismiss={(cid) =>
          onChange({
            ...model,
            challenges: model.challenges.map((c) =>
              c.id === cid ? { ...c, resolved: true } : c,
            ),
          })
        }
      />

      <div className="workspace-body">
        <BusinessModelPanel
          model={model}
          selectedStepId={selected?.id ?? null}
          onSelectStep={selectStep}
        />

        <div className="workspace-main">
          <div className="mobile-tabs">
            <button
              type="button"
              className={mobileTab === 'preview' ? 'active' : ''}
              onClick={() => setMobileTab('preview')}
            >
              Live Functional Preview
            </button>
            <button
              type="button"
              className={mobileTab === 'flow' ? 'active' : ''}
              onClick={() => setMobileTab('flow')}
            >
              Flow
            </button>
          </div>

          <div className="dual-rail">
            <div className={mobileTab === 'preview' ? 'rail-pane active-mobile' : 'rail-pane'}>
              {preview}
            </div>
            <div className={mobileTab === 'flow' ? 'rail-pane active-mobile' : 'rail-pane'}>
              {flow}
            </div>
          </div>

          <ProvenancePanel model={model} step={selected} />
        </div>
      </div>

      <ConversationInput
        onSubmit={handleInterpret}
        disabled={model.frozen}
        lastSummary={summary}
      />
    </div>
  )
}
