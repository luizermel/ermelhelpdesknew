migrate(
  (app) => {
    // Collections to fully wipe (delete all rows).
    const collections = [
      'tickets',
      'ticket_messages',
      'knowledge_articles',
      'quick_replies',
      'contacts',
      'approvals',
      'audit_logs',
      'assets',
      'inventory_items',
      'inventory_locations',
      'inventory_movements',
      'material_requests',
      'products',
      'brands',
      'product_categories',
      'product_subcategories',
      'manufacturers',
      'suppliers',
    ]

    // Loop over each collection and delete all records via raw SQL.
    for (let i = 0; i < collections.length; i++) {
      const name = collections[i]
      if (!app.hasTable(name)) {
        continue
      }
      app
        .db()
        .newQuery('DELETE FROM ' + name)
        .execute()
    }

    // Remove specific users by email (auth collection table is "users").
    const emails = [
      'carlos.silva@empresa.com',
      'mariana.costa@empresa.com',
      'roberto.alves@empresa.com',
    ]
    for (let i = 0; i < emails.length; i++) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', emails[i])
        app.delete(record)
      } catch (_) {
        // user not found — skip
      }
    }
  },
  (app) => {
    // Non-reversible cleanup — down is a no-op.
  },
)
