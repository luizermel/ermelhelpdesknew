import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User, Sector } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  userSector: Sector | null
  signIn: (email: string, password: string) => Promise<User>
  signUp: (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    sector: string
  }) => Promise<void>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      return pb.authStore.model as unknown as User
    }
    return null
  })
  const [token, setToken] = useState<string | null>(() => pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userSector, setUserSector] = useState<Sector | null>(null)
  const [, startTransition] = useTransition()

  const fetchUserExtra = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserSector(null)
      return
    }

    try {
      if (currentUser.sector) {
        const sectorRecord = await pb.collection('sectors').getOne<Sector>(currentUser.sector)
        setUserSector(sectorRecord)
      } else {
        setUserSector(null)
      }
    } catch {
      setUserSector(null)
    }
  }

  useEffect(() => {
    // Initial check
    if (pb.authStore.isValid && pb.authStore.model) {
      const authUser = pb.authStore.model as unknown as User
      setUser(authUser)
      setToken(pb.authStore.token)
      fetchUserExtra(authUser).finally(() => {
        setIsLoading(false)
      })
    } else {
      setUser(null)
      setToken(null)
      setUserSector(null)
      setIsLoading(false)
    }

    const unsubscribe = pb.authStore.onChange((newToken, model) => {
      startTransition(() => {
        const u = model as unknown as User | null
        setUser(u)
        setToken(newToken)
        if (u) {
          fetchUserExtra(u)
        } else {
          setUserSector(null)
        }
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<User> => {
    const authData = await pb.collection('users').authWithPassword(email.trim(), password)
    const loggedUser = authData.record as unknown as User
    setUser(loggedUser)
    setToken(authData.token)
    await fetchUserExtra(loggedUser)
    return loggedUser
  }

  const signUp = async (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    sector: string
  }): Promise<void> => {
    await pb.collection('users').create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      sector: data.sector,
      role: 'user',
    })
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
    setUserSector(null)
  }

  const requestPasswordReset = async (email: string): Promise<void> => {
    await pb.collection('users').requestPasswordReset(email.trim().toLowerCase())
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const authData = await pb.collection('users').authRefresh()
        const refreshed = authData.record as unknown as User
        setUser(refreshed)
        await fetchUserExtra(refreshed)
      } catch {
        signOut()
      }
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        userSector,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}

export default useAuth
