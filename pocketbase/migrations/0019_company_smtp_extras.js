/// 0019 — Campos adicionais de SMTP por empresa: e-mail do remetente, nome do remetente e switch TLS/SSL.
migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')

    if (!companiesCol.fields.getByName('smtp_sender_email')) {
      companiesCol.fields.add(new EmailField({ name: 'smtp_sender_email' }))
    }
    if (!companiesCol.fields.getByName('smtp_sender_name')) {
      companiesCol.fields.add(new TextField({ name: 'smtp_sender_name' }))
    }
    if (!companiesCol.fields.getByName('smtp_use_tls')) {
      companiesCol.fields.add(new BoolField({ name: 'smtp_use_tls' }))
    }

    app.save(companiesCol)
  },
  (app) => {
    try {
      const companiesCol = app.findCollectionByNameOrId('companies')
      ;['smtp_sender_email', 'smtp_sender_name', 'smtp_use_tls'].forEach((f) => {
        try {
          if (companiesCol.fields.getByName(f)) companiesCol.fields.removeByName(f)
        } catch (_) {}
      })
      app.save(companiesCol)
    } catch (_) {}
  },
)
