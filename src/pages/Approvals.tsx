import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  CheckCheck,
  Check,
  X,
  Clock,
  Loader2,
  Plus,
  Building2,
  Building,
  User,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { approvalsService, companiesService, sectorsService, usersService } from '@/services/api'
import pb from '@/lib/pocketbase/client'
import useRealtime from '@/hooks/use-realtime'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import type { Approval, ApprovalStatus, Company, Sector } from '@/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [companies, setCompanies] = useState<Company[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state for approving registration requests
  const [approveDialogOpen, setApproveOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedSectorId, setSelectedSectorId] = useState<string>('')
  const [actingId, setActingId] = useState<string | null>(null)

  // Modal state for creating custom generic approvals
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)

  // View mode state (persisted em localStorage) — padrão Lista
  const { viewMode, toggleViewMode } = useViewMode('approvals-view-mode')

  const fetchData = useCallback(async () => {
    try {
      const [apprs, comps, secs] = await Promise.all([
        approvalsService.getAll(),
        companiesService.getAll(),
        sectorsService.getAll(),
      ])
      setApprovals(apprs)
      setCompanies(comps)
      setSectors(secs)
    } catch {
      toast.error('Erro ao carregar dados de aprovação.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtime<Approval>('approvals', () => {
    fetchData()
  })

  const visible = useMemo(() => {
    if (isAdmin) return approvals
    return approvals.filter((a) => a.requester === user?.id || a.email === user?.email)
  }, [approvals, isAdmin, user?.id, user?.email])

  const pending = visible.filter((a) => a.status === 'Pendente')
  const resolved = visible.filter((a) => a.status !== 'Pendente')

  const openApproveModal = (a: Approval) => {
    setSelectedApproval(a)
    setSelectedCompanyId(companies[0]?.id || '')
    setSelectedSectorId(sectors[0]?.id || '')
    setApproveOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!selectedApproval || !user) return
    setActingId(selectedApproval.id)
    try {
      // 1. Atualizar aprovação no PocketBase com status Aprovado, empresa e setor reais
      await approvalsService.update(selectedApproval.id, {
        status: 'Aprovado',
        approver: user.id,
        company: selectedCompanyId || undefined,
        sector: selectedSectorId || undefined,
      })

      // 2. Se for uma solicitação de acesso (tem e-mail), criar o usuário no PocketBase
      if (selectedApproval.email) {
        const tempPassword = `Pass@${Math.random().toString(36).slice(-6)}`
        try {
          await pb.collection('users').create({
            email: selectedApproval.email,
            name: selectedApproval.name || selectedApproval.email.split('@')[0],
            password: tempPassword,
            passwordConfirm: tempPassword,
            role: 'user',
            sector: selectedSectorId || undefined,
            company: selectedCompanyId || undefined,
          })
          toast.success(`Solicitação aprovada! Usuário criado para ${selectedApproval.email}.`)
        } catch (err: unknown) {
          console.warn('Usuário pode já existir ou erro ao criar:', err)
          toast.success('Solicitação marcada como Aprovada!')
        }
      } else {
        toast.success('Solicitação aprovada com sucesso!')
      }

      setApproveOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao aprovar solicitação.')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (a: Approval) => {
    if (!user) return
    setActingId(a.id)
    try {
      await approvalsService.decide(a.id, 'Rejeitado', user.id)
      toast.success('Solicitação rejeitada.')
      fetchData()
    } catch {
      toast.error('Erro ao rejeitar solicitação.')
    } finally {
      setActingId(null)
    }
  }

  const handleCreateGeneric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !user) return
    setSaving(true)
    try {
      await approvalsService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        requester: user.id,
        status: 'Pendente',
      })
      toast.success('Solicitação criada com sucesso!')
      setForm({ title: '', description: '' })
      setCreateOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao criar solicitação.')
    } finally {
      setSaving(false)
    }
  }

  const renderActions = (a: Approval) => {
    if (!(isAdmin && a.status === 'Pendente')) return null
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-[#0062a8] hover:bg-[#00508a] text-white text-xs h-8 px-4 rounded-xl gap-1.5"
          disabled={actingId === a.id}
          onClick={() => openApproveModal(a)}
        >
          {actingId === a.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8 px-4 rounded-xl gap-1.5"
          disabled={actingId === a.id}
          onClick={() => handleReject(a)}
        >
          <X className="h-3.5 w-3.5" />
          Rejeitar
        </Button>
      </div>
    )
  }

  const renderCard = (a: Approval) => {
    const isAccessRequest = Boolean(a.email)

    return (
      <Card
        key={a.id}
        className="bg-white border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden"
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{a.title}</h3>
              {isAccessRequest && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0062a8]">
                  Solicitação de Acesso
                </span>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn('text-[10px] font-bold shrink-0', STATUS_COLORS[a.status])}
            >
              {a.status}
            </Badge>
          </div>

          {/* Se for solicitação de acesso, exibir dados do solicitante */}
          {isAccessRequest ? (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-3.5 w-3.5 text-[#0062a8]" />
                <span className="font-semibold">{a.name || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{a.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Empresa solicitada: <strong>{a.company_text || '—'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Setor solicitado: <strong>{a.sector_text || '—'}</strong>
                </span>
              </div>
            </div>
          ) : (
            a.description && (
              <p className="text-xs text-slate-500 leading-relaxed">{a.description}</p>
            )
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            {a.expand?.requester && (
              <span>
                Solicitante: <strong className="text-slate-600">{a.expand.requester.name}</strong>
              </span>
            )}
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

          {renderActions(a)}
        </CardContent>
      </Card>
    )
  }

  const renderListItem = (a: Approval) => {
    const isAccessRequest = Boolean(a.email)
    return (
      <div
        key={a.id}
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-sky-50/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
            {isAccessRequest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0062a8] shrink-0">
                Acesso
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {isAccessRequest ? `${a.name || '—'} • ${a.email}` : a.description || '—'}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn('text-[10px] font-bold shrink-0', STATUS_COLORS[a.status])}
        >
          {a.status}
        </Badge>
        <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(a.created))}
        </span>
        <div className="shrink-0">{renderActions(a)}</div>
      </div>
    )
  }

  const renderList = (list: Approval[]) =>
    viewMode === 'list' ? (
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {list.map(renderListItem)}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(renderCard)}
      </div>
    )

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-sky-100 text-[#0062a8] flex items-center justify-center">
              <CheckCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#0c2340] tracking-tight">
              Aprovações e Solicitações
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Analise as solicitações de novos usuários e vincule Empresa e Setor'
              : 'Acompanhe o status das suas solicitações no sistema'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle
            viewMode={viewMode}
            onToggle={toggleViewMode}
            activeColorClass="text-[#0062a8]"
          />
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs h-10 px-5 rounded-xl gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {loading ? (
        viewMode === 'list' ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pendentes ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                Nenhuma solicitação pendente no momento.
              </div>
            ) : (
              renderList(pending)
            )}
          </div>

          {resolved.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> Histórico de Resolvidas (
                {resolved.length})
              </h2>
              {renderList(resolved)}
            </div>
          )}
        </div>
      )}

      {/* Modal de Aprovação com Seleção de Empresa e Setor (Multiempresa) */}
      <Dialog open={approveDialogOpen} onOpenChange={(o) => !o && setApproveOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Aprovar Solicitação de Acesso
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vincule a Empresa e o Setor reais cadastrados no sistema para autorizar este usuário.
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <p>
                  <strong>Nome:</strong> {selectedApproval.name || selectedApproval.title}
                </p>
                <p>
                  <strong>E-mail:</strong> {selectedApproval.email || '—'}
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Texto enviado na página inicial:{' '}
                  <em>
                    {selectedApproval.company_text} / {selectedApproval.sector_text}
                  </em>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Empresa oficial *</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(val) => setSelectedCompanyId(val)}
                >
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Setor oficial *</Label>
                <Select value={selectedSectorId} onValueChange={(val) => setSelectedSectorId(val)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApproveOpen(false)}
                  className="h-10 text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="h-10 bg-[#0062a8] hover:bg-[#00508a] text-white text-xs font-bold rounded-xl"
                  disabled={Boolean(actingId)}
                >
                  {actingId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1 stroke-[2.5]" />
                  )}
                  Confirmar Aprovação
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criação Genérica */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Nova Solicitação de Aprovação
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Descreva a solicitação ou autorização que precisa de validação dos administradores
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGeneric} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Liberação de acesso especial"
                required
                autoFocus
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descrição</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
                className="h-10 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 bg-[#0062a8] hover:bg-[#00508a] text-white text-xs rounded-xl"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
