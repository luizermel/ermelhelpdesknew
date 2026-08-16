migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const sectorsCol = app.findCollectionByNameOrId('sectors')
    const sectorsId = sectorsCol.id

    // 1. knowledge_articles
    app.save(
      new Collection({
        name: 'knowledge_articles',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'editor', maxSize: 1048576 },
          { name: 'category', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_knowledge_articles_category ON knowledge_articles (category)',
          'CREATE INDEX idx_knowledge_articles_created ON knowledge_articles (created DESC)',
        ],
      }),
    )

    // 2. quick_replies
    app.save(
      new Collection({
        name: 'quick_replies',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: "@request.auth.role = 'admin' || @request.auth.id = created_by",
        deleteRule: "@request.auth.role = 'admin' || @request.auth.id = created_by",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text', required: true },
          { name: 'category', type: 'text' },
          {
            name: 'created_by',
            type: 'relation',
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_quick_replies_category ON quick_replies (category)'],
      }),
    )

    // 3. categories
    app.save(
      new Collection({
        name: 'categories',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_categories_name ON categories (name)'],
      }),
    )

    // 4. priorities
    app.save(
      new Collection({
        name: 'priorities',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'sla_hours', type: 'number', onlyInt: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_priorities_name ON priorities (name)'],
      }),
    )

    // 5. companies
    app.save(
      new Collection({
        name: 'companies',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'cnpj', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_companies_name ON companies (name)'],
      }),
    )

    // 6. contacts
    const companiesCol = app.findCollectionByNameOrId('companies')
    app.save(
      new Collection({
        name: 'contacts',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'phone', type: 'text' },
          {
            name: 'company',
            type: 'relation',
            collectionId: companiesCol.id,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_contacts_company ON contacts (company)'],
      }),
    )

    // 7. approvals
    app.save(
      new Collection({
        name: 'approvals',
        type: 'base',
        listRule: "@request.auth.role = 'admin' || @request.auth.id = requester",
        viewRule: "@request.auth.role = 'admin' || @request.auth.id = requester",
        createRule: '@request.auth.id != ""',
        updateRule: "@request.auth.role = 'admin' || @request.auth.id = requester",
        deleteRule: "@request.auth.role = 'admin' || @request.auth.id = requester",
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Pendente', 'Aprovado', 'Rejeitado'],
            maxSelect: 1,
          },
          {
            name: 'requester',
            type: 'relation',
            required: true,
            collectionId: usersId,
            maxSelect: 1,
          },
          {
            name: 'approver',
            type: 'relation',
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_approvals_status ON approvals (status)',
          'CREATE INDEX idx_approvals_requester ON approvals (requester)',
          'CREATE INDEX idx_approvals_created ON approvals (created DESC)',
        ],
      }),
    )

    // 8. audit_logs
    app.save(
      new Collection({
        name: 'audit_logs',
        type: 'base',
        listRule: "@request.auth.role = 'admin'",
        viewRule: "@request.auth.role = 'admin'",
        createRule: '@request.auth.id != ""',
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'action', type: 'text', required: true },
          { name: 'entity_type', type: 'text' },
          { name: 'entity_id', type: 'text' },
          {
            name: 'user',
            type: 'relation',
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'details', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_audit_logs_action ON audit_logs (action)',
          'CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type)',
          'CREATE INDEX idx_audit_logs_user ON audit_logs (user)',
          'CREATE INDEX idx_audit_logs_created ON audit_logs (created DESC)',
        ],
      }),
    )

    // 9. system_settings (singleton-style)
    app.save(
      new Collection({
        name: 'system_settings',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: null,
        fields: [
          { name: 'system_name', type: 'text' },
          { name: 'system_subtitle', type: 'text' },
          { name: 'logo_url', type: 'text' },
          { name: 'primary_color', type: 'text' },
          { name: 'smtp_host', type: 'text' },
          { name: 'smtp_port', type: 'number', onlyInt: true },
          { name: 'smtp_user', type: 'text' },
          { name: 'smtp_password', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
    )

    // 10. assets
    app.save(
      new Collection({
        name: 'assets',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['Computador', 'Notebook', 'Impressora', 'Monitor', 'Smartphone', 'Outros'],
            maxSelect: 1,
          },
          { name: 'serial_number', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Em uso', 'Em manutenção', 'Desativado', 'Em estoque'],
            maxSelect: 1,
          },
          {
            name: 'sector',
            type: 'relation',
            collectionId: sectorsId,
            maxSelect: 1,
          },
          {
            name: 'user',
            type: 'relation',
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'specifications', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_assets_type ON assets (type)',
          'CREATE INDEX idx_assets_status ON assets (status)',
          'CREATE INDEX idx_assets_sector ON assets (sector)',
        ],
      }),
    )

    // 11. inventory_items
    app.save(
      new Collection({
        name: 'inventory_items',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'category', type: 'text' },
          { name: 'quantity', type: 'number', onlyInt: true },
          { name: 'min_quantity', type: 'number', onlyInt: true },
          { name: 'unit', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_inventory_items_category ON inventory_items (category)'],
      }),
    )

    // 12. inventory_locations
    app.save(
      new Collection({
        name: 'inventory_locations',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_inventory_locations_name ON inventory_locations (name)'],
      }),
    )

    // 13. inventory_movements
    const itemsCol = app.findCollectionByNameOrId('inventory_items')
    const locationsCol = app.findCollectionByNameOrId('inventory_locations')
    app.save(
      new Collection({
        name: 'inventory_movements',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'item',
            type: 'relation',
            required: true,
            collectionId: itemsCol.id,
            maxSelect: 1,
          },
          {
            name: 'from_location',
            type: 'relation',
            collectionId: locationsCol.id,
            maxSelect: 1,
          },
          {
            name: 'to_location',
            type: 'relation',
            collectionId: locationsCol.id,
            maxSelect: 1,
          },
          { name: 'quantity', type: 'number', required: true, onlyInt: true },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['Entrada', 'Saída', 'Transferência'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text' },
          {
            name: 'created_by',
            type: 'relation',
            collectionId: usersId,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_inventory_movements_item ON inventory_movements (item)',
          'CREATE INDEX idx_inventory_movements_created ON inventory_movements (created DESC)',
        ],
      }),
    )
  },
  (app) => {
    const names = [
      'knowledge_articles',
      'quick_replies',
      'categories',
      'priorities',
      'companies',
      'contacts',
      'approvals',
      'audit_logs',
      'system_settings',
      'assets',
      'inventory_items',
      'inventory_locations',
      'inventory_movements',
    ]
    for (const n of names) {
      try {
        const c = app.findCollectionByNameOrId(n)
        app.delete(c)
      } catch (_) {}
    }
  },
)
