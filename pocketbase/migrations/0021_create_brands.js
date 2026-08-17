/// 0021 — Cria a collection "brands" (Marcas).
/// Campos: name (texto, obrigatório, único) + created/updated (autodate).
/// Acessível para list/view por qualquer autenticado; create/update/delete só admin.
migrate(
  (app) => {
    let brandsCol
    try {
      brandsCol = app.findCollectionByNameOrId('brands')
    } catch (_) {
      brandsCol = new Collection({
        name: 'brands',
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
        indexes: ['CREATE UNIQUE INDEX idx_brands_name ON brands (name)'],
      })
      app.save(brandsCol)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('brands'))
    } catch (_) {}
  },
)
