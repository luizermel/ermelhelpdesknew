import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  Cpu,
  Monitor,
  Laptop,
  Printer,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  inventoryItemsService,
  inventoryLocationsService,
  inventoryMovementsService,
  assetsService,
  sectorsService,
} from '@/services/api'
import type {
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
  InventoryMovementType,
  Asset,
  Sector,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MOV_COLORS: Record<InventoryMovementType, string> = {
  Entrada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Saída: 'bg-red-50 text-red-700 border-red-200',
  Transferência: 'bg-blue-50 text-blue-700 border-blue-200',
}

function fmt(s: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(s),
  )
}

export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const [it, loc, mov, ast, sec] = await Promise.all([
        inventoryItemsService.getAll(),
        inventoryLocationsService.getAll(),
        inventoryMovementsService.getAll(),
        assetsService.getAll(),
        sectorsService.getAll(),
      ])
      setItems(it)
      setLocations(loc)
      setMovements(mov)
      setAssets(ast)
      setSectors(sec)
    } catch {
      toast.error('Erro ao carregar estoque.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  // ---- Items dialog ----
  const [itemOpen, setItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
    min_quantity: 0,
    unit: 'un',
  })
  const [itemSaving, setItemSaving] = useState(false)

  const openItemCreate = () => {
    setEditingItem(null)
    setItemForm({
      name: '',
      description: '',
      category: '',
      quantity: 0,
      min_quantity: 0,
      unit: 'un',
    })
    setItemOpen(true)
  }
  const openItemEdit = (it: InventoryItem) => {
    setEditingItem(it)
    setItemForm({
      name: it.name,
      description: it.description || '',
      category: it.category || '',
      quantity: it.quantity,
      min_quantity: it.min_quantity,
      unit: it.unit || 'un',
    })
    setItemOpen(true)
  }

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name.trim()) return
    setItemSaving(true)
    try {
      if (editingItem) await inventoryItemsService.update(editingItem.id, itemForm)
      else await inventoryItemsService.create(itemForm)
      toast.success(editingItem ? 'Item atualizado!' : 'Item criado!')
      setItemOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar item.')
    } finally {
      setItemSaving(false)
    }
  }

  const removeItem = async (it: InventoryItem) => {
    if (!confirm(`Remover o item "${it.name}"?`)) return
    try {
      await inventoryItemsService.remove(it.id)
      toast.success('Item removido.')
      fetch()
    } catch {
      toast.error('Erro ao remover item.')
    }
  }

  // ---- Locations dialog ----
  const [locOpen, setLocOpen] = useState(false)
  const [editingLoc, setEditingLoc] = useState<InventoryLocation | null>(null)
  const [locForm, setLocForm] = useState({ name: '', description: '' })
  const [locSaving, setLocSaving] = useState(false)

  const openLocCreate = () => {
    setEditingLoc(null)
    setLocForm({ name: '', description: '' })
    setLocOpen(true)
  }
  const openLocEdit = (l: InventoryLocation) => {
    setEditingLoc(l)
    setLocForm({ name: l.name, description: l.description || '' })
    setLocOpen(true)
  }

  const saveLoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locForm.name.trim()) return
    setLocSaving(true)
    try {
      if (editingLoc) await inventoryLocationsService.update(editingLoc.id, locForm)
      else await inventoryLocationsService.create(locForm)
      toast.success(editingLoc ? 'Local atualizado!' : 'Local criado!')
      setLocOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao salvar local.')
    } finally {
      setLocSaving(false)
    }
  }

  const removeLoc = async (l: InventoryLocation) => {
    if (!confirm(`Remover o local "${l.name}"?`)) return
    try {
      await inventoryLocationsService.remove(l.id)
      toast.success('Local removido.')
      fetch()
    } catch {
      toast.error('Erro ao remover local.')
    }
  }

  // ---- Movement dialog ----
  const { user } = useAuth()
  const [movOpen, setMovOpen] = useState(false)
  const [movForm, setMovForm] = useState({
    item: '',
    from_location: '',
    to_location: '',
    quantity: 1,
    type: 'Entrada' as InventoryMovementType,
    notes: '',
  })
  const [movSaving, setMovSaving] = useState(false)

  const openMovCreate = () => {
    setMovForm({
      item: items[0]?.id || '',
      from_location: '',
      to_location: '',
      quantity: 1,
      type: 'Entrada',
      notes: '',
    })
    setMovOpen(true)
  }

  const saveMov = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movForm.item) {
      toast.error('Selecione um item.')
      return
    }
    setMovSaving(true)
    try {
      await inventoryMovementsService.create({
        item: movForm.item,
        from_location: movForm.from_location || undefined,
        to_location: movForm.to_location || undefined,
        quantity: movForm.quantity,
        type: movForm.type,
        notes: movForm.notes,
        created_by: user?.id,
      })
      // ajusta saldo do item
      const item = items.find((i) => i.id === movForm.item)
      if (item) {
        let delta = 0
        if (movForm.type === 'Entrada') delta = movForm.quantity
        else if (movForm.type === 'Saída') delta = -movForm.quantity
        if (delta !== 0) {
          await inventoryItemsService.update(item.id, {
            quantity: Math.max(0, item.quantity + delta),
          })
        }
      }
      toast.success('Movimentação registrada!')
      setMovOpen(false)
      fetch()
    } catch {
      toast.error('Erro ao registrar movimentação.')
    } finally {
      setMovSaving(false)
    }
  }

  // low stock
  const lowStock = useMemo(
    () => items.filter((i) => i.min_quantity > 0 && i.quantity <= i.min_quantity),
    [items],
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-indigo-600">{items.length}</p>
            <p className="text-[11px] text-slate-600 font-medium">Itens</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-600">{locations.length}</p>
            <p className="text-[11px] text-slate-600 font-medium">Locais</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-600">{movements.length}</p>
            <p className="text-[11px] text-slate-600 font-medium">Movimentações</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{lowStock.length}</p>
            <p className="text-[11px] text-slate-600 font-medium">Estoque baixo</p>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Atenção:</strong> {lowStock.length} item(ns) com estoque abaixo do mínimo:{' '}
            {lowStock.map((i) => i.name).join(', ')}.
          </span>
        </div>
      )}

      {/* Items */}
      <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">Itens de Estoque</CardTitle>
          <Button
            size="sm"
            onClick={openItemCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">Nenhum item cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Item</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">
                      Categoria
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Qtd</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Mínimo</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Unidade</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} className="hover:bg-slate-50/80">
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {it.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{it.category || '—'}</TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={cn(
                            'font-bold',
                            it.quantity <= it.min_quantity && it.min_quantity > 0
                              ? 'text-amber-600'
                              : 'text-slate-700',
                          )}
                        >
                          {it.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{it.min_quantity}</TableCell>
                      <TableCell className="text-xs text-slate-500">{it.unit || 'un'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => openItemEdit(it)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(it)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locations */}
        <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Locais de Estoque</CardTitle>
            <Button size="sm" variant="outline" onClick={openLocCreate} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {locations.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhum local cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-600">Nome</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-600">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((l) => (
                      <TableRow key={l.id} className="hover:bg-slate-50/80">
                        <TableCell className="text-xs font-semibold text-slate-900">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {l.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => openLocEdit(l)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeLoc(l)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movements */}
        <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">Movimentações</CardTitle>
            <Button
              size="sm"
              onClick={openMovCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Registrar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {movements.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[360px]">
                <Table>
                  <TableHeader className="bg-slate-50/70 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-600">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Item</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Qtd</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/80">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', MOV_COLORS[m.type])}
                          >
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {m.expand?.item?.name || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">
                          {m.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">{fmt(m.created)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assets overview (saldo por ativos) */}
      <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">Ativos de TI</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">Nenhum ativo cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-600">Ativo</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Tipo</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Setor</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Detalhes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id} className="hover:bg-slate-50/80">
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {a.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{a.type}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {a.expand?.sector?.name ||
                          sectors.find((s) => s.id === a.sector)?.name ||
                          '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                        >
                          <Link to={`/ativo/${a.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item dialog */}
      <Dialog open={itemOpen} onOpenChange={(o) => !o && setItemOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveItem} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descrição</Label>
              <Textarea
                rows={2}
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Categoria</Label>
                <Input
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Unidade</Label>
                <Input
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  placeholder="un, cx, kg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Quantidade</Label>
                <Input
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Qtd. mínima</Label>
                <Input
                  type="number"
                  value={itemForm.min_quantity}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, min_quantity: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemOpen(false)}
                disabled={itemSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={itemSaving}
              >
                {itemSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Location dialog */}
      <Dialog open={locOpen} onOpenChange={(o) => !o && setLocOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingLoc ? 'Editar Local' : 'Novo Local'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveLoc} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nome *</Label>
              <Input
                value={locForm.name}
                onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Descrição</Label>
              <Textarea
                rows={2}
                value={locForm.description}
                onChange={(e) => setLocForm({ ...locForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocOpen(false)}
                disabled={locSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={locSaving}
              >
                {locSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement dialog */}
      <Dialog open={movOpen} onOpenChange={(o) => !o && setMovOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Registrar Movimentação
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Entradas e saídas ajustam automaticamente o saldo do item
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMov} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Tipo *</Label>
              <Select
                value={movForm.type}
                onValueChange={(v) => setMovForm({ ...movForm, type: v as InventoryMovementType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saída">Saída</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Item *</Label>
              <Select
                value={movForm.item}
                onValueChange={(v) => setMovForm({ ...movForm, item: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Local de origem</Label>
                <Select
                  value={movForm.from_location}
                  onValueChange={(v) =>
                    setMovForm({ ...movForm, from_location: v === '__none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Local de destino</Label>
                <Select
                  value={movForm.to_location}
                  onValueChange={(v) =>
                    setMovForm({ ...movForm, to_location: v === '__none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Quantidade *</Label>
              <Input
                type="number"
                min={1}
                value={movForm.quantity}
                onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Observações</Label>
              <Textarea
                rows={2}
                value={movForm.notes}
                onChange={(e) => setMovForm({ ...movForm, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovOpen(false)}
                disabled={movSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={movSaving}
              >
                {movSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
