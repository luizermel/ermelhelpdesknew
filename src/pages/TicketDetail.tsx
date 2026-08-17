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
  FileAudio,
  Flag,
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
import AudioRecorder from '@/components/AudioRecorder'
import { isAudioPath } from '@/lib/tickets'
import pb from '@/lib/pocketbase/client'
import { useSystemSettings } from '@/hooks/use-system-settings'

/** Formata milissegundos restantes como "Xh Ymin restantes". */
function formatRemaining(ms: number): string {
  if (ms <= 0) return '0h 0min restantes'
  const totalMinutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}min restantes`
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { finalizationApprovalHours, reopenDeadlineHours } = useSystemSettings()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Comment Form
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Audio reply
  const [sendingAudio, setSendingAudio] = useState(false)

  // Admin Actions
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  // Finalization / Reopen actions
  const [finalizing, setFinalizing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [alreadyApproved, setAlreadyApproved] = useState(false)

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Tick state — re-renders the countdown text every 60s
  const [nowTick, setNowTick] = useState(() => Date.now())

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

  // Countdown ticker — updates every 60s, clears on unmount
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Derived finalization / reopen time calculations
  const finalizedUpdatedAt = ticket ? new Date(ticket.updated).getTime() : 0
  const msSinceFinalized = nowTick - finalizedUpdatedAt
  const hoursSinceFinalized = msSinceFinalized / (1000 * 60 * 60)
  const approvalMsLeft = finalizedUpdatedAt
    ? finalizationApprovalHours * 60 * 60 * 1000 - msSinceFinalized
    : 0
  const reopenMsLeft = finalizedUpdatedAt
    ? reopenDeadlineHours * 60 * 60 * 1000 - msSinceFinalized
    : 0
  const approvalExpired = ticket?.status === 'Finalizado' && approvalMsLeft <= 0
  const reopenExpired = ticket?.status === 'Finalizado' && reopenMsLeft <= 0

  // Automatic approval on timeout (status === 'Finalizado' only)
  useEffect(() => {
    if (!ticket || !user) return
    if (ticket.status !== 'Finalizado') return
    if (hoursSinceFinalized <= finalizationApprovalHours) return
    // Deadline exceeded — auto-approve
    let cancelled = false
    ;(async () => {
      try {
        const updated = await pb
          .collection('tickets')
          .update<Ticket>(
            ticket.id,
            { status: 'Finalizado e Aprovado' },
            { expand: 'requester,assigned_to,sector' },
          )
        if (cancelled) return
        await pb.collection('ticket_messages').create({
          ticket: ticket.id,
          author: user.id,
          content: 'Aprovação automática por decurso de prazo',
          event_type: 'status',
        })
        setTicket(updated)
        await fetchTicketData()
      } catch (err) {
        console.error('auto-approval failed', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id, ticket?.status, hoursSinceFinalized, finalizationApprovalHours])

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

  // Handle audio reply — uploads file to ticket_messages.attachments
  const handleSendAudio = async (file: File) => {
    if (!id || !user) return
    setSendingAudio(true)
    try {
      const formData = new FormData()
      formData.append('ticket', id)
      formData.append('author', user.id)
      formData.append('content', `Áudio: ${file.name}`)
      formData.append('event_type', 'comentario')
      formData.append('attachments', file)

      await pb.collection('ticket_messages').create(formData)
      toast.success('Áudio enviado na timeline!')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar áudio.')
    } finally {
      setSendingAudio(false)
    }
  }

  // Handle Admin Status Change (dropdown — only the original 3 statuses)
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !user) return
    if (newStatus === 'Concluído' && !commentText.trim()) {
      toast.error('É obrigatório preencher uma mensagem para concluir o chamado.')
      return
    }
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

  // Finalizar Chamado (admin only)
  const handleFinalize = async () => {
    if (!ticket || !user) return
    setFinalizing(true)
    try {
      const updated = await pb
        .collection('tickets')
        .update<Ticket>(
          ticket.id,
          { status: 'Finalizado', finalized_by: user.id },
          { expand: 'requester,assigned_to,sector' },
        )
      await pb.collection('ticket_messages').create({
        ticket: ticket.id,
        author: user.id,
        content: `Chamado finalizado por ${user.name || 'administrador'}`,
        event_type: 'status',
      })
      setTicket(updated)
      toast.success('Chamado finalizado! Aguardando aprovação do solicitante.')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível finalizar o chamado.')
    } finally {
      setFinalizing(false)
    }
  }

  // Aprovar Finalização (requester / non-finalizer)
  const handleApproveFinalization = async () => {
    if (!ticket || !user) return
    setApproving(true)
    try {
      const updated = await pb
        .collection('tickets')
        .update<Ticket>(
          ticket.id,
          { status: 'Finalizado e Aprovado' },
          { expand: 'requester,assigned_to,sector' },
        )
      await pb.collection('ticket_messages').create({
        ticket: ticket.id,
        author: user.id,
        content: `Finalização aprovada por ${user.name || 'solicitante'}`,
        event_type: 'status',
      })
      setTicket(updated)
      setAlreadyApproved(true)
      toast.success('Finalização aprovada com sucesso!')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao aprovar finalização.')
    } finally {
      setApproving(false)
    }
  }

  // Reabrir Chamado (admin or requester)
  const handleReopen = async () => {
    if (!ticket || !user) return
    setReopening(true)
    try {
      const updated = await pb
        .collection('tickets')
        .update<Ticket>(
          ticket.id,
          { status: 'Em andamento' },
          { expand: 'requester,assigned_to,sector' },
        )
      await pb.collection('ticket_messages').create({
        ticket: ticket.id,
        author: user.id,
        content: `Chamado reaberto por ${user.name || 'usuário'}`,
        event_type: 'status',
      })
      setTicket(updated)
      toast.success('Chamado reaberto com sucesso!')
      await fetchTicketData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível reabrir o chamado.')
    } finally {
      setReopening(false)
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
  const isFinalized = ticket.status === 'Finalizado'
  const isFinalizedApproved = ticket.status === 'Finalizado e Aprovado'

  // Whether the current user is the one who finalized (cannot self-approve)
  const finalizedByMe = !!user && ticket.finalized_by === user.id

  // Deadline calculations for legacy "Concluído" card
  const createdDate = ticket ? new Date(ticket.created) : new Date()
  const updatedDate = ticket ? new Date(ticket.updated) : new Date()
  const now = new Date()

  // Diff in hours since updated (when it was marked as Concluído)
  const hoursSinceClosed = isClosed ? (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60) : 0

  const canReopenClosed = isClosed && hoursSinceClosed <= reopenDeadlineHours

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
        {isAdmin && !isFinalized && !isFinalizedApproved && (
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

            {isAdmin && ticket.status === 'Concluído' && (
              <Button
                size="sm"
                onClick={handleFinalize}
                disabled={finalizing}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              >
                {finalizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Flag className="h-3.5 w-3.5" />
                )}
                Finalizar Chamado
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
                      const audio = isAudioPath(file)
                      if (audio) {
                        return (
                          <div
                            key={idx}
                            className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <FileAudio className="h-6 w-6 text-indigo-600" />
                            <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                              {file}
                            </span>
                            <audio
                              src={fileUrl}
                              controls
                              className="w-full h-7"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )
                      }
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

          {/* Comment Composer & Reopen / Finalize Actions */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-4">
              {isFinalizedApproved ? (
                /* ---- Status: Finalizado e Aprovado ---- */
                <div className="space-y-4">
                  <div className="text-center py-4 text-xs text-slate-500 bg-green-50/60 rounded-xl border border-green-100 p-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-800 text-sm">
                      Chamado Finalizado e Aprovado
                    </p>
                    <p className="mt-1">
                      Este chamado foi finalizado e aprovado. Nenhuma ação adicional é necessária.
                    </p>
                  </div>
                </div>
              ) : isFinalized ? (
                /* ---- Status: Finalizado (aguardando aprovação) ---- */
                <div className="space-y-4">
                  <div className="text-center py-4 text-xs text-slate-500 bg-teal-50/60 rounded-xl border border-teal-100 p-4">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-800 text-sm">Chamado Finalizado</p>
                    <p className="mt-1">
                      Este chamado foi finalizado pela equipe de atendimento e aguarda aprovação.
                    </p>
                  </div>

                  {/* Actions within deadline */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {/* Approval button — only for non-finalizer */}
                    {!finalizedByMe ? (
                      <Button
                        type="button"
                        onClick={handleApproveFinalization}
                        disabled={approving || alreadyApproved || approvalExpired}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                      >
                        {approving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {alreadyApproved
                          ? 'Finalização Aprovada'
                          : approvalExpired
                            ? 'Prazo expirado — aprovação automática'
                            : 'Aprovar Finalização'}
                        {!alreadyApproved && !approvalExpired && (
                          <span className="ml-1 font-normal text-[11px] opacity-90">
                            ({formatRemaining(approvalMsLeft)})
                          </span>
                        )}
                      </Button>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                        Você finalizou este chamado. Aguardando aprovação do solicitante.
                      </p>
                    )}

                    {/* Reabrir — both admin and requester can reopen, within deadline */}
                    {!reopenExpired ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReopen}
                        disabled={reopening}
                        className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold gap-1.5"
                      >
                        {reopening ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        Reabrir Chamado
                        <span className="ml-1 font-normal text-[11px] opacity-90">
                          ({formatRemaining(reopenMsLeft)})
                        </span>
                      </Button>
                    ) : (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Prazo de reabertura expirado
                      </p>
                    )}
                  </div>
                </div>
              ) : isClosed ? (
                /* ---- Status: Concluído (legacy flux) ---- */
                <div className="space-y-4">
                  <div className="text-center py-4 text-xs text-slate-500 bg-emerald-50/60 rounded-xl border border-emerald-100 p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-800 text-sm">Chamado Concluído</p>
                    <p className="mt-1">
                      Este chamado foi marcado como concluído pela equipe de atendimento.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tempo decorrido do encerramento: {hoursSinceClosed.toFixed(1)}h (limite de
                      reabertura: {reopenDeadlineHours}h)
                    </p>
                  </div>

                  {/* Actions within deadline */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {canReopenClosed ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleStatusChange('Em andamento')}
                        disabled={statusUpdating}
                        className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold gap-1.5"
                      >
                        {statusUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        Reabrir Chamado (dentro do prazo de {reopenDeadlineHours}h)
                      </Button>
                    ) : (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        O prazo limite de reabertura ({reopenDeadlineHours}h) expirou. Este chamado
                        foi encerrado permanentemente.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* ---- Status: Aberto / Em andamento — comment composer ---- */
                <div className="space-y-3">
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

                  {/* Audio reply recorder */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-600">
                      <FileAudio className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Responder com áudio</span>
                    </div>
                    <AudioRecorder
                      disabled={sendingAudio}
                      confirmLabel="Enviar áudio"
                      onComplete={handleSendAudio}
                    />
                    {sendingAudio && (
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Enviando áudio...
                      </p>
                    )}
                  </div>
                </div>
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

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center w-full">
            {isAudioPath(ticket.attachments[lightboxIndex]) ? (
              <div className="w-full max-w-md flex flex-col items-center gap-3">
                <FileAudio className="h-12 w-12 text-indigo-300" />
                <p className="text-xs text-white/80 font-medium truncate w-full text-center">
                  {ticket.attachments[lightboxIndex]}
                </p>
                <audio
                  src={getFileUrl(ticket, ticket.attachments[lightboxIndex])}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            ) : (
              <>
                <img
                  src={getFileUrl(ticket, ticket.attachments[lightboxIndex])}
                  alt="Anexo ampliado"
                  className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
                <p className="text-xs text-white/60 mt-3 font-medium">
                  Imagem {lightboxIndex + 1} de {ticket.attachments.length}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
