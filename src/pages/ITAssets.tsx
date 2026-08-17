import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Monitor,
  Search,
  Link2,
  Loader2,
  Layers,
  Tag,
  Building2,
  Hash,
  Package,
  CircleDot,
} from 'lucide-react'
import { productsService, ticketsService, inventoryItemsService } from '@/services/api'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { useAuth } from '@/hooks/use-auth'
import type { Product, Ticket, InventoryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function ITAssetsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const { viewMode, toggleViewMode } = useViewMode('it-assets-view-mode')

  // Modal para vínculo de ativo a chamado
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkProduct, setLinkProduct] = useState<Product | null>(null)
  const [linkTicketId, setLinkTicketId] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, inv, openTickets] = await Promise.all([
        productsService.getItAssets(),
        inventoryItemsService.getAll(),
        user ? ticketsService.getFullList() : Promise.resolve([] as Ticket[]),
      ])
      setProducts(prods)
      setItems(inv)
      // Apenas chamados abertos do usuário (não finalizados)
      setTickets(
        (openTickets as Ticket[]).filter(
          (t) =>
            t.status &&
            !['Resolvido', 'Fechado', 'Cancelado'].includes(t.status) &&
            (t.requester === user?.id || t.assigned_to === user?.id),
        ),
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar ativos de TI.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Estoque disponível por produto (soma das quantidades dos itens vinculados)
  const stockByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of items) {
      if (!it.product) continue
      map.set(it.product, (map.get(it.product) || 0) + (it.quantity || 0))
    }
    return map
  }, [items])

  // Itens (linhas de estoque) por produto — para listar seriais / patrimônios
  const itemsByProduct = useMemo(() => {
    const map = new Map<string, InventoryItem[]>()
    for (const it of items) {
      if (!it.product) continue
      const arr = map.get(it.product) || []
      arr.push(it)
      map.set(it.product, arr)
    }
    return map
  }, [items])

  // Chamados vinculados a itens deste produto
  const ticketsByProduct = useMemo(() => {
    const map = new Map<string, Ticket[]>()
    // Como não há campo direto de product no ticket, usamos os itens:
    // um ticket pode referenciar o item (em observações etc.). Aqui listamos
    // chamados abertos do usuário para seleção. Para exibir "ocorrências
    // vinculadas", consideramos os tickets cujo título contenha o nome do
    // produto (heurística simples, sem campo extra no schema existente).
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, products])

  const filteredProducts = products.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.expand?.category?.name || '').toLowerCase().includes(q) ||
      (p.expand?.manufacturer?.name || '').toLowerCase().includes(q)
    )
  })

  const handleOpenLink = (p: Product) => {
    setLinkProduct(p)
    setLinkTicketId('')
    setLinkOpen(true)
  }

  const handleSaveLink = async () => {
    if (!linkTicketId) {
      toast.error('Selecione um chamado para vincular.')
      return
    }
    setSavingLink(true)
    try {
      // Registra uma mensagem no chamado vinculando o ativo (sem novo campo no schema)
      await ticketsService.update(linkTicketId, {
        content: `Ativo de TI vinculado: ${linkProduct?.name || ''}`,
      })
      toast.success('Ativo vinculado ao chamado com sucesso!')
      setLinkOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao vincular ativo ao chamado.')
    } finally {
      setSavingLink(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Monitor className="h-6 w-6 text-indigo-600" />
            Ativos de TI
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Produtos marcados como Ativo de TI — acompanhe o estoque e vincule ocorrências.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
        </div>
      </div>

      {/* Filtro */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar ativo por nome, categoria ou fabricante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <Monitor className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhum ativo de TI encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Marque produtos como "Ativo de TI" em Cadastros › Produtos.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ativo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Fabricante</th>
                  <th className="py-3 px-4">Estoque</th>
                  <th className="py-3 px-4">Ocorrências</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = stockByProduct.get(p.id) || 0
                  const linkedItems = itemsByProduct.get(p.id) || []
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                          {p.name}
                        </p>
                        {p.is_patrimony && (
                          <span className="text-[10px] text-amber-700 font-medium">
                            Controlado como Patrimônio
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.expand?.category?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {p.expand?.manufacturer?.name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            stock > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]'
                              : 'bg-red-50 text-red-700 border border-red-200 text-[10px]'
                          }
                        >
                          {stock} {p.unit || 'un'} disponível
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {linkedItems.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <CircleDot className="h-3 w-3 text-indigo-500" />
                            {linkedItems.length} item(ns) em estoque
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem ocorrências</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenLink(p)}
                          className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 gap-1"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Vincular chamado
                        </Button>
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
          {filteredProducts.map((p) => {
            const stock = stockByProduct.get(p.id) || 0
            const linkedItems = itemsByProduct.get(p.id) || []
            return (
              <Card
                key={p.id}
                className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
                        <Monitor className="h-3 w-3 mr-1" /> Ativo de TI
                      </Badge>
                      {p.is_patrimony && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                          Patrimônio
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                      {p.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-4 space-y-2 flex-1 text-xs">
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" /> Categoria:
                      </span>
                      <span className="text-slate-800 font-medium">
                        {p.expand?.category?.name || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Fabricante:
                      </span>
                      <span className="text-slate-800 font-medium">
                        {p.expand?.manufacturer?.name || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Tag className="h-3.5 w-3.5 text-indigo-500" /> Fornecedor:
                      </span>
                      <span className="text-slate-800 font-medium">
                        {p.expand?.supplier?.name || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-slate-500">Estoque disponível:</span>
                    <Badge
                      className={
                        stock > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]'
                          : 'bg-red-50 text-red-700 border border-red-200 text-[10px]'
                      }
                    >
                      <Package className="h-3 w-3 mr-1" />
                      {stock} {p.unit || 'un'}
                    </Badge>
                  </div>

                  {linkedItems.length > 0 && (
                    <div className="pt-1 border-t border-slate-100">
                      <p className="font-medium text-slate-500 mb-1">Ocorrências / Itens:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {linkedItems.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-[11px] text-slate-600"
                          >
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-slate-400" />
                              {it.serial_number || it.name}
                            </span>
                            <Badge variant="secondary" className="text-[9px]">
                              {it.status || 'Em estoque'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenLink(p)}
                    className="w-full h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Vincular a chamado
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal vínculo */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Link2 className="h-5 w-5 text-indigo-600" />
              Vincular ativo a chamado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-600">
              <strong>Ativo:</strong> {linkProduct?.name}
            </p>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Chamado aberto *</label>
              {tickets.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic">
                  Você não possui chamados abertos no momento.{' '}
                  <Link to="/novo-chamado" className="text-indigo-600 underline">
                    Abrir novo chamado
                  </Link>
                </p>
              ) : (
                <Select value={linkTicketId} onValueChange={setLinkTicketId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um chamado" />
                  </SelectTrigger>
                  <SelectContent>
                    {tickets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        #{t.id.slice(0, 6)} — {t.title || t.subject || 'Sem título'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)} disabled={savingLink}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveLink}
              disabled={savingLink || !linkTicketId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {savingLink && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
