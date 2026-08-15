import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  PieChart as PieChartIcon,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react'
import { ticketsService, sectorsService } from '@/services/api'
import type { Ticket, Sector, TicketCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { toast } from 'sonner'

const CATEGORIES: TicketCategory[] = [
  'Hardware',
  'Software',
  'Rede',
  'Acesso e Senha',
  'E-mail',
  'Impressora',
  'Telefonia',
  'Outros',
]

const STATUS_COLORS: Record<string, string> = {
  Aberto: '#f59e0b', // amber
  'Em andamento': '#3b82f6', // blue
  Concluído: '#10b981', // green
}

const PALETTE = [
  '#4f46e5',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#84cc16',
  '#14b8a6',
]

export default function Reports() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [dateRange, setDateRange] = useState<'hoje' | '7d' | '30d' | 'todos'>('todos')
  const [sectorFilter, setSectorFilter] = useState<string>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')

  const fetchData = useCallback(async () => {
    try {
      const [tData, sData] = await Promise.all([
        ticketsService.getFullList(),
        sectorsService.getAll(),
      ])
      setTickets(tData)
      setSectors(sData)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados dos relatórios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered Tickets by date range and dropdowns
  const filteredTickets = useMemo(() => {
    const now = new Date()
    return tickets.filter((t) => {
      // Date filter
      const ticketDate = new Date(t.created)
      if (dateRange === 'hoje') {
        const isToday =
          ticketDate.getDate() === now.getDate() &&
          ticketDate.getMonth() === now.getMonth() &&
          ticketDate.getFullYear() === now.getFullYear()
        if (!isToday) return false
      } else if (dateRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (ticketDate < sevenDaysAgo) return false
      } else if (dateRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (ticketDate < thirtyDaysAgo) return false
      }

      // Sector filter
      if (sectorFilter !== 'todos' && t.sector !== sectorFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'todos' && t.category !== categoryFilter) {
        return false
      }

      return true
    })
  }, [tickets, dateRange, sectorFilter, categoryFilter])

  // KPIs
  const stats = useMemo(() => {
    const total = filteredTickets.length
    const open = filteredTickets.filter((t) => t.status === 'Aberto').length
    const inProgress = filteredTickets.filter((t) => t.status === 'Em andamento').length
    const closed = filteredTickets.filter((t) => t.status === 'Concluído').length
    return { total, open, inProgress, closed }
  }, [filteredTickets])

  // 1. Status Chart Data (Donut)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { Aberto: 0, 'Em andamento': 0, Concluído: 0 }
    filteredTickets.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++
      }
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }))
  }, [filteredTickets])

  // 2. Sector Chart Data (Vertical Bar)
  const sectorData = useMemo(() => {
    const map: Record<string, number> = {}
    sectors.forEach((s) => {
      map[s.name] = 0
    })

    filteredTickets.forEach((t) => {
      const sName = t.expand?.sector?.name || 'Geral'
      map[sName] = (map[sName] || 0) + 1
    })

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredTickets, sectors])

  // 3. Category Chart Data (Horizontal Bar)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    CATEGORIES.forEach((c) => {
      map[c] = 0
    })

    filteredTickets.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + 1
    })

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredTickets])

  // 4. Evolution Timeline Chart (Area)
  const evolutionData = useMemo(() => {
    const map: Record<string, number> = {}
    const sorted = [...filteredTickets].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    )

    sorted.forEach((t) => {
      const d = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
        new Date(t.created),
      )
      map[d] = (map[d] || 0) + 1
    })

    if (Object.keys(map).length === 0) {
      return [{ date: 'Hoje', chamados: 0 }]
    }

    return Object.entries(map).map(([date, chamados]) => ({ date, chamados }))
  }, [filteredTickets])

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error('Não há chamados para exportar com os filtros atuais.')
      return
    }

    const headers = [
      'ID',
      'Título',
      'Categoria',
      'Status',
      'Prioridade',
      'Setor',
      'Solicitante',
      'E-mail Solicitante',
      'Técnico Atribuído',
      'Data de Abertura',
    ]

    const rows = filteredTickets.map((t) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.expand?.sector?.name || ''}"`,
      `"${t.expand?.requester?.name || ''}"`,
      `"${t.expand?.requester?.email || ''}"`,
      `"${t.expand?.assigned_to?.name || 'Não atribuído'}"`,
      `"${new Date(t.created).toLocaleString('pt-BR')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_chamados_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório CSV exportado com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Relatórios & Estatísticas
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Análise detalhada de chamados por setor, categoria e tendências de atendimento
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 self-start sm:self-auto font-medium"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Exportar Relatório (CSV)</span>
        </Button>
      </div>

      {/* Filter Row */}
      <Card className="bg-white border-slate-200/90 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Período:</span>
            <div className="grid grid-cols-4 gap-1 w-full md:w-auto bg-slate-100 p-1 rounded-lg">
              {(
                [
                  { id: 'hoje', label: 'Hoje' },
                  { id: '7d', label: '7 dias' },
                  { id: '30d', label: '30 dias' },
                  { id: 'todos', label: 'Todos' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDateRange(p.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    dateRange === p.id
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Sector Filter */}
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full sm:w-[170px] text-xs h-9">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Setores</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] text-xs h-9">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Filtrado
            </CardTitle>
            <Layers className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Total no período</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-700 uppercase">
              Abertos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-extrabold text-amber-600">{stats.open}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Pendentes de início</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-blue-700 uppercase">
              Em andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-extrabold text-blue-600">{stats.inProgress}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Em atendimento</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-700 uppercase">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-extrabold text-emerald-600">{stats.closed}</div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Resolvidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Grid (1 col mobile / 2 cols desktop) */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTickets.length < 2 ? (
        <Card className="p-12 text-center bg-white border-dashed border-slate-300 rounded-2xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <PieChartIcon className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Dados insuficientes para gráficos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            São necessários pelo menos 2 chamados registrados no filtro selecionado para renderizar
            a distribuição.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Status Donut Chart */}
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-indigo-600" />
                Chamados por Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Distribuição percentual do progresso dos atendimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={STATUS_COLORS[entry.name] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `${value ?? 0} chamados`,
                      'Quantidade',
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Sector Vertical Bar Chart */}
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Chamados por Setor
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Volume de incidentes reportados por cada área da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={45}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0} chamados`, 'Total']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-sector-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. Category Horizontal Bar Chart */}
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Chamados por Categoria de TI
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tipos de problemas mais frequentes (hardware, rede, software, etc)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0} chamados`, 'Total']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-cat-${index}`}
                        fill={PALETTE[(index + 3) % PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 4. Evolution Timeline Area Chart */}
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Evolução Temporal dos Chamados
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aberturas de chamados ao longo dos dias
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={evolutionData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: number | undefined) => [`${value ?? 0} chamados`, 'Abertos']}
                  />
                  <Area
                    type="monotone"
                    dataKey="chamados"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTickets)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
