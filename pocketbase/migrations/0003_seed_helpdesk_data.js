migrate(
  (app) => {
    const sectorsCol = app.findCollectionByNameOrId('sectors')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const ticketsCol = app.findCollectionByNameOrId('tickets')
    const messagesCol = app.findCollectionByNameOrId('ticket_messages')

    // 1. Seed 10 Sectors
    const sectorNames = [
      'TI',
      'Financeiro',
      'Recursos Humanos',
      'Comercial',
      'Marketing',
      'Logística',
      'Jurídico',
      'Operações',
      'Administrativo',
      'Atendimento',
    ]

    const sectorMap = {}

    for (const name of sectorNames) {
      let sectorRecord
      try {
        sectorRecord = app.findFirstRecordByData('sectors', 'name', name)
      } catch (_) {
        sectorRecord = new Record(sectorsCol)
        sectorRecord.set('name', name)
        app.save(sectorRecord)
      }
      sectorMap[name] = sectorRecord.id
    }

    // 2. Seed Admin User
    let adminRecord
    try {
      adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'infobelbh@gmail.com')
      adminRecord.set('role', 'admin')
      if (sectorMap['TI']) adminRecord.set('sector', sectorMap['TI'])
      adminRecord.set('name', 'Administrador TI')
      app.save(adminRecord)
    } catch (_) {
      adminRecord = new Record(usersCol)
      adminRecord.setEmail('infobelbh@gmail.com')
      adminRecord.setPassword('Skip@Pass')
      adminRecord.setVerified(true)
      adminRecord.set('name', 'Administrador TI')
      adminRecord.set('role', 'admin')
      if (sectorMap['TI']) adminRecord.set('sector', sectorMap['TI'])
      app.save(adminRecord)
    }

    // 3. Seed Sample Regular Users
    const sampleUsersData = [
      {
        email: 'carlos.silva@empresa.com',
        name: 'Carlos Silva',
        sector: 'Financeiro',
        role: 'user',
      },
      {
        email: 'mariana.costa@empresa.com',
        name: 'Mariana Costa',
        sector: 'Recursos Humanos',
        role: 'user',
      },
      {
        email: 'roberto.alves@empresa.com',
        name: 'Roberto Alves',
        sector: 'Comercial',
        role: 'user',
      },
    ]

    const userMap = {}
    userMap['admin'] = adminRecord.id

    for (const u of sampleUsersData) {
      let uRecord
      try {
        uRecord = app.findAuthRecordByEmail('_pb_users_auth_', u.email)
      } catch (_) {
        uRecord = new Record(usersCol)
        uRecord.setEmail(u.email)
        uRecord.setPassword('Skip@Pass')
        uRecord.setVerified(true)
        uRecord.set('name', u.name)
        uRecord.set('role', u.role)
        if (sectorMap[u.sector]) uRecord.set('sector', sectorMap[u.sector])
        app.save(uRecord)
      }
      userMap[u.email] = uRecord.id
    }

    // 4. Seed 8 Sample Tickets
    const sampleTickets = [
      {
        title: 'Notebook não liga após atualização do Windows',
        description:
          'Ao tentar ligar o notebook corporativo hoje pela manhã, a tela fica preta com o LED piscando em azul. Já tentei remover da tomada e segurar o botão de energia por 30 segundos, sem sucesso.',
        category: 'Hardware',
        status: 'Aberto',
        priority: 'Alta',
        requesterEmail: 'carlos.silva@empresa.com',
        assignedAdmin: null,
        sectorName: 'Financeiro',
      },
      {
        title: 'Sem acesso ao e-mail institucional no Outlook',
        description:
          'O aplicativo Outlook está solicitando senha repetidamente e apresentando erro de autenticação 0x800CCC0E ao tentar sincronizar a caixa de entrada.',
        category: 'E-mail',
        status: 'Em andamento',
        priority: 'Média',
        requesterEmail: 'mariana.costa@empresa.com',
        assignedAdmin: 'infobelbh@gmail.com',
        sectorName: 'Recursos Humanos',
      },
      {
        title: 'Impressora do 2º andar com erro constante de atolamento de papel',
        description:
          'A impressora multifuncional HP do setor comercial indica papel preso mesmo após abrir e verificar todas as bandejas. Ninguém do setor consegue imprimir relatórios de vendas.',
        category: 'Impressora',
        status: 'Em andamento',
        priority: 'Alta',
        requesterEmail: 'roberto.alves@empresa.com',
        assignedAdmin: 'infobelbh@gmail.com',
        sectorName: 'Comercial',
      },
      {
        title: 'Instalação do software de BI (Power BI Desktop)',
        description:
          'Necessito da instalação da versão mais recente do Power BI Desktop e configuração do gateway para fechamento mensal da diretoria.',
        category: 'Software',
        status: 'Concluído',
        priority: 'Média',
        requesterEmail: 'carlos.silva@empresa.com',
        assignedAdmin: 'infobelbh@gmail.com',
        sectorName: 'Financeiro',
      },
      {
        title: 'Lentidão extrema e quedas no Wi-Fi corporativo',
        description:
          'O sinal de Wi-Fi corporativo na sala de reuniões 3 está caindo a cada 10 minutos durante chamadas com clientes externos.',
        category: 'Rede',
        status: 'Aberto',
        priority: 'Alta',
        requesterEmail: 'roberto.alves@empresa.com',
        assignedAdmin: null,
        sectorName: 'Comercial',
      },
      {
        title: 'Redefinição de senha do ERP TOTVS',
        description:
          'Usuário bloqueado no sistema TOTVS após 3 tentativas incorretas de senha. Preciso de desbloqueio para lançar admissões de novos colaboradores.',
        category: 'Acesso e Senha',
        status: 'Concluído',
        priority: 'Alta',
        requesterEmail: 'mariana.costa@empresa.com',
        assignedAdmin: 'infobelbh@gmail.com',
        sectorName: 'Recursos Humanos',
      },
      {
        title: 'Ramal telefônico mudo no posto de atendimento',
        description:
          "O aparelho IP Grandstream não emite tom de discagem e o display indica 'Sem registro no servidor SIP'.",
        category: 'Telefonia',
        status: 'Aberto',
        priority: 'Baixa',
        requesterEmail: 'carlos.silva@empresa.com',
        assignedAdmin: null,
        sectorName: 'Atendimento',
      },
      {
        title: 'Solicitação de teclado e mouse ergonômicos',
        description:
          'Conforme laudo ergonômico da CIPA, solicito a substituição do kit teclado e mouse padrão por modelo ergonômico.',
        category: 'Outros',
        status: 'Concluído',
        priority: 'Baixa',
        requesterEmail: 'mariana.costa@empresa.com',
        assignedAdmin: 'infobelbh@gmail.com',
        sectorName: 'Recursos Humanos',
      },
    ]

    for (const t of sampleTickets) {
      let ticketRecord
      try {
        ticketRecord = app.findFirstRecordByData('tickets', 'title', t.title)
      } catch (_) {
        const requesterId = userMap[t.requesterEmail] || adminRecord.id
        const assignedId = t.assignedAdmin ? adminRecord.id : null
        const sectorId = sectorMap[t.sectorName] || sectorMap['TI']

        ticketRecord = new Record(ticketsCol)
        ticketRecord.set('title', t.title)
        ticketRecord.set('description', t.description)
        ticketRecord.set('category', t.category)
        ticketRecord.set('status', t.status)
        ticketRecord.set('priority', t.priority)
        ticketRecord.set('requester', requesterId)
        if (assignedId) ticketRecord.set('assigned_to', assignedId)
        ticketRecord.set('sector', sectorId)
        app.save(ticketRecord)

        // Add opening message
        const msgRecord = new Record(messagesCol)
        msgRecord.set('ticket', ticketRecord.id)
        msgRecord.set('author', requesterId)
        msgRecord.set('content', t.description)
        msgRecord.set('event_type', 'comentario')
        app.save(msgRecord)

        // Add status message if not Aberto
        if (t.status === 'Em andamento' || t.status === 'Concluído') {
          const statusMsg = new Record(messagesCol)
          statusMsg.set('ticket', ticketRecord.id)
          statusMsg.set('author', adminRecord.id)
          statusMsg.set('content', `Status alterado para ${t.status}`)
          statusMsg.set('event_type', 'status')
          app.save(statusMsg)
        }

        if (t.status === 'Concluído') {
          const finalMsg = new Record(messagesCol)
          finalMsg.set('ticket', ticketRecord.id)
          finalMsg.set('author', adminRecord.id)
          finalMsg.set('content', 'Chamado atendido e verificado com sucesso pelo suporte.')
          finalMsg.set('event_type', 'comentario')
          app.save(finalMsg)
        }
      }
    }
  },
  (app) => {
    // down migration
  },
)
