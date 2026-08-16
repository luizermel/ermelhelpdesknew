import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Headset,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Informe um e-mail corporativo válido.')
      return
    }

    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      // Always show success message to prevent user enumeration
      setSubmitted(true)
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
        <div className="mb-6 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7a9c]">
            PORTAL CORPORATIVO
          </p>
          <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#0a192f] tracking-tight leading-none">
            Recuperar senha
          </h1>
          <p className="text-[13.5px] text-[#556980] leading-snug pt-1">
            Informe seu e-mail cadastrado para receber as instruções de redefinição.
          </p>
        </div>

        <Card className="shadow-lg shadow-sky-900/5 border border-slate-200/60 bg-white rounded-2xl p-6 sm:p-7 space-y-5">
          <CardContent className="p-0">
            {submitted ? (
              <div className="space-y-4">
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <AlertTitle className="text-sm font-semibold text-emerald-900">
                    Solicitação enviada
                  </AlertTitle>
                  <AlertDescription className="text-xs text-emerald-700 mt-1">
                    Se o e-mail existir no sistema, você receberá um link para redefinir sua senha
                    em instantes.
                  </AlertDescription>
                </Alert>

                <p className="text-xs text-slate-500 text-center">
                  Verifique também sua pasta de spam ou lixo eletrônico.
                </p>

                <Button
                  asChild
                  className="w-full h-11 bg-[#0062a8] hover:bg-[#00508a] text-white font-semibold rounded-xl text-sm mt-2"
                >
                  <Link to="/">Voltar para o login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50 border-red-200 text-red-700 py-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

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
                        if (error) setError(null)
                      }}
                      className="pl-10 h-11 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0062a8] rounded-xl"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0062a8] hover:bg-[#00508a] active:bg-[#004375] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors mt-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando link...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 pt-4 px-0 pb-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#0062a8] hover:underline font-semibold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </CardFooter>
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
