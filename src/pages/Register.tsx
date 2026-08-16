import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LifeBuoy,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { sectorsService } from '@/services/api'
import type { Sector } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

import { Headset, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [sectors, setSectors] = useState<Sector[]>([])
  const [loadingSectors, setLoadingSectors] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sector, setSector] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    sectorsService
      .getAll()
      .then((data) => {
        setSectors(data)
      })
      .catch((err) => {
        console.error('Erro ao carregar setores:', err)
      })
      .finally(() => {
        setLoadingSectors(false)
      })
  }, [])

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

    if (!sector) {
      errors.sector = 'Selecione o seu setor de trabalho.'
    }

    if (!password) {
      errors.password = 'A senha é obrigatória.'
    } else if (password.length < 8) {
      errors.password = 'A senha deve conter no mínimo 8 caracteres.'
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = 'Confirme sua senha.'
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = 'As senhas não coincidem.'
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
      await signUp({
        name,
        email,
        password,
        passwordConfirm,
        sector,
      })

      toast.success('Conta criada com sucesso! Faça login para continuar.', {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      })
      navigate('/')
    } catch (err: unknown) {
      console.error(err)
      if (typeof err === 'object' && err !== null && 'data' in err) {
        const pbErr = err as { data?: { data?: Record<string, { message: string }> } }
        if (pbErr.data?.data) {
          const newErrors: Record<string, string> = {}
          for (const [key, val] of Object.entries(pbErr.data.data)) {
            newErrors[key] = val.message
          }
          setFieldErrors(newErrors)
        }
      }
      setErrorMessage(
        'Não foi possível concluir o cadastro. O e-mail informado pode já estar em uso.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#e8f3fa] via-[#edf6fc] to-[#f4f9fd] flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-[#0062a8]/20">
      {/* Header Top Left */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-[#005a9c] flex items-center justify-center text-[#005a9c] bg-white/60 shadow-sm">
          <Headset className="w-6 h-6 stroke-[2]" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#0f172a]">Help Desk TI</span>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[460px] mx-auto my-auto py-8">
        {/* Title / Description area */}
        <div className="mb-6 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7a9c]">
            PORTAL CORPORATIVO
          </p>
          <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#0a192f] tracking-tight leading-none">
            Solicitar acesso
          </h1>
          <p className="text-[13.5px] text-[#556980] leading-snug pt-1">
            Cadastre seus dados para abrir chamados e acompanhar solicitações na TI.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-lg shadow-sky-900/5 border border-slate-200/60 bg-white rounded-2xl p-6 sm:p-7 space-y-5">
          {/* Tab switcher */}
          <div className="bg-[#f0f4f8] p-1 rounded-xl flex items-center">
            <Link
              to="/"
              className="flex-1 py-2 text-xs font-semibold text-[#556980] hover:text-[#0a192f] transition-colors text-center"
            >
              Entrar
            </Link>
            <button
              type="button"
              className="flex-1 py-2 text-xs font-semibold text-[#0a192f] bg-white rounded-lg shadow-sm border border-slate-200/50 transition-all text-center"
            >
              Solicitar acesso
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-[#1e293b]">
                Nome completo
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Carlos Silva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' })
                  }}
                  className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl ${
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

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#1e293b]">
                E-mail corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="carlos.silva@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                  }}
                  className={`pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl ${
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

            {/* Sector Dropdown */}
            <div className="space-y-1.5">
              <Label htmlFor="sector" className="text-xs font-semibold text-[#1e293b]">
                Setor de trabalho
              </Label>
              <div className="relative">
                <Select
                  value={sector}
                  onValueChange={(val) => {
                    setSector(val)
                    if (fieldErrors.sector) setFieldErrors({ ...fieldErrors, sector: '' })
                  }}
                  disabled={loading || loadingSectors}
                >
                  <SelectTrigger
                    id="sector"
                    className={`w-full pl-10 h-11 border-slate-200 text-slate-800 focus:ring-1 focus:ring-[#0062a8] rounded-xl ${
                      fieldErrors.sector ? 'border-red-500 focus:ring-red-400' : ''
                    }`}
                  >
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                    <SelectValue
                      placeholder={loadingSectors ? 'Carregando setores...' : 'Selecione seu setor'}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldErrors.sector && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.sector}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[#1e293b]">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo de 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                  }}
                  className={`pl-10 pr-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl ${
                    fieldErrors.password ? 'border-red-500 focus-visible:ring-red-400' : ''
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-slate-800 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-[#1e293b]">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha digitada"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    if (fieldErrors.passwordConfirm)
                      setFieldErrors({ ...fieldErrors, passwordConfirm: '' })
                  }}
                  className={`pl-10 pr-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl ${
                    fieldErrors.passwordConfirm ? 'border-red-500 focus-visible:ring-red-400' : ''
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-slate-800 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.passwordConfirm && (
                <p className="text-[11px] text-red-500 font-medium">
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-[#0062a8] hover:bg-[#00508a] active:bg-[#004375] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Solicitando acesso...
                </>
              ) : (
                <>
                  <span>Solicitar acesso</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer Below Card */}
      <footer className="text-center pb-2">
        <p className="inline-flex items-center gap-1.5 text-xs text-[#64748b] font-medium">
          <ShieldCheck className="h-4 w-4 text-[#64748b]" />
          Acesso protegido e monitorado pela equipe de TI
        </p>
      </footer>
    </div>
  )
}
