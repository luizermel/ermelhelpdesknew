import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LifeBuoy, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errors.email = 'O e-mail corporativo é obrigatório.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Informe um e-mail válido.'
    }

    if (!password) {
      errors.password = 'A senha é obrigatória.'
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
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error(err)
      setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4">
      <Card className="w-full max-w-[420px] shadow-xl border-slate-200/80 bg-white rounded-2xl animate-fade-in-up">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-3">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            Help Desk Hub
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm mt-1">
            Central de atendimento e suporte interno
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
                  placeholder="exemplo@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Senha de acesso
                </Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password)
                      setFieldErrors({ ...fieldErrors, password: undefined })
                  }}
                  className={`pl-9.5 pr-10 ${fieldErrors.password ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  disabled={loading}
                  autoComplete="current-password"
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
              {fieldErrors.password && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.password}</p>
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
                  Entrando no sistema...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-4 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100/80 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-indigo-900">Acesso rápido para testes:</p>
            <p>
              Admin: <span className="font-mono text-indigo-700">infobelbh@gmail.com</span> /{' '}
              <span className="font-mono text-indigo-700">Skip@Pass</span>
            </p>
            <p>
              Usuário: <span className="font-mono text-indigo-700">carlos.silva@empresa.com</span> /{' '}
              <span className="font-mono text-indigo-700">Skip@Pass</span>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="relative w-full text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase text-slate-400 font-medium tracking-wider">
              ou
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
          >
            <Link to="/registro">Criar nova conta</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
