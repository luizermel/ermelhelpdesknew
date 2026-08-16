import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { CheckCheck, Check, X, Clock, Loader2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { approvalsService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { Approval, ApprovalStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  Pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  Aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejeitado: 'bg-red-50 text-red-700 border-red-200',
}

export default function Approvals() {
  const { user, isAdmin } = useAuth()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      setApprovals(await approvalsService.getAll())
    } catch {
      toast.error('Erro ao carregar aprovações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])
  useRealtime<Approval>('approvals', () => {
    fetch()
  })

  // Users comuns veem só as próprias; admin vê todas (filtrado aqui para garantir)
  const visible = useMemo(() => {
    if (isAdmin) return approvals
    return approvals.filter((a) => a.requester === user?.id)
  }, [approvals, isAdmin, user?.id])

  const pending = visible.filter((a) => a.status === 'Pendente')
  const resolved = visible.filter((a) => a.status !== 'Pendente')

  const decide = async (a: Approval, status: ApprovalStatus) => {
    if (!user) return
    setActingId(a.id)
    try {
      await approvalsService.decide(a.id, status, user.id)
      toast.success(status === 'Aprovado' ? 'Aprovação concedida!' : 'Aprovação rejeitada.')
      fetch()
    } catch {
      toast.error('Erro ao processar aprovação.')
    } finally {
      setActingId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !user) return
    setSaving(true)
    try {
      await approvalsService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        requester: user.id,
      })
      toast.success('Solicitação criada!')
      setForm({ title: '', description: '' })
      setCreateOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao criar solicitação.')
    } finally {
      setSaving(false)
    }
  }

  const renderCard = (a: Approval) => (
    <Card key={a.id} className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
          <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[a.status])}>
            {a.status}
          </Badge>
        </div>
        {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <span>
            Solicitante:{' '}
            <strong className="text-slate-600">{a.expand?.requester?.name || '—'}</strong>
          </span>
          {a.expand?.approver && (
            <span>
              Aprovador: <strong className="text-slate-600">{a.expand.approver.name}</strong>
            </span>
          )}
          <span>
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
              new Date(a.created),
            )}
          </span>
        </div>
        {isAdmin && a.status === 'Pendente' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 gap-1"
              disabled={actingId === a.id}
              onClick={() => decide(a, 'Aprovado')}
            >
              {actingId === a.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 gap-1"
              disabled={actingId === a.id}
              onClick={() => decide(a, 'Rejeitado')}
            >
              <X className="h-3.5 w-3.5" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CheckCheck className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Aprovações
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Gerencie as solicitações pendentes de aprovação'
              : 'Acompanhe o status das suas solicitações'}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pendentes ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Nenhuma aprovação pendente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map(renderCard)}
              </div>
            )}
          </div>

          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> Resolvidas ({resolved.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolved.map(renderCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Nova Solicitação de Aprovação
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Descreva o que precisa ser aprovado pela administração
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descrição</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Enviar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
