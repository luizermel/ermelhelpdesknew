import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Cpu,
  Loader2,
  Building2,
  User as UserIcon,
  Hash,
  Activity,
  Monitor,
  Printer,
  Smartphone,
  Laptop,
  Package,
} from 'lucide-react'
import { assetsService } from '@/services/api'
import type { Asset, AssetType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Em uso': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Em manutenção': 'bg-amber-50 text-amber-700 border-amber-200',
  Desativado: 'bg-slate-100 text-slate-600 border-slate-200',
  'Em estoque': 'bg-blue-50 text-blue-700 border-blue-200',
}

const TYPE_ICON: Record<AssetType, React.ElementType> = {
  Computador: Cpu,
  Notebook: Laptop,
  Impressora: Printer,
  Monitor: Monitor,
  Smartphone: Smartphone,
  Outros: Package,
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    assetsService
      .getById(id)
      .then((a) => {
        if (!cancelled) setAsset(a)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) toast.error('Ativo não encontrado.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">Ativo não encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/cadastros">Voltar para Cadastros</Link>
        </Button>
      </div>
    )
  }

  const TypeIcon = TYPE_ICON[asset.type] || Package

  const rows = [
    { label: 'Tipo', icon: TypeIcon, value: asset.type },
    { label: 'Número de série', icon: Hash, value: asset.serial_number || '—' },
    {
      label: 'Status',
      icon: Activity,
      value: (
        <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[asset.status])}>
          {asset.status}
        </Badge>
      ),
    },
    { label: 'Setor', icon: Building2, value: asset.expand?.sector?.name || '—' },
    { label: 'Responsável', icon: UserIcon, value: asset.expand?.user?.name || '—' },
    { label: 'Especificações', icon: Cpu, value: asset.specifications || '—', multiline: true },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-600 hover:text-slate-900 -ml-2 mb-2"
        >
          <Link to="/admin" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
        </Button>
      </div>

      <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TypeIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">{asset.name}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Ativo de TI · {asset.type}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {rows.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.label} className={cn('flex gap-3', r.multiline && 'sm:col-span-2')}>
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {r.label}
                    </dt>
                    <dd
                      className={cn(
                        'text-sm text-slate-800 mt-0.5',
                        r.multiline && 'whitespace-pre-wrap',
                      )}
                    >
                      {r.value}
                    </dd>
                  </div>
                </div>
              )
            })}
          </dl>

          <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-400">
            Cadastrado em{' '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
              new Date(asset.created),
            )}
            {asset.updated && asset.updated !== asset.created && (
              <>
                {' '}
                · Atualizado em{' '}
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
                  new Date(asset.updated),
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
