migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    // resolve admin
    let adminId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'infobelbh@gmail.com')
      adminId = admin.id
    } catch (_) {}

    // resolve a regular user
    let regularUserId = adminId
    try {
      const u = app.findFirstRecordByData('_pb_users_auth_', 'email', 'carlos.silva@empresa.com')
      regularUserId = u.id
    } catch (_) {}

    // helper to get-or-create a base record by field
    function getOrCreate(colName, field, value, fill) {
      let rec
      try {
        rec = app.findFirstRecordByData(colName, field, value)
      } catch (_) {
        const col = app.findCollectionByNameOrId(colName)
        rec = new Record(col)
        rec.set(field, value)
        if (fill) fill(rec)
        app.save(rec)
      }
      return rec
    }

    // ---- system_settings (singleton) ----
    const settingsCol = app.findCollectionByNameOrId('system_settings')
    let settingsRec
    try {
      settingsRec = app.findFirstRecordByData('system_settings', 'system_name', 'Help Desk Hub')
    } catch (_) {
      try {
        // any record
        const all = app.findRecordsByFilter('system_settings', '1=1', '-created', 1, 0)
        if (all && all.length > 0) {
          settingsRec = all[0]
        }
      } catch (__) {}
    }
    if (!settingsRec) {
      settingsRec = new Record(settingsCol)
      settingsRec.set('system_name', 'Help Desk Hub')
      settingsRec.set('system_subtitle', 'Central de TI')
      settingsRec.set('primary_color', '#0c3b68')
      settingsRec.set('smtp_host', '')
      settingsRec.set('smtp_port', 587)
      settingsRec.set('smtp_user', '')
      settingsRec.set('smtp_password', '')
      app.save(settingsRec)
    }

    // ---- knowledge_articles ----
    const knowledge = [
      {
        title: 'Problemas comuns de rede',
        category: 'Rede',
        content:
          '<h3>Problemas comuns de rede</h3><p>Verifique o cabo de rede conectado à máquina e ao ponto de rede na parede. Reinicie o roteador ou access point aguardando 30 segundos antes de religar. Confirme se o IP está sendo obtido via DHCP (ipconfig /release e /renew no Windows). Se o problema persistir em mais de uma máquina, abra um chamado de rede.</p>',
      },
      {
        title: 'Como resetar senha',
        category: 'Acesso e Senha',
        content:
          '<h3>Como resetar senha</h3><p>Acesse o portal de senhas da empresa em https://senhar.empresa.com e clique em "Esqueci minha senha". Informe seu e-mail corporativo e siga as instruções recebidas. Para sistemas integrados (AD, e-mail, ERP) a alteração é propagada em até 15 minutos.</p>',
      },
      {
        title: 'Configuração de e-mail',
        category: 'E-mail',
        content:
          '<h3>Configuração de e-mail</h3><p>No Outlook, vá em Arquivo > Informações > Configurações de Conta. Servidor IMAP: imap.empresa.com porta 993 SSL. Servidor SMTP: smtp.empresa.com porta 587 TLS. Use seu e-mail corporativo como usuário e a senha do AD.</p>',
      },
      {
        title: 'Instalação de software',
        category: 'Software',
        content:
          '<h3>Instalação de software</h3><p>Softwares autorizados devem ser solicitados via chamado na categoria Software. A instalação é realizada remotamente pela equipe de TI via SCCM/Intune. Não instale softwares não homologados — isso pode comprometer a segurança e o suporte do equipamento.</p>',
      },
      {
        title: 'Impressoras',
        category: 'Impressora',
        content:
          '<h3>Impressoras</h3><p>Para adicionar uma impressora de rede, acesse \\\\\servidor-impressao\\\\ e clique no modelo desejado. Em caso de atolamento, desligue a impressora, remova o papel com cuidado e verifique se não há fragmentos presos nos rolos. Para nível de toner baixo, abra chamado de reposição.</p>',
      },
      {
        title: 'VPN e acesso remoto',
        category: 'Rede',
        content:
          '<h3>VPN e acesso remoto</h3><p>Instale o cliente GlobalProtect/Forticlient disponível no portal. Conecte com seu usuário corporativo e autenticação em dois fatores (MFA). Caso receba erro de certificado, atualize o cliente para a versão mais recente. Para problemas de conexão, verifique sua internet local primeiro.</p>',
      },
    ]
    for (const a of knowledge) {
      getOrCreate('knowledge_articles', 'title', a.title, (rec) => {
        rec.set('content', a.content)
        rec.set('category', a.category)
      })
    }

    // ---- quick_replies ----
    const replies = [
      {
        title: 'Chamado recebido',
        category: 'Triagem',
        content:
          'Olá! Seu chamado foi recebido e registrado em nosso sistema com sucesso. Nossa equipe de TI irá analisá-lo e responderá em breve dentro do SLA da sua prioridade. Obrigado pelo contato.',
      },
      {
        title: 'Solicitar mais informações',
        category: 'Triagem',
        content:
          'Para que possamos avançar no atendimento, precisamos de mais algumas informações: você poderia nos informar o modelo do equipamento, mensagens de erro exibidas e desde quando o problema ocorre? Anexos com print da tela ajudam bastante.',
      },
      {
        title: 'Problema resolvido',
        category: 'Fechamento',
        content:
          'Boa notícia! O problema relatado foi resolvido. Verifique por favor se está tudo funcionando conforme esperado. Caso afirmativo, este chamado será encerrado. Qualquer nova ocorrência, fique à vontade para abrir um novo chamado.',
      },
      {
        title: 'Acesso concedido',
        category: 'Acesso',
        content:
          'O acesso solicitado foi concedido com sucesso. Faça logoff e login novamente para que as permissões sejam aplicadas. Caso ainda não consiga acessar, nos informe para verificarmos a propagação no AD.',
      },
      {
        title: 'Aguardando aprovação',
        category: 'Triagem',
        content:
          'Esta solicitação requer aprovação do seu gestor. Encaminhamos a requisição e assim que tivermos o retorno daremos andamento. O prazo pode variar conforme a disponibilidade do aprovador.',
      },
    ]
    for (const r of replies) {
      getOrCreate('quick_replies', 'title', r.title, (rec) => {
        rec.set('content', r.content)
        rec.set('category', r.category)
        if (adminId) rec.set('created_by', adminId)
      })
    }

    // ---- categories ----
    const catNames = [
      'Hardware',
      'Software',
      'Rede',
      'Acesso e Senha',
      'E-mail',
      'Impressora',
      'Telefonia',
      'Outros',
    ]
    for (const c of catNames) {
      getOrCreate('categories', 'name', c, null)
    }

    // ---- priorities ----
    const priorities = [
      { name: 'Alta', sla_hours: 4 },
      { name: 'Média', sla_hours: 24 },
      { name: 'Baixa', sla_hours: 72 },
    ]
    for (const p of priorities) {
      getOrCreate('priorities', 'name', p.name, (rec) => {
        rec.set('sla_hours', p.sla_hours)
      })
    }

    // ---- companies ----
    const companies = [
      {
        name: 'Tech Solutions LTDA',
        cnpj: '12.345.678/0001-90',
        phone: '(11) 3000-1000',
        email: 'contato@techsolutions.com',
      },
      {
        name: 'Comércio Brasil S/A',
        cnpj: '98.765.432/0001-10',
        phone: '(11) 4000-2000',
        email: 'ti@comerciobrasil.com',
      },
      {
        name: 'Indústria Metalúrgica Ermel',
        cnpj: '45.678.901/0001-22',
        phone: '(31) 5000-3000',
        email: 'suporte@ermel.com',
      },
    ]
    const companyMap = {}
    for (const c of companies) {
      const rec = getOrCreate('companies', 'name', c.name, (r) => {
        r.set('cnpj', c.cnpj)
        r.set('phone', c.phone)
        r.set('email', c.email)
      })
      companyMap[c.name] = rec.id
    }

    // ---- contacts ----
    const contacts = [
      {
        name: 'João Pereira',
        email: 'joao@techsolutions.com',
        phone: '(11) 99000-1001',
        company: 'Tech Solutions LTDA',
      },
      {
        name: 'Ana Souza',
        email: 'ana@comerciobrasil.com',
        phone: '(11) 99000-2002',
        company: 'Comércio Brasil S/A',
      },
      {
        name: 'Pedro Lima',
        email: 'pedro@ermel.com',
        phone: '(31) 99000-3003',
        company: 'Indústria Metalúrgica Ermel',
      },
    ]
    for (const c of contacts) {
      getOrCreate('contacts', 'email', c.email, (rec) => {
        rec.set('name', c.name)
        rec.set('phone', c.phone)
        if (c.company && companyMap[c.company]) rec.set('company', companyMap[c.company])
      })
    }

    // ---- approvals ----
    const approvals = [
      {
        title: 'Aquisição de novo notebook',
        description:
          'Solicitação de compra de notebook para novo colaborador do setor financeiro. Orçamento R$ 6.500.',
        status: 'Pendente',
        requester: regularUserId,
      },
      {
        title: 'Acesso administrativo ao ERP',
        description:
          'Solicitação de perfil administrador no sistema TOTVS para fechamento contábil mensal.',
        status: 'Pendente',
        requester: regularUserId,
      },
      {
        title: 'Liberação de VPN externa',
        description:
          'Liberação de acesso VPN para consultor externo por 30 dias, com escopo restrito ao sistema de RH.',
        status: 'Pendente',
        requester: regularUserId,
      },
    ]
    for (const a of approvals) {
      getOrCreate('approvals', 'title', a.title, (rec) => {
        rec.set('description', a.description)
        rec.set('status', a.status)
        if (a.requester) rec.set('requester', a.requester)
      })
    }

    // ---- audit_logs ----
    try {
      const existing = app.countRecords('audit_logs')
      if (existing === 0) {
        const logsCol = app.findCollectionByNameOrId('audit_logs')
        const logs = [
          ['create', 'ticket', 'Sistema iniciado'],
          ['update', 'ticket', 'Status alterado para Em andamento'],
          ['update', 'ticket', 'Status alterado para Concluído'],
          ['assign', 'ticket', 'Chamado assumido pelo atendente'],
          ['create', 'user', 'Novo usuário criado'],
          ['update', 'user', 'Papel do usuário alterado para admin'],
          ['update', 'user', 'Setor do usuário atualizado'],
          ['create', 'sector', 'Novo setor cadastrado'],
          ['create', 'category', 'Categoria cadastrada'],
          ['create', 'priority', 'Prioridade cadastrada'],
          ['create', 'company', 'Empresa cadastrada'],
          ['create', 'contact', 'Contato cadastrado'],
          ['create', 'knowledge_article', 'Artigo da base de conhecimento publicado'],
          ['create', 'quick_reply', 'Resposta rápida criada'],
          ['approve', 'approval', 'Aprovação concedida'],
          ['reject', 'approval', 'Aprovação rejeitada'],
          ['create', 'asset', 'Ativo de TI cadastrado'],
          ['update', 'asset', 'Ativo atualizado'],
          ['create', 'inventory_item', 'Item de estoque cadastrado'],
          ['create', 'inventory_movement', 'Movimentação de estoque registrada'],
        ]
        for (const l of logs) {
          const rec = new Record(logsCol)
          rec.set('action', l[0])
          rec.set('entity_type', l[1])
          rec.set('entity_id', '')
          rec.set('details', l[2])
          if (adminId) rec.set('user', adminId)
          app.save(rec)
        }
      }
    } catch (_) {}

    // ---- assets ----
    let sectorsMap = {}
    try {
      const secs = app.findRecordsByFilter('sectors', '1=1', 'name', 100, 0)
      for (const s of secs) sectorsMap[s.getString('name')] = s.id
    } catch (_) {}
    const assets = [
      {
        name: 'Notebook Dell Latitude 5420',
        type: 'Notebook',
        serial_number: 'DL5420-001',
        status: 'Em uso',
        sector: 'TI',
        specifications: 'i5 11ª, 16GB RAM, 512GB SSD',
      },
      {
        name: 'Impressora HP LaserJet Pro M404',
        type: 'Impressora',
        serial_number: 'HPM404-777',
        status: 'Em uso',
        sector: 'Financeiro',
        specifications: 'Monocromática, rede, 38ppm',
      },
      {
        name: 'Monitor LG 27UL550',
        type: 'Monitor',
        serial_number: 'LG27-2231',
        status: 'Em estoque',
        sector: 'TI',
        specifications: '27" 4K UHD IPS',
      },
      {
        name: 'Desktop Lenovo ThinkCentre M70q',
        type: 'Computador',
        serial_number: 'LEN-M70-88',
        status: 'Em manutenção',
        sector: 'Comercial',
        specifications: 'i3 12ª, 8GB RAM, 256GB SSD',
      },
      {
        name: 'iPhone 13 Corporativo',
        type: 'Smartphone',
        serial_number: 'IP13-9090',
        status: 'Em uso',
        sector: 'Comercial',
        specifications: '128GB, linha corporativa',
      },
    ]
    for (const a of assets) {
      getOrCreate('assets', 'serial_number', a.serial_number, (rec) => {
        rec.set('name', a.name)
        rec.set('type', a.type)
        rec.set('status', a.status)
        rec.set('specifications', a.specifications)
        if (a.sector && sectorsMap[a.sector]) rec.set('sector', sectorsMap[a.sector])
      })
    }

    // ---- inventory_items ----
    const items = [
      {
        name: 'Cabo de rede RJ45 3m',
        category: 'Cablueamento',
        quantity: 50,
        min_quantity: 10,
        unit: 'un',
      },
      {
        name: 'Mouse óptico USB',
        category: 'Periféricos',
        quantity: 20,
        min_quantity: 5,
        unit: 'un',
      },
      {
        name: 'Teclado ABNT2 USB',
        category: 'Periféricos',
        quantity: 15,
        min_quantity: 5,
        unit: 'un',
      },
      {
        name: 'Toner HP 83A preto',
        category: 'Suprimentos',
        quantity: 8,
        min_quantity: 3,
        unit: 'un',
      },
      {
        name: 'Notebook SSD 512GB',
        category: 'Hardware',
        quantity: 6,
        min_quantity: 2,
        unit: 'un',
      },
    ]
    for (const it of items) {
      getOrCreate('inventory_items', 'name', it.name, (rec) => {
        rec.set('description', '')
        rec.set('category', it.category)
        rec.set('quantity', it.quantity)
        rec.set('min_quantity', it.min_quantity)
        rec.set('unit', it.unit)
      })
    }

    // ---- inventory_locations ----
    const locs = ['Almoxarifado Central', 'Estoque TI', 'Depósito Andar 2']
    const locMap = {}
    for (const l of locs) {
      const rec = getOrCreate('inventory_locations', 'name', l, (r) => {
        r.set('description', 'Local de armazenamento de itens de TI')
      })
      locMap[l] = rec.id
    }

    // ---- inventory_movements ----
    try {
      const existingMov = app.countRecords('inventory_movements')
      if (existingMov === 0) {
        const movCol = app.findCollectionByNameOrId('inventory_movements')
        let firstItem = ''
        try {
          const itRecs = app.findRecordsByFilter('inventory_items', '1=1', 'name', 1, 0)
          if (itRecs && itRecs.length > 0) firstItem = itRecs[0].id
        } catch (_) {}
        if (firstItem && locMap['Estoque TI']) {
          const mov = new Record(movCol)
          mov.set('item', firstItem)
          mov.set('to_location', locMap['Estoque TI'])
          mov.set('quantity', 10)
          mov.set('type', 'Entrada')
          mov.set('notes', 'Entrada inicial de estoque')
          if (adminId) mov.set('created_by', adminId)
          app.save(mov)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // down — no-op
  },
)
