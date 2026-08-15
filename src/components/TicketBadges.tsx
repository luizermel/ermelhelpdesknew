import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketPriority, TicketStatus } from '@/types'

export const StatusBadge: React.FC<{ status: TicketStatus; className?: string }> = ({
  status,
  className,
}) => {
  const getColors = () => {
    switch (status) {
      case 'Aberto':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80'
      case 'Em andamento':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80'
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs px-2.5 py-0.5 rounded-full transition-colors border inline-flex items-center gap-1.5',
        getColors(),
        className,
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-amber-500': status === 'Aberto',
          'bg-blue-500': status === 'Em andamento',
          'bg-emerald-500': status === 'Concluído',
        })}
      />
      {status}
    </Badge>
  )
}

export const PriorityBadge: React.FC<{ priority: TicketPriority; className?: string }> = ({
  priority,
  className,
}) => {
  const getColors = () => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'Média':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Baixa':
        return 'bg-slate-100 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs px-2 py-0.5 rounded-md border text-[11px]',
        getColors(),
        className,
      )}
    >
      {priority}
    </Badge>
  )
}
