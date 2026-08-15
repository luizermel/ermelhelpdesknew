import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ArrowRight,
  LifeBuoy,
  Layers,
  Calendar,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ticketsService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { Ticket } from '@/types'
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    try {
      const filter = isAdmin ? '' : `requester = "${user?.id}"`
      const data = await ticketsService.getFullList(filter)
      setTickets(data)
    } catch (err) {
      console.error('Erro ao buscar chamados:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user?.id])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Real-time update for tickets
  useRealtime<Ticket>('tickets', () => {
    fetchTickets()
  })

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário'

  const formattedDate = useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now)
  }, [])

  const stats = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter((t) => t.status === 'Aberto').length
    const inProgress = tickets.filter((t) => t.status === 'Em andamento').length
    const closed = tickets.filter((t) => t.status === 'Concluído').length
    return { total, open, inProgress, closed }
  }, [tickets])

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, 5)
  }, [tickets])

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-sm text-slate-500 capitalize flex items-center gap-1.5 mt-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all hover:translate-y-[-1px]"
          >
            <Link to="/chamados/novo" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Abrir Chamado</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Row (2 cols mobile / 4 cols desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total na Empresa' : 'Meus Chamados'}
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats.total}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Chamados registrados</p>
          </CardContent>
        </Card>

        {/* Aberto */}
        <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Abertos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.open}</div>
            )}
            <p className="text-xs text-slate-500 mt-1">Aguardando atendimento</p>
          </CardContent>
        </Card>

        {/* Em andamento */}
        <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Em andamento
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                {stats.inProgress}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Em suporte ativo</p>
          </CardContent>
        </Card>

        {/* Concluídos */}
        <Card className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Concluídos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {stats.closed}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">Solucionados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? 'Chamados Recentes (Organização)' : 'Meus Chamados Recentes'}
            </h2>
            <p className="text-xs text-slate-500">Últimas solicitações registradas no sistema</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium"
          >
            <Link to="/chamados" className="flex items-center gap-1.5">
              <span>Ver todos</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : recentTickets.length === 0 ? (
          <Card className="border-dashed border-slate-300 p-8 text-center bg-white">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Nenhum chamado aberto ainda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Precisa de ajuda com equipamentos, softwares, rede ou senhas? Abra seu primeiro
              chamado.
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              <Link to="/chamados/novo">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Abrir Chamado
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentTickets.map((ticket) => {
              const formattedCreated = new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date(ticket.created))

              return (
                <Link
                  key={ticket.id}
                  to={`/chamados/${ticket.id}`}
                  className="block p-4 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all hover:translate-y-[-1px] group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {ticket.category}
                        </span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {ticket.expand?.sector?.name || 'Setor'}
                        </span>
                        <span>•</span>
                        <span>
                          Solicitado por:{' '}
                          <strong className="text-slate-700">
                            {ticket.expand?.requester?.name || 'Usuário'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">{formattedCreated}</span>
                      <div className="h-8 w-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
