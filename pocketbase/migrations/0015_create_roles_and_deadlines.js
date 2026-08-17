migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Create 'roles' collection
    const rolesCol = new Collection({
      name: 'roles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'can_view_reports', type: 'bool' },
        { name: 'can_manage_users', type: 'bool' },
        { name: 'can_manage_tickets', type: 'bool' },
        { name: 'can_manage_settings', type: 'bool' },
        { name: 'can_manage_inventory', type: 'bool' },
        { name: 'is_admin', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(rolesCol)

    // Add role_profile relation field to users table
    if (!usersCol.fields.getByName('role_profile')) {
      usersCol.fields.add(
        new RelationField({
          name: 'role_profile',
          collectionId: rolesCol.id,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // Add finalization & reopening deadlines fields to system_settings
    const settingsCol = app.findCollectionByNameOrId('system_settings')
    if (!settingsCol.fields.getByName('finalization_approval_hours')) {
      settingsCol.fields.add(
        new NumberField({
          name: 'finalization_approval_hours',
          min: 0,
        }),
      )
    }
    if (!settingsCol.fields.getByName('reopen_deadline_hours')) {
      settingsCol.fields.add(
        new NumberField({
          name: 'reopen_deadline_hours',
          min: 0,
        }),
      )
    }
    app.save(settingsCol)

    // Set default deadline values in existing system_settings records
    try {
      const settingsList = app.findRecordsByFilter('system_settings', '1=1', '', 10, 0)
      for (const s of settingsList) {
        if (s.get('finalization_approval_hours') === 0 || !s.get('finalization_approval_hours')) {
          s.set('finalization_approval_hours', 48) // 48 horas padrão
        }
        if (s.get('reopen_deadline_hours') === 0 || !s.get('reopen_deadline_hours')) {
          s.set('reopen_deadline_hours', 72) // 72 horas padrão
        }
        app.save(s)
      }
    } catch (_) {}

    // Pre-populate default roles
    const fullAccess = new Record(rolesCol)
    fullAccess.set('name', 'Acesso Total')
    fullAccess.set('description', 'Acesso irrestrito a todas as funcionalidades do sistema')
    fullAccess.set('can_view_reports', true)
    fullAccess.set('can_manage_users', true)
    fullAccess.set('can_manage_tickets', true)
    fullAccess.set('can_manage_settings', true)
    fullAccess.set('can_manage_inventory', true)
    fullAccess.set('is_admin', true)
    app.save(fullAccess)

    const techSupport = new Record(rolesCol)
    techSupport.set('name', 'Técnico de Suporte')
    techSupport.set('description', 'Atendimento e gestão de chamados, relatórios e inventário')
    techSupport.set('can_view_reports', true)
    techSupport.set('can_manage_users', false)
    techSupport.set('can_manage_tickets', true)
    techSupport.set('can_manage_settings', false)
    techSupport.set('can_manage_inventory', true)
    techSupport.set('is_admin', false)
    app.save(techSupport)

    const standardUser = new Record(rolesCol)
    standardUser.set('name', 'Usuário Padrão')
    standardUser.set('description', 'Abertura e acompanhamento dos próprios chamados')
    standardUser.set('can_view_reports', false)
    standardUser.set('can_manage_users', false)
    standardUser.set('can_manage_tickets', false)
    standardUser.set('can_manage_settings', false)
    standardUser.set('can_manage_inventory', false)
    standardUser.set('is_admin', false)
    app.save(standardUser)

    // Ensure all existing users get full access role or keep admin permissions
    const users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 500, 0)
    for (const u of users) {
      u.set('role_profile', fullAccess.id)
      app.save(u)
    }
  },
  (app) => {
    try {
      const rolesCol = app.findCollectionByNameOrId('roles')
      app.delete(rolesCol)
    } catch (_) {}
  },
)
