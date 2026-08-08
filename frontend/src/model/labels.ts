import type { ConfirmationState } from './types'

export function statusLabel(s: ConfirmationState): string {
  switch (s) {
    case 'confirmed':
      return 'Confirmed'
    case 'explicit':
      return 'Stated'
    case 'inferred':
      return 'Inferred'
    case 'derived':
      return 'Derived'
    case 'assumed':
      return 'Assumed'
    case 'unresolved':
      return 'Unresolved'
  }
}
