/// 0018 — Categorias/Subcategorias de Produtos, Fabricantes, Fornecedores, Produtos,
/// campos de patrimônio/ativo de TI em inventory_items, vínculo de ativo em tickets,
/// SMTP por empresa e valor "Aguardando Lançamento" no status de inventory_items.
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    // -----------------------------------------------------------
    // 1. product_categories
    // -----------------------------------------------------------
    let productCategoriesCol
    try {
      productCategoriesCol = app.findCollectionByNameOrId('product_categories')
    } catch (_) {
      productCategoriesCol = new Collection({
        name: 'product_categories',
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
        indexes: ['CREATE UNIQUE INDEX idx_product_categories_name ON product_categories (name)'],
      })
      app.save(productCategoriesCol)
    }

    // -----------------------------------------------------------
    // 2. product_subcategories
    // -----------------------------------------------------------
    let productSubcategoriesCol
    try {
      productSubcategoriesCol = app.findCollectionByNameOrId('product_subcategories')
    } catch (_) {
      productSubcategoriesCol = new Collection({
        name: 'product_subcategories',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          {
            name: 'category',
            type: 'relation',
            collectionId: productCategoriesCol.id,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_product_subcategories_name ON product_subcategories (name)'],
      })
      app.save(productSubcategoriesCol)
    }

    // -----------------------------------------------------------
    // 3. manufacturers
    // -----------------------------------------------------------
    let manufacturersCol
    try {
      manufacturersCol = app.findCollectionByNameOrId('manufacturers')
    } catch (_) {
      manufacturersCol = new Collection({
        name: 'manufacturers',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'cnpj', type: 'text' },
          { name: 'contact', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'site', type: 'text' },
          { name: 'situacao', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_manufacturers_name ON manufacturers (name)'],
      })
      app.save(manufacturersCol)
    }

    // -----------------------------------------------------------
    // 4. suppliers
    // -----------------------------------------------------------
    let suppliersCol
    try {
      suppliersCol = app.findCollectionByNameOrId('suppliers')
    } catch (_) {
      suppliersCol = new Collection({
        name: 'suppliers',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'cnpj', type: 'text' },
          { name: 'contact', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'email' },
          { name: 'site', type: 'text' },
          { name: 'situacao', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_suppliers_name ON suppliers (name)'],
      })
      app.save(suppliersCol)
    }

    // -----------------------------------------------------------
    // 5. products
    // -----------------------------------------------------------
    let productsCol
    try {
      productsCol = app.findCollectionByNameOrId('products')
    } catch (_) {
      productsCol = new Collection({
        name: 'products',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: 'name', type: 'text', required: true },
          {
            name: 'category',
            type: 'relation',
            collectionId: productCategoriesCol.id,
            maxSelect: 1,
          },
          {
            name: 'subcategory',
            type: 'relation',
            collectionId: productSubcategoriesCol.id,
            maxSelect: 1,
          },
          {
            name: 'manufacturer',
            type: 'relation',
            collectionId: manufacturersCol.id,
            maxSelect: 1,
          },
          {
            name: 'supplier',
            type: 'relation',
            collectionId: suppliersCol.id,
            maxSelect: 1,
          },
          { name: 'cost_price', type: 'number', onlyInt: false },
          { name: 'sale_price', type: 'number', onlyInt: false },
          { name: 'unit', type: 'text' },
          { name: 'min_stock', type: 'number', onlyInt: true },
          { name: 'is_it_asset', type: 'bool' },
          { name: 'is_patrimony', type: 'bool' },
          { name: 'avg_price', type: 'number', onlyInt: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_products_name ON products (name)'],
      })
      app.save(productsCol)
    }

    // -----------------------------------------------------------
    // 6. inventory_items: novos campos + novo status
    // -----------------------------------------------------------
    const itemsCol = app.findCollectionByNameOrId('inventory_items')

    if (!itemsCol.fields.getByName('product')) {
      itemsCol.fields.add(
        new RelationField({
          name: 'product',
          collectionId: productsCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!itemsCol.fields.getByName('patrimony_number')) {
      itemsCol.fields.add(new TextField({ name: 'patrimony_number' }))
    }
    if (!itemsCol.fields.getByName('is_it_asset')) {
      itemsCol.fields.add(new BoolField({ name: 'is_it_asset' }))
    }
    if (!itemsCol.fields.getByName('is_patrimony')) {
      itemsCol.fields.add(new BoolField({ name: 'is_patrimony' }))
    }
    if (!itemsCol.fields.getByName('assigned_user')) {
      itemsCol.fields.add(
        new RelationField({
          name: 'assigned_user',
          collectionId: usersId,
          maxSelect: 1,
        }),
      )
    }

    // Recria o select status com o novo valor "Aguardando Lançamento"
    if (itemsCol.fields.getByName('status')) {
      itemsCol.fields.removeByName('status')
    }
    itemsCol.fields.add(
      new SelectField({
        name: 'status',
        values: ['Em uso', 'Em manutenção', 'Em estoque', 'Desativado', 'Aguardando Lançamento'],
        maxSelect: 1,
      }),
    )

    app.save(itemsCol)

    // -----------------------------------------------------------
    // 7. tickets: asset (relation -> inventory_items)
    // -----------------------------------------------------------
    const ticketsCol = app.findCollectionByNameOrId('tickets')
    if (!ticketsCol.fields.getByName('asset')) {
      ticketsCol.fields.add(
        new RelationField({
          name: 'asset',
          collectionId: itemsCol.id,
          maxSelect: 1,
        }),
      )
      app.save(ticketsCol)
    }

    // -----------------------------------------------------------
    // 8. companies: SMTP por empresa
    // -----------------------------------------------------------
    const companiesCol = app.findCollectionByNameOrId('companies')
    if (!companiesCol.fields.getByName('smtp_host')) {
      companiesCol.fields.add(new TextField({ name: 'smtp_host' }))
    }
    if (!companiesCol.fields.getByName('smtp_port')) {
      companiesCol.fields.add(new NumberField({ name: 'smtp_port', onlyInt: true }))
    }
    if (!companiesCol.fields.getByName('smtp_user')) {
      companiesCol.fields.add(new TextField({ name: 'smtp_user' }))
    }
    if (!companiesCol.fields.getByName('smtp_password')) {
      companiesCol.fields.add(new TextField({ name: 'smtp_password' }))
    }
    if (!companiesCol.fields.getByName('smtp_security')) {
      companiesCol.fields.add(
        new SelectField({
          name: 'smtp_security',
          values: ['TLS', 'SSL', 'Nenhum'],
          maxSelect: 1,
        }),
      )
    }
    app.save(companiesCol)

    // Defaults
    try {
      app
        .db()
        .newQuery('UPDATE inventory_items SET is_it_asset = 0 WHERE is_it_asset IS NULL')
        .execute()
    } catch (_) {}
    try {
      app
        .db()
        .newQuery('UPDATE inventory_items SET is_patrimony = 0 WHERE is_patrimony IS NULL')
        .execute()
    } catch (_) {}
    try {
      app
        .db()
        .newQuery(
          "UPDATE inventory_items SET status = 'Em estoque' WHERE status IS NULL OR status = ''",
        )
        .execute()
    } catch (_) {}
  },
  (app) => {
    const cols = [
      'products',
      'suppliers',
      'manufacturers',
      'product_subcategories',
      'product_categories',
    ]
    cols.forEach((name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    })

    try {
      const itemsCol = app.findCollectionByNameOrId('inventory_items')
      ;['product', 'patrimony_number', 'is_it_asset', 'is_patrimony', 'assigned_user'].forEach(
        (f) => {
          try {
            if (itemsCol.fields.getByName(f)) itemsCol.fields.removeByName(f)
          } catch (_) {}
        },
      )
      if (itemsCol.fields.getByName('status')) itemsCol.fields.removeByName('status')
      itemsCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Em uso', 'Em manutenção', 'Em estoque', 'Desativado'],
          maxSelect: 1,
        }),
      )
      app.save(itemsCol)
    } catch (_) {}

    try {
      const ticketsCol = app.findCollectionByNameOrId('tickets')
      if (ticketsCol.fields.getByName('asset')) ticketsCol.fields.removeByName('asset')
      app.save(ticketsCol)
    } catch (_) {}

    try {
      const companiesCol = app.findCollectionByNameOrId('companies')
      ;['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_security'].forEach((f) => {
        try {
          if (companiesCol.fields.getByName(f)) companiesCol.fields.removeByName(f)
        } catch (_) {}
      })
      app.save(companiesCol)
    } catch (_) {}
  },
)
