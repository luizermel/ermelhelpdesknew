import type { RecordModel } from 'pocketbase'

export type UserRole = 'user' | 'admin'

export interface Sector extends RecordModel {
  name: string
}

export interface User extends RecordModel {
  email: string
  name: string
  role: UserRole
  sector?: string
  avatar?: string
  expand?: {
    sector?: Sector
  }
}

export type TicketCategory =
  | 'Hardware'
  | 'Software'
  | 'Rede'
  | 'Acesso e Senha'
  | 'E-mail'
  | 'Impressora'
  | 'Telefonia'
  | 'Outros'

export type TicketStatus = 'Aberto' | 'Em andamento' | 'Concluído'
export type TicketPriority = 'Baixa' | 'Média' | 'Alta'

export interface Ticket extends RecordModel {
  title: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  requester: string
  assigned_to?: string | null
  sector: string
  attachments?: string[]
  expand?: {
    requester?: User
    assigned_to?: User
    sector?: Sector
  }
}

export type TicketEventType = 'comentario' | 'status'

export interface TicketMessage extends RecordModel {
  ticket: string
  author: string
  content: string
  event_type: TicketEventType
  expand?: {
    author?: User
  }
}
