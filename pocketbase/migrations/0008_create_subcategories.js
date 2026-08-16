migrate(
  (app) => {
    const subcategories = new Collection({
      name: 'subcategories',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'category_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_subcategories_name ON subcategories (name)'],
    })
    app.save(subcategories)

    // Seed default subcategories matching image 3
    const seedSubcategories = [
      'Armazenamento e memória',
      'Atualização de programa',
      'Caixa postal cheia',
      'Calendário e reuniões',
      'Categoria não identificada',
      'Computador e notebook',
      'Configuração de e-mail',
      'CRM ou atendimento',
      'Dúvida ou orientação',
      'E-mail não envia ou recebe',
      'Equipamento não liga',
      'ERP ou sistema de gestão',
      'Erro de impressão',
      'Erro ou travamento',
      'Impressora não imprime',
      'Instalação de impressora',
      'Instalação de programa',
      'Internet lenta ou instável',
      'Licença de software',
      'Monitor e vídeo',
      'Mudança de equipamento ou local',
      'Ponto de rede',
      'Relatórios e integrações',
      'Scanner e digitalização',
      'Sem acesso à internet',
      'Sistema de RH',
      'Sistema financeiro',
      'Sistema operacional',
      'Solicitação de equipamento',
      'Solicitação de melhoria',
      'Teams, Meet ou videoconferência',
      'Teclado, mouse e periféricos',
      'Toner, tinta ou suprimentos',
      'VPN e acesso remoto',
      'Wi-Fi',
    ]

    seedSubcategories.forEach((name) => {
      try {
        app.findFirstRecordByData('subcategories', 'name', name)
      } catch (_) {
        const rec = new Record(subcategories)
        rec.set('name', name)
        app.save(rec)
      }
    })
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('subcategories')
      app.delete(collection)
    } catch (_) {}
  },
)
