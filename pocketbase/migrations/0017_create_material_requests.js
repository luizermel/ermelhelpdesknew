migrate(
  (app) => {
    const usersAuthId = '_pb_users_auth_'
    const itemsCol = app.findCollectionByNameOrId('inventory_items')
    const locsCol = app.findCollectionByNameOrId('inventory_locations')

    // 1. Create material_requests collection
    const requestsCol = new Collection({
      name: 'material_requests',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != '' || token != ''", // Allow viewing with public token or logged user
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'requester',
          type: 'relation',
          required: true,
          collectionId: usersAuthId,
          maxSelect: 1,
        },
        {
          name: 'item',
          type: 'relation',
          required: false,
          collectionId: itemsCol.id,
          maxSelect: 1,
        },
        { name: 'item_name', type: 'text', required: false },
        {
          name: 'item_type',
          type: 'select',
          required: true,
          values: ['Ativo', 'Consumível'],
          maxSelect: 1,
        },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unit', type: 'text' },
        {
          name: 'destination_location',
          type: 'relation',
          required: false,
          collectionId: locsCol.id,
          maxSelect: 1,
        },
        { name: 'reason', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Aprovado', 'Rejeitado'],
          maxSelect: 1,
        },
        {
          name: 'signature_type',
          type: 'select',
          values: ['Sistema', 'LinkPúblico'],
          maxSelect: 1,
        },
        { name: 'signature_name', type: 'text' },
        { name: 'signature_email', type: 'email' },
        { name: 'signature_notes', type: 'text' },
        { name: 'signed_at', type: 'date' },
        { name: 'token', type: 'text' },
        { name: 'approver', type: 'relation', collectionId: usersAuthId, maxSelect: 1 },
        { name: 'rejection_reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_material_requests_status ON material_requests (status)',
        'CREATE INDEX idx_material_requests_token ON material_requests (token)',
        'CREATE INDEX idx_material_requests_requester ON material_requests (requester)',
      ],
    })
    app.save(requestsCol)

    // 2. Add item_type and serial_number fields to inventory_items if not present
    if (!itemsCol.fields.getByName('item_type')) {
      itemsCol.fields.add(
        new SelectField({
          name: 'item_type',
          required: true,
          values: ['Ativo', 'Consumível'],
          maxSelect: 1,
        }),
      )
    }
    if (!itemsCol.fields.getByName('serial_number')) {
      itemsCol.fields.add(
        new TextField({
          name: 'serial_number',
          required: false,
        }),
      )
    }
    if (!itemsCol.fields.getByName('location')) {
      itemsCol.fields.add(
        new RelationField({
          name: 'location',
          collectionId: locsCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!itemsCol.fields.getByName('status')) {
      itemsCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Em uso', 'Em manutenção', 'Em estoque', 'Desativado'],
          maxSelect: 1,
        }),
      )
    }
    app.save(itemsCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('material_requests')
      app.delete(col)
    } catch (_) {}
  },
)
