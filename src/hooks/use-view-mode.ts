import { useCallback, useState } from 'react'

type ViewMode = 'card' | 'list'

/**
 * Hook de toggle Cards/Lista com persistência por tela em localStorage.
 *
 * Padrão **Lista** conforme especificação do produto.
 *
 * @param storageKey chave única por tela (ex.: "tickets-view-mode")
 */
export function useViewMode(storageKey: string): {
  viewMode: ViewMode
  toggleViewMode: (mode: ViewMode) => void
} {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      // Padrão "list" — só usamos "card" se explicitamente salvo
      return saved === 'card' ? 'card' : 'list'
    } catch {
      return 'list'
    }
  })

  const toggleViewMode = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      try {
        localStorage.setItem(storageKey, mode)
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  )

  return { viewMode, toggleViewMode }
}

export default useViewMode
