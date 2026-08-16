/// Adiciona campo subcategory (relation para subcategories) na collection tickets
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')

    if (!col.fields.getByName('subcategory')) {
      col.fields.add(
        new RelationField({
          name: 'subcategory',
          collectionId: app.findCollectionByNameOrId('subcategories').id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tickets')
    try {
      col.fields.remove('subcategory')
    } catch (_) {}
    app.save(col)
  },
)
