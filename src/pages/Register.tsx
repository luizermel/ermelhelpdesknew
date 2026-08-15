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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4">
      <Card className="w-full max-w-[480px] shadow-xl border-slate-200/80 bg-white rounded-2xl animate-fade-in-up my-6">
        <CardHeader className="text-center pb-5">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-2">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            Criar nova conta
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Cadastre-se para abrir e acompanhar chamados de TI
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Nome completo
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Carlos da Silva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' })
                  }}
                  className={`pl-9.5 ${fieldErrors.name ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
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
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                E-mail corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.nome@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
                  }}
                  className={`pl-9.5 ${fieldErrors.email ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Sector Dropdown (10 sectors) */}
            <div className="space-y-1.5">
              <Label htmlFor="sector" className="text-xs font-semibold text-slate-700">
                Setor de trabalho (10 setores)
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
                    className={`w-full pl-9.5 ${fieldErrors.sector ? 'border-red-500 focus:ring-red-400' : ''}`}
                  >
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <SelectValue
                      placeholder={loadingSectors ? 'Carregando setores...' : 'Selecione seu setor'}
                    />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Senha de acesso
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo de 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
                  }}
                  className={`pl-9.5 pr-10 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.password}</p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Dica: use pelo menos 8 caracteres com letras e números.
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-slate-700">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
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
                  className={`pl-9.5 pr-10 ${fieldErrors.passwordConfirm ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
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

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 shadow-sm transition-all duration-150 active:scale-[0.99] mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Já possui uma conta?{' '}
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
