import pb from '@/lib/pocketbase/client'
import type { Sector, Ticket, TicketMessage, User } from '@/types'

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
    // 1. Update ticket status
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
      expand: 'sector',
    })
  },

  async updateRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { role },
      {
        expand: 'sector',
      },
    )
  },

  async updateSector(userId: string, sectorId: string): Promise<User> {
    return await pb.collection('users').update<User>(
      userId,
      { sector: sectorId },
      {
        expand: 'sector',
      },
    )
  },
}

export const getFileUrl = (
  record: { id: string; collectionId?: string; collectionName?: string },
  filename: string,
) => {
  return pb.files.getURL(record, filename)
}
