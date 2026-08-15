import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LifeBuoy,
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  ShieldCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
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

export default function Layout() {
  const { user, isAdmin, signOut, userSector } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      to: '/chamados',
      label: 'Chamados',
      icon: TicketIcon,
      adminOnly: false,
    },
    {
      to: '/chamados/novo',
      label: 'Abrir Chamado',
      icon: PlusCircle,
      adminOnly: false,
    },
    {
      to: '/admin',
      label: 'Painel Admin',
      icon: ShieldCheck,
      adminOnly: true,
    },
    {
      to: '/relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      adminOnly: true,
    },
  ]

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Desktop Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] bg-white border-r border-slate-200 flex-col z-30 shadow-sm">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <LifeBuoy className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none tracking-tight">Help Desk Hub</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Central de TI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Principal
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/dashboard' &&
                item.to !== '/chamados/novo' &&
                location.pathname.startsWith(item.to + '/'))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: directActive }) => {
                  const active = directActive || isActive
                  return cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )
                }}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-indigo-600' : 'text-slate-400',
                  )}
                />
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    Admin
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Block at bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <Avatar className="h-10 w-10 border border-indigo-100 shrink-0">
              {user?.avatar && <AvatarImage src={getFileUrl(user, user.avatar)} alt={user.name} />}
              <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate leading-snug">
                {user?.name || 'Usuário'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="truncate">
                  {userSector?.name || (isAdmin ? 'TI / Admin' : 'Setor Geral')}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar (< 1024px) */}
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
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 text-base">Help Desk Hub</span>
          </div>
        </div>

        {/* Mobile User Dropdown */}
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 animate-slide-right">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <span className="font-bold text-slate-900">Help Desk Hub</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Menu de Navegação
              </div>
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== '/dashboard' &&
                    item.to !== '/chamados/novo' &&
                    location.pathname.startsWith(item.to + '/'))
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive: directActive }) => {
                      const active = directActive || isActive
                      return cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50',
                      )
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-slate-400')}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.adminOnly ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        Admin
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    )}
                  </NavLink>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border border-indigo-100">
                  {user?.avatar && (
                    <AvatarImage src={getFileUrl(user, user.avatar)} alt={user.name} />
                  )}
                  <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 justify-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sair do sistema
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-[260px] flex flex-col flex-1 min-h-screen">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="py-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
          <p>Help Desk Hub © {new Date().getFullYear()} — Suporte interno de TI</p>
        </footer>
      </div>
    </div>
  )
}
