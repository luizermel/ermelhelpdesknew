migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('products')

    if (!col.fields.getByName('barcode')) {
      col.fields.add(new TextField({ name: 'barcode' }))
    }

    if (!col.fields.getByName('is_serial')) {
      col.fields.add(new BoolField({ name: 'is_serial' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('products')

    const barcodeField = col.fields.getByName('barcode')
    if (barcodeField) col.fields.remove(barcodeField)

    const isSerialField = col.fields.getByName('is_serial')
    if (isSerialField) col.fields.remove(isSerialField)

    app.save(col)
  },
)
