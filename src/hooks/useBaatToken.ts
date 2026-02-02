import { useEffect } from 'react'

const BAAT_TOKEN_URL = 'https://nvdb-baat-dispenser.atlas.vegvesen.no/api/v1/token'
const REFRESH_BUFFER_MS = 60_000
const DEFAULT_TOKEN_TTL_MS = 55 * 60 * 1000

type BaatTokenResponse = {
  token?: string
  expires_in?: number
  expiresIn?: number
  expires_at?: string
  expiresAt?: string
  exp?: number
}

let currentToken: string | null = null
let tokenExpiresAt = 0
let refreshTimeout: ReturnType<typeof setTimeout> | null = null
let refreshPromise: Promise<string> | null = null

function resolveExpiresAt(data: BaatTokenResponse): number {
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : typeof data.expiresIn === 'number' ? data.expiresIn : null
  if (expiresIn !== null) {
    return Date.now() + expiresIn * 1000
  }

  const expiresAt = data.expires_at ?? data.expiresAt
  if (expiresAt) {
    const parsed = Date.parse(expiresAt)
    if (!Number.isNaN(parsed)) return parsed
  }

  if (typeof data.exp === 'number') {
    return data.exp * 1000
  }

  return Date.now() + DEFAULT_TOKEN_TTL_MS
}

async function fetchToken(): Promise<{ token: string; expiresAt: number }> {
  const response = await fetch(BAAT_TOKEN_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch BAAT token: ${response.status}`)
  }
  const data = (await response.json()) as BaatTokenResponse
  const token = data.token
  if (!token) {
    throw new Error('BAAT token response missing token')
  }
  return { token, expiresAt: resolveExpiresAt(data) }
}

function scheduleRefresh(expiresAt: number) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }
  const delay = Math.max(1000, expiresAt - Date.now() - REFRESH_BUFFER_MS)
  refreshTimeout = setTimeout(() => {
    void refreshBaatToken()
  }, delay)
}

function shouldRefreshToken(): boolean {
  if (!currentToken) return true
  return Date.now() >= tokenExpiresAt - REFRESH_BUFFER_MS
}

async function refreshBaatToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const { token, expiresAt } = await fetchToken()
    currentToken = token
    tokenExpiresAt = expiresAt
    scheduleRefresh(expiresAt)
    return token
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export function getBaatToken(): string | null {
  return currentToken
}

export function useBaatToken() {
  useEffect(() => {
    let active = true
    const ensureToken = async () => {
      try {
        if (shouldRefreshToken()) {
          await refreshBaatToken()
        }
      } catch (error) {
        if (active) {
          console.warn('Failed to refresh BAAT token', error)
        }
      }
    }

    void ensureToken()
    return () => {
      active = false
    }
  }, [])
}
