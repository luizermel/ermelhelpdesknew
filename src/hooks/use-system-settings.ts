import { useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { settingsService } from '@/services/api'
import type { SystemSettings } from '@/types'

export interface SystemSettingsContext {
  systemName: string
  systemSubtitle: string
  logoUrl: string
  primaryColor: string
  panelColor: string
  institutionalDesc: string
  showInstitutionalNewline: boolean
  loginTitle: string
  loginDesc: string
  footerLeft: string
  footerRight: string
  allowPublicRegister: boolean
  finalizationApprovalHours: number
  reopenDeadlineHours: number
  settings: SystemSettings | null
  refresh: () => Promise<void>
  loading: boolean
}

const DEFAULTS: SystemSettingsContext = {
  systemName: 'Help Desk TI',
  systemSubtitle: 'Central de suporte',
  logoUrl: '',
  primaryColor: '#082844',
  panelColor: '#082844',
  institutionalDesc:
    'Abra chamados em segundos, acompanhe o andamento em tempo real e ajude a equipe de TI a identificar problemas recorrentes por setor.',
  showInstitutionalNewline: true,
  loginTitle: 'Bem-vindo',
  loginDesc: 'Entre para acompanhar solicitações e manter seu trabalho em movimento.',
  footerLeft: 'Uso interno • Ambiente corporativo',
  footerRight: 'Suporte com transparência',
  allowPublicRegister: true,
  finalizationApprovalHours: 48,
  reopenDeadlineHours: 72,
  settings: null,
  refresh: async () => {},
  loading: true,
}

let cache: SystemSettingsContext = { ...DEFAULTS }
const listeners = new Set<() => void>()

async function loadSettings(): Promise<SystemSettingsContext> {
  try {
    const s = await settingsService.get()
    return {
      systemName: s?.system_name || DEFAULTS.systemName,
      systemSubtitle: s?.system_subtitle || DEFAULTS.systemSubtitle,
      logoUrl: s?.logo_url || '',
      primaryColor: s?.primary_color || DEFAULTS.primaryColor,
      panelColor: s?.panel_color || s?.primary_color || DEFAULTS.panelColor,
      institutionalDesc: s?.institutional_desc || DEFAULTS.institutionalDesc,
      showInstitutionalNewline: s?.show_institutional_newline ?? DEFAULTS.showInstitutionalNewline,
      loginTitle: s?.login_title || DEFAULTS.loginTitle,
      loginDesc: s?.login_desc || DEFAULTS.loginDesc,
      footerLeft: s?.footer_left || DEFAULTS.footerLeft,
      footerRight: s?.footer_right || DEFAULTS.footerRight,
      allowPublicRegister: s?.allow_public_register ?? DEFAULTS.allowPublicRegister,
      finalizationApprovalHours:
        s?.finalization_approval_hours ?? DEFAULTS.finalizationApprovalHours,
      reopenDeadlineHours: s?.reopen_deadline_hours ?? DEFAULTS.reopenDeadlineHours,
      settings: s,
      refresh: doRefresh,
      loading: false,
    }
  } catch {
    return { ...DEFAULTS, loading: false, refresh: doRefresh }
  }
}

async function doRefresh() {
  cache = await loadSettings()
  listeners.forEach((l) => l())
}

export function useSystemSettings(): SystemSettingsContext {
  const [state, setState] = useState<SystemSettingsContext>(cache)

  useEffect(() => {
    let mounted = true
    const listener = () => {
      if (mounted) setState({ ...cache })
    }
    listeners.add(listener)

    if (cache.loading) {
      loadSettings().then((s) => {
        cache = s
        if (mounted) setState({ ...cache })
      })
    }

    return () => {
      mounted = false
      listeners.delete(listener)
    }
  }, [])

  const refresh = useCallback(async () => {
    await doRefresh()
  }, [])

  return { ...state, refresh }
}

// Subscribe to realtime updates of system_settings so all open tabs stay in sync.
// Realtime is optional — if the SSE client is unavailable the app keeps working.
try {
  pb.collection('system_settings')
    .subscribe('*', () => {
      doRefresh()
    })
    .catch(() => {})
} catch {
  // Realtime client unavailable — degrade silently.
}

export default useSystemSettings
