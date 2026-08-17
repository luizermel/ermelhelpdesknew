import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Search, MapPin, Loader2, Package, AlertCircle } from 'lucide-react'
import { inventoryItemsService, inventoryMovementsService } from '@/services/api'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import type { InventoryItem, InventoryMovement } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface BalanceRow {
  key: string
  productName: string
  locationName: string
  quantity: number
  unit: string
  avgPrice: number
  totalValue: number
  isAsset: boolean
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

const fmtQty = (n: number, unit: string) => `${n} ${unit || 'un'}`

export default function StockBalancePage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // View mode state (persisted) — padrão Lista
  const { viewMode, toggleViewMode } = useViewMode('stock-balance-view-mode')

  const loadData = async () => {
    setLoading(true)
    try {
      const [itData, mvData] = await Promise.all([
        inventoryItemsService.getAll(),
        inventoryMovementsService.getAll(),
      ])
      setItems(itData)
      setMovements(mvData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar saldo do estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Saldo por item = somatório de Entradas - Saídas (transferências não alteram
  // a quantidade do item, apenas a localização)
  const netByItem = useMemo(() => {
    const map = new Map<string, number>()
    for (const mv of movements) {
      if (!mv.item) continue
      const itemId = typeof mv.item === 'string' ? mv.item : (mv.item as InventoryItem).id
      const current = map.get(itemId) || 0
      if (mv.type === 'Entrada') {
        map.set(itemId, current + (mv.quantity || 0))
      } else if (mv.type === 'Saída') {
        map.set(itemId, current - (mv.quantity || 0))
      }
    }
    return map
  }, [movements])

  // Agrupa por produto + localização
  const balanceRows = useMemo<BalanceRow[]>(() => {
    const groupMap = new Map<string, BalanceRow>()
    for (const it of items) {
      const productName = it.expand?.product?.name || it.name
      const locationName = it.expand?.location?.name || 'Não definida'
      const locationId = it.location || ''
      const productId = it.product || ''
      const key = `p:${productId || it.name}|l:${locationId}`
      const isAsset = (it.item_type || 'Consumível') === 'Ativo'
      // Para ativos controlados por serial, cada registro = 1 unidade
      const netQty = isAsset ? 1 : (netByItem.get(it.id) ?? it.quantity ?? 0)
      const avgPrice = it.expand?.product?.avg_price ?? it.expand?.product?.cost_price ?? 0
      const unit = it.unit || it.expand?.product?.unit || 'un'

      const existing = groupMap.get(key)
      if (existing) {
        existing.quantity += netQty
        existing.totalValue += netQty * avgPrice
      } else {
        groupMap.set(key, {
          key,
          productName,
          locationName,
          quantity: netQty,
          unit,
          avgPrice,
          totalValue: netQty * avgPrice,
          isAsset,
        })
      }
    }
    return Array.from(groupMap.values()).sort(
      (a, b) =>
        a.productName.localeCompare(b.productName) || a.locationName.localeCompare(b.locationName),
    )
  }, [items, netByItem])

  const filteredRows = balanceRows.filter((row) =>
    row.productName.toLowerCase().includes(search.toLowerCase()),
  )

  const totalQuantity = filteredRows.reduce((sum, r) => sum + r.quantity, 0)
  const totalValue = filteredRows.reduce((sum, r) => sum + r.totalValue, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Saldo do Estoque
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão consolidada de quantidades e valores por produto e localização.
          </p>
        </div>
        <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Produtos no filtro
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{filteredRows.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quantidade total
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuantity}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200/80 shadow-2xs">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valor total em estoque
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{fmtBRL(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista / Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredRows.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum saldo encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Realize entradas de materiais para gerar saldos de estoque.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Preço Médio</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.key} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 line-clamp-1">{row.productName}</p>
                        {row.isAsset && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 font-medium text-[10px]"
                          >
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {row.locationName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">
                        {fmtQty(row.quantity, row.unit)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {row.avgPrice > 0 ? fmtBRL(row.avgPrice) : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <span className="font-bold text-indigo-600">{fmtBRL(row.totalValue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRows.map((row) => (
            <Card
              key={row.key}
              className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
            >
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {row.isAsset && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200 font-medium text-[10px]"
                    >
                      Ativo
                    </Badge>
                  )}
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                    {row.productName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 pb-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Localização:</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-800">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {row.locationName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Quantidade:</span>
                  <span className="font-bold text-slate-900">{fmtQty(row.quantity, row.unit)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Preço médio:</span>
                  <span className="text-slate-800">
                    {row.avgPrice > 0 ? fmtBRL(row.avgPrice) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">Valor total:</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {fmtBRL(row.totalValue)}
                  </span>
                </div>
                {row.quantity <= 0 && (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 pt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Saldo zerado
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
