import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  isPlatformAdmin: boolean
  companyId: string | null
  companyName: string | null
  authError: string | null
  clearAuthError: () => void
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signOut: () => Promise<void>
  refreshMembership: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadMembership(userId: string): Promise<{
  isPlatformAdmin: boolean
  companyId: string | null
  companyName: string | null
}> {
  const supabase = getSupabase()

  const [adminRes, memberRes] = await Promise.all([
    supabase.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase.from('company_members').select('company_id').eq('user_id', userId).maybeSingle(),
  ])

  if (adminRes.error) throw new Error(adminRes.error.message)
  if (memberRes.error) throw new Error(memberRes.error.message)

  let companyName: string | null = null
  const companyId = memberRes.data?.company_id ? String(memberRes.data.company_id) : null

  if (companyId) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle()
    if (companyError) throw new Error(companyError.message)
    companyName = company?.name != null ? String(company.name) : null
  }

  return {
    isPlatformAdmin: Boolean(adminRes.data),
    companyId,
    companyName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const applyMembership = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setIsPlatformAdmin(false)
      setCompanyId(null)
      setCompanyName(null)
      return
    }
    const membership = await loadMembership(userId)
    setIsPlatformAdmin(membership.isPlatformAdmin)
    setCompanyId(membership.companyId)
    setCompanyName(membership.companyName)
  }, [])

  const refreshMembership = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) return
    await applyMembership(userId)
  }, [applyMembership, session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return undefined
    }

    const supabase = getSupabase()
    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (cancelled) return
        setSession(data.session)
        await applyMembership(data.session?.user?.id)
      } catch (err) {
        if (!cancelled) {
          setAuthError(err instanceof Error ? err.message : 'Failed to restore session')
          setSession(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void (async () => {
        try {
          await applyMembership(nextSession?.user?.id)
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : 'Failed to load membership')
        }
      })()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [applyMembership])

  const signIn = useCallback(async (email: string, password: string) => {
    clearAuthError()
    if (!isSupabaseConfigured()) {
      return { ok: false as const, error: 'Supabase is not configured' }
    }
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      return { ok: false as const, error: error.message }
    }
    setSession(data.session)
    try {
      await applyMembership(data.user?.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load membership'
      setAuthError(message)
      return { ok: false as const, error: message }
    }
    return { ok: true as const }
  }, [applyMembership, clearAuthError])

  const signOut = useCallback(async () => {
    clearAuthError()
    if (!isSupabaseConfigured()) return
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setSession(null)
    setIsPlatformAdmin(false)
    setCompanyId(null)
    setCompanyName(null)
  }, [clearAuthError])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isPlatformAdmin,
      companyId,
      companyName,
      authError,
      clearAuthError,
      signIn,
      signOut,
      refreshMembership,
    }),
    [
      session,
      loading,
      isPlatformAdmin,
      companyId,
      companyName,
      authError,
      clearAuthError,
      signIn,
      signOut,
      refreshMembership,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
