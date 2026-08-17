import { useState, useEffect, useMemo } from 'react'
import {
  PackagePlus,
  Plus,
  Trash2,
  Loader2,
  Hash,
  Save,
  FileDown,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  productsService,
  suppliersService,
  inventoryLocationsService,
  inventoryItemsService,
  inventoryMovementsService,
} from '@/services/api'
import { useAuth } from '@/hooks/use-auth'
import type { Product, Supplier, InventoryLocation } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import pb from '@/lib/pocketbase/client'

interface EntryItem {
  key: string
  productId: string
  quantity: number
  barcode: string
  unitPrice: number
  serials: string[]
}

const EMPTY_ITEM = (): EntryItem => ({
  key: Math.random().toString(36).slice(2),
  productId: '',
  quantity: 1,
  barcode: '',
  unitPrice: 0,
  serials: [],
})

interface CompletedEntry {
  supplierName: string
  document: string
  locationName: string
  items: Array<{
    productName: string
    quantity: number
    barcode: string
    unitPrice: number
    serials: string[]
    isSerial: boolean
  }>
}

export default function StockEntry() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [document, setDocument] = useState('')
  const [locationId, setLocationId] = useState('')
  const [informPrices, setInformPrices] = useState(false)
  const [items, setItems] = useState<EntryItem[]>([EMPTY_ITEM()])

  // Serial modal state
  const [serialModalKey, setSerialModalKey] = useState<string | null>(null)

  // Completed entry (for PDF)
  const [completed, setCompleted] = useState<CompletedEntry | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, sups, locs] = await Promise.all([
        productsService.getAll(),
        suppliersService.getAll(),
        inventoryLocationsService.getAll(),
      ])
      setProducts(prods)
      setSuppliers(sups)
      setLocations(locs)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const productMap = useMemo(() => {
    const m = new Map<string, Product>()
    products.forEach((p) => m.set(p.id, p))
    return m
  }, [products])

  const isProductSerial = (productId: string) => {
    const p = productMap.get(productId)
    if (!p) return false
    return !!p.is_serial || !!p.is_it_asset
  }

  const updateItem = (key: string, patch: Partial<EntryItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it
        const next = { ...it, ...patch }
        // Ao trocar o produto, preenche o barcode do produto
        if (patch.productId !== undefined) {
          const p = productMap.get(patch.productId)
          next.barcode = p?.barcode || ''
          next.serials = []
        }
        return next
      }),
    )
  }

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()])

  const removeItem = (key: string) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.key !== key)))

  // Abre o modal de seriais ao sair do campo de quantidade
  const handleQuantityBlur = (it: EntryItem) => {
    if (!isProductSerial(it.productId)) return
    const qty = Math.max(1, Math.floor(it.quantity) || 1)
    if (qty <= 0) return
    // ajusta o array de seriais ao tamanho da quantidade
    setItems((prev) =>
      prev.map((x) => {
        if (x.key !== it.key) return x
        let serials = [...x.serials]
        if (serials.length > qty) serials = serials.slice(0, qty)
        else if (serials.length < qty)
          serials = [...serials, ...Array(qty - serials.length).fill('')]
        return { ...x, quantity: qty, serials }
      }),
    )
    setSerialModalKey(it.key)
  }

  const serialModalItem = items.find((it) => it.key === serialModalKey) || null

  const updateSerial = (index: number, value: string) => {
    if (!serialModalKey) return
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== serialModalKey) return it
        const serials = [...it.serials]
        serials[index] = value
        return { ...it, serials }
      }),
    )
  }

  // Validação de duplicidade dentro do item e global
  const validateSerials = (it: EntryItem): string | null => {
    const filled = it.serials.map((s) => s.trim()).filter(Boolean)
    if (filled.length !== it.serials.length) {
      return `Preencha todos os ${it.serials.length} números de série do produto "${
        productMap.get(it.productId)?.name || ''
      }".`
    }
    const dup = new Set(filled.filter((s, i) => filled.indexOf(s) !== i))
    if (dup.size > 0) {
      return `Existem números de série duplicados no produto "${
        productMap.get(it.productId)?.name || ''
      }".`
    }
    return null
  }

  const handleFinish = async () => {
    if (!supplierId) return toast.error('Selecione um fornecedor.')
    if (!locationId) return toast.error('Selecione um depósito de destino.')

    const validItems = items.filter((it) => it.productId && it.quantity > 0)
    if (validItems.length === 0) return toast.error('Adicione ao menos um item válido.')

    for (const it of validItems) {
      if (isProductSerial(it.productId)) {
        const err = validateSerials(it)
        if (err) {
          toast.error(err)
          setSerialModalKey(it.key)
          return
        }
      }
    }

    setSaving(true)
    try {
      const supplier = suppliers.find((s) => s.id === supplierId)
      const location = locations.find((l) => l.id === locationId)
      const createdItemsLog: CompletedEntry['items'] = []

      for (const it of validItems) {
        const product = productMap.get(it.productId)!
        const isSerial = isProductSerial(it.productId)

        if (isSerial) {
          // Um inventory_item por serial
          for (const sn of it.serials) {
            await inventoryItemsService.create({
              name: product.name,
              product: product.id,
              serial_number: sn.trim(),
              barcode: it.barcode || undefined,
              quantity: 1,
              min_quantity: 0,
              unit: product.unit || 'un',
              item_type: 'Ativo',
              location: locationId,
              status: 'Em estoque',
              is_it_asset: !!product.is_it_asset,
              is_patrimony: !!product.is_patrimony,
              category: product.expand?.category?.name || undefined,
            })
          }
        } else {
          // Um inventory_item por linha
          await inventoryItemsService.create({
            name: product.name,
            product: product.id,
            barcode: it.barcode || undefined,
            quantity: it.quantity,
            min_quantity: 0,
            unit: product.unit || 'un',
            item_type: 'Consumível',
            location: locationId,
            status: 'Em estoque',
            is_it_asset: false,
            is_patrimony: !!product.is_patrimony,
            category: product.expand?.category?.name || undefined,
          })
        }

        createdItemsLog.push({
          productName: product.name,
          quantity: it.quantity,
          barcode: it.barcode,
          unitPrice: informPrices ? it.unitPrice : 0,
          serials: isSerial ? [...it.serials] : [],
          isSerial,
        })
      }

      // Registra movimentação de entrada (uma por item criado)
      // Buscamos o(s) inventory_items recém criados pelo product + location para registrar a movimentação.
      // Como inventoryMovementsService.create pede um item id, registramos uma movimentação por item/produto.
      for (const it of validItems) {
        const product = productMap.get(it.productId)!
        const isSerial = isProductSerial(it.productId)
        try {
          const created = await pb.collection('inventory_items').getFullList({
            filter: `product = "${product.id}" && location = "${locationId}"`,
            sort: '-created',
            requestKey: null,
          })
          const first = created[0]
          if (first) {
            await inventoryMovementsService.create({
              item: first.id,
              to_location: locationId,
              quantity: it.quantity,
              type: 'Entrada',
              notes: `Entrada de materiais — Doc: ${document || '—'} — Fornecedor: ${
                supplier?.name || '—'
              }${informPrices ? ` — Preço unit.: ${it.unitPrice}` : ''}`,
              created_by: user?.id,
            })
          }
        } catch (err) {
          console.warn('Falha ao registrar movimentação de entrada', err)
        }
      }

      setCompleted({
        supplierName: supplier?.name || '—',
        document: document || '—',
        locationName: location?.name || '—',
        items: createdItemsLog,
      })

      toast.success('Entrada finalizada com sucesso!')
      // Limpa o formulário
      setSupplierId('')
      setDocument('')
      setLocationId('')
      setInformPrices(false)
      setItems([EMPTY_ITEM()])
    } catch (err) {
      console.error(err)
      toast.error('Erro ao finalizar entrada.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrintPdf = () => {
    if (!completed) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) {
      toast.error(
        'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.',
      )
      return
    }
    const esc = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    const fmtBRL = (n: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

    const rows = completed.items
      .map((it, idx) => {
        const serialCell = it.isSerial
          ? `<ul style="margin:0;padding-left:16px">${it.serials
              .map((s) => `<li style="font-family:monospace">${esc(s)}</li>`)
              .join('')}</ul>`
          : '—'
        const priceCell = completed.items.some((x) => x.unitPrice)
          ? `<td>${esc(fmtBRL(it.unitPrice))}</td>`
          : ''
        return `<tr>
          <td>${idx + 1}</td>
          <td>${esc(it.productName)}</td>
          <td>${esc(it.barcode || '—')}</td>
          <td>${it.quantity}</td>
          ${completed.items.some((x) => x.unitPrice) ? `<td>${esc(fmtBRL(it.unitPrice))}</td>` : ''}
          <td>${serialCell}</td>
        </tr>`
      })
      .join('')

    const priceCol = completed.items.some((x) => x.unitPrice) ? '<th>Preço Unit.</th>' : ''

    w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
      <title>Comprovante de Entrada</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color:#1e293b; padding:32px; }
        h1 { font-size:20px; margin:0 0 4px; }
        .meta { font-size:13px; color:#475569; margin-bottom:20px; }
        .meta div { margin:2px 0; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th, td { border:1px solid #e2e8f0; padding:8px; vertical-align:top; text-align:left; }
        th { background:#f1f5f9; font-weight:600; }
        .footer { margin-top:24px; font-size:11px; color:#94a3b8; text-align:center; }
        @media print { .no-print { display:none; } }
      </style>
    </head><body>
      <h1>Comprovante de Entrada de Materiais</h1>
      <div class="meta">
        <div><strong>Fornecedor:</strong> ${esc(completed.supplierName)}</div>
        <div><strong>Nº Documento:</strong> ${esc(completed.document)}</div>
        <div><strong>Depósito destino:</strong> ${esc(completed.locationName)}</div>
        <div><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Produto</th><th>Código de Barras</th><th>Qtd</th>${priceCol}<th>Seriais</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Documento gerado pelo sistema de Help Desk — Entrada de Materiais</div>
      <div class="no-print" style="margin-top:24px;text-align:center">
        <button onclick="window.print()" style="padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer">Imprimir / Salvar PDF</button>
      </div>
    </body></html>`)
    w.document.close()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-indigo-600" />
            Entrada de Materiais
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registre a entrada de múltiplos itens no estoque, com controle de seriais quando
            aplicável.
          </p>
        </div>
        {completed && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrintPdf} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
            <Button variant="outline" onClick={handlePrintPdf} className="gap-2">
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCompleted(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Success banner */}
      {completed && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800">Entrada finalizada com sucesso!</p>
              <p className="text-emerald-700 text-xs mt-0.5">
                {completed.items.length} produto(s) registrados em {completed.locationName}. Gere o
                comprovante em PDF acima.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho da entrada */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Fornecedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione o fornecedor" />
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Nº Documento</Label>
            <Input
              placeholder="Ex: NF-123456"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Depósito destino</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-1">
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="inform-prices"
                checked={informPrices}
                onCheckedChange={(v) => setInformPrices(v === true)}
              />
              <Label
                htmlFor="inform-prices"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Informar preços
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de itens */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Produto</th>
                  <th className="py-3 px-4 w-28">Quantidade</th>
                  <th className="py-3 px-4 min-w-[180px]">Código de Barras</th>
                  {informPrices && <th className="py-3 px-4 w-32">Preço Unitário</th>}
                  <th className="py-3 px-4 min-w-[120px]">Seriais</th>
                  <th className="py-3 px-4 w-12 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const product = productMap.get(it.productId)
                  const isSerial = isProductSerial(it.productId)
                  const serialError = isSerial ? validateSerials(it) : null
                  return (
                    <tr key={it.key} className="align-top">
                      <td className="py-3 px-4">
                        <Select
                          value={it.productId}
                          onValueChange={(v) => updateItem(it.key, { productId: v })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {product && (product.is_serial || product.is_it_asset) && (
                          <Badge className="mt-1 bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                            Controla Serial
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(it.key, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          onBlur={() => handleQuantityBlur(it)}
                          className="h-9 text-xs w-24"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <Input
                          placeholder="Código de barras"
                          value={it.barcode}
                          onChange={(e) => updateItem(it.key, { barcode: e.target.value })}
                          className="h-9 text-xs font-mono"
                        />
                      </td>

                      {informPrices && (
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={it.unitPrice || ''}
                            onChange={(e) =>
                              updateItem(it.key, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-9 text-xs w-28"
                          />
                        </td>
                      )}

                      <td className="py-3 px-4">
                        {isSerial ? (
                          <div className="space-y-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // garante o tamanho do array
                                const qty = Math.max(1, Math.floor(it.quantity) || 1)
                                let serials = [...it.serials]
                                if (serials.length > qty) serials = serials.slice(0, qty)
                                else if (serials.length < qty)
                                  serials = [...serials, ...Array(qty - serials.length).fill('')]
                                updateItem(it.key, { serials, quantity: qty })
                                setSerialModalKey(it.key)
                              }}
                              className="h-7 text-[11px] gap-1"
                            >
                              <Hash className="h-3 w-3" />
                              {it.serials.filter((s) => s.trim()).length}/{it.quantity} seriais
                            </Button>
                            {serialError && (
                              <p className="text-[10px] text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Incompleto/duplicado
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.key)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Finalizar Entrada
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Seriais */}
      <Dialog open={!!serialModalKey} onOpenChange={(o) => !o && setSerialModalKey(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Hash className="h-5 w-5 text-indigo-600" />
              Números de Série
            </DialogTitle>
            <p className="text-xs text-slate-500 -mt-1">
              {serialModalItem
                ? `Produto: ${productMap.get(serialModalItem.productId)?.name || '—'} — informe ${serialModalItem.quantity} serial(is).`
                : ''}
            </p>
          </DialogHeader>

          {serialModalItem && (
            <div className="space-y-2 py-1">
              {serialModalItem.serials.map((sn, idx) => {
                const dup =
                  sn.trim() &&
                  serialModalItem.serials.some(
                    (s, i) => i !== idx && s.trim() && s.trim() === sn.trim(),
                  )
                return (
                  <div key={idx} className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-600">
                      Serial {idx + 1}
                    </Label>
                    <Input
                      placeholder={`Ex: SN-${1000 + idx}`}
                      value={sn}
                      onChange={(e) => updateSerial(idx, e.target.value)}
                      className={`h-9 font-mono text-xs ${dup ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    />
                    {dup && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Serial duplicado
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSerialModalKey(null)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
