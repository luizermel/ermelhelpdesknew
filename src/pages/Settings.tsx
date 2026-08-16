import React, { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  Loader2,
  Save,
  Upload,
  RotateCcw,
  Ticket as TicketIcon,
  PlusCircle,
  BookOpen,
  ShieldCheck,
  LayoutDashboard,
  ListOrdered,
  Zap,
  Database,
  CheckCheck,
  BarChart3,
  ScrollText,
  User,
  Inbox,
  Folder,
  FileText,
  HelpCircle,
  PhoneCall,
  Laptop,
  Box,
  Key,
  Flame,
  Star,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { settingsService } from '@/services/api'
import type { CustomMenuItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Ticket', icon: TicketIcon },
  { name: 'CirclePlus', icon: PlusCircle },
  { name: 'PlusCircle', icon: PlusCircle },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'LayoutDashboard', icon: LayoutDashboard },
  { name: 'PieChart', icon: BarChart3 },
  { name: 'ListChecks', icon: ListOrdered },
  { name: 'ListOrdered', icon: ListOrdered },
  { name: 'Zap', icon: Zap },
  { name: 'Database', icon: Database },
  { name: 'CheckCheck', icon: CheckCheck },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'ScrollText', icon: ScrollText },
  { name: 'Settings', icon: SettingsIcon },
  { name: 'User', icon: User },
  { name: 'Inbox', icon: Inbox },
  { name: 'Folder', icon: Folder },
  { name: 'FileText', icon: FileText },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'PhoneCall', icon: PhoneCall },
  { name: 'Laptop', icon: Laptop },
  { name: 'Box', icon: Box },
  { name: 'Key', icon: Key },
  { name: 'Flame', icon: Flame },
  { name: 'Star', icon: Star },
  { name: 'Tag', icon: Tag },
  { name: 'Users', icon: Users },
]

export const DEFAULT_MENU_ITEMS: CustomMenuItem[] = [
  { path: '/chamados', label: 'Meus chamados', iconName: 'Ticket' },
  { path: '/novo-chamado', label: 'Abrir chamado', iconName: 'CirclePlus' },
  { path: '/conhecimento', label: 'Conhecimento', iconName: 'BookOpen' },
  { path: '/admin', label: 'Painel de suporte', iconName: 'LayoutDashboard' },
  { path: '/dashboard', label: 'Dashboard', iconName: 'PieChart' },
  { path: '/fila', label: 'Minha fila', iconName: 'ListChecks' },
  { path: '/respostas-rapidas', label: 'Respostas rápidas', iconName: 'Zap' },
  { path: '/cadastros', label: 'Cadastros', iconName: 'Database' },
  { path: '/aprovacoes', label: 'Aprovações', iconName: 'CheckCheck' },
  { path: '/relatorios', label: 'Relatórios', iconName: 'BarChart3' },
  { path: '/logs', label: 'Logs', iconName: 'ScrollText' },
  { path: '/configuracoes', label: 'Configurações', iconName: 'Settings' },
]

export default function SettingsPage() {
  const { settings, refresh, loading } = useSystemSettings()

  const [form, setForm] = useState({
    system_name: 'Help Desk TI',
    system_subtitle: 'Central de suporte',
    logo_url: '',
    primary_color: '#082844',
    panel_color: '#082844',
    institutional_desc:
      'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.',
    show_institutional_newline: true,
    login_title: 'Bem-vindo',
    login_desc: 'Entre para acompanhar solicitações e manter seu trabalho em movimento.',
    footer_left: 'Uso interno • Ambiente corporativo',
    footer_right: 'Suporte com transparência',
    allow_public_register: true,
  })

  const [menuItems, setMenuItems] = useState<CustomMenuItem[]>(DEFAULT_MENU_ITEMS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        system_name: settings.system_name || 'Help Desk TI',
        system_subtitle: settings.system_subtitle || 'Central de suporte',
        logo_url: settings.logo_url || '',
        primary_color: settings.primary_color || '#082844',
        panel_color: settings.panel_color || settings.primary_color || '#082844',
        institutional_desc:
          settings.institutional_desc ||
          'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.',
        show_institutional_newline: settings.show_institutional_newline ?? true,
        login_title: settings.login_title || 'Bem-vindo',
        login_desc:
          settings.login_desc ||
          'Entre para acompanhar solicitações e manter seu trabalho em movimento.',
        footer_left: settings.footer_left || 'Uso interno • Ambiente corporativo',
        footer_right: settings.footer_right || 'Suporte com transparência',
        allow_public_register: settings.allow_public_register ?? true,
      })

      if (Array.isArray(settings.custom_menu) && settings.custom_menu.length > 0) {
        const map = new Map(settings.custom_menu.map((m) => [m.path, m]))
        const merged = DEFAULT_MENU_ITEMS.map((d) => map.get(d.path) || d)
        setMenuItems(merged)
      } else {
        setMenuItems(DEFAULT_MENU_ITEMS)
      }
    }
  }, [settings])

  const handleMenuChange = (path: string, field: 'label' | 'iconName', value: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.path === path ? { ...item, [field]: value } : item)),
    )
  }

  const handleRestoreDefaults = () => {
    setForm({
      system_name: 'Help Desk TI',
      system_subtitle: 'Central de suporte',
      logo_url: '',
      primary_color: '#082844',
      panel_color: '#082844',
      institutional_desc:
        'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.',
      show_institutional_newline: true,
      login_title: 'Bem-vindo',
      login_desc: 'Entre para acompanhar solicitações e manter seu trabalho em movimento.',
      footer_left: 'Uso interno • Ambiente corporativo',
      footer_right: 'Suporte com transparência',
      allow_public_register: true,
    })
    setMenuItems(DEFAULT_MENU_ITEMS)
    toast.info('Padrões restaurados. Clique em "Salvar personalização" para confirmar.')
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        custom_menu: menuItems,
      }

      if (settings?.id) {
        await settingsService.update(settings.id, payload)
      } else {
        await settingsService.create(payload)
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
    if (!file) return
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        setForm((f) => ({ ...f, logo_url: dataUrl }))
        toast.success('Logo selecionado. Clique em "Salvar personalização".')
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Erro ao processar imagem do logo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062a8]" />
      </div>
    )
  }

  return (
    <div className="relative pb-16 font-sans text-slate-800 space-y-6">
      {/* SEÇÃO SUPERIOR: Customização do Login & Painel Institucional */}
      <Card className="bg-white border border-slate-200/80 shadow-2xs rounded-2xl p-6 sm:p-8 space-y-5">
        {/* Toggle 1: Exibir o texto destacado em uma nova linha */}
        <div className="flex items-center justify-start gap-3">
          <Switch
            checked={form.show_institutional_newline}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, show_institutional_newline: checked }))
            }
          />
          <Label className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
            Exibir o texto destacado em uma nova linha
          </Label>
        </div>

        {/* Descrição institucional */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">Descrição institucional</Label>
          <Textarea
            rows={2}
            value={form.institutional_desc}
            onChange={(e) => setForm({ ...form, institutional_desc: e.target.value })}
            className="text-xs sm:text-sm rounded-xl border-slate-200/90"
          />
        </div>

        {/* Grid 2 colunas: Título do login & Descrição do login */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Título do login</Label>
            <Input
              value={form.login_title}
              onChange={(e) => setForm({ ...form, login_title: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Descrição do login</Label>
            <Input
              value={form.login_desc}
              onChange={(e) => setForm({ ...form, login_desc: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>
        </div>

        {/* Grid 2 colunas: Rodapé esquerdo & Rodapé direito */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Rodapé esquerdo</Label>
            <Input
              value={form.footer_left}
              onChange={(e) => setForm({ ...form, footer_left: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Rodapé direito</Label>
            <Input
              value={form.footer_right}
              onChange={(e) => setForm({ ...form, footer_right: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>
        </div>

        {/* Grid 2 colunas: Seletores de cor para Cor principal & Cor do painel institucional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Cor principal</Label>
            <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="w-full h-8 rounded-lg cursor-pointer border-0 p-0"
                style={{ backgroundColor: form.primary_color }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Cor do painel institucional
            </Label>
            <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="color"
                value={form.panel_color}
                onChange={(e) => setForm({ ...form, panel_color: e.target.value })}
                className="w-full h-8 rounded-lg cursor-pointer border-0 p-0"
                style={{ backgroundColor: form.panel_color }}
              />
            </div>
          </div>
        </div>

        {/* Toggle 2: Permitir solicitação pública de acesso na página inicial */}
        <div className="flex items-center justify-start gap-3 pt-1">
          <Switch
            checked={form.allow_public_register}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, allow_public_register: checked }))
            }
          />
          <Label className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
            Permitir solicitação pública de acesso na página inicial
          </Label>
        </div>
      </Card>

      {/* SEÇÃO INFERIOR: Identidade Visual (Esquerda) + Itens do Menu Lateral (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Identidade Visual (col-span-4) */}
        <Card className="lg:col-span-4 bg-white border border-slate-200/80 shadow-2xs rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Identidade visual</h2>

          {/* Logo upload box */}
          <div className="p-6 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <svg
                  className="w-10 h-10 text-slate-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
                  <path d="M19 11v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </div>

            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
                <Upload className="h-3.5 w-3.5 text-slate-500" /> Alterar logo
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoUpload(e.target.files?.[0])}
              />
            </label>
            <p className="text-[10px] text-slate-400">
              PNG, JPG, WebP ou SVG • otimização automática
            </p>
          </div>

          {/* Nome do sistema */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Nome do sistema</Label>
            <Input
              value={form.system_name}
              onChange={(e) => setForm({ ...form, system_name: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>

          {/* Subtítulo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Subtítulo</Label>
            <Input
              value={form.system_subtitle}
              onChange={(e) => setForm({ ...form, system_subtitle: e.target.value })}
              className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/90"
            />
          </div>

          {/* Restaurar padrão button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleRestoreDefaults}
            className="w-full h-10 border-slate-200 text-slate-700 font-semibold text-xs rounded-xl gap-2 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
          </Button>
        </Card>

        {/* Itens do Menu Lateral (col-span-8) */}
        <Card className="lg:col-span-8 bg-white border border-slate-200/80 shadow-2xs rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Itens do menu lateral</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere o título e o símbolo exibido para cada tela.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const currentIconObj = AVAILABLE_ICONS.find((i) => i.name === item.iconName)
              const IconComp = currentIconObj ? currentIconObj.icon : TicketIcon

              return (
                <div
                  key={item.path}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#e8f2fc] text-[#0062a8] flex items-center justify-center shrink-0">
                      <IconComp className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">Título</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => handleMenuChange(item.path, 'label', e.target.value)}
                        className="h-9 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">Símbolo</Label>
                      <Select
                        value={item.iconName}
                        onValueChange={(val) => handleMenuChange(item.path, 'iconName', val)}
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-white border-slate-200">
                          <SelectValue placeholder="Símbolo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 rounded-xl">
                          {AVAILABLE_ICONS.map((ic) => {
                            const Icon = ic.icon
                            return (
                              <SelectItem key={ic.name} value={ic.name} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 text-[#0062a8]" />
                                  <span>{ic.name}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Floating Sticky Save Button (Matching bottom right of reference images) */}
      <div className="fixed bottom-6 right-8 z-50">
        <Button
          onClick={() => handleSave()}
          disabled={saving}
          className="bg-[#0062a8] hover:bg-[#00508a] active:bg-[#004375] text-white font-bold text-xs h-11 px-6 rounded-2xl gap-2 shadow-xl shadow-sky-950/20 border border-white/20 transition-all hover:scale-105"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4 stroke-[2.5]" />
          )}
          Salvar personalização
        </Button>
      </div>
    </div>
  )
}
