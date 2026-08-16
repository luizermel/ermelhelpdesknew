migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('system_settings')
    if (!col.fields.getByName('custom_menu')) {
      col.fields.add(
        new JSONField({
          name: 'custom_menu',
          maxSize: 1048576,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('system_settings')
      col.fields.removeByName('custom_menu')
      app.save(col)
    } catch (_) {}
  },
)
