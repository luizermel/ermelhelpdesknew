migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')
    if (!col.fields.getByName('finalized_by')) {
      col.fields.add(
        new RelationField({
          name: 'finalized_by',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')
    const f = col.fields.getByName('finalized_by')
    if (f) col.fields.remove(f)
    app.save(col)
  },
)
