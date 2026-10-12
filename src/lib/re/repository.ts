import type { WorkspaceState } from "@/lib/types"

export const WORKSPACE_KEY = "basis.workspace.v2"

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface WorkspaceRepository {
  load(): { ok: true; state: WorkspaceState | null } | { ok: false; message: string }
  save(state: WorkspaceState): { ok: true } | { ok: false; message: string }
  clear(): void
}

export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

export function createRepository(store: KeyValueStore): WorkspaceRepository {
  return {
    load() {
      try {
        const raw = store.getItem(WORKSPACE_KEY)
        if (!raw) return { ok: true, state: null }
        const parsed = JSON.parse(raw) as WorkspaceState
        if (parsed?.schema !== 2 || !Array.isArray(parsed.projects)) {
          return { ok: false, message: "Saved workspace could not be read. The sample is still available." }
        }
        return { ok: true, state: parsed }
      } catch {
        return { ok: false, message: "Saved workspace could not be read. The sample is still available." }
      }
    },
    save(state) {
      try {
        store.setItem(WORKSPACE_KEY, JSON.stringify(state))
        return { ok: true }
      } catch {
        return { ok: false, message: "The workspace could not be saved in this browser." }
      }
    },
    clear() {
      store.removeItem(WORKSPACE_KEY)
    },
  }
}
