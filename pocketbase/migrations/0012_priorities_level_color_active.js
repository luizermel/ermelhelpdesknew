/// Adiciona level (number), color (text) e active (bool) à collection priorities
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('priorities')

    if (!col.fields.getByName('level')) {
      col.fields.add(
        new NumberField({
          name: 'level',
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('color')) {
      col.fields.add(
        new TextField({
          name: 'color',
          max: 20,
        }),
      )
    }

    if (!col.fields.getByName('active')) {
      col.fields.add(
        new BoolField({
          name: 'active',
        }),
      )
    }

    app.save(col)

    // Define defaults para registros existentes
    app.db().newQuery('UPDATE priorities SET active = 1 WHERE active IS NULL').execute()
    app
      .db()
      .newQuery("UPDATE priorities SET color = '#64748b' WHERE color IS NULL OR color = ''")
      .execute()
    app.db().newQuery('UPDATE priorities SET level = 0 WHERE level IS NULL').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('priorities')
    try {
      col.fields.remove('level')
    } catch (_) {}
    try {
      col.fields.remove('color')
    } catch (_) {}
    try {
      col.fields.remove('active')
    } catch (_) {}
    app.save(col)
  },
)
