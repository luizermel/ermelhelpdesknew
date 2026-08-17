import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Package,
  User,
  Loader2,
  FileSignature,
  ExternalLink,
  ShieldCheck,
  Send,
  Copy,
} from 'lucide-react'
import {
  materialRequestsService,
  inventoryItemsService,
  inventoryLocationsService,
} from '@/services/api'
import { MaterialRequest, InventoryItem, InventoryLocation } from '@/types'
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

export default function MaterialRequestsPage() {
  const { user, isAdmin } = useAuth()
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // New Request Modal State
  const [createDialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [useCustomItem, setUseCustomItem] = useState(false)

  const [createForm, setCreateForm] = useState({
    item: '',
    item_name: '',
    item_type: 'Consumível' as 'Ativo' | 'Consumível',
    quantity: 1,
    unit: 'un',
    destination_location: '',
    reason: '',
  })

  // Approval Modal State (Admin)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approving, setApproving] = useState(false)
  const [selectedReq, setSelectedReq] = useState<MaterialRequest | null>(null)
  const [approvalForm, setApprovalForm] = useState({
    signature_type: 'Sistema' as 'Sistema' | 'LinkPúblico',
    signature_name: '',
    signature_email: '',
    signature_notes: '',
  })

  // Rejection Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [reqData, itData, locData] = await Promise.all([
        materialRequestsService.getAll(),
        inventoryItemsService.getAll(),
        inventoryLocationsService.getAll(),
      ])
      setRequests(reqData)
      setItems(itData)
      setLocations(locData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar requisições de estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    const firstItem = items[0]
    setUseCustomItem(false)
    setCreateForm({
      item: firstItem?.id || '',
      item_name: firstItem?.name || '',
      item_type: (firstItem?.item_type as 'Ativo' | 'Consumível') || 'Consumível',
      quantity: 1,
      unit: firstItem?.unit || 'un',
      destination_location: locations[0]?.id || '',
      reason: '',
    })
    setDialogOpen(true)
  }

  const handleItemSelect = (itemId: string) => {
    if (itemId === 'custom') {
      setUseCustomItem(true)
      setCreateForm((prev) => ({
        ...prev,
        item: '',
        item_name: '',
        unit: 'un',
      }))
      return
    }

    setUseCustomItem(false)
    const selected = items.find((i) => i.id === itemId)
    setCreateForm((prev) => ({
      ...prev,
      item: itemId,
      item_name: selected?.name || '',
      item_type: (selected?.item_type as 'Ativo' | 'Consumível') || 'Consumível',
      unit: selected?.unit || 'un',
    }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.item_name && !useCustomItem) {
      toast.error('Selecione ou informe um item.')
      return
    }

    if (!createForm.reason.trim()) {
      toast.error('Informe o motivo/justificativa da solicitação.')
      return
    }

    setSaving(true)
    try {
      await materialRequestsService.create({
        requester: user?.id,
        item: useCustomItem ? undefined : createForm.item,
        item_name: useCustomItem
          ? createForm.item_name
          : items.find((i) => i.id === createForm.item)?.name || createForm.item_name,
        item_type: createForm.item_type,
        quantity: createForm.quantity,
        unit: createForm.unit,
        destination_location: createForm.destination_location || undefined,
        reason: createForm.reason,
      })

      toast.success('Requisição de material solicitada com sucesso!')
      setDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar requisição.')
    } finally {
      setSaving(false)
    }
  }

  // Admin Approval Flow
  const handleOpenApprove = (req: MaterialRequest) => {
    setSelectedReq(req)
    setApprovalForm({
      signature_type: 'Sistema',
      signature_name: user?.name || 'Administrador do Estoque',
      signature_email: user?.email || '',
      signature_notes: 'Aprovado via painel administrativo com validação de credencial ativa.',
    })
    setApproveDialogOpen(true)
  }

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !user) return
    if (!approvalForm.signature_name.trim()) {
      toast.error('Informe o nome da assinatura eletrônica.')
      return
    }

    setApproving(true)
    try {
      await materialRequestsService.approve(selectedReq.id, user.id, approvalForm)
      toast.success('Requisição aprovada e baixa/transferência de estoque registrada!')
      setApproveDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao aprovar requisição.')
    } finally {
      setApproving(false)
    }
  }

  // Admin Rejection Flow
  const handleOpenReject = (req: MaterialRequest) => {
    setSelectedReq(req)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !user) return
    if (!rejectionReason.trim()) {
      toast.error('Informe a justificativa da rejeição.')
      return
    }

    setRejecting(true)
    try {
      await materialRequestsService.reject(selectedReq.id, user.id, rejectionReason)
      toast.success('Requisição de material rejeitada.')
      setRejectDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao rejeitar requisição.')
    } finally {
      setRejecting(false)
    }
  }

  const copyPublicLink = (token?: string) => {
    if (!token) return
    const url = `${window.location.origin}/confirmacao-publica/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link público de confirmação copiado para a área de transferência!')
  }

  const filteredRequests = requests.filter((r) => {
    const name = r.item_name || r.expand?.item?.name || ''
    const reqName = r.expand?.requester?.name || ''
    const reason = r.reason || ''
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      reqName.toLowerCase().includes(search.toLowerCase()) ||
      reason.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            Requisições de Material e Ativos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Solicite materiais ou aprove pedidos com assinatura eletrônica e baixa automática no
            estoque.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Solicitar Material
        </Button>
      </div>

      {/* Filter */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por item, solicitante ou justificativa..."
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
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhuma requisição encontrada</p>
          <p className="text-xs text-slate-400 mt-1">
            Clique no botão acima para realizar a primeira solicitação de material.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'Pendente'
            const isApproved = req.status === 'Aprovado'
            const isRejected = req.status === 'Rejeitado'

            const requesterName = req.expand?.requester?.name || 'Solicitante'
            const itemName = req.item_name || req.expand?.item?.name || 'Item de Estoque'
            const destinationName = req.expand?.destination_location?.name || 'Não especificado'
            const formattedDate = new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(req.created))

            return (
              <Card
                key={req.id}
                className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant="outline"
                        className={
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                            : isRejected
                              ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                        }
                      >
                        {isApproved && (
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 inline" />
                        )}
                        {isRejected && <XCircle className="h-3 w-3 mr-1 text-red-600 inline" />}
                        {isPending && <Clock className="h-3 w-3 mr-1 text-amber-600 inline" />}
                        {req.status}
                      </Badge>

                      <Badge variant="secondary" className="text-[11px]">
                        {req.item_type || 'Consumível'}
                      </Badge>

                      <span className="text-xs font-bold text-slate-900">{itemName}</span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Qtd: {req.quantity} {req.unit || 'un'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>
                          Solicitante: <strong className="text-slate-800">{requesterName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>
                          Destino: <strong className="text-slate-800">{destinationName}</strong>
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      <span className="font-semibold text-slate-800">Justificativa:</span> "
                      {req.reason}"
                    </p>

                    {/* Electronic Signature Info if Approved */}
                    {isApproved && (
                      <div className="mt-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 text-xs text-emerald-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <FileSignature className="h-4 w-4 text-emerald-600" />
                          Assinatura Eletrônica Registrada
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Assinado por <strong>{req.signature_name}</strong> ({req.signature_type})
                          em {req.signed_at ? new Date(req.signed_at).toLocaleString('pt-BR') : ''}
                        </p>
                        {req.signature_notes && (
                          <p className="text-[11px] text-emerald-600 italic">
                            Nota: {req.signature_notes}
                          </p>
                        )}
                      </div>
                    )}

                    {isRejected && req.rejection_reason && (
                      <div className="mt-2 p-2.5 bg-red-50/60 rounded-xl border border-red-100 text-xs text-red-900">
                        <p className="font-semibold text-red-800">Motivo da Rejeição:</p>
                        <p className="text-[11px] text-red-700">{req.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <span className="text-[11px] text-slate-400">{formattedDate}</span>

                    <div className="flex items-center gap-2">
                      {isPending && isAdmin && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenApprove(req)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReject(req)}
                            className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs h-8 gap-1.5"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rejeitar
                          </Button>
                        </>
                      )}

                      {/* Public confirmation link for external signers without account */}
                      {isPending && req.token && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPublicLink(req.token)}
                          className="h-8 text-xs text-indigo-600 hover:bg-indigo-50 gap-1"
                          title="Copiar link público para assinatura externa"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Link Público
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Nova Requisição */}
      <Dialog open={createDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              Solicitar Material / Ativo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Selecione o Item do Estoque</label>
              <Select
                value={useCustomItem ? 'custom' : createForm.item}
                onValueChange={handleItemSelect}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um item ou outro personalizado" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name} ({it.item_type || 'Consumível'}) - Saldo: {it.quantity}{' '}
                      {it.unit || 'un'}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Outro item não listado...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCustomItem && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nome do Item Desejado *</label>
                <Input
                  placeholder="Ex: Cabo HDMI 5 metros"
                  value={createForm.item_name}
                  onChange={(e) => setCreateForm({ ...createForm, item_name: e.target.value })}
                  required
                  className="h-9"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantidade Solicitada *</label>
                <Input
                  type="number"
                  min={1}
                  value={createForm.quantity}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Unidade</label>
                <Input
                  placeholder="un, cx, m"
                  value={createForm.unit}
                  onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Localização de Destino / Aplicação
              </label>
              <Select
                value={createForm.destination_location}
                onValueChange={(v) => setCreateForm({ ...createForm, destination_location: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione onde será utilizado" />
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
              <label className="font-semibold text-slate-700">Justificativa / Finalidade *</label>
              <Textarea
                placeholder="Explique porque este material é necessário e para qual atividade..."
                rows={3}
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                required
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
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Aprovação com Assinatura Eletrônica (Admin) */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileSignature className="h-5 w-5 text-emerald-600" />
              Aprovação e Assinatura Eletrônica
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleApproveSubmit} className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">
                Item: {selectedReq?.item_name || 'Material'} (Qtd: {selectedReq?.quantity}{' '}
                {selectedReq?.unit || 'un'})
              </p>
              <p>Solicitante: {selectedReq?.expand?.requester?.name}</p>
              <p>Destino: {selectedReq?.expand?.destination_location?.name || 'Geral'}</p>
              <p className="text-[11px] text-slate-500 italic mt-1">"{selectedReq?.reason}"</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tipo de Assinatura</label>
              <Select
                value={approvalForm.signature_type}
                onValueChange={(v) =>
                  setApprovalForm({ ...approvalForm, signature_type: v as any })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sistema">Assinatura no Sistema (Usuário Logado)</SelectItem>
                  <SelectItem value="LinkPúblico">Confirmação via Link Público</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Completo do Responsável *</label>
              <Input
                placeholder="Ex: Carlos Eduardo da Silva"
                value={approvalForm.signature_name}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, signature_name: e.target.value })
                }
                required
                className="h-9 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">E-mail do Assinante</label>
              <Input
                placeholder="email@empresa.com.br"
                value={approvalForm.signature_email}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, signature_email: e.target.value })
                }
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações da Liberação</label>
              <Textarea
                placeholder="Adicione um termo ou registro adicional sobre esta entrega..."
                rows={2}
                value={approvalForm.signature_notes}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, signature_notes: e.target.value })
                }
                className="resize-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 inline mr-1" />
              Ao aprovar, esta ação registrará um log permanente e atualizará o saldo/transferência
              do estoque automaticamente.
            </p>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
                disabled={approving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={approving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                {approving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando Assinatura...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    Assinar e Aprovar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeitar Requisição de Material
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Motivo / Justificativa da Rejeição *
              </label>
              <Textarea
                placeholder="Informe o motivo pelo qual este pedido foi negado..."
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={rejecting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={rejecting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  'Confirmar Rejeição'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
