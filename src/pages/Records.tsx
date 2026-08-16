import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, Shield, User as UserIcon, Tag, Boxes } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  sectorsCrudService,
  categoriesService,
  subcategoriesService,
  prioritiesService,
  companiesService,
  contactsService,
  usersService,
  sectorsService,
} from '@/services/api'
import type { Sector, Category, Subcategory, Priority, Company, Contact, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

type TabKey = 'empresas' | 'contatos' | 'setores' | 'categorias' | 'prioridades' | 'atendentes'

const TABS: { value: TabKey; label: string }[] = [
  { value: 'empresas', label: 'Empresas' },
  { value: 'contatos', label: 'Contatos' },
  { value: 'setores', label: 'Setores' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'prioridades', label: 'Prioridades' },
  { value: 'atendentes', label: 'Usuários' },
]

function getInitials(name?: string) {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function Records() {
  const [activeTab, setActiveTab] = useState<TabKey>('categorias')

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0c2340] tracking-tight">Cadastros</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Estrutura base do help desk multiempresa.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="space-y-6"
      >
        <TabsList className="bg-slate-100/80 p-1 rounded-xl flex flex-wrap h-auto gap-1 border border-slate-200/50">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-[#0a2540] data-[state=active]:shadow-xs transition-all"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="empresas">
          <CompaniesTab />
        </TabsContent>
        <TabsContent value="contatos">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="setores">
          <SectorsTab />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriesSubcategoriesTwoColumnTab />
        </TabsContent>
        <TabsContent value="prioridades">
          <PrioritiesTab />
        </TabsContent>
        <TabsContent value="atendentes">
          <AttendantsTab />
        </TabsContent>
      </Tabs>
    </div>
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

// =========================================================
// ABA DE CATEGORIAS E SUBCATEGORIAS (LAYOUT DE 2 COLUNAS - FOTO DE REFERÊNCIA)
// =========================================================
function CategoriesSubcategoriesTwoColumnTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  // Modais de Categoria
  const [catOpen, setCatOpen] = useState(false)
  const [catEditing, setCatEditing] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catSaving, setCatSaving] = useState(false)

  // Modais de Subcategoria
  const [subOpen, setSubOpen] = useState(false)
  const [subEditing, setSubEditing] = useState<Subcategory | null>(null)
  const [subName, setSubName] = useState('')
  const [subCatId, setSubCatId] = useState('')
  const [subSaving, setSubSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [cats, subs] = await Promise.all([
        categoriesService.getAll(),
        subcategoriesService.getAll(),
      ])
      setCategories(cats)
      setSubcategories(subs)
    } catch {
      toast.error('Erro ao carregar categorias e subcategorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Map para buscar nome da Categoria pelo id ou nome
  const getCategoryName = (catIdOrName?: string) => {
    if (!catIdOrName) return '—'
    const found = categories.find((c) => c.id === catIdOrName || c.name === catIdOrName)
    return found ? found.name : catIdOrName
  }

  // --- Handlers Categoria ---
  const openCatCreate = () => {
    setCatEditing(null)
    setCatName('')
    setCatOpen(true)
  }
  const openCatEdit = (c: Category) => {
    setCatEditing(c)
    setCatName(c.name)
    setCatOpen(true)
  }
  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return
    setCatSaving(true)
    try {
      if (catEditing) await categoriesService.update(catEditing.id, catName.trim())
      else await categoriesService.create(catName.trim())
      toast.success(catEditing ? 'Categoria atualizada!' : 'Categoria criada!')
      setCatOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar categoria.')
    } finally {
      setCatSaving(false)
    }
  }
  const removeCat = async (c: Category) => {
    if (!confirm(`Remover a categoria "${c.name}"?`)) return
    try {
      await categoriesService.remove(c.id)
      toast.success('Categoria removida.')
      fetchData()
    } catch {
      toast.error('Erro ao remover categoria.')
    }
  }

  // --- Handlers Subcategoria ---
  const openSubCreate = () => {
    setSubEditing(null)
    setSubName('')
    setSubCatId(categories[0]?.id || '')
    setSubOpen(true)
  }
  const openSubEdit = (s: Subcategory) => {
    setSubEditing(s)
    setSubName(s.name)
    setSubCatId(s.category_id || categories[0]?.id || '')
    setSubOpen(true)
  }
  const saveSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subName.trim()) return
    setSubSaving(true)
    try {
      if (subEditing) await subcategoriesService.update(subEditing.id, subName.trim(), subCatId)
      else await subcategoriesService.create(subName.trim(), subCatId)
      toast.success(subEditing ? 'Subcategoria atualizada!' : 'Subcategoria criada!')
      setSubOpen(false)
      fetchData()
    } catch {
      toast.error('Erro ao salvar subcategoria.')
    } finally {
      setSubSaving(false)
    }
  }
  const removeSub = async (s: Subcategory) => {
    if (!confirm(`Remover a subcategoria "${s.name}"?`)) return
    try {
      await subcategoriesService.remove(s.id)
      toast.success('Subcategoria removida.')
      fetchData()
    } catch {
      toast.error('Erro ao remover subcategoria.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da aba de categorias */}
      <div>
        <h2 className="text-sm font-bold text-[#0c2340]">Organização dos chamados</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Crie primeiro as categorias e, depois, vincule cada subcategoria ao grupo correto.
        </p>
      </div>

      {/* Grid de 2 Colunas Lado a Lado (Foto da Tarefa) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUNA ESQUERDA: Categorias */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0062a8] flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0c2340]">Categorias</h3>
                <p className="text-[11px] text-slate-500">Grupos principais de atendimento</p>
              </div>
            </div>
            <Button
              onClick={openCatCreate}
              className="bg-[#0062a8] hover:bg-[#00508a] text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-2xs"
            >
              <Plus className="h-4 w-4" /> Nova categoria
            </Button>
          </div>

          <div className="border border-slate-200/80 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-b border-slate-200/60">
                  <TableHead className="text-xs font-semibold text-slate-600 py-3">Nome</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3">
                    Situação
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600 py-3">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingRows n={4} cols={3} />
                ) : categories.length === 0 ? (
                  <EmptyRow colSpan={3} label="Nenhuma categoria cadastrada." />
                ) : (
                  categories.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                    >
                      <TableCell className="text-xs font-bold text-[#0c2340] py-3.5">
                        {c.name}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#0062a8] text-white">
                          Ativa
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-700 hover:text-[#0062a8] rounded-lg"
                            onClick={() => openCatEdit(c)}
                          >
                            <Pencil className="h-4 w-4 stroke-[1.75]" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => removeCat(c)}
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
        </div>

        {/* COLUNA DIREITA: Subcategorias */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0062a8] flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0c2340]">Subcategorias</h3>
                <p className="text-[11px] text-slate-500">Opções vinculadas a uma categoria</p>
              </div>
            </div>
            <Button
              onClick={openSubCreate}
              className="bg-[#0062a8] hover:bg-[#00508a] text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-2xs"
            >
              <Plus className="h-4 w-4" /> Nova subcategoria
            </Button>
          </div>

          <div className="border border-slate-200/80 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-b border-slate-200/60">
                  <TableHead className="text-xs font-semibold text-slate-600 py-3">Nome</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3">
                    Categoria
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3">
                    Situação
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600 py-3">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingRows n={4} cols={4} />
                ) : subcategories.length === 0 ? (
                  <EmptyRow colSpan={4} label="Nenhuma subcategoria cadastrada." />
                ) : (
                  subcategories.map((sc) => (
                    <TableRow
                      key={sc.id}
                      className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                    >
                      <TableCell className="text-xs font-bold text-[#0c2340] py-3.5">
                        {sc.name}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                          {getCategoryName(sc.category_id)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#0062a8] text-white">
                          Ativa
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-700 hover:text-[#0062a8] rounded-lg"
                            onClick={() => openSubEdit(sc)}
                          >
                            <Pencil className="h-4 w-4 stroke-[1.75]" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => removeSub(sc)}
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
        </div>
      </div>

      {/* Modal Categoria */}
      <Dialog open={catOpen} onOpenChange={(o) => !o && setCatOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {catEditing ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCat} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome da categoria *</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Hardware, Software"
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatOpen(false)}
                disabled={catSaving}
                className="rounded-xl text-xs h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs font-bold h-10"
                disabled={catSaving}
              >
                {catSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Subcategoria */}
      <Dialog open={subOpen} onOpenChange={(o) => !o && setSubOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {subEditing ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSub} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome da subcategoria *</Label>
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Ex: Armazenamento e memória"
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Categoria pai *</Label>
              <Select value={subCatId} onValueChange={(val) => setSubCatId(val)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
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
                onClick={() => setSubOpen(false)}
                disabled={subSaving}
                className="rounded-xl text-xs h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs font-bold h-10"
                disabled={subSaving}
              >
                {subSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =========================================================
// Setores Tab
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#0c2340]">Catálogo geral de setores</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Depois, selecione na aba Empresas quais setores cada empresa utiliza.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs px-4 h-9 rounded-lg gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Novo setor
        </Button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Setor
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Situação
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
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
                <TableRow
                  key={s.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] uppercase tracking-wide py-4 px-6">
                    {s.name}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#0062a8] text-white">
                      Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-[#0062a8] hover:bg-sky-50 rounded-lg"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => remove(s)}
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
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome do setor *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TI"
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs font-bold"
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

// =========================================================
// Empresas Tab
// =========================================================
function CompaniesTab() {
  const [items, setItems] = useState<Company[]>([])
  const [allSectors, setAllSectors] = useState<Sector[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', phone: '', email: '' })

  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [comps, sec, cat, subcat] = await Promise.all([
        companiesService.getAll(),
        sectorsService.getAll(),
        categoriesService.getAll(),
        subcategoriesService.getAll(),
      ])
      setItems(comps)
      setAllSectors(sec)
      setAllCategories(cat)
      setAllSubcategories(subcat)
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', cnpj: '', phone: '', email: '' })
    setSelectedSectors(allSectors.map((s) => s.name))
    setSelectedCategories(allCategories.map((c) => c.name))
    setSelectedSubcategories(allSubcategories.map((sc) => sc.name))
    setOpen(true)
  }

  const openEdit = (c: Company) => {
    setEditing(c)
    setForm({ name: c.name, cnpj: c.cnpj || '', phone: c.phone || '', email: c.email || '' })
    setSelectedSectors(allSectors.map((s) => s.name))
    setSelectedCategories(allCategories.map((c) => c.name))
    setSelectedSubcategories(allSubcategories.map((sc) => sc.name))
    setOpen(true)
  }

  const toggleSector = (name: string) => {
    setSelectedSectors((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    )
  }

  const toggleSubcategory = (name: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(name) ? prev.filter((sc) => sc !== name) : [...prev, name],
    )
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
      fetchAll()
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
      fetchAll()
    } catch {
      toast.error('Erro ao remover empresa.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0c2340]">Empresas cadastradas</h2>
          <p className="text-xs text-slate-500">
            Configure os setores e categorias permitidos por empresa.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs px-4 h-9 rounded-lg gap-1.5 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Nome
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                CNPJ
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Telefone
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                E-mail
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
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
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] py-4 px-6">
                    {c.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.cnpj || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.phone || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.email || '—'}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-[#0062a8] hover:bg-sky-50 rounded-lg"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => remove(c)}
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
        <DialogContent className="max-w-2xl bg-white rounded-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">Nome da Empresa *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Empresa Matriz"
                  required
                  autoFocus
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-[#0c2340]">Setores utilizados pela empresa</h3>
              <div className="p-3 bg-[#f8fafc] border border-slate-200/80 rounded-xl flex flex-wrap gap-2">
                {allSectors.map((s) => {
                  const selected = selectedSectors.includes(s.name)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSector(s.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        selected
                          ? 'bg-white text-[#0a2540] border border-slate-200/90 shadow-2xs'
                          : 'bg-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#0c2340]">Categorias disponíveis</h3>
              <div className="p-3 bg-[#f8fafc] border border-slate-200/80 rounded-xl flex flex-wrap gap-2">
                {allCategories.map((c) => {
                  const selected = selectedCategories.includes(c.name)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.name)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? 'bg-white text-[#0a2540] border border-slate-200/90 shadow-2xs'
                          : 'bg-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#0c2340]">Subcategorias disponíveis</h3>
              <div className="p-3.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl flex flex-wrap gap-2 max-h-[220px] overflow-y-auto">
                {allSubcategories.map((sc) => {
                  const selected = selectedSubcategories.includes(sc.name)
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => toggleSubcategory(sc.name)}
                      className={`px-3 py-1 rounded-lg text-[11.5px] font-medium transition-all ${
                        selected
                          ? 'bg-white text-[#0a2540] border border-slate-200/90 shadow-2xs'
                          : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {sc.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="h-10 px-5 rounded-xl text-xs font-semibold bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-0"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 px-6 bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs font-bold shadow-xs"
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

// =========================================================
// Prioridades Tab
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0c2340]">Prioridades e SLA</h2>
          <p className="text-xs text-slate-500">
            Prazos de atendimento baseados no nível de urgência.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs px-4 h-9 rounded-lg gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nova prioridade
        </Button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Nome
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                SLA (horas)
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Situação
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
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
                <TableRow
                  key={p.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] py-4 px-6">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {p.sla_hours ? `${p.sla_hours} horas` : '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#0062a8] text-white">
                      Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-[#0062a8] hover:bg-sky-50 rounded-lg"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => remove(p)}
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
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Prioridade' : 'Nova Prioridade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alta"
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">SLA (horas)</Label>
              <Input
                type="number"
                value={sla}
                onChange={(e) => setSla(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 4"
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs"
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

// =========================================================
// Usuários Tab
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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#0c2340]">Usuários e Atendentes</h2>
        <p className="text-xs text-slate-500">Gestão de permissões do sistema.</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Usuário
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                E-mail
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Setor
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Papel
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRows n={4} cols={5} />
            ) : users.length === 0 ? (
              <EmptyRow colSpan={5} label="Nenhum usuário cadastrado." />
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-[#0062a8] text-white text-[10px] font-bold">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-[#0062a8] font-semibold">(Você)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono py-4 px-6">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {u.expand?.sector?.name || '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-sky-100 text-[#0062a8]">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        <UserIcon className="h-3 w-3" />
                        Usuário
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-lg"
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
    </div>
  )
}

// =========================================================
// Contatos Tab
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0c2340]">Contatos das Empresas</h2>
          <p className="text-xs text-slate-500">
            Pessoas de contato vinculadas às empresas atentas.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold text-xs px-4 h-9 rounded-lg gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-[#f8fafc]">
            <TableRow className="border-b border-slate-200/70 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Nome
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                E-mail
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Telefone
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Empresa
              </TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-600 py-3.5 px-6">
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
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="text-xs font-bold text-[#0a2540] py-4 px-6">
                    {c.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.email || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.phone || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {c.expand?.company?.name || '—'}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-[#0062a8] hover:bg-sky-50 rounded-lg"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-4 w-4 stroke-[1.75]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => remove(c)}
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
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Contato' : 'Novo Contato'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Empresa</Label>
              <Select
                value={form.company}
                onValueChange={(v) => setForm({ ...form, company: v === '__none' ? '' : v })}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
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
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0062a8] hover:bg-[#00508a] text-white rounded-xl text-xs"
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
