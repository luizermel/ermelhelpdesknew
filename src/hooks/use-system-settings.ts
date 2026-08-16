import { useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { settingsService } from '@/services/api'
import type { SystemSettings } from '@/types'

export interface SystemSettingsContext {
  systemName: string
  systemSubtitle: string
  logoUrl: string
  primaryColor: string
  settings: SystemSettings | null
  refresh: () => Promise<void>
  loading: boolean
}

const DEFAULTS: SystemSettingsContext = {
  systemName: 'Help Desk Hub',
  systemSubtitle: 'Central de TI',
  logoUrl: '',
  primaryColor: '#0c3b68',
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

// Subscribe to realtime updates of system_settings so all open tabs stay in sync
pb.collection('system_settings')
  .subscribe('*', () => {
    doRefresh()
  })
  .catch(() => {})

export default useSystemSettings
