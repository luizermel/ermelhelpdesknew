import React, { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Loader2, LifeBuoy, Save, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { settingsService } from '@/services/api'
import { useSystemSettings } from '@/hooks/use-system-settings'
import type { SystemSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#0c3b68',
  '#1d4ed8',
  '#4f46e5',
  '#7c3aed',
  '#0d9488',
  '#dc2626',
  '#db2777',
  '#ea580c',
]

export default function SettingsPage() {
  const { settings, refresh, loading } = useSystemSettings()
  const [form, setForm] = useState({
    system_name: 'Help Desk Hub',
    system_subtitle: 'Central de TI',
    logo_url: '',
    primary_color: '#0c3b68',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        system_name: settings.system_name || 'Help Desk Hub',
        system_subtitle: settings.system_subtitle || 'Central de TI',
        logo_url: settings.logo_url || '',
        primary_color: settings.primary_color || '#0c3b68',
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port ?? 587,
        smtp_user: settings.smtp_user || '',
        smtp_password: settings.smtp_password || '',
      })
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (settings?.id) {
        await settingsService.update(settings.id, form)
      } else {
        await settingsService.create(form)
      }
      await refresh()
      toast.success('Configurações salvas com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file || !settings?.id) return
    try {
      const fd = new FormData()
      fd.append('logo_url', file)
      // Logo is stored as text URL — we keep the data URL for simplicity
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        await settingsService.update(settings.id, { logo_url: dataUrl })
        setForm((f) => ({ ...f, logo_url: dataUrl }))
        await refresh()
        toast.success('Logo atualizado!')
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Erro ao enviar logo.')
    }
  }

  const sidebarBg = `linear-gradient(180deg, ${form.primary_color} 0%, ${shade(form.primary_color, -25)} 100%)`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <SettingsIcon className="h-4 w-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configurações do Sistema
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Personalize a identidade visual e parâmetros gerais do Help Desk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Identidade do Sistema
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Nome, subtítulo e logo exibidos no menu lateral
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome do sistema</Label>
                <Input
                  value={form.system_name}
                  onChange={(e) => setForm({ ...form, system_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Subtítulo</Label>
                <Input
                  value={form.system_subtitle}
                  onChange={(e) => setForm({ ...form, system_subtitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">URL do logo</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.logo_url.startsWith('data:') ? '(imagem enviada)' : form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://... ou envie um arquivo"
                  />
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium hover:bg-slate-50 gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Enviar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Cor Primária</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Aplicada ao fundo do menu lateral
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="h-10 w-14 rounded border border-slate-200 cursor-pointer"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="max-w-[160px] font-mono text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, primary_color: c })}
                    className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/90 shadow-2xs rounded-2xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                E-mail (SMTP) — apenas exibição
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Parâmetros não funcionais no momento, apenas cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">SMTP Host</Label>
                <Input
                  value={form.smtp_host}
                  onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                  placeholder="smtp.empresa.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Porta</Label>
                <Input
                  type="number"
                  value={form.smtp_port}
                  onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Usuário</Label>
                <Input
                  value={form.smtp_user}
                  onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Senha</Label>
                <Input
                  type="password"
                  value={form.smtp_password}
                  onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Configurações
            </Button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pré-visualização
          </h3>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <div
              className="h-10 flex items-center px-4 text-white text-xs font-bold"
              style={{ background: sidebarBg }}
            >
              <span className="opacity-80">Prévia do Sidebar</span>
            </div>
            <div className="w-full p-0" style={{ background: sidebarBg }}>
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                {form.logo_url ? (
                  <img
                    src={form.logo_url.startsWith('data:') ? form.logo_url : undefined}
                    alt="logo"
                    className="h-9 w-9 rounded-xl object-cover bg-white/10"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {form.system_name || 'Help Desk Hub'}
                  </p>
                  <p className="text-[11px] text-white/60 truncate">
                    {form.system_subtitle || 'Central de TI'}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {['Chamados', 'Dashboard', 'Base de Conhecimento'].map((l, i) => (
                  <div
                    key={l}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-white/15 text-white font-semibold' : 'text-white/70'}`}
                  >
                    <span className="h-4 w-4 rounded bg-white/30" />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            As mudanças são aplicadas ao menu lateral de todas as telas após salvar.
          </p>
        </div>
      </div>
    </div>
  )
}

// helper: shade a hex color by percent (-100..100)
function shade(hex: string, percent: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const num = parseInt(h, 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  r = Math.max(0, Math.min(255, Math.round(r + (r * percent) / 100)))
  g = Math.max(0, Math.min(255, Math.round(g + (g * percent) / 100)))
  b = Math.max(0, Math.min(255, Math.round(b + (b * percent) / 100)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
