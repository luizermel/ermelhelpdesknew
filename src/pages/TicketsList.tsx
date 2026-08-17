import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  PlusCircle,
  X,
  LifeBuoy,
  Building2,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ticketsService, sectorsService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import type { Ticket, Sector, TicketCategory, TicketStatus, TicketPriority } from '@/types'
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const CATEGORIES: TicketCategory[] = [
  'Acesso e Senha',
  'E-mail',
  'Hardware',
  'Impressora',
  'Rede',
  'Software',
  'Telefonia',
  'Outros',
]

// Sorting state for the list (table) view — tri-state per column:
// null = no sort (padrão), 'asc' = A-Z / menor-maior, 'desc' = Z-A / maior-menor
type SortDir = 'asc' | 'desc' | null
type SortKey = 'title' | 'category' | 'sector' | 'priority' | 'status' | 'created'

const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  Baixa: 1,
  Média: 2,
  Alta: 3,
}

// Order em que os status aparecem (para ordenação por coluna de status)
const STATUS_WEIGHT: Record<TicketStatus, number> = {
  Aberto: 1,
  'Em andamento': 2,
  Concluído: 3,
  Finalizado: 4,
  'Finalizado e Aprovado': 5,
}

export default function TicketsList() {
  const { user, isAdmin } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  // View mode state (persisted in localStorage) — padrão Lista
  const { viewMode, toggleViewMode } = useViewMode('tickets-view-mode')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [sectorFilter, setSectorFilter] = useState<string>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')

  // Sorting (list view): one active column + direction at a time
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      // New column → first click is ascending
      setSortKey(key)
      setSortDir('asc')
      return
    }
    // Same column → cycle asc → desc → none
    if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  const fetchSectors = async () => {
    try {
      const data = await sectorsService.getAll()
      setSectors(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTickets = useCallback(async () => {
    try {
      const filter = isAdmin ? '' : `requester = "${user?.id}"`
      const data = await ticketsService.getFullList(filter)
      setTickets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user?.id])

  useEffect(() => {
    fetchSectors()
    fetchTickets()
  }, [fetchTickets])

  useRealtime<Ticket>('tickets', () => {
    fetchTickets()
  })

  // Filter + sort logic
  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const titleMatch = t.title.toLowerCase().includes(q)
        const descMatch = t.description.toLowerCase().includes(q)
        const requesterMatch = t.expand?.requester?.name.toLowerCase().includes(q)
        if (!titleMatch && !descMatch && !requesterMatch) return false
      }

      // Status
      if (statusFilter !== 'todos' && t.status !== statusFilter) {
        return false
      }

      // Sector
      if (sectorFilter !== 'todos' && t.sector !== sectorFilter) {
        return false
      }

      // Category
      if (categoryFilter !== 'todos' && t.category !== categoryFilter) {
        return false
      }

      return true
    })

    if (!sortKey || !sortDir) return filtered

    const dir = sortDir === 'asc' ? 1 : -1
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title, 'pt-BR') * dir
        case 'category':
          return a.category.localeCompare(b.category, 'pt-BR') * dir
        case 'sector': {
          const sa = a.expand?.sector?.name || 'Setor Geral'
          const sb = b.expand?.sector?.name || 'Setor Geral'
          return sa.localeCompare(sb, 'pt-BR') * dir
        }
        case 'priority':
          return ((PRIORITY_WEIGHT[a.priority] ?? 0) - (PRIORITY_WEIGHT[b.priority] ?? 0)) * dir
        case 'status':
          return ((STATUS_WEIGHT[a.status] ?? 0) - (STATUS_WEIGHT[b.status] ?? 0)) * dir
        case 'created':
          return (new Date(a.created).getTime() - new Date(b.created).getTime()) * dir
        default:
          return 0
      }
    })
    return sorted
  }, [tickets, search, statusFilter, sectorFilter, categoryFilter, sortKey, sortDir])

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'todos' ||
    sectorFilter !== 'todos' ||
    categoryFilter !== 'todos'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setSectorFilter('todos')
    setCategoryFilter('todos')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chamados
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Todos os chamados de TI registrados pelos setores'
              : 'Gerencie e acompanhe o status de suas solicitações'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle View Mode */}
          <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />

          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
          >
            <Link to="/chamados/novo" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Abrir Chamado</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-slate-200/90 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sector Filter */}
            <div>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter counter / Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Mostrando <strong>{filteredTickets.length}</strong> de {tickets.length} chamados
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium text-xs flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket List View OR Card Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-12 text-center bg-white rounded-2xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhum chamado encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {hasActiveFilters
              ? 'Nenhum chamado corresponde aos filtros aplicados. Tente ajustar os parâmetros de busca.'
              : 'Não há registros de chamados no momento.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters} className="text-xs">
              Limpar filtros
            </Button>
          ) : (
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              <Link to="/chamados/novo">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Abrir Novo Chamado
              </Link>
            </Button>
          )}
        </Card>
      ) : viewMode === 'list' ? (
        /* List View (Compact Table) */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  {[
                    { key: 'title' as SortKey, label: 'Título / Descrição', align: 'left' },
                    { key: 'category' as SortKey, label: 'Categoria', align: 'left' },
                    { key: 'sector' as SortKey, label: 'Setor / Solicitante', align: 'left' },
                    { key: 'priority' as SortKey, label: 'Prioridade', align: 'left' },
                    { key: 'status' as SortKey, label: 'Status', align: 'left' },
                    { key: 'created' as SortKey, label: 'Data', align: 'right' },
                  ].map((col) => {
                    const isActive = sortKey === col.key && sortDir !== null
                    return (
                      <th
                        key={col.key}
                        className="py-3 px-4 select-none cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => toggleSort(col.key)}
                        title={`Ordenar por ${col.label}`}
                      >
                        <span
                          className={`inline-flex items-center gap-1 ${
                            col.align === 'right' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {col.label}
                          {isActive &&
                            (sortDir === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-indigo-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-indigo-600" />
                            ))}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(ticket.created))

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <Link to={`/chamados/${ticket.id}`} className="block">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {ticket.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {ticket.description}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {ticket.expand?.sector?.name || 'Setor Geral'}
                          </span>
                          {ticket.expand?.requester?.name && (
                            <span className="text-[11px] text-slate-400">
                              {ticket.expand.requester.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-slate-400 text-[11px]">
                        {formattedDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => {
            const formattedDate = new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(ticket.created))

            return (
              <Link
                key={ticket.id}
                to={`/chamados/${ticket.id}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all hover:translate-y-[-2px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {ticket.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate max-w-[120px]">
                      {ticket.expand?.sector?.name || 'Setor Geral'}
                    </span>
                    {ticket.expand?.requester?.name && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[130px]">
                          {ticket.expand.requester.name}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
