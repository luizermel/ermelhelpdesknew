import React, { useEffect, useState, useCallback } from 'react'
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Tag,
  AlertTriangle,
  Users as UsersIcon,
  Phone,
  Loader2,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  sectorsCrudService,
  categoriesService,
  prioritiesService,
  companiesService,
  contactsService,
  usersService,
  sectorsService,
} from '@/services/api'
import type { Sector, Category, Priority, Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

type TabKey = 'setores' | 'categorias' | 'prioridades' | 'atendentes' | 'empresas' | 'contatos'

const TABS: { value: TabKey; label: string; icon: React.ElementType }[] = [
  { value: 'setores', label: 'Setores', icon: Building2 },
  { value: 'categorias', label: 'Categorias', icon: Tag },
  { value: 'prioridades', label: 'Prioridades', icon: AlertTriangle },
  { value: 'atendentes', label: 'Atendentes', icon: UsersIcon },
  { value: 'empresas', label: 'Empresas', icon: Building2 },
  { value: 'contatos', label: 'Contatos', icon: Phone },
]

function getInitials(name?: string) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function Records() {
  const [activeTab, setActiveTab] = useState<TabKey>('setores')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Database className="h-4 w-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cadastros
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie setores, categorias, prioridades, atendentes, empresas e contatos do sistema
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="space-y-4"
      >
        <TabsList className="bg-slate-100 p-1 rounded-xl flex flex-wrap h-auto">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs font-semibold gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="setores">
          <SectorsTab />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="prioridades">
          <PrioritiesTab />
        </TabsContent>
        <TabsContent value="atendentes">
          <AttendantsTab />
        </TabsContent>
        <TabsContent value="empresas">
          <CompaniesTab />
        </TabsContent>
        <TabsContent value="contatos">
          <ContactsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =========================================================
// Generic CRUD table card
// =========================================================
function CrudCard({
  title,
  count,
  onAdd,
  children,
}: {
  title: string
  count: number
  onAdd: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-slate-900">
          {title} <span className="text-slate-400 font-normal">({count})</span>
        </CardTitle>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-10 text-slate-500 text-xs">
        {label}
      </TableCell>
    </TableRow>
  )
}

function LoadingRows({ n, cols }: { n: number; cols: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function fmtDate(s: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(s))
}

// =========================================================
// Setores
// =========================================================
function SectorsTab() {
  const [items, setItems] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sector | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      setItems(await sectorsService.getAll())
    } catch {
      toast.error('Erro ao carregar setores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setOpen(true)
  }
  const openEdit = (s: Sector) => {
    setEditing(s)
    setName(s.name)
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) await sectorsCrudService.update(editing.id, name.trim())
      else await sectorsCrudService.create(name.trim())
      toast.success(editing ? 'Setor atualizado!' : 'Setor criado!')
      setOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar setor.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: Sector) => {
    if (!confirm(`Remover o setor "${s.name}"?`)) return
    try {
      await sectorsCrudService.remove(s.id)
      toast.success('Setor removido.')
      fetch()
    } catch {
      toast.error('Erro ao remover setor.')
    }
  }

  return (
    <>
      <CrudCard title="Setores" count={items.length} onAdd={openCreate}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Criado em</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows n={4} cols={3} />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={3} label="Nenhum setor cadastrado." />
              ) : (
                items.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-900">{s.name}</TableCell>
                    <TableCell className="text-xs text-slate-400">{fmtDate(s.created)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CrudCard>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Informe o nome do setor da empresa
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome do setor *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Financeiro"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =========================================================
// Categorias
// =========================================================
function CategoriesTab() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      setItems(await categoriesService.getAll())
    } catch {
      toast.error('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setOpen(true)
  }
  const openEdit = (c: Category) => {
    setEditing(c)
    setName(c.name)
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editing) await categoriesService.update(editing.id, name.trim())
      else await categoriesService.create(name.trim())
      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!')
      setOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar categoria.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c: Category) => {
    if (!confirm(`Remover a categoria "${c.name}"?`)) return
    try {
      await categoriesService.remove(c.id)
      toast.success('Categoria removida.')
      fetch()
    } catch {
      toast.error('Erro ao remover categoria.')
    }
  }

  return (
    <>
      <CrudCard title="Categorias" count={items.length} onAdd={openCreate}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Criado em</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows n={4} cols={3} />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={3} label="Nenhuma categoria cadastrada." />
              ) : (
                items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-900">{c.name}</TableCell>
                    <TableCell className="text-xs text-slate-400">{fmtDate(c.created)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CrudCard>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =========================================================
// Prioridades
// =========================================================
function PrioritiesTab() {
  const [items, setItems] = useState<Priority[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Priority | null>(null)
  const [name, setName] = useState('')
  const [sla, setSla] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      setItems(await prioritiesService.getAll())
    } catch {
      toast.error('Erro ao carregar prioridades.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSla('')
    setOpen(true)
  }
  const openEdit = (p: Priority) => {
    setEditing(p)
    setName(p.name)
    setSla(p.sla_hours ?? '')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = { name: name.trim(), sla_hours: typeof sla === 'number' ? sla : undefined }
      if (editing) await prioritiesService.update(editing.id, data)
      else await prioritiesService.create(data)
      toast.success(editing ? 'Prioridade atualizada!' : 'Prioridade criada!')
      setOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar prioridade.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: Priority) => {
    if (!confirm(`Remover a prioridade "${p.name}"?`)) return
    try {
      await prioritiesService.remove(p.id)
      toast.success('Prioridade removida.')
      fetch()
    } catch {
      toast.error('Erro ao remover prioridade.')
    }
  }

  return (
    <>
      <CrudCard title="Prioridades" count={items.length} onAdd={openCreate}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">SLA (horas)</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Criado em</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows n={3} cols={4} />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={4} label="Nenhuma prioridade cadastrada." />
              ) : (
                items.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-900">{p.name}</TableCell>
                    <TableCell className="text-xs text-slate-600">{p.sla_hours ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-400">{fmtDate(p.created)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CrudCard>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Prioridade' : 'Nova Prioridade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alta"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">SLA (horas)</Label>
              <Input
                type="number"
                value={sla}
                onChange={(e) => setSla(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 4"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =========================================================
// Atendentes
// =========================================================
function AttendantsTab() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setUsers(await usersService.getAll())
    } catch {
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const toggleRole = async (u: User) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    try {
      await usersService.updateRole(u.id, newRole)
      toast.success(`${u.name} agora é ${newRole === 'admin' ? 'Administrador' : 'Usuário Comum'}.`)
      fetch()
    } catch {
      toast.error('Erro ao alterar papel.')
    }
  }

  return (
    <CrudCard title="Atendentes / Usuários" count={users.length} onAdd={() => {}}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="text-xs font-semibold text-slate-600">Usuário</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">E-mail</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Setor</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Papel</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRows n={4} cols={5} />
            ) : users.length === 0 ? (
              <EmptyRow colSpan={5} label="Nenhum usuário." />
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-xs font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-indigo-600 font-semibold">(Você)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">{u.email}</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {u.expand?.sector?.name || '—'}
                  </TableCell>
                  <TableCell>
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        <UserIcon className="h-3 w-3" />
                        Usuário
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={u.id === currentUser?.id}
                      onClick={() => toggleRole(u)}
                    >
                      {u.role === 'admin' ? 'Rebaixar' : 'Promover a Admin'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CrudCard>
  )
}

// =========================================================
// Empresas
// =========================================================
function CompaniesTab() {
  const [items, setItems] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      setItems(await companiesService.getAll())
    } catch {
      toast.error('Erro ao carregar empresas.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', cnpj: '', phone: '', email: '' })
    setOpen(true)
  }
  const openEdit = (c: Company) => {
    setEditing(c)
    setForm({ name: c.name, cnpj: c.cnpj || '', phone: c.phone || '', email: c.email || '' })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await companiesService.update(editing.id, form)
      else await companiesService.create(form)
      toast.success(editing ? 'Empresa atualizada!' : 'Empresa criada!')
      setOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar empresa.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c: Company) => {
    if (!confirm(`Remover a empresa "${c.name}"?`)) return
    try {
      await companiesService.remove(c.id)
      toast.success('Empresa removida.')
      fetch()
    } catch {
      toast.error('Erro ao remover empresa.')
    }
  }

  return (
    <>
      <CrudCard title="Empresas" count={items.length} onAdd={openCreate}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">CNPJ</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Telefone</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">E-mail</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows n={3} cols={5} />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={5} label="Nenhuma empresa cadastrada." />
              ) : (
                items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-900">{c.name}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.cnpj || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.phone || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CrudCard>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =========================================================
// Contatos
// =========================================================
function ContactsTab() {
  const [items, setItems] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const [c, comp] = await Promise.all([contactsService.getAll(), companiesService.getAll()])
      setItems(c)
      setCompanies(comp)
    } catch {
      toast.error('Erro ao carregar contatos.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    fetch()
  }, [fetch])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', company: '' })
    setOpen(true)
  }
  const openEdit = (c: Contact) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '' })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = { ...form, company: form.company || undefined }
      if (editing) await contactsService.update(editing.id, data)
      else await contactsService.create(data)
      toast.success(editing ? 'Contato atualizado!' : 'Contato criado!')
      setOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar contato.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c: Contact) => {
    if (!confirm(`Remover o contato "${c.name}"?`)) return
    try {
      await contactsService.remove(c.id)
      toast.success('Contato removido.')
      fetch()
    } catch {
      toast.error('Erro ao remover contato.')
    }
  }

  return (
    <>
      <CrudCard title="Contatos" count={items.length} onAdd={openCreate}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">E-mail</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Telefone</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Empresa</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows n={3} cols={5} />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={5} label="Nenhum contato cadastrado." />
              ) : (
                items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-xs font-semibold text-slate-900">{c.name}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.email || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">{c.phone || '—'}</TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {c.expand?.company?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => remove(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CrudCard>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Empresa</Label>
              <Select
                value={form.company}
                onValueChange={(v) => setForm({ ...form, company: v === '__none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Sem empresa —</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
