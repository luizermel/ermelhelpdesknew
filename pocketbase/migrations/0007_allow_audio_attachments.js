migrate(
  (app) => {
    const ticketsCol = app.findCollectionByNameOrId('tickets')

    // `add` replaces an existing field with the same name (and appends otherwise).
    ticketsCol.fields.add(
      new FileField({
        name: 'attachments',
        required: false,
        maxSelect: 10,
        maxSize: 10485760, // 10MB
        mimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'audio/webm',
          'audio/ogg',
          'audio/wav',
          'audio/x-wav',
          'audio/mpeg',
          'audio/mp3',
          'audio/mp4',
          'audio/m4a',
          'audio/x-m4a',
        ],
      }),
    )
    app.save(ticketsCol)

    // Add an attachments file field to ticket_messages (for audio replies).
    const messagesCol = app.findCollectionByNameOrId('ticket_messages')
    if (!messagesCol.fields.getByName('attachments')) {
      messagesCol.fields.add(
        new FileField({
          name: 'attachments',
          required: false,
          maxSelect: 10,
          maxSize: 10485760, // 10MB
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'audio/webm',
            'audio/ogg',
            'audio/wav',
            'audio/x-wav',
            'audio/mpeg',
            'audio/mp3',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a',
          ],
        }),
      )
      app.save(messagesCol)
    }
  },
  (app) => {
    // Best-effort revert: restore image-only mime types on tickets.attachments
    const ticketsCol = app.findCollectionByNameOrId('tickets')
    ticketsCol.fields.add(
      new FileField({
        name: 'attachments',
        required: false,
        maxSelect: 10,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }),
    )
    app.save(ticketsCol)

    // Remove the attachments field from ticket_messages if present
    const messagesCol = app.findCollectionByNameOrId('ticket_messages')
    if (messagesCol.fields.getByName('attachments')) {
      messagesCol.fields.removeByName('attachments')
      app.save(messagesCol)
    }
  },
)
