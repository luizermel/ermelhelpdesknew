import { useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  MapPin,
  Package,
  Loader2,
  Calendar,
  User,
} from 'lucide-react'
import {
  inventoryItemsService,
  inventoryLocationsService,
  inventoryMovementsService,
} from '@/services/api'
import { InventoryItem, InventoryLocation, InventoryMovement, InventoryMovementType } from '@/types'
import { useAuth } from '@/hooks/use-auth'
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

const MOV_BADGES: Record<InventoryMovementType, { bg: string; text: string; icon: any }> = {
  Entrada: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'Entrada',
    icon: ArrowDownRight,
  },
  Saída: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Saída', icon: ArrowUpRight },
  Transferência: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    text: 'Transferência',
    icon: RefreshCw,
  },
}

export default function InventoryMovementsPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'Transferência' as InventoryMovementType,
    item: '',
    from_location: '',
    to_location: '',
    quantity: 1,
    notes: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [movData, itData, locData] = await Promise.all([
        inventoryMovementsService.getAll(),
        inventoryItemsService.getAll(),
        inventoryLocationsService.getAll(),
      ])
      setMovements(movData)
      setItems(itData)
      setLocations(locData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar movimentações de estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = (initialType: InventoryMovementType = 'Transferência') => {
    const firstItem = items[0]
    setForm({
      type: initialType,
      item: firstItem?.id || '',
      from_location: firstItem?.location || locations[0]?.id || '',
      to_location: locations[1]?.id || locations[0]?.id || '',
      quantity: 1,
      notes: '',
    })
    setDialogOpen(true)
  }

  const handleItemChange = (itemId: string) => {
    const selectedItem = items.find((i) => i.id === itemId)
    setForm((prev) => ({
      ...prev,
      item: itemId,
      from_location: selectedItem?.location || prev.from_location,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item) {
      toast.error('Selecione um item.')
      return
    }

    if (form.type === 'Transferência' && form.from_location === form.to_location) {
      toast.error('A localização de origem e destino devem ser diferentes.')
      return
    }

    if (form.quantity <= 0) {
      toast.error('A quantidade deve ser maior que zero.')
      return
    }

    const targetItem = items.find((i) => i.id === form.item)
    if (targetItem && (form.type === 'Saída' || form.type === 'Transferência')) {
      if (
        (targetItem.item_type || 'Consumível') === 'Consumível' &&
        targetItem.quantity < form.quantity
      ) {
        toast.error(
          `Estoque insuficiente! Saldo atual: ${targetItem.quantity} ${targetItem.unit || 'un'}`,
        )
        return
      }
    }

    setSaving(true)
    try {
      // 1. Create movement record
      await inventoryMovementsService.create({
        item: form.item,
        from_location: form.type === 'Entrada' ? undefined : form.from_location,
        to_location: form.type === 'Saída' ? undefined : form.to_location,
        quantity: form.quantity,
        type: form.type,
        notes: form.notes,
        created_by: user?.id,
      })

      // 2. Adjust target item stock & location
      if (targetItem) {
        let newQty = targetItem.quantity || 0
        if (form.type === 'Entrada') newQty += form.quantity
        if (form.type === 'Saída') newQty = Math.max(0, newQty - form.quantity)
        if (
          form.type === 'Transferência' &&
          (targetItem.item_type || 'Consumível') === 'Consumível'
        ) {
          // Keep total stock count, update location
        }

        const updatePayload: Partial<InventoryItem> = {
          quantity: newQty,
        }

        if (form.type === 'Entrada' || form.type === 'Transferência') {
          if (form.to_location) updatePayload.location = form.to_location
        }

        await inventoryItemsService.update(targetItem.id, updatePayload)
      }

      toast.success('Movimentação realizada com sucesso!')
      setDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao registrar movimentação.')
    } finally {
      setSaving(false)
    }
  }

  const filteredMovements = movements.filter((m) => {
    const itemName = m.expand?.item?.name || ''
    const notes = m.notes || ''
    const user = m.expand?.created_by?.name || ''
    return (
      itemName.toLowerCase().includes(search.toLowerCase()) ||
      notes.toLowerCase().includes(search.toLowerCase()) ||
      user.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
            Movimentações e Transferências
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historico de entradas, saídas e transferências de itens entre depósitos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleOpenCreate('Transferência')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            Mover / Transferir
          </Button>
          <Button
            onClick={() => handleOpenCreate('Entrada')}
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold gap-1.5"
          >
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            Entrada
          </Button>
          <Button
            onClick={() => handleOpenCreate('Saída')}
            variant="outline"
            className="border-red-200 bg-red-50 text-red-800 hover:bg-red-100 font-semibold gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4 text-red-600" />
            Saída
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por item, notas ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredMovements.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <ArrowRightLeft className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhuma movimentação encontrada</p>
          <p className="text-xs text-slate-400 mt-1">
            Realize uma transferência de depósito ou ajuste de estoque.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMovements.map((mov) => {
            const badge = MOV_BADGES[mov.type] || MOV_BADGES.Transferência
            const Icon = badge.icon
            const itemName = mov.expand?.item?.name || 'Item do estoque'
            const fromLoc = mov.expand?.from_location?.name || 'Sem origem'
            const toLoc = mov.expand?.to_location?.name || 'Sem destino'
            const userName = mov.expand?.created_by?.name || 'Sistema'
            const formattedDate = new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(mov.created))

            return (
              <Card
                key={mov.id}
                className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${badge.bg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`font-semibold ${badge.bg}`}>
                          {badge.text}
                        </Badge>
                        <span className="font-bold text-slate-900 text-sm">{itemName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-slate-600">
                        {mov.type === 'Transferência' && (
                          <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            <MapPin className="h-3 w-3 text-indigo-500" />
                            {fromLoc} <span className="text-slate-400">→</span> {toLoc}
                          </span>
                        )}
                        {mov.type === 'Entrada' && (
                          <span className="flex items-center gap-1 font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                            <MapPin className="h-3 w-3 text-emerald-600" /> Destino: {toLoc}
                          </span>
                        )}
                        {mov.type === 'Saída' && (
                          <span className="flex items-center gap-1 font-medium bg-red-50 text-red-800 px-2 py-0.5 rounded">
                            <MapPin className="h-3 w-3 text-red-600" /> Origem: {fromLoc}
                          </span>
                        )}

                        <span className="font-bold text-slate-900">
                          Qtd: {mov.quantity} {mov.expand?.item?.unit || 'un'}
                        </span>
                      </div>

                      {mov.notes && (
                        <p className="text-slate-500 italic mt-1.5 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                          "{mov.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" /> {userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" /> {formattedDate}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Nova Movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Registrar Movimentação de Estoque
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tipo de Movimento</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as InventoryMovementType })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transferência">Transferência entre depósitos</SelectItem>
                  <SelectItem value="Entrada">Entrada de estoque</SelectItem>
                  <SelectItem value="Saída">Saída / Baixa de estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Item do Estoque *</label>
              <Select value={form.item} onValueChange={handleItemChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name} (Saldo: {it.quantity} {it.unit || 'un'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.type !== 'Entrada' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Localização de Origem</label>
                <Select
                  value={form.from_location}
                  onValueChange={(v) => setForm({ ...form, from_location: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Origem" />
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
            )}

            {form.type !== 'Saída' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Localização de Destino</label>
                <Select
                  value={form.to_location}
                  onValueChange={(v) => setForm({ ...form, to_location: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Destino" />
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
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Quantidade</label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Motivo / Notas</label>
              <Textarea
                placeholder="Ex: Transferência para obra externa, reposição de almoxarifado..."
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                    Confirmando...
                  </>
                ) : (
                  'Confirmar Movimentação'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
