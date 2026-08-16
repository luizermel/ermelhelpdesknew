import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ListOrdered, Building2, Clock, UserCheck, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ticketsService, auditService } from '@/services/api'
import type { Ticket } from '@/types'
import { PriorityBadge } from '@/components/TicketBadges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PRIORITY_ORDER: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

export default function Queue() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const data = await ticketsService.getFullList('status = "Aberto"')
      setTickets(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar fila de atendimento.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 15000)
    return () => clearInterval(interval)
  }, [fetch])

  const sorted = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99
      const pb = PRIORITY_ORDER[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return new Date(a.created).getTime() - new Date(b.created).getTime()
    })
  }, [tickets])

  const handleAssume = async (t: Ticket) => {
    if (!user) return
    setClaimingId(t.id)
    try {
      await ticketsService.update(t.id, {
        assigned_to: user.id,
        status: 'Em andamento',
      })
      await auditService.log('assign', 'ticket', t.id, `Chamado assumido: ${t.title}`)
      toast.success('Chamado assumido com sucesso!')
      fetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao assumir chamado.')
    } finally {
      setClaimingId(null)
    }
  }

  const counts = useMemo(() => {
    const c = { Alta: 0, Média: 0, Baixa: 0 }
    tickets.forEach((t) => {
      if (t.priority in c) c[t.priority as keyof typeof c]++
    })
    return c
  }, [tickets])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ListOrdered className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Fila de Atendimento
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Chamados abertos ordenados por prioridade e tempo de espera · atualização automática a
            cada 15s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-xl border-red-200 bg-red-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-red-600">{counts.Alta}</p>
            <p className="text-[11px] text-slate-600 font-medium">Prioridade Alta</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{counts.Média}</p>
            <p className="text-[11px] text-slate-600 font-medium">Prioridade Média</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-slate-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-600">{counts.Baixa}</p>
            <p className="text-[11px] text-slate-600 font-medium">Prioridade Baixa</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ListOrdered className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          Nenhum chamado aberto na fila. Bom trabalho!
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((t, idx) => (
            <Card
              key={t.id}
              className={cn(
                'bg-white border-slate-200/90 shadow-2xs rounded-2xl hover:shadow-md transition-all',
                t.priority === 'Alta' && 'border-l-4 border-l-red-500',
                t.priority === 'Média' && 'border-l-4 border-l-amber-500',
                t.priority === 'Baixa' && 'border-l-4 border-l-slate-400',
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/chamados/${t.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline truncate block"
                      >
                        {t.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {t.expand?.sector?.name || 'Geral'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                            {t.category}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(t.created)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {t.expand?.requester?.name || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <Button
                      size="sm"
                      onClick={() => handleAssume(t)}
                      disabled={claimingId === t.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                    >
                      {claimingId === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                      )}
                      Assumir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
