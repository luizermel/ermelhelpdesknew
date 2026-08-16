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

import { Headset, ArrowRight, ShieldCheck } from 'lucide-react'

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
    <div className="min-h-screen w-full bg-gradient-to-b from-[#e8f3fa] via-[#edf6fc] to-[#f4f9fd] flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-[#0062a8]/20">
      {/* Header Top Left */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-[#005a9c] flex items-center justify-center text-[#005a9c] bg-white/60 shadow-sm">
          <Headset className="w-6 h-6 stroke-[2]" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#0f172a]">Help Desk TI</span>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[430px] mx-auto my-auto py-8">
        {/* Title / Description area */}
        <div className="mb-6 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7a9c]">
            PORTAL CORPORATIVO
          </p>
          <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#0a192f] tracking-tight leading-none">
            Bem-vindo
          </h1>
          <p className="text-[13.5px] text-[#556980] leading-snug pt-1">
            Entre para acompanhar solicitações e manter seu trabalho em movimento.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-lg shadow-sky-900/5 border border-slate-200/60 bg-white rounded-2xl p-6 sm:p-7 space-y-5">
          {/* Tab switcher */}
          <div className="bg-[#f0f4f8] p-1 rounded-xl flex items-center">
            <button
              type="button"
              className="flex-1 py-2 text-xs font-semibold text-[#0a192f] bg-white rounded-lg shadow-sm border border-slate-200/50 transition-all text-center"
            >
              Entrar
            </button>
            <Link
              to="/registro"
              className="flex-1 py-2 text-xs font-semibold text-[#556980] hover:text-[#0a192f] transition-colors text-center"
            >
              Solicitar acesso
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

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
                  placeholder="infobelbh@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#1e293b]">
                  Senha
                </Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-[#0062a8] hover:underline font-semibold"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Infobel@2027"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password)
                      setFieldErrors({ ...fieldErrors, password: undefined })
                  }}
                  className={`pl-10 pr-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl ${
                    fieldErrors.password ? 'border-red-500 focus-visible:ring-red-400' : ''
                  }`}
                  disabled={loading}
                  autoComplete="current-password"
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-[#0062a8] hover:bg-[#00508a] active:bg-[#004375] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <span>Entrar</span>
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
