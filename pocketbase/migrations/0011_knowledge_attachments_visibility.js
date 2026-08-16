/// Adiciona campos de anexos, visibilidade e empresa em knowledge_articles
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('knowledge_articles')

    // attachments: arquivo múltiplo
    if (!col.fields.getByName('attachments')) {
      col.fields.add(
        new FileField({
          name: 'attachments',
          maxSelect: 10,
          maxSize: 10 * 1024 * 1024,
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'audio/webm',
            'audio/ogg',
            'audio/wav',
            'audio/mpeg',
            'audio/mp3',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a',
          ],
        }),
      )
    }

    // visibility: select com GERAL ou Por empresa
    if (!col.fields.getByName('visibility')) {
      col.fields.add(
        new SelectField({
          name: 'visibility',
          values: ['GERAL', 'Por empresa'],
          maxSelect: 1,
        }),
      )
    }

    // company: relation para companies
    if (!col.fields.getByName('company')) {
      col.fields.add(
        new RelationField({
          name: 'company',
          collectionId: app.findCollectionByNameOrId('companies').id,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)

    // Define o valor padrão "GERAL" para artigos já existentes
    app
      .db()
      .newQuery(
        "UPDATE knowledge_articles SET visibility = 'GERAL' WHERE visibility IS NULL OR visibility = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('knowledge_articles')
    try {
      col.fields.remove('attachments')
    } catch (_) {}
    try {
      col.fields.remove('visibility')
    } catch (_) {}
    try {
      col.fields.remove('company')
    } catch (_) {}
    app.save(col)
  },
)
