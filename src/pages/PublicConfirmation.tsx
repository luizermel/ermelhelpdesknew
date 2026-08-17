import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileSignature,
  CheckCircle2,
  ShieldCheck,
  Package,
  User,
  MapPin,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'
import { materialRequestsService } from '@/services/api'
import { MaterialRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function PublicConfirmationPage() {
  const { token } = useParams<{ token: string }>()
  const [request, setRequest] = useState<MaterialRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    signature_name: '',
    signature_email: '',
    signature_notes: '',
  })

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    materialRequestsService
      .getByToken(token)
      .then((req) => {
        setRequest(req)
        if (req?.status === 'Aprovado') {
          setDone(true)
        }
      })
      .catch((err) => {
        console.error(err)
        toast.error('Requisição não encontrada ou token inválido.')
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request) return
    if (!form.signature_name.trim()) {
      toast.error('Informe seu nome completo para a assinatura eletrônica.')
      return
    }

    setSaving(true)
    try {
      await materialRequestsService.approve(request.id, 'public_external', {
        signature_type: 'LinkPúblico',
        signature_name: form.signature_name,
        signature_email: form.signature_email,
        signature_notes: form.signature_notes,
      })
      toast.success('Assinatura eletrônica e liberação confirmadas com sucesso!')
      setDone(true)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao registrar confirmação.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border-slate-200 shadow-sm">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">Requisição não encontrada</h1>
          <p className="text-xs text-slate-500 mt-1">
            O link de confirmação fornecido é inválido ou expirou.
          </p>
        </Card>
      </div>
    )
  }

  const requesterName = request.expand?.requester?.name || 'Solicitante'
  const itemName = request.item_name || request.expand?.item?.name || 'Item do Estoque'
  const destinationName = request.expand?.destination_location?.name || 'Não especificado'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <Card className="max-w-lg w-full bg-white border-slate-200/90 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-indigo-950 text-white p-6">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Confirmação Pública de Estoque
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Assinatura Eletrônica de Entrega
          </CardTitle>
          <p className="text-xs text-indigo-200/80 mt-1">
            Confirme o recebimento / aprovação deste material do estoque.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-900 text-sm">{itemName}</span>
              <Badge variant="outline" className="bg-white font-semibold">
                Qtd: {request.quantity} {request.unit || 'un'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400">Solicitante:</span>
                <p className="font-semibold text-slate-800">{requesterName}</p>
              </div>
              <div>
                <span className="text-slate-400">Destino:</span>
                <p className="font-semibold text-slate-800">{destinationName}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-400">Justificativa:</span>
              <p className="italic text-slate-800">"{request.reason}"</p>
            </div>
          </div>

          {done ? (
            <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">
                Requisição Confirmada e Assinada!
              </h2>
              <p className="text-xs text-slate-600">
                A assinatura eletrônica para{' '}
                <strong>{request.signature_name || form.signature_name}</strong> foi registrada no
                log do sistema com sucesso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Seu Nome Completo *</label>
                <Input
                  placeholder="Ex: Roberto Carlos Pereira"
                  value={form.signature_name}
                  onChange={(e) => setForm({ ...form, signature_name: e.target.value })}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Seu E-mail (Opcional)</label>
                <Input
                  type="email"
                  placeholder="seuemail@empresa.com.br"
                  value={form.signature_email}
                  onChange={(e) => setForm({ ...form, signature_email: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Observação / Declaração (Opcional)
                </label>
                <Textarea
                  placeholder="Ex: Recebido em perfeito estado e conferido no local."
                  rows={2}
                  value={form.signature_notes}
                  onChange={(e) => setForm({ ...form, signature_notes: e.target.value })}
                  className="text-xs resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={signing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-xs gap-2 rounded-xl shadow-xs"
              >
                {signing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando Assinatura...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    Assinar e Confirmar Recebimento
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
