import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Ticket as TicketIcon,
  Users,
  Search,
  Eye,
  AlertCircle,
  Building2,
  Loader2,
  Shield,
  User as UserIcon,
  Package,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ticketsService, usersService, sectorsService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { Ticket, User, Sector, TicketStatus, UserRole } from '@/types'
import { InventoryTab } from '@/pages/AdminInventory'
import { StatusBadge, PriorityBadge } from '@/components/TicketBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminPanel() {
  const { user } = useAuth()

  // Tab
  const [activeTab, setActiveTab] = useState('chamados')

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketSearch, setTicketSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loadingTickets, setLoadingTickets] = useState(true)

  // Users State
  const [users, setUsers] = useState<User[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)

  // User Role Confirmation Modal
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null)
  const [roleChanging, setRoleChanging] = useState(false)

  const fetchTickets = useCallback(async () => {
    try {
      const data = await ticketsService.getFullList()
      setTickets(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao listar chamados no painel admin.')
    } finally {
      setLoadingTickets(false)
    }
  }, [])

  const fetchUsersAndSectors = useCallback(async () => {
    try {
      const [uData, sData] = await Promise.all([usersService.getAll(), sectorsService.getAll()])
      setUsers(uData)
      setSectors(sData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao listar usuários.')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
    fetchUsersAndSectors()
  }, [fetchTickets, fetchUsersAndSectors])

  useRealtime<Ticket>('tickets', () => {
    fetchTickets()
  })

  // Handle Inline Ticket Status Change
  const handleInlineStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!user) return
    try {
      await ticketsService.updateStatus(ticketId, newStatus, user.id)
      toast.success('Status atualizado com sucesso!')
      fetchTickets()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status do chamado.')
    }
  }

  // Handle User Role Toggle
  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return
    const newRole: UserRole = roleModalUser.role === 'admin' ? 'user' : 'admin'

    setRoleChanging(true)
    try {
      await usersService.updateRole(roleModalUser.id, newRole)
      toast.success(
        `Papel de ${roleModalUser.name} alterado para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}!`,
      )
      setRoleModalUser(null)
      fetchUsersAndSectors()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar permissão do usuário.')
    } finally {
      setRoleChanging(false)
    }
  }

  // Handle User Sector Change
  const handleUserSectorChange = async (userId: string, newSectorId: string) => {
    try {
      await usersService.updateSector(userId, newSectorId)
      toast.success('Setor do usuário atualizado!')
      fetchUsersAndSectors()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar setor do usuário.')
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketSearch.trim()) {
        const q = ticketSearch.toLowerCase()
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchRequester = t.expand?.requester?.name.toLowerCase().includes(q)
        const matchSector = t.expand?.sector?.name.toLowerCase().includes(q)
        if (!matchTitle && !matchRequester && !matchSector) return false
      }

      if (statusFilter !== 'todos' && t.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [tickets, ticketSearch, statusFilter])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase()
        const matchName = u.name.toLowerCase().includes(q)
        const matchEmail = u.email.toLowerCase().includes(q)
        const matchSector = u.expand?.sector?.name.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchSector) return false
      }
      return true
    })
  }, [users, userSearch])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Painel Administrativo
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestão global de chamados, alocação técnica e administração de usuários
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger
            value="chamados"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs font-semibold gap-2"
          >
            <TicketIcon className="h-4 w-4" />
            Chamados da Empresa ({tickets.length})
          </TabsTrigger>
          <TabsTrigger
            value="usuarios"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs font-semibold gap-2"
          >
            <Users className="h-4 w-4" />
            Usuários Cadastrados ({users.length})
          </TabsTrigger>
          <TabsTrigger
            value="estoque"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs text-xs font-semibold gap-2"
          >
            <Package className="h-4 w-4" />
            Estoque
          </TabsTrigger>
        </TabsList>

        {/* CHAMADOS TAB */}
        <TabsContent value="chamados" className="space-y-4">
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar por título, solicitante ou setor..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] text-xs h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="Aberto">Aberto</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingTickets ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhum chamado encontrado com os filtros aplicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Título do Chamado
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Solicitante
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Setor
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Categoria
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Prioridade
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Status / Ação Rápida
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">Data</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-slate-600">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((t) => {
                        const dateStr = new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(t.created))

                        return (
                          <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-xs text-slate-900 max-w-[220px] truncate">
                              <Link
                                to={`/chamados/${t.id}`}
                                className="hover:text-indigo-600 hover:underline"
                              >
                                {t.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">
                              {t.expand?.requester?.name || 'Usuário'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                {t.expand?.sector?.name || 'Geral'}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium border border-indigo-100">
                                {t.category}
                              </span>
                            </TableCell>
                            <TableCell>
                              <PriorityBadge priority={t.priority} />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={t.status}
                                onValueChange={(val) =>
                                  handleInlineStatusChange(t.id, val as TicketStatus)
                                }
                              >
                                <SelectTrigger className="h-7 w-[130px] text-[11px] bg-white border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Aberto">Aberto</SelectItem>
                                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                                  <SelectItem value="Concluído">Concluído</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs text-slate-400">{dateStr}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs"
                              >
                                <Link to={`/chamados/${t.id}`}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Detalhes
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USUÁRIOS TAB */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar usuário por nome, e-mail ou setor..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  Total: <strong>{filteredUsers.length}</strong> usuários
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Usuário
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          E-mail Corporativo
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Setor de Atuação
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Papel / Acesso
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600">
                          Cadastrado em
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold text-slate-600">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => {
                        const createdDate = new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                        }).format(new Date(u.created))

                        const isCurrentUser = u.id === user?.id

                        return (
                          <TableRow key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-xs text-slate-900">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                    {getInitials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="leading-tight">{u.name}</p>
                                  {isCurrentUser && (
                                    <span className="text-[10px] text-indigo-600 font-semibold">
                                      (Você)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-slate-600 font-mono">
                              {u.email}
                            </TableCell>

                            <TableCell className="text-xs">
                              <Select
                                value={u.sector || ''}
                                onValueChange={(val) => handleUserSectorChange(u.id, val)}
                              >
                                <SelectTrigger className="h-7 w-[150px] text-[11px] bg-white">
                                  <SelectValue placeholder="Sem setor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sectors.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell>
                              {u.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                  <Shield className="h-3 w-3" />
                                  Administrador
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  <UserIcon className="h-3 w-3" />
                                  Usuário Comum
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-slate-400">{createdDate}</TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRoleModalUser(u)}
                                disabled={isCurrentUser}
                                className="h-7 text-xs border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                {u.role === 'admin' ? 'Tornar Usuário' : 'Tornar Admin'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTOQUE TAB */}
        <TabsContent value="estoque" className="space-y-4">
          <InventoryTab />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Role Change */}
      <Dialog open={!!roleModalUser} onOpenChange={(open) => !open && setRoleModalUser(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              Confirmar alteração de permissão
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Você está alterando o papel de{' '}
              <strong className="text-slate-800">{roleModalUser?.name}</strong> para{' '}
              <strong className="text-indigo-600 font-bold">
                {roleModalUser?.role === 'admin' ? 'Usuário Comum' : 'Administrador'}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {roleModalUser?.role === 'admin'
              ? 'O usuário perderá o acesso ao painel de administração e relatórios da organização.'
              : 'O usuário terá acesso a todos os chamados da empresa, relatórios gerenciais e gestão de usuários.'}
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoleModalUser(null)}
              disabled={roleChanging}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={handleConfirmRoleChange}
              disabled={roleChanging}
            >
              {roleChanging ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar alteração'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
