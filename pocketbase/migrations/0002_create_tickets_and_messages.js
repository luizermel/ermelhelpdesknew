migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const sectorsCol = app.findCollectionByNameOrId('sectors')

    // Create tickets collection
    const tickets = new Collection({
      name: 'tickets',
      type: 'base',
      listRule:
        "@request.auth.id = requester || @request.auth.role = 'admin' || @request.auth.id = assigned_to",
      viewRule:
        "@request.auth.id = requester || @request.auth.role = 'admin' || @request.auth.id = assigned_to",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.role = 'admin' || (@request.auth.id = requester && status = 'Aberto')",
      deleteRule: null,
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        { name: 'description', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: [
            'Hardware',
            'Software',
            'Rede',
            'Acesso e Senha',
            'E-mail',
            'Impressora',
            'Telefonia',
            'Outros',
          ],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Aberto', 'Em andamento', 'Concluído'],
          maxSelect: 1,
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          values: ['Baixa', 'Média', 'Alta'],
          maxSelect: 1,
        },
        {
          name: 'requester',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'assigned_to',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'sector',
          type: 'relation',
          required: true,
          collectionId: sectorsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'attachments',
          type: 'file',
          required: false,
          maxSelect: 10,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tickets_status ON tickets (status)',
        'CREATE INDEX idx_tickets_sector ON tickets (sector)',
        'CREATE INDEX idx_tickets_requester ON tickets (requester)',
        'CREATE INDEX idx_tickets_category ON tickets (category)',
        'CREATE INDEX idx_tickets_created ON tickets (created DESC)',
      ],
    })
    app.save(tickets)

    const ticketsCol = app.findCollectionByNameOrId('tickets')

    // Create ticket_messages collection
    const ticketMessages = new Collection({
      name: 'ticket_messages',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.id = ticket.requester || @request.auth.id = ticket.assigned_to)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.id = ticket.requester || @request.auth.id = ticket.assigned_to)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.id = ticket.requester || @request.auth.id = ticket.assigned_to)",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'ticket',
          type: 'relation',
          required: true,
          collectionId: ticketsCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'author',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'content', type: 'text', required: true },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          values: ['comentario', 'status'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ticket_messages_ticket ON ticket_messages (ticket)',
        'CREATE INDEX idx_ticket_messages_created ON ticket_messages (created ASC)',
      ],
    })
    app.save(ticketMessages)
  },
  (app) => {
    try {
      const ticketMessages = app.findCollectionByNameOrId('ticket_messages')
      app.delete(ticketMessages)
    } catch (_) {}

    try {
      const tickets = app.findCollectionByNameOrId('tickets')
      app.delete(tickets)
    } catch (_) {}
  },
)
