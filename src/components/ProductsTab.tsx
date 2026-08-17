import { useState, useEffect, useMemo } from 'react'
import { Package, Plus, Pencil, Trash2, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react'
import {
  productsService,
  productCategoriesService,
  productSubcategoriesService,
  manufacturersService,
  suppliersService,
} from '@/services/api'
import type { Product, ProductCategory, ProductSubcategory, Manufacturer, Supplier } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
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

type SortField = 'name' | 'category' | 'manufacturer' | 'supplier' | 'sale_price'
type SortDir = 'asc' | 'desc'

interface FormState {
  name: string
  category: string
  subcategory: string
  manufacturer: string
  supplier: string
  sale_price: string
  barcode: string
  is_it_asset: boolean
  is_patrimony: boolean
  is_serial: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  subcategory: '',
  manufacturer: '',
  supplier: '',
  sale_price: '',
  barcode: '',
  is_it_asset: false,
  is_patrimony: false,
  is_serial: false,
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Ordenação
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Modal
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, cats, subs, mans, sups] = await Promise.all([
        productsService.getAll(),
        productCategoriesService.getAll(),
        productSubcategoriesService.getAll(),
        manufacturersService.getAll(),
        suppliersService.getAll(),
      ])
      setProducts(prods)
      setCategories(cats)
      setSubcategories(subs)
      setManufacturers(mans)
      setSuppliers(sups)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Subcategorias filtradas pela categoria selecionada
  const filteredSubcategories = useMemo(
    () => (form.category ? subcategories.filter((s) => s.category === form.category) : []),
    [form.category, subcategories],
  )

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.expand?.category?.name || '').toLowerCase().includes(q) ||
        (p.expand?.manufacturer?.name || '').toLowerCase().includes(q)
      )
    })

    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'category':
          cmp = (a.expand?.category?.name || '').localeCompare(b.expand?.category?.name || '')
          break
        case 'manufacturer':
          cmp = (a.expand?.manufacturer?.name || '').localeCompare(
            b.expand?.manufacturer?.name || '',
          )
          break
        case 'supplier':
          cmp = (a.expand?.supplier?.name || '').localeCompare(b.expand?.supplier?.name || '')
          break
        case 'sale_price':
          cmp = (a.sale_price || 0) - (b.sale_price || 0)
          break
      }
      return cmp * dir
    })
  }, [products, search, sortField, sortDir])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const handleOpenEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      category: p.category || '',
      subcategory: p.subcategory || '',
      manufacturer: p.manufacturer || '',
      supplier: p.supplier || '',
      sale_price: p.sale_price != null ? String(p.sale_price) : '',
      barcode: p.barcode || '',
      is_it_asset: !!p.is_it_asset,
      is_patrimony: !!p.is_patrimony,
      is_serial: !!p.is_serial,
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('O nome do produto é obrigatório.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category || undefined,
        subcategory: form.subcategory || undefined,
        manufacturer: form.manufacturer || undefined,
        supplier: form.supplier || undefined,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
        barcode: form.barcode.trim() || undefined,
        is_it_asset: form.is_it_asset,
        is_patrimony: form.is_patrimony,
        is_serial: form.is_serial,
      }
      if (editing) {
        await productsService.update(editing.id, payload)
        toast.success('Produto atualizado com sucesso!')
      } else {
        await productsService.create(payload)
        toast.success('Produto cadastrado com sucesso!')
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${p.name}"?`)) return
    try {
      await productsService.remove(p.id)
      toast.success('Produto excluído com sucesso.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir produto.')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUp className="h-3 w-3 text-slate-300 inline ml-1" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-600 inline ml-1" />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar produto por nome, categoria ou fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shrink-0"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : sortedProducts.length === 0 ? (
        <Card className="p-10 text-center border-dashed bg-slate-50/50">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Cadastre o primeiro produto.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('name')}
                  >
                    Nome <SortIcon field="name" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('category')}
                  >
                    Categoria <SortIcon field="category" />
                  </th>
                  <th className="py-3 px-4">Subcategoria</th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('manufacturer')}
                  >
                    Fabricante <SortIcon field="manufacturer" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('supplier')}
                  >
                    Fornecedor <SortIcon field="supplier" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('sale_price')}
                  >
                    Valor Unit. <SortIcon field="sale_price" />
                  </th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                        {p.name}
                      </p>
                      {p.unit && (
                        <span className="text-[11px] text-slate-400">Unidade: {p.unit}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.expand?.category?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.expand?.subcategory?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.expand?.manufacturer?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.expand?.supplier?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold whitespace-nowrap">
                      {p.sale_price != null
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.sale_price)
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.is_it_asset && (
                          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
                            Ativo de TI
                          </Badge>
                        )}
                        {p.is_patrimony && (
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                            Patrimônio
                          </Badge>
                        )}
                        {p.situacao === false && (
                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px]">
                            Inativo
                          </Badge>
                        )}
                        {!p.is_it_asset && !p.is_patrimony && p.situacao !== false && (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Package className="h-5 w-5 text-indigo-600" />
              {editing ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome do Produto *</label>
              <Input
                placeholder="Ex: Notebook Dell Latitude 5420"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Categoria</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v, subcategory: '' })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subcategoria</label>
                <Select
                  value={form.subcategory}
                  onValueChange={(v) => setForm({ ...form, subcategory: v })}
                  disabled={!form.category}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fabricante</label>
                <Select
                  value={form.manufacturer}
                  onValueChange={(v) => setForm({ ...form, manufacturer: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fornecedor</label>
                <Select
                  value={form.supplier}
                  onValueChange={(v) => setForm({ ...form, supplier: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Valor Unitário (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Código de Barras (opcional)</label>
              <Input
                placeholder="Ex: 7891234567890"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="h-9 font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-semibold text-slate-700">Ativo de TI</span>
                <Switch
                  checked={form.is_it_asset}
                  onCheckedChange={(v) => setForm({ ...form, is_it_asset: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-semibold text-slate-700">Patrimônio</span>
                <Switch
                  checked={form.is_patrimony}
                  onCheckedChange={(v) => setForm({ ...form, is_patrimony: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-semibold text-slate-700">Controla Serial</span>
                <Switch
                  checked={form.is_serial}
                  onCheckedChange={(v) => setForm({ ...form, is_serial: v })}
                />
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Produto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductsTab
