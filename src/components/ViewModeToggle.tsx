import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewModeToggleProps {
  viewMode: 'card' | 'list'
  onToggle: (mode: 'card' | 'list') => void
  /**
   * Cor de destaque usada no botão ativo (default indigo-600).
   * Use para casar com a paleta de cada tela (ex.: "#0062a8").
   */
  activeColorClass?: string
}

/**
 * Controle visual de alternância entre Cards e Lista.
 * Padrão visual segue o toggle já usado em TicketsList/InventoryItems.
 */
export function ViewModeToggle({
  viewMode,
  onToggle,
  activeColorClass = 'text-indigo-600',
}: ViewModeToggleProps) {
  return (
    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
      <Button
        type="button"
        variant={viewMode === 'card' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onToggle('card')}
        className={`h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5 transition-all ${
          viewMode === 'card'
            ? `bg-white shadow-2xs ${activeColorClass}`
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Visualização em Cards"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onToggle('list')}
        className={`h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5 transition-all ${
          viewMode === 'list'
            ? `bg-white shadow-2xs ${activeColorClass}`
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Visualização em Lista"
      >
        <List className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
    </div>
  )
}

export default ViewModeToggle
