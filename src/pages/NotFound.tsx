import React from 'react'
import { Link } from 'react-router-dom'
import { LifeBuoy, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
          <LifeBuoy className="h-8 w-8 animate-bounce" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Página não encontrada</h2>
        <p className="text-sm text-slate-500">
          O endereço acessado não existe ou você não tem permissão para acessá-lo.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
