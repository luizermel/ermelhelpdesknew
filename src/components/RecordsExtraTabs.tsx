import React, { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  Check,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { rolesService, settingsService } from '@/services/api'
import type { Role, SystemSettings } from '@/types'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

export function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [canViewReports, setCanViewReports] = useState(false)
  const [canManageUsers, setCanManageUsers] = useState(false)
  const [canManageTickets, setCanManageTickets] = useState(false)
  const [canManageSettings, setCanManageSettings] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchRoles = useCallback(async () => {
    try {
      setRoles(await rolesService.getAll())
    } catch {
      toast.error('Erro ao carregar perfis de acesso.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setCanViewReports(true)
    setCanManageUsers(false)
    setCanManageTickets(true)
    setCanManageSettings(false)
    setIsAdmin(false)
    setOpen(true)
  }

  const openEdit = (r: Role) => {
    setEditing(r)
    setName(r.name)
    setDescription(r.description || '')
    setCanViewReports(!!r.can_view_reports)
    setCanManageUsers(!!r.can_manage_users)
    setCanManageTickets(!!r.can_manage_tickets)
    setCanManageSettings(!!r.can_manage_settings)
    setIsAdmin(!!r.is_admin)
    setOpen(true)
  }

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        can_view_reports: canViewReports,
        can_manage_users: canManageUsers,
        can_manage_tickets: canManageTickets,
        can_manage_settings: canManageSettings,
        is_admin: isAdmin,
      }
      if (editing) await rolesService.update(editing.id, data)
      else await rolesService.create(data)
      toast.success(editing ? 'Perfil atualizado!' : 'Perfil criado!')
      setOpen(false)
      fetchRoles()
    } catch {
      toast.error('Erro ao salvar perfil de acesso.')
    } finally {
      setSaving(false)
    }
  }

  const removeRole = async (r: Role) => {
    if (!confirm(`Remover o perfil "${r.name}"?`)) return
    try {
      await rolesService.remove(r.id)
      toast.success('Perfil removido.')
      fetchRoles()
    } catch {
      toast.error('Erro ao remover perfil.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#0c2340]">Perfis de Acesso e Permissões</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina papéis com permissões específicas para atribuir aos usuários.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs px-4 h-9 rounded-lg gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Novo Perfil
        </Button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Nome do Perfil
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Descrição
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Permissões Chave
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500 text-xs">
                  Nenhum perfil cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((r) => (
                <TableRow
                  key={r.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <span>{r.name}</span>
                      {r.is_admin && (
                        <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Admin Total
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6 max-w-xs truncate">
                    {r.description || '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {r.can_manage_tickets && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-medium">
                          Chamados
                        </span>
                      )}
                      {r.can_view_reports && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          Relatórios
                        </span>
                      )}
                      {r.can_manage_users && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                          Usuários
                        </span>
                      )}
                      {r.can_manage_settings && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
                          Configurações
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-[#0062a8] hover:bg-sky-50 rounded-lg"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => removeRole(r)}
                      >
                        <Trash2 className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveRole} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome do perfil *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Suporte Nível 1 / Gestor de Setor"
                required
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resumo do escopo deste perfil"
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-800">Permissões de Acesso</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Switch
                    checked={canManageTickets}
                    onCheckedChange={setCanManageTickets}
                    id="perm-tickets"
                  />
                  <Label
                    htmlFor="perm-tickets"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Gerenciar Chamados
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Switch
                    checked={canViewReports}
                    onCheckedChange={setCanViewReports}
                    id="perm-reports"
                  />
                  <Label
                    htmlFor="perm-reports"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Visualizar Relatórios
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <Switch
                    checked={canManageUsers}
                    onCheckedChange={setCanManageUsers}
                    id="perm-users"
                  />
                  <Label
                    htmlFor="perm-users"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Gerenciar Usuários
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 sm:col-span-2">
                  <Switch
                    checked={canManageSettings}
                    onCheckedChange={setCanManageSettings}
                    id="perm-settings"
                  />
                  <Label
                    htmlFor="perm-settings"
                    className="text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Acessar Configurações do Sistema
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-red-200 bg-red-50/40 sm:col-span-2">
                  <Switch checked={isAdmin} onCheckedChange={setIsAdmin} id="perm-admin" />
                  <Label
                    htmlFor="perm-admin"
                    className="text-xs font-bold text-red-700 cursor-pointer"
                  >
                    Acesso Total Administrador (Superuser)
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl text-xs h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs font-bold h-10"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function DeadlinesTab() {
  const { settings, refresh } = useSystemSettings()
  const [finalizationHours, setFinalizationHours] = useState<number>(48)
  const [reopenHours, setReopenHours] = useState<number>(72)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setFinalizationHours(settings.finalization_approval_hours ?? 48)
      setReopenHours(settings.reopen_deadline_hours ?? 72)
    }
  }, [settings])

  const handleSaveDeadlines = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (settings?.id) {
        await settingsService.update(settings.id, {
          finalization_approval_hours: Number(finalizationHours),
          reopen_deadline_hours: Number(reopenHours),
        })
      } else {
        await settingsService.create({
          finalization_approval_hours: Number(finalizationHours),
          reopen_deadline_hours: Number(reopenHours),
        })
      }
      toast.success('Prazos atualizados com sucesso!')
      await refresh()
    } catch {
      toast.error('Erro ao salvar os prazos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-[#0c2340] flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          Configuração de Prazos de Finalização e Reabertura
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Defina a janela de tempo (em horas) em que o solicitante pode aprovar a finalização ou
          solicitar a reabertura de um chamado encerrado.
        </p>
      </div>

      <form onSubmit={handleSaveDeadlines} className="space-y-5">
        <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <Label htmlFor="fin-hours" className="text-xs font-bold text-slate-800">
            Prazo para Aprovação de Finalização (em horas)
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="fin-hours"
              type="number"
              min={1}
              max={720}
              value={finalizationHours}
              onChange={(e) => setFinalizationHours(Number(e.target.value))}
              required
              className="w-32 text-xs sm:text-sm rounded-xl font-mono"
            />
            <span className="text-xs text-slate-500 font-medium">
              = {(finalizationHours / 24).toFixed(1)} dias
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Período máximo após a conclusão para o usuário confirmar/aprovar a solução do chamado.
          </p>
        </div>

        <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <Label htmlFor="reopen-hours" className="text-xs font-bold text-slate-800">
            Prazo limite para Reabertura de Chamado Concluído (em horas)
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="reopen-hours"
              type="number"
              min={1}
              max={720}
              value={reopenHours}
              onChange={(e) => setReopenHours(Number(e.target.value))}
              required
              className="w-32 text-xs sm:text-sm rounded-xl font-mono"
            />
            <span className="text-xs text-slate-500 font-medium">
              = {(reopenHours / 24).toFixed(1)} dias
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Após este prazo, o chamado será travado permanentemente e não poderá mais ser reaberto
            pelo solicitante.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#0062a8] hover:bg-[#00508a] text-white font-bold text-xs px-6 h-10 rounded-xl gap-2 shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar Configurações de Prazos
          </Button>
        </div>
      </form>
    </div>
  )
}
