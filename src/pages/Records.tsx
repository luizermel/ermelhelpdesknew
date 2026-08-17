import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  User as UserIcon,
  Tag,
  Boxes,
  Building2,
  ArrowUp,
  ArrowDown,
  Mail,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  sectorsCrudService,
  categoriesService,
  subcategoriesService,
  prioritiesService,
  companiesService,
  usersService,
  sectorsService,
  rolesService,
  settingsService,
} from '@/services/api'
import type { Sector, Category, Subcategory, Priority, Company, User, Role } from '@/types'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { RolesTab, DeadlinesTab } from '@/components/RecordsExtraTabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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

type TabKey =
  | 'empresas'
  | 'setores'
  | 'categorias'
  | 'prioridades'
  | 'atendentes'
  | 'perfis'
  | 'prazos'

const TABS: { value: TabKey; label: string }[] = [
  { value: 'empresas', label: 'Empresas' },
  { value: 'setores', label: 'Setores' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'prioridades', label: 'Prioridades' },
  { value: 'perfis', label: 'Perfis de Acesso' },
  { value: 'atendentes', label: 'Usuários' },
  { value: 'prazos', label: 'Prazos e Pós-Fechamento' },
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
        <TabsContent value="setores">
          <SectorsTab />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriesSubcategoriesTwoColumnTab />
        </TabsContent>
        <TabsContent value="prioridades">
          <PrioritiesTab />
        </TabsContent>
        <TabsContent value="perfis">
          <RolesTab />
        </TabsContent>
        <TabsContent value="atendentes">
          <AttendantsTab />
        </TabsContent>
        <TabsContent value="prazos">
          <DeadlinesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Tri-state sort direction for clickable table headers:
// null = ordenação padrão, 'asc' = A-Z (crescente), 'desc' = Z-A (decrescente)
type SortDir = 'asc' | 'desc' | null

function SortHeader({
  label,
  active,
  dir,
  align = 'left',
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  align?: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <TableHead
      className={`text-xs font-semibold text-slate-600 py-3 select-none cursor-pointer hover:text-[#0062a8] transition-colors ${
        align === 'right' ? 'text-right' : ''
      }`}
      onClick={onClick}
      title={`Ordenar por ${label}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {active &&
          (dir === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-[#0062a8]" />
          ) : (
            <ArrowDown className="h-3 w-3 text-[#0062a8]" />
          ))}
      </span>
    </TableHead>
  )
}

// Próximo valor no ciclo tri-state: null → asc → desc → null
function nextDir(dir: SortDir): SortDir {
  if (dir === null) return 'asc'
  if (dir === 'asc') return 'desc'
  return null
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
// ABA DE CATEGORIAS E SUBCATEGORIAS (LAYOUT DE 2 COLUNAS)
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

  // Ordenação por coluna (tri-state) — Categorias e Subcategorias
  const [catSortKey, setCatSortKey] = useState<'name' | 'status' | null>(null)
  const [catSortDir, setCatSortDir] = useState<SortDir>(null)
  const [subSortKey, setSubSortKey] = useState<'name' | 'category' | 'status' | null>(null)
  const [subSortDir, setSubSortDir] = useState<SortDir>(null)

  const toggleCatSort = (key: 'name' | 'status') => {
    if (catSortKey !== key) {
      setCatSortKey(key)
      setCatSortDir('asc')
      return
    }
    setCatSortDir(nextDir(catSortDir))
    if (catSortDir === 'desc') setCatSortKey(null)
  }

  const toggleSubSort = (key: 'name' | 'category' | 'status') => {
    if (subSortKey !== key) {
      setSubSortKey(key)
      setSubSortDir('asc')
      return
    }
    setSubSortDir(nextDir(subSortDir))
    if (subSortDir === 'desc') setSubSortKey(null)
  }

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

  // Listas ordenadas conforme o estado de ordenação de cada tabela
  const sortedCategories = useMemo(() => {
    if (!catSortKey || !catSortDir) return categories
    const dir = catSortDir === 'asc' ? 1 : -1
    return [...categories].sort((a, b) => {
      switch (catSortKey) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR') * dir
        case 'status':
          // Situação é sempre "Ativa" para categorias — mantém a ordem original
          return 0
        default:
          return 0
      }
    })
  }, [categories, catSortKey, catSortDir])

  const sortedSubcategories = useMemo(() => {
    if (!subSortKey || !subSortDir) return subcategories
    const dir = subSortDir === 'asc' ? 1 : -1
    return [...subcategories].sort((a, b) => {
      switch (subSortKey) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR') * dir
        case 'category':
          return (
            getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id), 'pt-BR') *
            dir
          )
        case 'status':
          // Situação é sempre "Ativa" para subcategorias — mantém a ordem original
          return 0
        default:
          return 0
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategories, subSortKey, subSortDir, categories])

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
    // OBRIGATÓRIO: ao editar, a categoria precisa ter ao menos uma subcategoria vinculada
    if (catEditing) {
      const relatedSubs = subcategories.filter((s) => s.category_id === catEditing.id)
      if (relatedSubs.length === 0) {
        toast.error('A categoria precisa ter ao menos uma subcategoria vinculada antes de salvar.')
        return
      }
    }
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

      {/* Grid de 2 Colunas Lado a Lado */}
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
                  <SortHeader
                    label="Nome"
                    active={catSortKey === 'name'}
                    dir={catSortDir}
                    onClick={() => toggleCatSort('name')}
                  />
                  <SortHeader
                    label="Situação"
                    active={catSortKey === 'status'}
                    dir={catSortDir}
                    onClick={() => toggleCatSort('status')}
                  />
                  <TableHead className="text-right text-xs font-semibold text-slate-600 py-3">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingRows n={4} cols={3} />
                ) : sortedCategories.length === 0 ? (
                  <EmptyRow colSpan={3} label="Nenhuma categoria cadastrada." />
                ) : (
                  sortedCategories.map((c) => (
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
                  <SortHeader
                    label="Nome"
                    active={subSortKey === 'name'}
                    dir={subSortDir}
                    onClick={() => toggleSubSort('name')}
                  />
                  <SortHeader
                    label="Categoria"
                    active={subSortKey === 'category'}
                    dir={subSortDir}
                    onClick={() => toggleSubSort('category')}
                  />
                  <SortHeader
                    label="Situação"
                    active={subSortKey === 'status'}
                    dir={subSortDir}
                    onClick={() => toggleSubSort('status')}
                  />
                  <TableHead className="text-right text-xs font-semibold text-slate-600 py-3">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <LoadingRows n={4} cols={4} />
                ) : sortedSubcategories.length === 0 ? (
                  <EmptyRow colSpan={4} label="Nenhuma subcategoria cadastrada." />
                ) : (
                  sortedSubcategories.map((sc) => (
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
  const [form, setForm] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    smtp_host: '',
    smtp_port: '' as number | '',
    smtp_sender_email: '',
    smtp_password: '',
  })
  const [showSmtp, setShowSmtp] = useState(false)

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
    setForm({
      name: '',
      cnpj: '',
      phone: '',
      email: '',
      smtp_host: '',
      smtp_port: '',
      smtp_sender_email: '',
      smtp_password: '',
    })
    setShowSmtp(false)
    setSelectedSectors(allSectors.map((s) => s.name))
    setSelectedCategories(allCategories.map((c) => c.name))
    setSelectedSubcategories(allSubcategories.map((sc) => sc.name))
    setOpen(true)
  }
  const openEdit = (c: Company) => {
    setEditing(c)
    setForm({
      name: c.name,
      cnpj: c.cnpj || '',
      phone: c.phone || '',
      email: c.email || '',
      smtp_host: c.smtp_host || '',
      smtp_port: c.smtp_port ?? '',
      smtp_sender_email: c.smtp_sender_email || '',
      smtp_password: c.smtp_password || '',
    })
    setShowSmtp(false)
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
    setSelectedCategories((prev) => {
      if (prev.includes(name)) {
        // Ao desmarcar a categoria, remove automaticamente as subcategorias vinculadas a ela
        const cat = allCategories.find((c) => c.name === name)
        const subNamesToRemove = cat
          ? allSubcategories.filter((sc) => sc.category_id === cat.id).map((sc) => sc.name)
          : []
        if (subNamesToRemove.length > 0) {
          setSelectedSubcategories((prevSub) =>
            prevSub.filter((s) => !subNamesToRemove.includes(s)),
          )
        }
        return prev.filter((c) => c !== name)
      }
      return [...prev, name]
    })
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
      const payload = {
        name: form.name.trim(),
        cnpj: form.cnpj.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        smtp_host: form.smtp_host.trim(),
        smtp_port: form.smtp_port === '' ? undefined : Number(form.smtp_port),
        smtp_sender_email: form.smtp_sender_email.trim(),
        smtp_password: form.smtp_password,
      }
      if (editing) await companiesService.update(editing.id, payload)
      else await companiesService.create(payload)
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
                {/* Exibe apenas subcategorias das categorias selecionadas e concatena CATEGORIA - SUBCATEGORIA */}
                {allSubcategories
                  .filter((sc) => {
                    const cat = allCategories.find((c) => c.id === sc.category_id)
                    return cat ? selectedCategories.includes(cat.name) : true
                  })
                  .map((sc) => {
                    const selected = selectedSubcategories.includes(sc.name)
                    const catName = allCategories.find((c) => c.id === sc.category_id)?.name || ''
                    const label = catName ? `${catName} - ${sc.name}` : sc.name
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
                        {label}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Configuração de E-mail (SMTP) */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSmtp((s) => !s)}
                className="flex w-full items-center gap-2 text-xs font-bold text-[#0c2340] hover:text-[#0062a8] transition-colors"
              >
                <Mail className="h-4 w-4 text-[#0062a8]" />
                Configuração de E-mail (SMTP)
                <ChevronDown
                  className={cn('h-4 w-4 ml-auto transition-transform', showSmtp && 'rotate-180')}
                />
              </button>
              {showSmtp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Servidor SMTP</Label>
                    <Input
                      value={form.smtp_host}
                      onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                      placeholder="Ex: smtp.empresa.com.br"
                      className="h-10 text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Porta SMTP</Label>
                    <Input
                      type="number"
                      value={form.smtp_port}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          smtp_port: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="Ex: 587"
                      className="h-10 text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Email Remetente</Label>
                    <Input
                      type="email"
                      value={form.smtp_sender_email}
                      onChange={(e) => setForm({ ...form, smtp_sender_email: e.target.value })}
                      placeholder="noreply@empresa.com.br"
                      className="h-10 text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Senha SMTP</Label>
                    <Input
                      type="password"
                      value={form.smtp_password}
                      onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                      placeholder="••••••••"
                      className="h-10 text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                </div>
              )}
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
  const [level, setLevel] = useState<number | ''>(0)
  const [color, setColor] = useState('#64748b')
  const [sla, setSla] = useState<number | ''>('')
  const [active, setActive] = useState(true)
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
    setLevel(0)
    setColor('#64748b')
    setSla('')
    setActive(true)
    setOpen(true)
  }
  const openEdit = (p: Priority) => {
    setEditing(p)
    setName(p.name)
    setLevel(p.level ?? 0)
    setColor(p.color || '#64748b')
    setSla(p.sla_hours ?? '')
    setActive(p.active !== false)
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        level: typeof level === 'number' ? level : 0,
        color,
        sla_hours: typeof sla === 'number' ? sla : undefined,
        active,
      }
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
                Prioridade
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Nível / Ordem
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Cor
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                SLA (h)
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
              <LoadingRows n={3} cols={6} />
            ) : items.length === 0 ? (
              <EmptyRow colSpan={6} label="Nenhuma prioridade cadastrada." />
            ) : (
              items.map((p) => (
                <TableRow
                  key={p.id}
                  className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0"
                >
                  <TableCell className="py-4 px-6">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: p.color || '#64748b' }}
                    >
                      {p.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">{p.level ?? 0}</TableCell>
                  <TableCell className="py-4 px-6">
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-slate-200"
                      style={{ backgroundColor: p.color || '#64748b' }}
                      title={p.color || '#64748b'}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {p.sla_hours ? `${p.sla_hours}h` : '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {p.active !== false ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                        Inativo
                      </span>
                    )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label className="text-xs font-semibold text-slate-700">Nível / Ordem</Label>
                <Input
                  type="number"
                  value={level}
                  onChange={(e) => setLevel(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 1"
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 p-1 rounded-xl"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 text-xs sm:text-sm rounded-xl flex-1 font-mono"
                  />
                </div>
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
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={active} onCheckedChange={setActive} id="prio-active" />
              <Label htmlFor="prio-active" className="text-xs font-semibold text-slate-700">
                Prioridade ativa
              </Label>
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
  const [companies, setCompanies] = useState<Company[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [rolesList, setRolesList] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<'user' | 'admin'>('user')
  const [formRoleProfile, setFormRoleProfile] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formSector, setFormSector] = useState('')
  const [formSituacao, setFormSituacao] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const [u, comp, sec, r] = await Promise.all([
        usersService.getAll(),
        companiesService.getAll(),
        sectorsService.getAll(),
        rolesService.getAll(),
      ])
      setUsers(u)
      setCompanies(comp)
      setSectors(sec)
      setRolesList(r)
    } catch {
      toast.error('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const openEdit = (u: User) => {
    setEditingUser(u)
    setFormName(u.name || '')
    setFormEmail(u.email || '')
    setFormRole(u.role || 'user')
    setFormRoleProfile(u.role_profile || '')
    setFormCompany(u.company || '')
    setFormSector(u.sector || '')
    setFormSituacao(u.situacao !== false)
    setEditOpen(true)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true)
    try {
      const profileChanges: { name?: string; email?: string; situacao?: boolean } = {}
      if (formName.trim() !== (editingUser.name || '')) profileChanges.name = formName.trim()
      if (formEmail.trim() !== (editingUser.email || '')) profileChanges.email = formEmail.trim()
      if (formSituacao !== (editingUser.situacao !== false)) profileChanges.situacao = formSituacao
      if (Object.keys(profileChanges).length > 0) {
        await usersService.updateProfile(editingUser.id, profileChanges)
      }
      if (formRole !== editingUser.role) {
        await usersService.updateRole(editingUser.id, formRole)
      }
      if (formRoleProfile !== (editingUser.role_profile || '')) {
        await usersService.updateRoleProfile(editingUser.id, formRoleProfile)
      }
      if (formCompany !== (editingUser.company || '')) {
        await usersService.updateCompany(editingUser.id, formCompany)
      }
      if (formSector !== (editingUser.sector || '')) {
        await usersService.updateSector(editingUser.id, formSector)
      }
      toast.success('Usuário atualizado!')
      setEditOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar usuário.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#0c2340]">Usuários do sistema</h2>
        <p className="text-xs text-slate-500">Gestão de usuários, perfis e permissões.</p>
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
                Empresa
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Setor
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 py-3.5 px-6">
                Perfil Acesso
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
              <LoadingRows n={4} cols={7} />
            ) : users.length === 0 ? (
              <EmptyRow colSpan={7} label="Nenhum usuário cadastrado." />
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
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-[#0062a8] font-semibold">(Você)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono py-4 px-6">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      {u.expand?.company?.name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 py-4 px-6">
                    {u.expand?.sector?.name || '—'}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {u.expand?.role_profile?.name ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Shield className="h-3 w-3" />
                        {u.expand.role_profile.name}
                      </span>
                    ) : u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-sky-100 text-[#0062a8]">
                        <Shield className="h-3 w-3" />
                        Acesso Total (Admin)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        <UserIcon className="h-3 w-3" />
                        Usuário Padrão
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {u.situacao !== false ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edição de usuário */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do usuário"
                required
                disabled={saving}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">E-mail *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@empresa.com"
                required
                disabled={saving}
                className="h-10 text-xs sm:text-sm rounded-xl"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={formSituacao}
                onCheckedChange={setFormSituacao}
                id="user-situacao"
                disabled={saving}
              />
              <Label htmlFor="user-situacao" className="text-xs font-semibold text-slate-700">
                Situação: {formSituacao ? 'Ativo' : 'Inativo'}
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nível do Sistema (Role)
              </Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as 'user' | 'admin')}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (admin)</SelectItem>
                  <SelectItem value="user">Usuário comum (user)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Perfil de Acesso Personalizado
              </Label>
              <Select
                value={formRoleProfile || '__none'}
                onValueChange={(v) => setFormRoleProfile(v === '__none' ? '' : v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione o perfil de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhum / Padrão —</SelectItem>
                  {rolesList.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Empresa</Label>
              <Select
                value={formCompany || '__none'}
                onValueChange={(v) => setFormCompany(v === '__none' ? '' : v)}
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Setor</Label>
              <Select
                value={formSector || '__none'}
                onValueChange={(v) => setFormSector(v === '__none' ? '' : v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Sem setor —</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
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
