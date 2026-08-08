import type { Challenge, ProcessModel } from '../model/types'

interface Props {
  model: ProcessModel
  onResolve: (challengeId: string, optionId: string) => void
  onDismiss: (challengeId: string) => void
}

export function ChallengeBar({ model, onResolve, onDismiss }: Props) {
  const open = model.challenges.filter((c) => !c.resolved).slice(0, 2)
  if (open.length === 0) return null

  return (
    <div className="challenge-bar">
      {open.map((c: Challenge) => (
        <div key={c.id} className="challenge-card">
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
