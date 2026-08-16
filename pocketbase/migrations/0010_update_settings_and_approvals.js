migrate(
  (app) => {
    // 1. Atualizar a coleção system_settings
    const settingsCol = app.findCollectionByNameOrId('system_settings')

    if (!settingsCol.fields.getByName('institutional_desc')) {
      settingsCol.fields.add(new TextField({ name: 'institutional_desc' }))
    }
    if (!settingsCol.fields.getByName('show_institutional_newline')) {
      settingsCol.fields.add(new BoolField({ name: 'show_institutional_newline' }))
    }
    if (!settingsCol.fields.getByName('login_title')) {
      settingsCol.fields.add(new TextField({ name: 'login_title' }))
    }
    if (!settingsCol.fields.getByName('login_desc')) {
      settingsCol.fields.add(new TextField({ name: 'login_desc' }))
    }
    if (!settingsCol.fields.getByName('footer_left')) {
      settingsCol.fields.add(new TextField({ name: 'footer_left' }))
    }
    if (!settingsCol.fields.getByName('footer_right')) {
      settingsCol.fields.add(new TextField({ name: 'footer_right' }))
    }
    if (!settingsCol.fields.getByName('panel_color')) {
      settingsCol.fields.add(new TextField({ name: 'panel_color' }))
    }
    if (!settingsCol.fields.getByName('allow_public_register')) {
      settingsCol.fields.add(new BoolField({ name: 'allow_public_register' }))
    }

    app.save(settingsCol)

    // Preencher dados padrões no primeiro registro de system_settings se existir
    try {
      const records = app.findRecordsByFilter('system_settings', '1=1', '-created', 1, 0)
      if (records.length > 0) {
        const rec = records[0]
        if (!rec.getString('login_title')) rec.set('login_title', 'Bem-vindo')
        if (!rec.getString('login_desc'))
          rec.set(
            'login_desc',
            'Entre para acompanhar solicitações e manter seu trabalho em movimento.',
          )
        if (!rec.getString('footer_left'))
          rec.set('footer_left', 'Uso interno • Ambiente corporativo')
        if (!rec.getString('footer_right')) rec.set('footer_right', 'Suporte com transparência')
        if (!rec.getString('panel_color')) rec.set('panel_color', '#082844')
        if (!rec.getString('institutional_desc'))
          rec.set(
            'institutional_desc',
            'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.',
          )
        rec.set('allow_public_register', true)
        rec.set('show_institutional_newline', true)
        app.save(rec)
      }
    } catch (_) {}

    // 2. Atualizar a coleção approvals para suportar os campos do formulário de solicitação multiempresa
    const approvalsCol = app.findCollectionByNameOrId('approvals')

    if (!approvalsCol.fields.getByName('name')) {
      approvalsCol.fields.add(new TextField({ name: 'name' }))
    }
    if (!approvalsCol.fields.getByName('email')) {
      approvalsCol.fields.add(new EmailField({ name: 'email' }))
    }
    if (!approvalsCol.fields.getByName('sector_text')) {
      approvalsCol.fields.add(new TextField({ name: 'sector_text' }))
    }
    if (!approvalsCol.fields.getByName('company_text')) {
      approvalsCol.fields.add(new TextField({ name: 'company_text' }))
    }
    if (!approvalsCol.fields.getByName('company')) {
      const companiesCol = app.findCollectionByNameOrId('companies')
      approvalsCol.fields.add(
        new RelationField({
          name: 'company',
          collectionId: companiesCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!approvalsCol.fields.getByName('sector')) {
      const sectorsCol = app.findCollectionByNameOrId('sectors')
      approvalsCol.fields.add(
        new RelationField({
          name: 'sector',
          collectionId: sectorsCol.id,
          maxSelect: 1,
        }),
      )
    }

    // Tornar o campo requester opcional em approvals pois solicitações de novo usuário vêm de visitantes não logados
    const reqField = approvalsCol.fields.getByName('requester')
    if (reqField) {
      reqField.required = false
    }

    app.save(approvalsCol)

    // Garantir que a regra de criação de approvals seja pública para que solicitações de cadastro possam ser enviadas
    approvalsCol.createRule = ''
    app.save(approvalsCol)

    // 3. Atualizar a coleção users para adicionar relação com company se não tiver
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('company')) {
      const companiesCol = app.findCollectionByNameOrId('companies')
      usersCol.fields.add(
        new RelationField({
          name: 'company',
          collectionId: companiesCol.id,
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    }
  },
  (app) => {
    // Reversão simplificada
  },
)
