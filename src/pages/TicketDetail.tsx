import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UserCheck,
  Send,
  Building2,
  Calendar,
  Layers,
  User as UserIcon,
  ShieldAlert,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ticketsService, messagesService, getFileUrl } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { Ticket, TicketMessage, TicketStatus } from '@/types'
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Comment Form
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Admin Actions
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const fetchTicketData = useCallback(async () => {
    if (!id) return
    try {
      const [tData, mData] = await Promise.all([
        ticketsService.getById(id),
        messagesService.getByTicketId(id),
      ])
      setTicket(tData)
      setMessages(mData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar os dados do chamado.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTicketData()
  }, [fetchTicketData])

  // Real-time subscriptions
  useRealtime<Ticket>('tickets', () => {
    fetchTicketData()
  })

  useRealtime<TicketMessage>('ticket_messages', () => {
    fetchTicketData()
  })

  // Handle Comment Submission
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !id || !user) return

    setSendingComment(true)
    try {
      await messagesService.create({
        ticket: id,
        author: user.id,
        content: commentText.trim(),
        event_type: 'comentario',
      })
      setCommentText('')
      toast.success('Mensagem enviada na timeline!')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar mensagem.')
    } finally {
      setSendingComment(false)
    }
  }

  // Handle Admin Status Change
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !user) return
    setStatusUpdating(true)
    try {
      const updated = await ticketsService.updateStatus(ticket.id, newStatus, user.id)
      setTicket(updated)
      toast.success(`Status alterado para "${newStatus}" com sucesso!`)
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível alterar o status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  // Handle Admin Claim / Assign
  const handleAssignToSelf = async () => {
    if (!ticket || !user) return
    setAssigningAdmin(true)
    try {
      const updated = await ticketsService.assignToAdmin(ticket.id, user.id)
      setTicket(updated)
      toast.success('Você assumiu o atendimento deste chamado!')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível assumir o chamado.')
    } finally {
      setAssigningAdmin(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Chamado não encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          O chamado solicitado pode ter sido removido ou você não possui permissão para
          visualizá-lo.
        </p>
        <Button asChild>
          <Link to="/chamados">Voltar para a lista</Link>
        </Button>
      </div>
    )
  }

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(ticket.created))

  const isClosed = ticket.status === 'Concluído'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-slate-600 hover:text-slate-900 shrink-0"
          >
            <Link to="/chamados" title="Voltar para chamados">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {ticket.category}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Admin Quick Actions in Header */}
        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 p-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 px-2">Status:</span>
            <Select
              value={ticket.status}
              onValueChange={(val) => handleStatusChange(val as TicketStatus)}
              disabled={statusUpdating}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>

            {!ticket.assigned_to && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAssignToSelf}
                disabled={assigningAdmin}
                className="h-8 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {assigningAdmin ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                )}
                Assumir
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Comments (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Description Card */}
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarFallback className="bg-slate-700 text-white font-semibold text-xs">
                    {getInitials(ticket.expand?.requester?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {ticket.expand?.requester?.name || 'Solicitante'}
                  </p>
                  <p className="text-[11px] text-slate-400">{formattedDate}</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Abertura do chamado</span>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>

              {/* Attachments Section */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <ImageIcon className="h-4 w-4 text-indigo-600" />
                    <span>Anexos ({ticket.attachments.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ticket.attachments.map((file, idx) => {
                      const fileUrl = getFileUrl(ticket, file)
                      return (
                        <div
                          key={idx}
                          onClick={() => setLightboxIndex(idx)}
                          className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-400 transition-all shadow-2xs"
                        >
                          <img
                            src={fileUrl}
                            alt={`Anexo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            Ampliar
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline of Messages & Status Changes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Evolução do Atendimento ({messages.length})
              </h2>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-slate-200">
              {messages.map((msg, index) => {
                const isStatusEvent = msg.event_type === 'status'
                const msgDate = new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(msg.created))

                if (isStatusEvent) {
                  return (
                    <div key={msg.id} className="relative flex items-center gap-3 animate-fade-in">
                      <div className="absolute -left-6 h-5 w-5 rounded-full bg-indigo-100 border-2 border-indigo-600 flex items-center justify-center text-indigo-600">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <div className="py-1 px-3.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs text-indigo-800 font-medium inline-flex items-center gap-2 shadow-2xs">
                        <span>{msg.content}</span>
                        <span className="text-[10px] text-indigo-400">• {msgDate}</span>
                      </div>
                    </div>
                  )
                }

                // If first message matches ticket description, skip or keep as comment
                const isAuthorAdmin = msg.expand?.author?.role === 'admin'

                return (
                  <div key={msg.id} className="relative animate-fade-in">
                    <div
                      className={cn(
                        'absolute -left-6 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-white',
                        isAuthorAdmin
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-slate-400 text-slate-500',
                      )}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>

                    <Card className="bg-white border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                      <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className={cn(
                                'text-[10px] font-bold',
                                isAuthorAdmin
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-600 text-white',
                              )}
                            >
                              {getInitials(msg.expand?.author?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-slate-800">
                            {msg.expand?.author?.name || 'Participante'}
                          </span>
                          {isAuthorAdmin && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                              Suporte TI
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{msgDate}</span>
                      </div>
                      <CardContent className="p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comment Composer */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              {isClosed ? (
                <div className="text-center py-4 text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">Chamado Concluído</p>
                  <p>Este chamado já foi finalizado e não aceita novos comentários.</p>
                </div>
              ) : (
                <form onSubmit={handleSendComment} className="space-y-3">
                  <Textarea
                    placeholder="Escreva uma mensagem de atualização ou resposta sobre o chamado..."
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={sendingComment}
                    className="text-xs resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      As atualizações são enviadas em tempo real.
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 shadow-sm"
                      disabled={sendingComment || !commentText.trim()}
                    >
                      {sendingComment ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-1.5 h-3.5 w-3.5" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ticket Metadata Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Informações do Chamado
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Status */}
              <div>
                <span className="text-slate-400 block mb-1">Status Atual</span>
                <StatusBadge status={ticket.status} />
              </div>

              {/* Priority */}
              <div>
                <span className="text-slate-400 block mb-1">Prioridade</span>
                <PriorityBadge priority={ticket.priority} />
              </div>

              {/* Category */}
              <div>
                <span className="text-slate-400 block mb-1">Categoria</span>
                <span className="font-semibold text-slate-800">{ticket.category}</span>
              </div>

              {/* Sector */}
              <div>
                <span className="text-slate-400 block mb-1">Setor Solicitante</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {ticket.expand?.sector?.name || 'Geral'}
                </div>
              </div>

              {/* Requester */}
              <div>
                <span className="text-slate-400 block mb-1">Aberto por</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-slate-700 text-white text-[10px]">
                      {getInitials(ticket.expand?.requester?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-800 leading-tight">
                      {ticket.expand?.requester?.name || 'Usuário'}
                    </p>
                    <p className="text-[10px] text-slate-400">{ticket.expand?.requester?.email}</p>
                  </div>
                </div>
              </div>

              {/* Assigned To */}
              <div>
                <span className="text-slate-400 block mb-1">Técnico Responsável</span>
                {ticket.expand?.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-indigo-600 text-white text-[10px]">
                        {getInitials(ticket.expand.assigned_to.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-indigo-900 leading-tight">
                        {ticket.expand.assigned_to.name}
                      </p>
                      <p className="text-[10px] text-indigo-500">Equipe de TI</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Não atribuído ainda</span>
                )}
              </div>

              {/* Created At */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-0.5">Criado em</span>
                <span className="text-slate-600">{formattedDate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Modal for Attachments */}
      {lightboxIndex !== null && ticket.attachments && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 animate-fade-in backdrop-blur-xs">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          {ticket.attachments.length > 1 && (
            <>
              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : ticket.attachments!.length - 1,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
                title="Anterior"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null && prev < ticket.attachments!.length - 1 ? prev + 1 : 0,
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
                title="Próxima"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={getFileUrl(ticket, ticket.attachments[lightboxIndex])}
              alt="Anexo ampliado"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <p className="text-xs text-white/60 mt-3 font-medium">
              Imagem {lightboxIndex + 1} de {ticket.attachments.length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
