import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LifeBuoy, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4">
      <Card className="w-full max-w-[420px] shadow-xl border-slate-200/80 bg-white rounded-2xl animate-fade-in-up">
        <CardHeader className="text-center pb-5">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-2">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            Recuperar senha
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Informe seu e-mail cadastrado para receber as instruções de recuperação
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="text-sm font-semibold text-emerald-900">
                  Solicitação enviada
                </AlertTitle>
                <AlertDescription className="text-xs text-emerald-700 mt-1">
                  Se o e-mail existir no sistema, você receberá um link para redefinir sua senha em
                  instantes.
                </AlertDescription>
              </Alert>

              <p className="text-xs text-slate-500 text-center">
                Verifique também sua pasta de spam ou lixo eletrônico.
              </p>

              <Button
                asChild
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium mt-2"
              >
                <Link to="/">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200 text-red-700 py-2.5"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

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
                      if (error) setError(null)
                    }}
                    className="pl-9.5"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 shadow-sm transition-all duration-150 active:scale-[0.99] mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando link...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
