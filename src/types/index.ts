import type { RecordModel } from 'pocketbase'

export type UserRole = 'user' | 'admin'

export interface Sector extends RecordModel {
  name: string
}

export interface User extends RecordModel {
  email: string
  name: string
  role: UserRole
  role_profile?: string
  sector?: string
  company?: string
  avatar?: string
  situacao?: boolean
  expand?: {
    sector?: Sector
    company?: Company
    role_profile?: Role
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

export type TicketStatus =
  | 'Aberto'
  | 'Em andamento'
  | 'Concluído'
  | 'Finalizado'
  | 'Finalizado e Aprovado'
export type TicketPriority = 'Baixa' | 'Média' | 'Alta'

export interface Ticket extends RecordModel {
  title: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  finalized_by?: string | null
  requester: string
  assigned_to?: string | null
  sector: string
  attachments?: string[]
  asset?: string | null
  expand?: {
    requester?: User
    assigned_to?: User
    sector?: Sector
    asset?: InventoryItem
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

export type KnowledgeVisibility = 'GERAL' | 'Por empresa'

export interface KnowledgeArticle extends RecordModel {
  title: string
  content: string
  category: string
  visibility: KnowledgeVisibility
  company?: string
  attachments?: string[]
  expand?: {
    company?: Company
  }
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

export interface Subcategory extends RecordModel {
  name: string
  category_id?: string
}

export interface Priority extends RecordModel {
  name: string
  sla_hours?: number
  level?: number
  color?: string
  active?: boolean
}

export interface Company extends RecordModel {
  name: string
  cnpj?: string
  phone?: string
  email?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  smtp_security?: 'TLS' | 'SSL' | 'Nenhum'
  smtp_sender_email?: string
  smtp_sender_name?: string
  smtp_use_tls?: boolean
}

// ---------- Produtos, Fabricantes, Fornecedores ----------
export interface ProductCategory extends RecordModel {
  name: string
}

export interface ProductSubcategory extends RecordModel {
  name: string
  category?: string
  expand?: {
    category?: ProductCategory
  }
}

export interface Brand extends RecordModel {
  name: string
}

export interface Manufacturer extends RecordModel {
  name: string
  cnpj?: string
  contact?: string
  phone?: string
  email?: string
  site?: string
  situacao?: boolean
}

export interface Supplier extends RecordModel {
  name: string
  cnpj?: string
  contact?: string
  phone?: string
  email?: string
  site?: string
  situacao?: boolean
}

export interface Product extends RecordModel {
  name: string
  category?: string
  subcategory?: string
  manufacturer?: string
  supplier?: string
  cost_price?: number
  sale_price?: number
  unit?: string
  min_stock?: number
  is_it_asset?: boolean
  is_patrimony?: boolean
  avg_price?: number
  situacao?: boolean
  barcode?: string
  is_serial?: boolean
  expand?: {
    category?: ProductCategory
    subcategory?: ProductSubcategory
    manufacturer?: Manufacturer
    supplier?: Supplier
  }
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
  requester?: string
  approver?: string | null
  name?: string
  email?: string
  sector_text?: string
  company_text?: string
  company?: string
  sector?: string
  expand?: {
    requester?: User
    approver?: User
    company?: Company
    sector?: Sector
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

export interface CustomMenuItem {
  path: string
  label: string
  iconName: string
}

export interface SystemSettings extends RecordModel {
  system_name?: string
  system_subtitle?: string
  logo_url?: string
  primary_color?: string
  panel_color?: string
  institutional_desc?: string
  show_institutional_newline?: boolean
  login_title?: string
  login_desc?: string
  footer_left?: string
  footer_right?: string
  allow_public_register?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  custom_menu?: CustomMenuItem[]
  finalization_approval_hours?: number
  reopen_deadline_hours?: number
}

export interface Role extends RecordModel {
  name: string
  description?: string
  can_view_reports?: boolean
  can_manage_users?: boolean
  can_manage_tickets?: boolean
  can_manage_settings?: boolean
  can_manage_inventory?: boolean
  is_admin?: boolean
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

export type InventoryItemStatus =
  | 'Em uso'
  | 'Em manutenção'
  | 'Em estoque'
  | 'Desativado'
  | 'Aguardando Lançamento'

export interface InventoryItem extends RecordModel {
  name: string
  description?: string
  category?: string
  quantity: number
  min_quantity: number
  unit?: string
  item_type?: 'Ativo' | 'Consumível'
  serial_number?: string
  location?: string
  status?: InventoryItemStatus
  product?: string
  patrimony_number?: string
  is_it_asset?: boolean
  is_patrimony?: boolean
  barcode?: string
  assigned_user?: string
  expand?: {
    location?: InventoryLocation
    product?: Product
    assigned_user?: User
  }
}

export type MaterialRequestStatus = 'Pendente' | 'Aprovado' | 'Rejeitado'
export type SignatureType = 'Sistema' | 'LinkPúblico'

export interface MaterialRequest extends RecordModel {
  requester: string
  item?: string
  item_name?: string
  item_type: 'Ativo' | 'Consumível'
  quantity: number
  unit?: string
  destination_location?: string
  reason: string
  status: MaterialRequestStatus
  signature_type?: SignatureType
  signature_name?: string
  signature_email?: string
  signature_notes?: string
  signed_at?: string
  token?: string
  approver?: string
  rejection_reason?: string
  expand?: {
    requester?: User
    item?: InventoryItem
    destination_location?: InventoryLocation
    approver?: User
  }
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
