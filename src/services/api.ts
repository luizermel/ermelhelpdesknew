import pb from '@/lib/pocketbase/client'
import type {
  Approval,
  ApprovalStatus,
  Asset,
  AuditLog,
  Category,
  Subcategory,
  Company,
  Contact,
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
  InventoryMovementType,
  MaterialRequest,
  KnowledgeArticle,
  Priority,
  Product,
  ProductCategory,
  ProductSubcategory,
  Brand,
  Manufacturer,
  Supplier,
  QuickReply,
  Sector,
  SystemSettings,
  Ticket,
  TicketMessage,
  User,
  Role,
} from '@/types'

export const rolesService = {
  async getAll(): Promise<Role[]> {
    return await pb.collection('roles').getFullList<Role>({ sort: 'name' })
  },
  async create(data: Partial<Role>): Promise<Role> {
    const r = await pb.collection('roles').create<Role>(data)
    await auditService.log('create', 'role', r.id, `Perfil de acesso criado: ${data.name}`)
    return r
  },
  async update(id: string, data: Partial<Role>): Promise<Role> {
    const r = await pb.collection('roles').update<Role>(id, data)
    await auditService.log('update', 'role', id, `Perfil de acesso atualizado: ${data.name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('roles').delete(id)
    await auditService.log('delete', 'role', id, 'Perfil de acesso removido')
  },
}

export const sectorsService = {
  async getAll(): Promise<Sector[]> {
    return await pb.collection('sectors').getFullList<Sector>({
      sort: 'name',
    })
  },

  async getById(id: string): Promise<Sector> {
    return await pb.collection('sectors').getOne<Sector>(id)
  },
}

export const ticketsService = {
  async getAll(options?: { filter?: string; sort?: string; page?: number; perPage?: number }) {
    const sort = options?.sort || '-created'
    const filter = options?.filter || ''

    return await pb
      .collection('tickets')
      .getList<Ticket>(options?.page || 1, options?.perPage || 100, {
        filter,
        sort,
        expand: 'requester,assigned_to,sector',
      })
  },

  async getFullList(filter?: string) {
    return await pb.collection('tickets').getFullList<Ticket>({
      filter: filter || '',
      sort: '-created',
      expand: 'requester,assigned_to,sector',
    })
  },

  async getById(id: string): Promise<Ticket> {
    return await pb.collection('tickets').getOne<Ticket>(id, {
      expand: 'requester,assigned_to,sector',
    })
  },

  async create(data: FormData | Record<string, unknown>): Promise<Ticket> {
    return await pb.collection('tickets').create<Ticket>(data, {
      expand: 'requester,assigned_to,sector',
    })
  },

  async update(id: string, data: FormData | Record<string, unknown>): Promise<Ticket> {
    return await pb.collection('tickets').update<Ticket>(id, data, {
      expand: 'requester,assigned_to,sector',
    })
  },

  async updateStatus(ticketId: string, newStatus: Ticket['status'], authorId: string) {
    // Manufacturers (Fabricantes) — CRUD
// =========================================================
=======
// =========================================================
// Brands (Marcas) — CRUD
// =========================================================
export const brandsService = {
  async getAll(): Promise<Brand[]> {
    return await pb.collection('brands').getFullList<Brand>({ sort: 'name' })
  },
  async create(data: { name: string }): Promise<Brand> {
    const r = await pb.collection('brands').create<Brand>(data)
    await auditService.log('create', 'brand', r.id, `Marca criada: ${data.name}`)
    return r
  },
  async update(id: string, data: { name: string }): Promise<Brand> {
    const r = await pb.collection('brands').update<Brand>(id, data)
    await auditService.log('update', 'brand', id, `Marca atualizada: ${data.name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('brands').delete(id)
    await auditService.log('delete', 'brand', id, 'Marca removida')
  },
}

// =========================================================
// Manufacturers (Fabricantes) — CRUD
// =========================================================1. Update ticket status
    const updated = await pb.collection('tickets').update<Ticket>(
      ticketId,
      {
        status: newStatus,
      },
      {
        expand: 'requester,assigned_to,sector',
      },
    )

    // 2. Append status event message to timeline
    await pb.collection('ticket_messages').create({
      ticket: ticketId,
      author: authorId,
      content: `Status alterado para ${newStatus}`,
      event_type: 'status',
    })

    return updated
  },

  async assignToAdmin(ticketId: string, adminId: string) {
    return await pb.collection('tickets').update<Ticket>(
      ticketId,
      {
        assigned_to: adminId,
      },
      {
        expand: 'requester,assigned_to,sector',
      },
    )
  },
}

export const messagesService = {
  async getByTicketId(ticketId: string): Promise<TicketMessage[]> {
    return await pb.collection('ticket_messages').getFullList<TicketMessage>({
      filter: `ticket = "${ticketId}"`,
      sort: 'created',
      expand: 'author',
    })
  },

  async create(data: {
    ticket: string
    author: string
    content: string
    event_type?: 'comentario' | 'status'
  }): Promise<TicketMessage> {
    return await pb.collection('ticket_messages').create<TicketMessage>(
      {
        ticket: data.ticket,
        author: data.author,
        content: data.content,
        event_type: data.event_type || 'comentario',
      },
      {
        expand: 'author',
      },
    )
  },
}

export const usersService = {
  async getAll(): Promise<User[]> {
    return await pb.collection('users').getFullList<User>({
      sort: 'name',
      expand: 'sector,company,role_profile',
    })
  },

  async updateRoleProfile(userId: string, roleProfileId: string): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { role_profile: roleProfileId },
      {
        expand: 'sector,company,role_profile',
      },
    )
  },

  async updateRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { role },
      {
        expand: 'sector,company',
      },
    )
  },

  async updateSector(userId: string, sectorId: string): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { sector: sectorId },
      {
        expand: 'sector,company',
      },
    )
  },

  async updateCompany(userId: string, companyId: string): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { company: companyId },
      {
        expand: 'sector,company',
      },
    )
  },

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; situacao?: boolean },
  ): Promise<User> {
    const payload: Record<string, unknown> = {}
    if (typeof data.name !== 'undefined') payload.name = data.name
    if (typeof data.email !== 'undefined') payload.email = data.email
    if (typeof data.situacao !== 'undefined') payload.situacao = data.situacao
    return await pb.collection('users').update<User>(userId, payload, {
      expand: 'sector,company',
    })
  },
}
export const getFileUrl = (
  record: { id: string; collectionId?: string; collectionName?: string },
  filename: string,
) => {
  return pb.files.getURL(record, filename)
}

// =========================================================
// Audit logs helper
// =========================================================
export const auditService = {
  async log(action: string, entityType = '', entityId = '', details = ''): Promise<void> {
    try {
      const user = pb.authStore.model as { id?: string } | null
      if (!user?.id) return
      await pb.collection('audit_logs').create({
        action,
        entity_type: entityType,
        entity_id: entityId,
        user: user.id,
        details,
      })
    } catch (e) {
      // best-effort, never block UI
      console.warn('audit log failed', e)
    }
  },
}

// =========================================================
// Knowledge articles
// =========================================================
export const knowledgeService = {
  async getAll(search?: string): Promise<KnowledgeArticle[]> {
    const filter = search ? `title ~ "${search}" || category ~ "${search}"` : ''
    return await pb.collection('knowledge_articles').getFullList<KnowledgeArticle>({
      sort: '-created',
      filter,
      expand: 'company',
    })
  },
  async getById(id: string): Promise<KnowledgeArticle> {
    return await pb.collection('knowledge_articles').getOne<KnowledgeArticle>(id, {
      expand: 'company',
    })
  },
  async create(data: FormData | Record<string, unknown>): Promise<KnowledgeArticle> {
    const r = await pb
      .collection('knowledge_articles')
      .create<KnowledgeArticle>(data, { expand: 'company' })
    const title =
      data instanceof FormData ? (data.get('title') as string) : (data as { title?: string }).title
    await auditService.log('create', 'knowledge_article', r.id, `Artigo criado: ${title}`)
    return r
  },
  async update(id: string, data: FormData | Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const r = await pb
      .collection('knowledge_articles')
      .update<KnowledgeArticle>(id, data, { expand: 'company' })
    const title =
      data instanceof FormData ? (data.get('title') as string) : (data as { title?: string }).title
    await auditService.log('update', 'knowledge_article', id, `Artigo atualizado: ${title || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('knowledge_articles').delete(id)
    await auditService.log('delete', 'knowledge_article', id, 'Artigo removido')
  },
}

// =========================================================
// Quick replies
// =========================================================
export const quickRepliesService = {
  async getAll(): Promise<QuickReply[]> {
    return await pb.collection('quick_replies').getFullList<QuickReply>({
      sort: '-created',
      expand: 'created_by',
    })
  },
  async create(data: {
    title: string
    content: string
    category?: string
    created_by?: string
  }): Promise<QuickReply> {
    const r = await pb
      .collection('quick_replies')
      .create<QuickReply>(data, { expand: 'created_by' })
    await auditService.log('create', 'quick_reply', r.id, `Resposta rápida criada: ${data.title}`)
    return r
  },
  async update(
    id: string,
    data: Partial<{ title: string; content: string; category?: string }>,
  ): Promise<QuickReply> {
    const r = await pb
      .collection('quick_replies')
      .update<QuickReply>(id, data, { expand: 'created_by' })
    await auditService.log(
      'update',
      'quick_reply',
      id,
      `Resposta rápida atualizada: ${data.title || id}`,
    )
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('quick_replies').delete(id)
    await auditService.log('delete', 'quick_reply', id, 'Resposta rápida removida')
  },
}

// =========================================================
// Categories
// =========================================================
export const categoriesService = {
  async getAll(): Promise<Category[]> {
    return await pb.collection('categories').getFullList<Category>({ sort: 'name' })
  },
  async create(name: string): Promise<Category> {
    const r = await pb.collection('categories').create<Category>({ name })
    await auditService.log('create', 'category', r.id, `Categoria criada: ${name}`)
    return r
  },
  async update(id: string, name: string): Promise<Category> {
    const r = await pb.collection('categories').update<Category>(id, { name })
    await auditService.log('update', 'category', id, `Categoria atualizada: ${name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('categories').delete(id)
    await auditService.log('delete', 'category', id, 'Categoria removida')
  },
}

export const subcategoriesService = {
  async getAll(): Promise<Subcategory[]> {
    return await pb.collection('subcategories').getFullList<Subcategory>({ sort: 'name' })
  },
  async create(name: string, category_id?: string): Promise<Subcategory> {
    const r = await pb.collection('subcategories').create<Subcategory>({ name, category_id })
    await auditService.log('create', 'subcategory', r.id, `Subcategoria criada: ${name}`)
    return r
  },
  async update(id: string, name: string, category_id?: string): Promise<Subcategory> {
    const r = await pb.collection('subcategories').update<Subcategory>(id, { name, category_id })
    await auditService.log('update', 'subcategory', id, `Subcategoria atualizada: ${name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('subcategories').delete(id)
    await auditService.log('delete', 'subcategory', id, 'Subcategoria removida')
  },
}

// =========================================================
// Priorities
// =========================================================
export const prioritiesService = {
  async getAll(): Promise<Priority[]> {
    return await pb.collection('priorities').getFullList<Priority>({ sort: 'level,name' })
  },
  async create(data: {
    name: string
    sla_hours?: number
    level?: number
    color?: string
    active?: boolean
  }): Promise<Priority> {
    const r = await pb.collection('priorities').create<Priority>(data)
    await auditService.log('create', 'priority', r.id, `Prioridade criada: ${data.name}`)
    return r
  },
  async update(
    id: string,
    data: Partial<{
      name: string
      sla_hours?: number
      level?: number
      color?: string
      active?: boolean
    }>,
  ): Promise<Priority> {
    const r = await pb.collection('priorities').update<Priority>(id, data)
    await auditService.log('update', 'priority', id, `Prioridade atualizada: ${data.name || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('priorities').delete(id)
    await auditService.log('delete', 'priority', id, 'Prioridade removida')
  },
}

// =========================================================
// Companies
// =========================================================
export const companiesService = {
  async getAll(): Promise<Company[]> {
    return await pb.collection('companies').getFullList<Company>({ sort: 'name' })
  },
  async create(data: Partial<Company>): Promise<Company> {
    const r = await pb.collection('companies').create<Company>(data)
    await auditService.log('create', 'company', r.id, `Empresa criada: ${data.name}`)
    return r
  },
  async update(id: string, data: Partial<Company>): Promise<Company> {
    const r = await pb.collection('companies').update<Company>(id, data)
    await auditService.log('update', 'company', id, `Empresa atualizada: ${data.name || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('companies').delete(id)
    await auditService.log('delete', 'company', id, 'Empresa removida')
  },
}

// =========================================================
// Contacts
// =========================================================
export const contactsService = {
  async getAll(): Promise<Contact[]> {
    return await pb.collection('contacts').getFullList<Contact>({ sort: 'name', expand: 'company' })
  },
  async create(data: {
    name: string
    email?: string
    phone?: string
    company?: string
  }): Promise<Contact> {
    const r = await pb.collection('contacts').create<Contact>(data, { expand: 'company' })
    await auditService.log('create', 'contact', r.id, `Contato criado: ${data.name}`)
    return r
  },
  async update(
    id: string,
    data: Partial<{ name: string; email?: string; phone?: string; company?: string }>,
  ): Promise<Contact> {
    const r = await pb.collection('contacts').update<Contact>(id, data, { expand: 'company' })
    await auditService.log('update', 'contact', id, `Contato atualizado: ${data.name || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('contacts').delete(id)
    await auditService.log('delete', 'contact', id, 'Contato removido')
  },
}

// =========================================================
// Approvals
// =========================================================
export const approvalsService = {
  async getAll(): Promise<Approval[]> {
    return await pb.collection('approvals').getFullList<Approval>({
      sort: '-created',
      expand: 'requester,approver,company,sector',
    })
  },
  async create(data: Record<string, unknown>): Promise<Approval> {
    const r = await pb
      .collection('approvals')
      .create<Approval>(data, { expand: 'requester,approver,company,sector' })
    await auditService.log(
      'create',
      'approval',
      r.id,
      `Aprovação criada: ${data.title || 'Solicitação'}`,
    )
    return r
  },
  async update(id: string, data: Record<string, unknown>): Promise<Approval> {
    const r = await pb
      .collection('approvals')
      .update<Approval>(id, data, { expand: 'requester,approver,company,sector' })
    await auditService.log('update', 'approval', id, `Aprovação atualizada: ${id}`)
    return r
  },
  async decide(id: string, status: ApprovalStatus, approverId: string): Promise<Approval> {
    const r = await pb
      .collection('approvals')
      .update<Approval>(
        id,
        { status, approver: approverId },
        { expand: 'requester,approver,company,sector' },
      )
    await auditService.log(
      status === 'Aprovado' ? 'approve' : 'reject',
      'approval',
      id,
      `Aprovação ${status}: ${r.title}`,
    )
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('approvals').delete(id)
    await auditService.log('delete', 'approval', id, 'Aprovação removida')
  },
}

// =========================================================
// Audit logs
// =========================================================
export const auditLogsService = {
  async getAll(params?: {
    action?: string
    entityType?: string
    userId?: string
  }): Promise<AuditLog[]> {
    const filters: string[] = []
    if (params?.action) filters.push(`action = "${params.action}"`)
    if (params?.entityType) filters.push(`entity_type = "${params.entityType}"`)
    if (params?.userId) filters.push(`user = "${params.userId}"`)
    return await pb.collection('audit_logs').getFullList<AuditLog>({
      sort: '-created',
      filter: filters.join(' && '),
      expand: 'user',
    })
  },
}

// =========================================================
// System settings
// =========================================================
export const settingsService = {
  async get(): Promise<SystemSettings | null> {
    try {
      const list = await pb
        .collection('system_settings')
        .getFullList<SystemSettings>({ sort: '-created' })
      return list[0] || null
    } catch {
      return null
    }
  },
  async update(id: string, data: Partial<SystemSettings>): Promise<SystemSettings> {
    return await pb.collection('system_settings').update<SystemSettings>(id, data)
  },
  async create(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return await pb.collection('system_settings').create<SystemSettings>(data)
  },
}

// =========================================================
// Assets
// =========================================================
export const assetsService = {
  async getAll(): Promise<Asset[]> {
    return await pb.collection('assets').getFullList<Asset>({
      sort: '-created',
      expand: 'sector,user',
    })
  },
  async getById(id: string): Promise<Asset> {
    return await pb.collection('assets').getOne<Asset>(id, { expand: 'sector,user' })
  },
  async create(data: Record<string, unknown>): Promise<Asset> {
    const r = await pb.collection('assets').create<Asset>(data, { expand: 'sector,user' })
    await auditService.log('create', 'asset', r.id, `Ativo criado: ${r.name}`)
    return r
  },
  async update(id: string, data: Record<string, unknown>): Promise<Asset> {
    const r = await pb.collection('assets').update<Asset>(id, data, { expand: 'sector,user' })
    await auditService.log('update', 'asset', id, `Ativo atualizado: ${r.name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('assets').delete(id)
    await auditService.log('delete', 'asset', id, 'Ativo removido')
  },
}

// =========================================================
// Inventory items
// =========================================================
export const inventoryItemsService = {
  async getAll(): Promise<InventoryItem[]> {
    return await pb.collection('inventory_items').getFullList<InventoryItem>({
      sort: 'name',
      expand: 'location,product',
    })
  },
  async create(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const r = await pb.collection('inventory_items').create<InventoryItem>(data)
    await auditService.log('create', 'inventory_item', r.id, `Item criado: ${r.name}`)
    return r
  },
  async update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const r = await pb.collection('inventory_items').update<InventoryItem>(id, data)
    await auditService.log('update', 'inventory_item', id, `Item atualizado: ${r.name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('inventory_items').delete(id)
    await auditService.log('delete', 'inventory_item', id, 'Item removido')
  },
}

// =========================================================
// Inventory locations
// =========================================================
export const inventoryLocationsService = {
  async getAll(): Promise<InventoryLocation[]> {
    return await pb
      .collection('inventory_locations')
      .getFullList<InventoryLocation>({ sort: 'name' })
  },
  async create(data: Partial<InventoryLocation>): Promise<InventoryLocation> {
    const r = await pb.collection('inventory_locations').create<InventoryLocation>(data)
    await auditService.log('create', 'inventory_location', r.id, `Local criado: ${r.name}`)
    return r
  },
  async update(id: string, data: Partial<InventoryLocation>): Promise<InventoryLocation> {
    const r = await pb.collection('inventory_locations').update<InventoryLocation>(id, data)
    await auditService.log('update', 'inventory_location', id, `Local atualizado: ${r.name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('inventory_locations').delete(id)
    await auditService.log('delete', 'inventory_location', id, 'Local removido')
  },
}

// =========================================================
// Inventory movements
// =========================================================
export const inventoryMovementsService = {
  async getAll(): Promise<InventoryMovement[]> {
    return await pb.collection('inventory_movements').getFullList<InventoryMovement>({
      sort: '-created',
      expand: 'item,from_location,to_location,created_by',
    })
  },
  async create(data: {
    item: string
    from_location?: string
    to_location?: string
    quantity: number
    type: InventoryMovementType
    notes?: string
    created_by?: string
  }): Promise<InventoryMovement> {
    const r = await pb.collection('inventory_movements').create<InventoryMovement>(data, {
      expand: 'item,from_location,to_location,created_by',
    })
    await auditService.log(
      'create',
      'inventory_movement',
      r.id,
      `Movimentação (${data.type}) de ${data.quantity}`,
    )
    return r
  },
}

// =========================================================
// Material requests service
// =========================================================
export const materialRequestsService = {
  async getAll(): Promise<MaterialRequest[]> {
    return await pb.collection('material_requests').getFullList<MaterialRequest>({
      sort: '-created',
      expand: 'requester,item,destination_location,approver',
    })
  },
  async getByToken(token: string): Promise<MaterialRequest | null> {
    try {
      const records = await pb.collection('material_requests').getFullList<MaterialRequest>({
        filter: `token = "${token}"`,
        expand: 'requester,item,destination_location,approver',
      })
      return records[0] || null
    } catch {
      return null
    }
  },
  async create(data: Partial<MaterialRequest>): Promise<MaterialRequest> {
    // Generate a secure signature token for public confirmation if needed
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const r = await pb.collection('material_requests').create<MaterialRequest>(
      {
        ...data,
        status: 'Pendente',
        token,
      },
      {
        expand: 'requester,item,destination_location,approver',
      },
    )
    await auditService.log(
      'create',
      'material_request',
      r.id,
      `Requisição criada: ${r.item_name || 'Material'}`,
    )
    return r
  },
  async approve(
    id: string,
    approverId: string,
    signatureData: {
      signature_type: 'Sistema' | 'LinkPúblico'
      signature_name: string
      signature_email?: string
      signature_notes?: string
    },
  ): Promise<MaterialRequest> {
    const req = await pb.collection('material_requests').getOne<MaterialRequest>(id, {
      expand: 'item,destination_location',
    })

    const updated = await pb.collection('material_requests').update<MaterialRequest>(
      id,
      {
        status: 'Aprovado',
        approver: approverId,
        signed_at: new Date().toISOString(),
        ...signatureData,
      },
      {
        expand: 'requester,item,destination_location,approver',
      },
    )

    // Execute auto-inventory deduction or movement if linked item exists
    if (req.item) {
      try {
        const itemRecord = await pb.collection('inventory_items').getOne<InventoryItem>(req.item)
        const currentQty = itemRecord.quantity || 0
        const newQty = Math.max(0, currentQty - (req.quantity || 1))

        // Update stock quantity
        await pb.collection('inventory_items').update(req.item, {
          quantity: newQty,
          ...(req.destination_location ? { location: req.destination_location } : {}),
        })

        // Log movement
        await inventoryMovementsService.create({
          item: req.item,
          from_location: itemRecord.location,
          to_location: req.destination_location,
          quantity: req.quantity || 1,
          type: req.destination_location ? 'Transferência' : 'Saída',
          notes: `Baixa via aprovação de requisição (${updated.id}) - Assinado por ${signatureData.signature_name}`,
          created_by: approverId,
        })
      } catch (err) {
        console.error('Erro ao dar baixa/transferir item no estoque:', err)
      }
    }

    await auditService.log(
      'update',
      'material_request',
      id,
      `Requisição APROVADA com assinatura de ${signatureData.signature_name} (${signatureData.signature_type})`,
    )

    return updated
  },
  async reject(id: string, approverId: string, reason: string): Promise<MaterialRequest> {
    const updated = await pb.collection('material_requests').update<MaterialRequest>(
      id,
      {
        status: 'Rejeitado',
        approver: approverId,
        rejection_reason: reason,
      },
      {
        expand: 'requester,item,destination_location,approver',
      },
    )

    await auditService.log('update', 'material_request', id, `Requisição REJEITADA: ${reason}`)
    return updated
  },
}

// =========================================================
// Sectors CRUD (existing collection, previously read-only)
// =========================================================
export const sectorsCrudService = {
  async create(name: string): Promise<Sector> {
    const r = await pb.collection('sectors').create<Sector>({ name })
    await auditService.log('create', 'sector', r.id, `Setor criado: ${name}`)
    return r
  },
  async update(id: string, name: string): Promise<Sector> {
    const r = await pb.collection('sectors').update<Sector>(id, { name })
    await auditService.log('update', 'sector', id, `Setor atualizado: ${name}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('sectors').delete(id)
    await auditService.log('delete', 'sector', id, 'Setor removido')
  },
}

// =========================================================
// Product categories (CRUD)
// =========================================================
export const productCategoriesService = {
  async getAll(): Promise<ProductCategory[]> {
    return await pb.collection('product_categories').getFullList<ProductCategory>({ sort: 'name' })
  },
  async create(data: { name: string }): Promise<ProductCategory> {
    const r = await pb.collection('product_categories').create<ProductCategory>(data)
    await auditService.log(
      'create',
      'product_category',
      r.id,
      `Categoria de produto criada: ${data.name}`,
    )
    return r
  },
  async update(id: string, data: { name: string }): Promise<ProductCategory> {
    const r = await pb.collection('product_categories').update<ProductCategory>(id, data)
    await auditService.log(
      'update',
      'product_category',
      id,
      `Categoria de produto atualizada: ${data.name}`,
    )
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('product_categories').delete(id)
    await auditService.log('delete', 'product_category', id, 'Categoria de produto removida')
  },
}

// =========================================================
// Product subcategories (CRUD) — vinculadas a categorias de produto
// =========================================================
export const productSubcategoriesService = {
  async getAll(): Promise<ProductSubcategory[]> {
    return await pb
      .collection('product_subcategories')
      .getFullList<ProductSubcategory>({ sort: 'name', expand: 'category' })
  },
  async create(data: { name: string; category?: string }): Promise<ProductSubcategory> {
    const r = await pb.collection('product_subcategories').create<ProductSubcategory>(data, {
      expand: 'category',
    })
    await auditService.log(
      'create',
      'product_subcategory',
      r.id,
      `Subcategoria de produto criada: ${data.name}`,
    )
    return r
  },
  async update(id: string, data: { name: string; category?: string }): Promise<ProductSubcategory> {
    const r = await pb
      .collection('product_subcategories')
      .update<ProductSubcategory>(id, data, { expand: 'category' })
    await auditService.log(
      'update',
      'product_subcategory',
      id,
      `Subcategoria de produto atualizada: ${data.name}`,
    )
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('product_subcategories').delete(id)
    await auditService.log('delete', 'product_subcategory', id, 'Subcategoria de produto removida')
  },
}

// =========================================================
// Manufacturers (Fabricantes) — CRUD
// =========================================================
export const manufacturersService = {
  async getAll(): Promise<Manufacturer[]> {
    return await pb.collection('manufacturers').getFullList<Manufacturer>({ sort: 'name' })
  },
  async create(data: Partial<Manufacturer>): Promise<Manufacturer> {
    const r = await pb.collection('manufacturers').create<Manufacturer>(data)
    await auditService.log('create', 'manufacturer', r.id, `Fabricante criado: ${data.name}`)
    return r
  },
  async update(id: string, data: Partial<Manufacturer>): Promise<Manufacturer> {
    const r = await pb.collection('manufacturers').update<Manufacturer>(id, data)
    await auditService.log(
      'update',
      'manufacturer',
      id,
      `Fabricante atualizado: ${data.name || id}`,
    )
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('manufacturers').delete(id)
    await auditService.log('delete', 'manufacturer', id, 'Fabricante removido')
  },
}

// =========================================================
// Suppliers (Fornecedores) — CRUD
// =========================================================
export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    return await pb.collection('suppliers').getFullList<Supplier>({ sort: 'name' })
  },
  async create(data: Partial<Supplier>): Promise<Supplier> {
    const r = await pb.collection('suppliers').create<Supplier>(data)
    await auditService.log('create', 'supplier', r.id, `Fornecedor criado: ${data.name}`)
    return r
  },
  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const r = await pb.collection('suppliers').update<Supplier>(id, data)
    await auditService.log('update', 'supplier', id, `Fornecedor atualizado: ${data.name || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('suppliers').delete(id)
    await auditService.log('delete', 'supplier', id, 'Fornecedor removido')
  },
}

// =========================================================
// Products (Produtos) — CRUD
// =========================================================
export const productsService = {
  async getAll(): Promise<Product[]> {
    return await pb
      .collection('products')
      .getFullList<Product>({ sort: 'name', expand: 'category,subcategory,manufacturer,supplier' })
  },
  async getItAssets(): Promise<Product[]> {
    return await pb.collection('products').getFullList<Product>({
      sort: 'name',
      filter: 'is_it_asset = true',
      expand: 'category,subcategory,manufacturer,supplier',
    })
  },
  async create(data: Partial<Product>): Promise<Product> {
    const r = await pb
      .collection('products')
      .create<Product>(data, { expand: 'category,subcategory,manufacturer,supplier' })
    await auditService.log('create', 'product', r.id, `Produto criado: ${data.name}`)
    return r
  },
  async update(id: string, data: Partial<Product>): Promise<Product> {
    const r = await pb
      .collection('products')
      .update<Product>(id, data, { expand: 'category,subcategory,manufacturer,supplier' })
    await auditService.log('update', 'product', id, `Produto atualizado: ${data.name || id}`)
    return r
  },
  async remove(id: string): Promise<void> {
    await pb.collection('products').delete(id)
    await auditService.log('delete', 'product', id, 'Produto removido')
  },
}
