import { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  Search,
  Building2,
  Tag,
  Hash,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import { inventoryItemsService, inventoryLocationsService } from '@/services/api'
import { InventoryItem, InventoryLocation } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'todos' | 'Ativo' | 'Consumível'>('todos')

  // View mode state (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    const saved = localStorage.getItem('inventory-items-view-mode')
    return saved === 'card' ? 'card' : 'list'
  })

  const toggleViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('inventory-items-view-mode', mode)
  }

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const [form, setForm] = useState({
    name: '',
    item_type: 'Consumível' as 'Ativo' | 'Consumível',
    serial_number: '',
    category: '',
    quantity: 1,
    min_quantity: 0,
    unit: 'un',
    location: '',
    status: 'Em estoque' as 'Em uso' | 'Em manutenção' | 'Em estoque' | 'Desativado',
    description: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [itData, locData] = await Promise.all([
        inventoryItemsService.getAll(),
        inventoryLocationsService.getAll(),
      ])
      setItems(itData)
      setLocations(locData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar itens do estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setForm({
      name: '',
      item_type: 'Consumível',
      serial_number: '',
      category: '',
      quantity: 1,
      min_quantity: 0,
      unit: 'un',
      location: locations[0]?.id || '',
      status: 'Em estoque',
      description: '',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (it: InventoryItem) => {
    setEditingItem(it)
    setForm({
      name: it.name || '',
      item_type: (it.item_type as 'Ativo' | 'Consumível') || 'Consumível',
      serial_number: it.serial_number || '',
      category: it.category || '',
      quantity: it.quantity ?? 1,
      min_quantity: it.min_quantity ?? 0,
      unit: it.unit || 'un',
      location: it.location || '',
      status:
        (it.status as 'Em uso' | 'Em manutenção' | 'Em estoque' | 'Desativado') || 'Em estoque',
      description: it.description || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('O nome do item é obrigatório.')
      return
    }

    if (form.item_type === 'Ativo' && !form.serial_number.trim()) {
      toast.error('Número de Série é obrigatório para Ativos.')
      return
    }

    setSaving(true)
    try {
      if (editingItem) {
        await inventoryItemsService.update(editingItem.id, form)
        toast.success('Item atualizado com sucesso!')
      } else {
        await inventoryItemsService.create(form)
        toast.success('Item cadastrado com sucesso!')
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar item.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (it: InventoryItem) => {
    if (!confirm(`Tem certeza que deseja excluir o item "${it.name}"?`)) return
    try {
      await inventoryItemsService.remove(it.id)
      toast.success('Item excluído com sucesso.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir item.')
    }
  }

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.serial_number && it.serial_number.toLowerCase().includes(search.toLowerCase())) ||
      (it.category && it.category.toLowerCase().includes(search.toLowerCase()))

    const matchesType = typeFilter === 'todos' || (it.item_type || 'Consumível') === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />
            Itens e Ativos do Estoque
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie itens consumíveis e ativos rastreáveis por número de série.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Novo Item / Ativo
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, número de série ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
              <span>Tipo:</span>
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-36 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos (Serial)</SelectItem>
                <SelectItem value="Consumível">Consumíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List / Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum item encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre um novo item ou ajuste seus filtros de busca.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View (Table) */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Serial</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((it) => {
                  const isAsset = (it.item_type || 'Consumível') === 'Ativo'
                  const isLowStock = !isAsset && it.quantity <= (it.min_quantity || 0)
                  const locName = it.expand?.location?.name || 'Não definida'

                  return (
                    <tr key={it.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {it.name}
                        </p>
                        {it.category && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {it.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            isAsset
                              ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium text-[10px]'
                              : 'bg-blue-50 text-blue-700 border-blue-200 font-medium text-[10px]'
                          }
                        >
                          {isAsset ? 'Ativo' : 'Consumível'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAsset ? (
                          <span className="font-mono font-bold text-slate-900">
                            {it.serial_number || 'Sem serial'}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {locName}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAsset ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              isLowStock ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {it.quantity} {it.unit || 'un'}
                            {isLowStock && (
                              <AlertCircle className="inline h-3 w-3 text-red-600 ml-1 shrink-0" />
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {it.status || 'Em estoque'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(it)}
                            className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(it)}
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((it) => {
            const isAsset = (it.item_type || 'Consumível') === 'Ativo'
            const isLowStock = !isAsset && it.quantity <= (it.min_quantity || 0)
            const locName = it.expand?.location?.name || 'Não definida'

            return (
              <Card
                key={it.id}
                className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isAsset
                            ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium text-[10px]'
                            : 'bg-blue-50 text-blue-700 border-blue-200 font-medium text-[10px]'
                        }
                      >
                        {isAsset ? 'Ativo (Serial)' : 'Consumível'}
                      </Badge>
                      {it.category && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {it.category}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                      {it.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(it)}
                      className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(it)}
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-4 space-y-3 flex-1 text-xs">
                  {isAsset ? (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Hash className="h-3.5 w-3.5 text-indigo-500" /> N° de Série:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {it.serial_number || 'Sem serial'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Tag className="h-3.5 w-3.5 text-indigo-500" /> Status:
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {it.status || 'Em estoque'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-slate-500">Quantidade em estoque:</span>
                        <span
                          className={`font-bold text-sm ${
                            isLowStock ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {it.quantity} {it.unit || 'un'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Mínimo recomendado:</span>
                        <span>
                          {it.min_quantity || 0} {it.unit || 'un'}
                        </span>
                      </div>
                      {isLowStock && (
                        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pt-1 border-t border-red-100">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          Estoque abaixo do mínimo!
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Depósito/Local: <strong className="text-slate-800">{locName}</strong>
                    </span>
                  </div>

                  {it.description && (
                    <p className="text-slate-500 text-[11px] line-clamp-2 italic pt-1 border-t border-slate-100">
                      "{it.description}"
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Package className="h-5 w-5 text-indigo-600" />
              {editingItem ? 'Editar Item do Estoque' : 'Novo Item / Ativo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipo de Cadastramento</label>
                <Select
                  value={form.item_type}
                  onValueChange={(v) =>
                    setForm({ ...form, item_type: v as 'Ativo' | 'Consumível' })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumível">Consumível (Quantidade)</SelectItem>
                    <SelectItem value="Ativo">Ativo (Número de Série)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Categoria</label>
                <Input
                  placeholder="Ex: Periféricos, Peças, Cabos"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome do Item / Modelo *</label>
              <Input
                placeholder="Ex: Teclado USB Dell KB216"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-9"
              />
            </div>

            {form.item_type === 'Ativo' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">N° de Série (Serial) *</label>
                  <Input
                    placeholder="Ex: SN-98127391"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    required
                    className="h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status do Ativo</label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        status: v as 'Em uso' | 'Em manutenção' | 'Em estoque' | 'Desativado',
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em estoque">Em estoque</SelectItem>
                      <SelectItem value="Em uso">Em uso</SelectItem>
                      <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                      <SelectItem value="Desativado">Desativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Quantidade Atual</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Estoque Mínimo</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.min_quantity}
                    onChange={(e) =>
                      setForm({ ...form, min_quantity: parseInt(e.target.value) || 0 })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unidade de Medida</label>
                  <Input
                    placeholder="un, cx, m, kg"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização / Depósito Padrao</label>
              <Select
                value={form.location}
                onValueChange={(v) => setForm({ ...form, location: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um depósito" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações / Detalhes</label>
              <Textarea
                placeholder="Informações adicionais, especificações técnicas..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none"
              />
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
                  'Salvar Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
