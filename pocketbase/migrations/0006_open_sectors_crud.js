migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('sectors')
    col.listRule = '@request.auth.id != ""'
    col.viewRule = '@request.auth.id != ""'
    col.createRule = "@request.auth.role = 'admin'"
    col.updateRule = "@request.auth.role = 'admin'"
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('sectors')
    col.createRule = null
    col.updateRule = null
    col.deleteRule = null
    app.save(col)
  },
)
