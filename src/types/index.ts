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

// ---------- New collections ----------

export interface KnowledgeArticle extends RecordModel {
  title: string
  content: string
  category: string
}

export interface QuickReply extends RecordModel {
  title: string
  content: string
  category?: string
  created_by?: string
  expand?: {
    created_by?: User
  }
}

export interface Category extends RecordModel {
  name: string
}

export interface Priority extends RecordModel {
  name: string
  sla_hours?: number
}

export interface Company extends RecordModel {
  name: string
  cnpj?: string
  phone?: string
  email?: string
}

export interface Contact extends RecordModel {
  name: string
  email?: string
  phone?: string
  company?: string
  expand?: {
    company?: Company
  }
}

export type ApprovalStatus = 'Pendente' | 'Aprovado' | 'Rejeitado'

export interface Approval extends RecordModel {
  title: string
  description?: string
  status: ApprovalStatus
  requester: string
  approver?: string | null
  expand?: {
    requester?: User
    approver?: User
  }
}

export interface AuditLog extends RecordModel {
  action: string
  entity_type?: string
  entity_id?: string
  user?: string
  details?: string
  expand?: {
    user?: User
  }
}

export interface SystemSettings extends RecordModel {
  system_name?: string
  system_subtitle?: string
  logo_url?: string
  primary_color?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
}

export type AssetType =
  | 'Computador'
  | 'Notebook'
  | 'Impressora'
  | 'Monitor'
  | 'Smartphone'
  | 'Outros'

export type AssetStatus = 'Em uso' | 'Em manutenção' | 'Desativado' | 'Em estoque'

export interface Asset extends RecordModel {
  name: string
  type: AssetType
  serial_number?: string
  status: AssetStatus
  sector?: string
  user?: string
  specifications?: string
  expand?: {
    sector?: Sector
    user?: User
  }
}

export interface InventoryItem extends RecordModel {
  name: string
  description?: string
  category?: string
  quantity: number
  min_quantity: number
  unit?: string
}

export interface InventoryLocation extends RecordModel {
  name: string
  description?: string
}

export type InventoryMovementType = 'Entrada' | 'Saída' | 'Transferência'

export interface InventoryMovement extends RecordModel {
  item: string
  from_location?: string
  to_location?: string
  quantity: number
  type: InventoryMovementType
  notes?: string
  created_by?: string
  expand?: {
    item?: InventoryItem
    from_location?: InventoryLocation
    to_location?: InventoryLocation
    created_by?: User
  }
}
