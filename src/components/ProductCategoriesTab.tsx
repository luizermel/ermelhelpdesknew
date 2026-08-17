import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, ArrowUp, ArrowDown, Tag } from 'lucide-react'
import { productCategoriesService, productSubcategoriesService } from '@/services/api'
import type { ProductCategory, ProductSubcategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
import { toast } from 'sonner'

type SortField = 'name' | 'category'
type SortDir = 'asc' | 'desc'

/**
 * Aba unificada de Categorias e Subcategorias de Produtos.
 * Renderiza duas seções (Categorias acima, Subcategorias abaixo) seguindo o
 * padrão de tabela com CRUD, ordenação por clique no cabeçalho e A-Z.
 */
export function ProductCategoriesTab() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([])
  const [loading, setLoading] = useState(true)

  const [searchCat, setSearchCat] = useState('')
  const [searchSub, setSearchSub] = useState('')

  const [sortCat, setSortCat] = useState<{ field: 'name'; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  })
  const [sortSub, setSortSub] = useState<{ field: SortField; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  })

  // Modais
  const [catDialog, setCatDialog] = useState(false)
  const [subDialog, setSubDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingCat, setEditingCat] = useState<ProductCategory | null>(null)
  const [editingSub, setEditingSub] = useState<ProductSubcategory | null>(null)
  const [catName, setCatName] = useState('')
  const [subName, setSubName] = useState('')
  const [subCategory, setSubCategory] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, subs] = await Promise.all([
        productCategoriesService.getAll(),
        productSubcategoriesService.getAll(),
      ])
      setCategories(cats)
      setSubcategories(subs)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar categorias de produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const sortedCategories = useMemo(() => {
    const filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(searchCat.toLowerCase()),
    )
    const dir = sortCat.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name) * dir)
  }, [categories, searchCat, sortCat])

  const sortedSubcategories = useMemo(() => {
    const filtered = subcategories.filter((s) => {
      if (!searchSub) return true
      const q = searchSub.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        (s.expand?.category?.name || '').toLowerCase().includes(q)
      )
    })
    const dir = sortSub.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const cmp =
        sortSub.field === 'name'
          ? a.name.localeCompare(b.name)
          : (a.expand?.category?.name || '').localeCompare(b.expand?.category?.name || '')
      return cmp * dir
    })
  }, [subcategories, searchSub, sortSub])

  // Handlers Categoria
  const openCreateCat = () => {
    setEditingCat(null)
    setCatName('')
    setCatDialog(true)
  }
  const openEditCat = (c: ProductCategory) => {
    setEditingCat(c)
    setCatName(c.name)
    setCatDialog(true)
  }
  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return toast.error('O nome é obrigatório.')
    setSaving(true)
    try {
      if (editingCat) {
        await productCategoriesService.update(editingCat.id, { name: catName.trim() })
        toast.success('Categoria atualizada!')
      } else {
        await productCategoriesService.create({ name: catName.trim() })
        toast.success('Categoria criada!')
      }
      setCatDialog(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar categoria.')
    } finally {
      setSaving(false)
    }
  }
  const deleteCat = async (c: ProductCategory) => {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return
    try {
      await productCategoriesService.remove(c.id)
      toast.success('Categoria excluída.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir categoria.')
    }
  }

  // Handlers Subcategoria
  const openCreateSub = () => {
    setEditingSub(null)
    setSubName('')
    setSubCategory(categories[0]?.id || '')
    setSubDialog(true)
  }
  const openEditSub = (s: ProductSubcategory) => {
    setEditingSub(s)
    setSubName(s.name)
    setSubCategory(s.category || '')
    setSubDialog(true)
  }
  const saveSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subName.trim()) return toast.error('O nome é obrigatório.')
    setSaving(true)
    try {
      const payload = { name: subName.trim(), category: subCategory || undefined }
      if (editingSub) {
        await productSubcategoriesService.update(editingSub.id, payload)
        toast.success('Subcategoria atualizada!')
      } else {
        await productSubcategoriesService.create(payload)
        toast.success('Subcategoria criada!')
      }
      setSubDialog(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar subcategoria.')
    } finally {
      setSaving(false)
    }
  }
  const deleteSub = async (s: ProductSubcategory) => {
    if (!confirm(`Excluir a subcategoria "${s.name}"?`)) return
    try {
      await productSubcategoriesService.remove(s.id)
      toast.success('Subcategoria excluída.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir subcategoria.')
    }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) =>
    !active ? (
      <ArrowUp className="h-3 w-3 text-slate-300 inline ml-1" />
    ) : dir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-600 inline ml-1" />
    )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* CATEGORIAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-600" /> Categorias de Produtos
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar categoria..."
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
            <Button
              onClick={openCreateCat}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                  onClick={() =>
                    setSortCat((s) => ({
                      field: 'name',
                      dir: s.field === 'name' && s.dir === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                >
                  Nome <SortIcon active={sortCat.field === 'name'} dir={sortCat.dir} />
                </th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-slate-400">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCat(c)}
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCat(c)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUBCATEGORIAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-600" /> Subcategorias de Produtos
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar subcategoria..."
                value={searchSub}
                onChange={(e) => setSearchSub(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
            <Button
              onClick={openCreateSub}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                  onClick={() =>
                    setSortSub((s) => ({
                      field: 'name',
                      dir: s.field === 'name' && s.dir === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                >
                  Nome <SortIcon active={sortSub.field === 'name'} dir={sortSub.dir} />
                </th>
                <th
                  className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                  onClick={() =>
                    setSortSub((s) => ({
                      field: 'category',
                      dir: s.field === 'category' && s.dir === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                >
                  Categoria <SortIcon active={sortSub.field === 'category'} dir={sortSub.dir} />
                </th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Nenhuma subcategoria cadastrada.
                  </td>
                </tr>
              ) : (
                sortedSubcategories.map((s) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.expand?.category?.name || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditSub(s)}
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSub(s)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Categoria */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? 'Editar Categoria' : 'Nova Categoria de Produto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCat} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome *</label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                className="h-9"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatDialog(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Subcategoria */}
      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingSub ? 'Editar Subcategoria' : 'Nova Subcategoria de Produto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSub} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome *</label>
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                required
                className="h-9"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Categoria vinculada</label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubDialog(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductCategoriesTab
