import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Headset,
  Sparkles,
  Clock,
  Shield,
  CheckCircle2,
  Mail,
  User as UserIcon,
  Building2,
  Building,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { approvalsService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function Register() {
  const navigate = useNavigate()
  const {
    systemName,
    systemSubtitle,
    logoUrl,
    panelColor,
    loginTitle,
    loginDesc,
    footerLeft,
    footerRight,
    institutionalDesc,
    showInstitutionalNewline,
  } = useSystemSettings()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sectorText, setSectorText] = useState('')
  const [companyText, setCompanyText] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'Nome completo é obrigatório.'
    } else if (name.trim().split(' ').length < 2) {
      errors.name = 'Informe seu nome e sobrenome.'
    }

    if (!email.trim()) {
      errors.email = 'E-mail corporativo é obrigatório.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Informe um e-mail válido.'
    }

    if (!sectorText.trim()) {
      errors.sectorText = 'Informe o seu setor de trabalho.'
    }

    if (!companyText.trim()) {
      errors.companyText = 'Informe a sua empresa.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) return

    setLoading(true)
    try {
      await approvalsService.create({
        title: `Solicitação de acesso: ${name.trim()}`,
        description: `Nova solicitação de acesso para ${name.trim()} (${email.trim()}). Empresa: ${companyText.trim()}, Setor: ${sectorText.trim()}`,
        status: 'Pendente',
        name: name.trim(),
        email: email.trim(),
        sector_text: sectorText.trim(),
        company_text: companyText.trim(),
      })

      toast.success(
        'Solicitação de acesso enviada com sucesso! Aguarde a aprovação dos administradores.',
        {
          duration: 6000,
        },
      )
      navigate('/')
    } catch (err: unknown) {
      console.error(err)
      setErrorMessage(
        'Não foi possível enviar a solicitação de acesso. Tente novamente mais tarde.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row font-sans selection:bg-[#0062a8]/20"
      style={{ backgroundColor: panelColor || '#082844' }}
    >
      {/* LADO ESQUERDO — Fundo Customizado / Painel Institucional */}
      <div
        className="w-full md:w-1/2 min-h-[450px] md:min-h-screen text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${panelColor || '#082844'} 0%, #041a2e 100%)`,
        }}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[700px] h-[700px] rounded-full border border-white/5 pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3.5 z-10">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={systemName}
              className="w-12 h-12 rounded-2xl object-cover bg-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl border-2 border-white/80 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Headset className="w-6 h-6 stroke-[2]" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              {systemName || 'Help Desk TI'}
            </h1>
            <p className="text-xs text-cyan-200/80 font-medium">
              {systemSubtitle || 'Central de suporte'}
            </p>
          </div>
        </div>

        {/* Middle Main Content */}
        <div className="my-auto py-10 space-y-7 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-cyan-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Suporte simples, rápido e rastreável</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.15] text-white">
              Suporte técnico.{' '}
              {showInstitutionalNewline ? (
                <span className="text-[#38bdf8] block">Do chamado à solução</span>
              ) : (
                <span className="text-[#38bdf8]"> Do chamado à solução</span>
              )}
            </h2>
            <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed pt-2">
              {institutionalDesc ||
                'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Tempo real</p>
                <p className="text-[11px] text-slate-300/70">Acompanhe o SLA</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Seguro</p>
                <p className="text-[11px] text-slate-300/70">Dados protegidos</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Organizado</p>
                <p className="text-[11px] text-slate-300/70">Histórico completo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Extreme Text */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-4 z-10">
          <span>{footerLeft || 'Uso interno • Ambiente corporativo'}</span>
          <span>{footerRight || 'Suporte com transparência'}</span>
        </div>
      </div>

      {/* LADO DIREITO — Formulário de Solicitação de Acesso */}
      <div className="w-full md:w-1/2 bg-[#f8fafc] sm:bg-white p-6 sm:p-12 lg:p-16 flex flex-col justify-between items-center">
        <div className="w-full max-w-[420px] my-auto space-y-6">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0284c7]">
              PORTAL CORPORATIVO
            </p>
            <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Solicitar acesso
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
              Cadastre seus dados para solicitar liberação ao administrador do sistema.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
              <Link
                to="/"
                className="flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all text-center"
              >
                Entrar
              </Link>
              <button
                type="button"
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-white text-slate-900 shadow-xs border border-slate-200/60 transition-all text-center"
              >
                Solicitar acesso
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Nome completo */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-slate-700 block">
                  Nome completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Carlos Silva"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' })
                    }}
                    className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl text-xs sm:text-sm ${
                      fieldErrors.name ? 'border-red-500 focus-visible:ring-red-400' : ''
                    }`}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* E-mail corporativo */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 block">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="carlos.silva@empresa.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                    }}
                    className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl text-xs sm:text-sm ${
                      fieldErrors.email ? 'border-red-500 focus-visible:ring-red-400' : ''
                    }`}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* Setor de trabalho (Texto Livre) */}
              <div className="space-y-1.5">
                <label htmlFor="sector" className="text-xs font-semibold text-slate-700 block">
                  Setor
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="sector"
                    type="text"
                    placeholder="Ex: Financeiro, TI, Vendas"
                    value={sectorText}
                    onChange={(e) => {
                      setSectorText(e.target.value)
                      if (fieldErrors.sectorText) setFieldErrors({ ...fieldErrors, sectorText: '' })
                    }}
                    className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl text-xs sm:text-sm ${
                      fieldErrors.sectorText ? 'border-red-500 focus-visible:ring-red-400' : ''
                    }`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.sectorText && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.sectorText}</p>
                )}
              </div>

              {/* Empresa (Texto Livre - Multiempresa) */}
              <div className="space-y-1.5">
                <label htmlFor="company" className="text-xs font-semibold text-slate-700 block">
                  Empresa
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Ex: Empresa Matriz, Filial SP"
                    value={companyText}
                    onChange={(e) => {
                      setCompanyText(e.target.value)
                      if (fieldErrors.companyText)
                        setFieldErrors({ ...fieldErrors, companyText: '' })
                    }}
                    className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl text-xs sm:text-sm ${
                      fieldErrors.companyText ? 'border-red-500 focus-visible:ring-red-400' : ''
                    }`}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.companyText && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.companyText}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#0062a8] hover:bg-[#00508a] active:bg-[#004375] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-900/10 transition-colors pt-0.5"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando solicitação...</span>
                  </>
                ) : (
                  <>
                    <span>Solicitar acesso</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center pt-2">
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Acesso protegido e monitorado pela equipe de TI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
