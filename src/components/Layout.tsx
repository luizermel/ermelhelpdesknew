import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LifeBuoy,
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  ShieldCheck,
  BarChart3,
  BookOpen,
  ListOrdered,
  Zap,
  Database,
  CheckCheck,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFileUrl } from '@/services/api'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Atendimento',
    items: [
      { to: '/chamados', label: 'Chamados', icon: TicketIcon },
      { to: '/novo-chamado', label: 'Novo Chamado', icon: PlusCircle, exact: true },
      { to: '/conhecimento', label: 'Base de Conhecimento', icon: BookOpen },
    ],
  },
  {
    label: 'Operação',
    items: [
      {
        to: '/admin',
        label: 'Painel de Controle',
        icon: ShieldCheck,
        adminOnly: true,
        exact: true,
      },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/fila', label: 'Fila de Atendimento', icon: ListOrdered, adminOnly: true },
      { to: '/respostas-rapidas', label: 'Respostas Rápidas', icon: Zap },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/cadastros', label: 'Cadastros', icon: Database, adminOnly: true, exact: true },
      { to: '/aprovacoes', label: 'Aprovações', icon: CheckCheck },
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
      { to: '/logs', label: 'Logs do Sistema', icon: ScrollText, adminOnly: true },
      {
        to: '/configuracoes',
        label: 'Configurações',
        icon: SettingsIcon,
        adminOnly: true,
        exact: true,
      },
    ],
  },
]

const COLLAPSE_KEY = 'hdh-sidebar-collapsed'

export default function Layout() {
  const { user, isAdmin, signOut, userSector } = useAuth()
  const { systemName, systemSubtitle, logoUrl } = useSystemSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  // close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const filteredGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((g) => g.items.length > 0)

  const isActive = (item: NavItem) => {
    if (item.exact || item.to === '/chamados') return location.pathname === item.to
    return location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  }

  const sidebarWidth = collapsed ? 76 : 260

  const renderBrand = (compact: boolean) => (
    <div
      className={cn(
        'h-16 flex items-center border-b border-white/10 gap-3',
        compact ? 'px-3 justify-center' : 'px-5',
      )}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={systemName} className="h-9 w-9 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-md shrink-0">
          <LifeBuoy className="h-5 w-5" />
        </div>
      )}
      {!compact && (
        <div className="min-w-0">
          <h1 className="font-bold text-white leading-none tracking-tight truncate">
            {systemName}
          </h1>
          <p className="text-[11px] text-white/60 mt-1 font-medium truncate">{systemSubtitle}</p>
        </div>
      )}
    </div>
  )

  const renderNav = (compact: boolean) => (
    <nav
      className={cn('flex-1 py-4 overflow-y-auto', compact ? 'px-2 space-y-4' : 'px-3 space-y-5')}
    >
      {filteredGroups.map((group) => (
        <div key={group.label} className="space-y-1.5">
          {!compact && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={compact ? item.label : undefined}
                className={({ isActive: directActive }) => {
                  const a = directActive || active
                  return cn(
                    'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                    compact ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5',
                    a
                      ? 'bg-white/15 text-white font-semibold shadow-xs'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    active ? 'text-white' : 'text-white/60',
                  )}
                />
                {!compact && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const renderUserBlock = (compact: boolean) => (
    <div className={cn('p-3 border-t border-white/10', compact && 'px-2')}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl bg-white/5 border border-white/10',
          compact ? 'p-2 justify-center' : 'p-2',
        )}
      >
        <Avatar className="h-9 w-9 border border-white/20 shrink-0">
          {user?.avatar && <AvatarImage src={getFileUrl(user, user.avatar)} alt={user.name} />}
          <AvatarFallback className="bg-white/20 text-white font-semibold text-xs">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        {!compact && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-snug">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-[11px] text-white/60 truncate">
              {userSector?.name || (isAdmin ? 'TI / Admin' : 'Setor Geral')}
            </p>
          </div>
        )}
        {!compact && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-white/60 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 shrink-0 transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  const sidebarBg = 'linear-gradient(180deg, #0c3b68 0%, #082844 100%)'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 flex-col z-30 shadow-lg transition-[width] duration-200"
        style={{ width: sidebarWidth, background: sidebarBg }}
      >
        {renderBrand(collapsed)}
        {renderNav(collapsed)}
        {renderUserBlock(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 z-40 h-6 w-6 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-700 hover:bg-slate-100 -ml-2"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={systemName} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                style={{ background: sidebarBg }}
              >
                <LifeBuoy className="h-4 w-4" />
              </div>
            )}
            <span className="font-bold text-slate-900 text-base">{systemName}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 border border-indigo-100">
                {user?.avatar && (
                  <AvatarImage src={getFileUrl(user, user.avatar)} alt={user.name} />
                )}
                <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                  {isAdmin ? 'Administrador' : `Setor: ${userSector?.name || 'Geral'}`}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative flex flex-col w-4/5 max-w-xs h-full shadow-2xl z-10 animate-slide-right"
            style={{ background: sidebarBg }}
          >
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt={systemName} className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                )}
                <span className="font-bold text-white">{systemName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {renderNav(false)}

            {renderUserBlock(false)}
          </div>
        </div>
      )}

      {/* Main Content Area — offset by fixed sidebar on desktop */}
      <div className="hdh-main flex flex-col flex-1 min-h-screen">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          <Outlet />
        </main>
        <footer className="py-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
          <p>
            {systemName} © {new Date().getFullYear()} — Suporte interno de TI
          </p>
        </footer>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .hdh-main { padding-left: ${sidebarWidth}px; transition: padding-left 200ms ease; }
        }
      `}</style>
    </div>
  )
}
