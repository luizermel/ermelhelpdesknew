migrate(
  (app) => {
    // 1. Create sectors collection
    const sectors = new Collection({
      name: 'sectors',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_sectors_name ON sectors (name)'],
    })
    app.save(sectors)

    // 2. Update users collection to add role and sector
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const sectorsCol = app.findCollectionByNameOrId('sectors')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: true,
          values: ['user', 'admin'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('sector')) {
      users.fields.add(
        new RelationField({
          name: 'sector',
          required: false, // allow flexible registration/initial setups
          collectionId: sectorsCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    // Users access rules: authenticated users can list/view, update own profile or admin can update any
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = ''
    users.updateRule = "@request.auth.id = id || @request.auth.role = 'admin'"
    users.deleteRule = null

    app.save(users)
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = users.fields.getByName('role')
      if (roleField) users.fields.remove(roleField)
      const sectorField = users.fields.getByName('sector')
      if (sectorField) users.fields.remove(sectorField)
      app.save(users)
    } catch (_) {}

    try {
      const sectors = app.findCollectionByNameOrId('sectors')
      app.delete(sectors)
    } catch (_) {}
  },
)
