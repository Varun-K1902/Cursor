import type { StructuralGap } from '../model/types'

export function GapChip({ gap }: { gap: StructuralGap }) {
  return (
    <div className="gap-chip" title={gap.kind}>
      <span className="gap-mark">⚠</span>
      <span>{gap.message}</span>
    </div>
  )
}
