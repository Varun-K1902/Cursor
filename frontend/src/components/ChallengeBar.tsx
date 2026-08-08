import type { Challenge, ProcessModel } from '../model/types'

interface Props {
  model: ProcessModel
  focusId?: string | null
  onResolve: (challengeId: string, optionId: string) => void
  onDismiss: (challengeId: string) => void
}

export function ChallengeBar({ model, focusId, onResolve, onDismiss }: Props) {
  const open = model.challenges.filter((c) => !c.resolved)
  const shown = focusId
    ? open.filter((c) => c.id === focusId).concat(open.filter((c) => c.id !== focusId)).slice(0, 2)
    : open.slice(0, 2)
  if (shown.length === 0) return null

  return (
    <div className="challenge-bar">
      {shown.map((c: Challenge) => (
        <div
          key={c.id}
          className={focusId === c.id ? 'challenge-card focused' : 'challenge-card'}
        >
          <div className="challenge-q">
            <span className="challenge-kicker">AIBA challenges</span>
            <strong>{c.question}</strong>
            <p>{c.context}</p>
          </div>
          <div className="challenge-actions">
            {c.options.map((o) => (
              <button key={o.id} type="button" onClick={() => onResolve(c.id, o.id)}>
                {o.label}
              </button>
            ))}
            <button type="button" className="linkish" onClick={() => onDismiss(c.id)}>
              Later
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
