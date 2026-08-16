import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { ScrollText, Search, Filter, RefreshCw, Loader2 } from 'lucide-react'
import { auditLogsService, usersService } from '@/services/api'
import type { AuditLog, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const ACTION_LABELS: Record<string, string> = {
  create: 'Criar',
  update: 'Atualizar',
  delete: 'Remover',
  assign: 'Assumir',
  approve: 'Aprovar',
  reject: 'Rejeitar',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  assign: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  approve: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reject: 'bg-red-50 text-red-700 border-red-200',
}

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('todos')
  const [entityFilter, setEntityFilter] = useState('todos')
  const [userFilter, setUserFilter] = useState('todos')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetch = useCallback(async () => {
    try {
      const [l, u] = await Promise.all([auditLogsService.getAll(), usersService.getAll()])
      setLogs(l)
      setUsers(u)
    } catch {
      toast.error('Erro ao carregar logs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const entities = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.entity_type && set.add(l.entity_type))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'todos' && l.action !== actionFilter) return false
      if (entityFilter !== 'todos' && l.entity_type !== entityFilter) return false
      if (userFilter !== 'todos' && l.user !== userFilter) return false
      const created = new Date(l.created).getTime()
      if (fromDate && created < new Date(fromDate).getTime()) return false
      if (toDate && created > new Date(toDate).getTime() + 86400000) return false
      return true
    })
  }, [logs, actionFilter, entityFilter, userFilter, fromDate, toDate])

  const userName = (id?: string) => users.find((u) => u.id === id)?.name || (id ? '—' : 'Sistema')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ScrollText className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Logs do Sistema
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Trilha de auditoria das ações realizadas no sistema
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch} className="gap-2 w-fit">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {Object.keys(ACTION_LABELS).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Entidade</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Usuário</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">De</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Até</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
          {(actionFilter !== 'todos' ||
            entityFilter !== 'todos' ||
            userFilter !== 'todos' ||
            fromDate ||
            toDate) && (
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100"
              >
                {filtered.length} de {logs.length} registros
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500"
                onClick={() => {
                  setActionFilter('todos')
                  setEntityFilter('todos')
                  setUserFilter('todos')
                  setFromDate('')
                  setToDate('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhum log encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Ação</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Entidade</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Detalhes</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Usuário</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Data/Hora
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${ACTION_COLORS[l.action] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                        >
                          {ACTION_LABELS[l.action] || l.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {l.entity_type || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-md">
                        {l.details || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{userName(l.user)}</TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(l.created))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
