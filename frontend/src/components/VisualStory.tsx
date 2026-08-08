import { useEffect, useMemo, useState } from 'react'
import type { DerivedScreen, ProcessModel } from '../model/types'
import { compileStory, resolvePlaybackPath } from '../model/story/compile'
import type { Scene, SceneGraph } from '../model/story/types'
import { SCENE_TYPE_LABELS } from '../model/story/types'
import { characterById, locationById, objectById } from '../model/story/world'
import { statusLabel } from '../model/labels'

interface Props {
  model: ProcessModel
  screen: DerivedScreen | null
  onSelectStep: (stepId: string) => void
  onCorrect: (promptHint: string) => void
  onAskClarify: (question: string, outcomeId?: string | null) => void
  onConfirmStep: (stepId: string) => void
  onClose: () => void
}

export function VisualStory({
  model,
  screen,
  onSelectStep,
  onCorrect,
  onAskClarify,
  onConfirmStep,
  onClose,
}: Props) {
  const [perspectiveId, setPerspectiveId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [branchChoices, setBranchChoices] = useState<Record<string, string>>({})
  const [whatIf, setWhatIf] = useState<string | null>(null)
  const [showWhy, setShowWhy] = useState(false)

  const graph: SceneGraph = useMemo(
    () => compileStory(model, { perspectiveActorId: perspectiveId }),
    [model, perspectiveId],
  )

  const path = useMemo(
    () => resolvePlaybackPath(graph, branchChoices),
    [graph, branchChoices],
  )

  useEffect(() => {
    setIndex(0)
  }, [model.id, model.updatedAt, perspectiveId])

  const scene: Scene | undefined = path[index]
  const total = path.length

  function goTo(nextIndex: number) {
    const next = path[nextIndex]
    setIndex(nextIndex)
    if (next?.stepId) onSelectStep(next.stepId)
  }

  if (graph.scenes.length === 0) {
    return (
      <div className="story-shell">
        <header className="story-top">
          <div>
            <div className="preview-kicker">Visual Story</div>
            <h2>Show me what you understood</h2>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Back to workshop
          </button>
        </header>
        <div className="story-empty">
          <p>No process steps yet. Describe how the business works, then open Visual Story.</p>
        </div>
      </div>
    )
  }

  if (!scene) {
    return null
  }

  const actor = characterById(graph.world, scene.actorId)
  const location = locationById(graph.world, scene.locationId)
  const object = objectById(graph.world, scene.objectId)
  const paused = scene.requiresClarification

  function continueStory() {
    if (index < total - 1) goTo(index + 1)
  }

  function chooseBranch(nextId: string) {
    const nextChoices = { ...branchChoices, [scene!.id]: nextId }
    setBranchChoices(nextChoices)
    const newPath = resolvePlaybackPath(graph, nextChoices)
    const idx = newPath.findIndex((s) => s.id === nextId)
    if (idx >= 0) {
      setIndex(idx)
      const next = newPath[idx]
      if (next?.stepId) onSelectStep(next.stepId)
    }
  }

  return (
    <div className="story-shell">
      <header className="story-top">
        <div>
          <div className="preview-kicker">Visual Story</div>
          <h2>Show me what you understood</h2>
          <p className="story-sub">
            Interactive storyboard of the canonical model — not an AI video. Meaning comes from the
            model; glyphs are presentation only.
          </p>
        </div>
        <div className="story-top-actions">
          <label className="perspective-select">
            Perspective
            <select
              value={perspectiveId ?? ''}
              onChange={(e) => setPerspectiveId(e.target.value || null)}
            >
              <option value="">Whole process</option>
              {graph.world.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Back to workshop
          </button>
        </div>
      </header>

      <div className="story-progress">
        <div className="story-progress-track">
          <div
            className="story-progress-fill"
            style={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }}
          />
        </div>
        <span>
          Scene {index + 1} / {total}
        </span>
      </div>

      <div className="story-stage">
        <div className="story-location">
          <span className="story-glyph lg">{location?.glyph ?? '🏢'}</span>
          <span>{location?.label ?? 'Location'}</span>
        </div>

        <div className={`story-frame status-${scene.status}`}>
          <div className="story-type">{SCENE_TYPE_LABELS[scene.type]}</div>
          <div className="story-cast">
            {actor && (
              <div className="story-actor">
                <span className="story-glyph">{actor.glyph}</span>
                <span>{actor.label}</span>
              </div>
            )}
            {object && (
              <div className="story-object">
                <span className="story-glyph">{object.glyph}</span>
                <span>{object.label}</span>
              </div>
            )}
          </div>

          <p className="story-caption">{scene.caption}</p>

          {scene.type === 'CONDITION' && scene.followingSceneIds.length > 1 && (
            <div className="story-branches">
              {scene.followingSceneIds.map((fid) => {
                const next = graph.scenes.find((s) => s.id === fid)
                return (
                  <button
                    key={fid}
                    type="button"
                    className="story-branch-btn"
                    onClick={() => chooseBranch(fid)}
                  >
                    {next?.branchLabel ?? next?.actionLabel ?? next?.caption ?? 'Branch'}
                  </button>
                )
              })}
            </div>
          )}

          {paused && (
            <div className="story-pause">
              <strong>⚠ Story paused — ambiguity in the model</strong>
              <p>{scene.clarificationQuestion ?? scene.caption}</p>
              <p className="fine-print">
                AIBA will not invent the next step. Correct the model, then the story continues.
              </p>
            </div>
          )}

          {scene.showsDigitalExperience && (
            <div className="story-digital">
              <div className="story-digital-label">Real world → software capability</div>
              {screen && screen.stepId === scene.stepId ? (
                <div className="story-sketch-mini">
                  <div className="wire-chrome mini">
                    <span>{screen.role ?? 'Role'}</span>
                    <span>{screen.title}</span>
                    <span>{screen.type}</span>
                  </div>
                  <ul>
                    {screen.fields.slice(0, 4).map((f) => (
                      <li key={f.id}>
                        {f.label} <em>[{f.mode}]</em>
                      </li>
                    ))}
                  </ul>
                  <div className="wire-actions">
                    {screen.actions.slice(0, 3).map((a) => (
                      <span key={a} className="wire-btn">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="muted">Select this step’s Live Sketch in the workshop.</p>
              )}
            </div>
          )}

          <div className="story-meta-row">
            <span className={`badge badge-${scene.status}`}>{statusLabel(scene.status)}</span>
            <button type="button" className="linkish" onClick={() => setShowWhy((v) => !v)}>
              Why is this scene here?
            </button>
          </div>

          {showWhy && (
            <div className="story-why">
              {scene.evidence ? (
                <>
                  <p>
                    <strong>Source:</strong> “{scene.evidence.sourceText}”
                  </p>
                  <p>
                    <strong>Origin:</strong> {scene.evidence.origin} ·{' '}
                    <strong>Status:</strong> {statusLabel(scene.status)}
                  </p>
                </>
              ) : (
                <p>
                  Derived framing for recognition (arrival / completion). Not a confirmed business
                  fact — correct if wrong.
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="story-rail">
          <h3>Story world</h3>
          <p className="fine-print">Stable visual identities — not regenerated per scene.</p>
          <ul className="story-world-list">
            {graph.world.characters.map((c) => (
              <li key={c.id}>
                <span>{c.glyph}</span> {c.label}
                <code>{c.visualId}</code>
              </li>
            ))}
            {graph.world.locations.map((l) => (
              <li key={l.id}>
                <span>{l.glyph}</span> {l.label}
                <code>{l.visualId}</code>
              </li>
            ))}
            {graph.world.objects.map((o) => (
              <li key={o.id}>
                <span>{o.glyph}</span> {o.label}
                <code>{o.visualId}</code>
              </li>
            ))}
          </ul>

          <h3>What if…</h3>
          <p className="fine-print">Counterfactual exploration — does not alter the confirmed model until you keep it.</p>
          <div className="whatif-list">
            {['What if the child is not found?', 'What if eligibility fails?', 'What if QC rejects?'].map(
              (q) => (
                <button
                  key={q}
                  type="button"
                  className={whatIf === q ? 'active' : ''}
                  onClick={() => {
                    setWhatIf(q)
                    onAskClarify(q)
                  }}
                >
                  {q}
                </button>
              ),
            )}
          </div>
          {whatIf && (
            <div className="whatif-banner">
              Exploring: {whatIf}
              <div className="whatif-actions">
                <button type="button" onClick={() => setWhatIf(null)}>
                  Discard
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="story-controls">
        <button type="button" disabled={index === 0} onClick={() => goTo(index - 1)}>
          ← Back
        </button>
        <button
          type="button"
          className="btn-confirm"
          disabled={!scene.stepId}
          onClick={() => scene.stepId && onConfirmStep(scene.stepId)}
        >
          Correct / Confirm
        </button>
        <button
          type="button"
          onClick={() =>
            onCorrect(
              scene.stepId
                ? `About “${scene.caption}”: `
                : `Change the story around: ${scene.caption}. `,
            )
          }
        >
          Change
        </button>
        <button
          type="button"
          onClick={() =>
            onAskClarify(
              scene.clarificationQuestion ?? `Help me understand: ${scene.caption}`,
              scene.outcomeId,
            )
          }
        >
          Ask AIBA
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={paused || index >= total - 1}
          onClick={continueStory}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
