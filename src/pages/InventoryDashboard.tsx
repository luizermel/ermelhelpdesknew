import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  PackagePlus,
  BarChart3,
  ClipboardList,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  Loader2,
  Factory,
  Truck,
  Tag,
  Layers,
} from 'lucide-react'
import {
  inventoryItemsService,
  inventoryMovementsService,
  productsService,
  manufacturersService,
  suppliersService,
  productCategoriesService,
  brandsService,
} from '@/services/api'
import type { InventoryItem, InventoryMovement, Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

interface ShortItem {
  id: string
  name: string
  locationName: string
  quantity: number
  minQuantity: number
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [counts, setCounts] = useState<{
    manufacturers: number
    suppliers: number
    categories: number
    brands: number
  }>({ manufacturers: 0, suppliers: 0, categories: 0, brands: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itData, mvData, prodData, mans, sups, cats, brs] = await Promise.all([
        inventoryItemsService.getAll(),
        inventoryMovementsService.getAll(),
        productsService.getAll(),
        manufacturersService.getAll(),
        suppliersService.getAll(),
        productCategoriesService.getAll(),
        brandsService.getAll(),
      ])
      setItems(itData)
      setMovements(mvData)
      setProducts(prodData)
      setCounts({
        manufacturers: mans.length,
        suppliers: sups.length,
        categories: cats.length,
        brands: brs.length,
      })
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar o dashboard de estoque.')
    } finally {
      setLoading(false)
    }
  }

  // Saldo por item
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

  const totalUnits = useMemo(() => {
    let sum = 0
    for (const it of items) {
      const isAsset = (it.item_type || 'Consumível') === 'Ativo'
      sum += isAsset ? 1 : (netByItem.get(it.id) ?? it.quantity ?? 0)
    }
    return sum
  }, [items, netByItem])

  const totalValue = useMemo(() => {
    let sum = 0
    for (const it of items) {
      const isAsset = (it.item_type || 'Consumível') === 'Ativo'
      const qty = isAsset ? 1 : (netByItem.get(it.id) ?? it.quantity ?? 0)
      const price = it.expand?.product?.avg_price ?? it.expand?.product?.cost_price ?? 0
      sum += qty * price
    }
    return sum
  }, [items, netByItem])

  const shortItems = useMemo<ShortItem[]>(() => {
    const list: ShortItem[] = []
    for (const it of items) {
      const isAsset = (it.item_type || 'Consumível') === 'Ativo'
      if (isAsset) continue // ativos não têm estoque mínimo de quantidade
      const qty = netByItem.get(it.id) ?? it.quantity ?? 0
      const min = it.min_quantity ?? 0
      if (min > 0 && qty <= min) {
        list.push({
          id: it.id,
          name: it.expand?.product?.name || it.name,
          locationName: it.expand?.location?.name || '—',
          quantity: qty,
          minQuantity: min,
        })
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [items, netByItem])

  // Movimentações dos últimos 7 dias (entradas vs saídas)
  const weeklySeries = useMemo(() => {
    const days: { label: string; entradas: number; saidas: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entradas: 0,
        saidas: 0,
        _key: key,
      } as unknown as { label: string; entradas: number; saidas: number; _key: string })
    }
    const keyMap = new Map(days.map((d) => [(d as unknown as { _key: string })._key, d]))
    for (const mv of movements) {
      const key = (mv.created || '').slice(0, 10)
      const bucket = keyMap.get(key)
      if (!bucket) continue
      if (mv.type === 'Entrada') bucket.entradas += mv.quantity || 0
      else if (mv.type === 'Saída') bucket.saidas += mv.quantity || 0
    }
    return days.map(({ label, entradas, saidas }) => ({ label, entradas, saidas }))
  }, [movements])

  const maxBar = Math.max(1, ...weeklySeries.flatMap((d) => [d.entradas, d.saidas]))

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const cards = [
    {
      label: 'Itens em estoque',
      value: totalUnits.toString(),
      icon: Package,
      color: 'text-indigo-600 bg-indigo-50',
      to: '/estoque/itens',
    },
    {
      label: 'Valor total em estoque',
      value: fmtBRL(totalValue),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
      to: '/estoque/saldo',
    },
    {
      label: 'Produtos cadastrados',
      value: products.length.toString(),
      icon: Boxes,
      color: 'text-sky-600 bg-sky-50',
      to: '/estoque/entrada',
    },
    {
      label: 'Itens abaixo do mínimo',
      value: shortItems.length.toString(),
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
      to: '/estoque/itens',
    },
  ]

  const cadastros = [
    {
      label: 'Fabricantes',
      value: counts.manufacturers,
      icon: Factory,
      to: '/estoque/fabricantes',
    },
    { label: 'Fornecedores', value: counts.suppliers, icon: Truck, to: '/estoque/fornecedores' },
    { label: 'Marcas', value: counts.brands, icon: Tag, to: '/estoque/marcas' },
    {
      label: 'Categorias',
      value: counts.categories,
      icon: Layers,
      to: '/estoque/categorias-produtos',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Boxes className="h-6 w-6 text-indigo-600" />
          Estoque
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Visão geral do estoque, cadastros e movimentações.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-sm transition-all h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {c.label}
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5 truncate">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/estoque/entrada">
          <Card className="bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all">
            <CardContent className="p-3 flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Entrada</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/estoque/saldo">
          <Card className="bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all">
            <CardContent className="p-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Saldo</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/estoque/movimentacoes">
          <Card className="bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all">
            <CardContent className="p-3 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Movimentações</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/estoque/requisicoes">
          <Card className="bg-white border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all">
            <CardContent className="p-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">Requisições</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de movimentações */}
        <Card className="lg:col-span-2 bg-white border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-700">
              Movimentações — últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3 h-48 px-1">
              {weeklySeries.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 h-40 w-full justify-center">
                    <div
                      className="w-3 rounded-t bg-emerald-400"
                      style={{
                        height: `${(d.entradas / maxBar) * 100}%`,
                        minHeight: d.entradas ? 4 : 0,
                      }}
                      title={`Entradas: ${d.entradas}`}
                    />
                    <div
                      className="w-3 rounded-t bg-rose-400"
                      style={{
                        height: `${(d.saidas / maxBar) * 100}%`,
                        minHeight: d.saidas ? 4 : 0,
                      }}
                      title={`Saídas: ${d.saidas}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Saídas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Itens abaixo do mínimo */}
        <Card className="bg-white border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Abaixo do estoque mínimo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {shortItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Nenhum item abaixo do mínimo. 🎉
              </p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {shortItems.slice(0, 8).map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{it.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{it.locationName}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] shrink-0">
                      {it.quantity}/{it.minQuantity}
                    </Badge>
                  </li>
                ))}
                {shortItems.length > 8 && (
                  <li className="text-[11px] text-center text-slate-400 pt-1">
                    +{shortItems.length - 8} outro(s)
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cadastros rápidos */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-700">Cadastros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cadastros.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <c.icon className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{c.value}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
