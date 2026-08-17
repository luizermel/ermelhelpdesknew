/// Adiciona campo "situacao" (bool, default true = Ativo) na collection users
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('situacao')) {
      col.fields.add(new BoolField({ name: 'situacao' }))
    }

    app.save(col)

    // Marca todos os usuários existentes como Ativos (situacao = true)
    try {
      app
        .db()
        .newQuery('UPDATE users SET situacao = 1 WHERE situacao IS NULL OR situacao = 0')
        .execute()
    } catch (_) {}
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      col.fields.remove('situacao')
    } catch (_) {}
    app.save(col)
  },
)
