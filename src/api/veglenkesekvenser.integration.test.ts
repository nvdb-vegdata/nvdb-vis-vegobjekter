import { describe, expect, test } from 'bun:test'
import { hentVeglenkesekvenser } from './uberiketClient'
import './apiConfig'

function formatZodLikeError(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const maybeIssues = (error as { issues?: unknown }).issues
  if (!Array.isArray(maybeIssues)) return null

  try {
    return JSON.stringify(maybeIssues, null, 2)
  } catch {
    return String(maybeIssues)
  }
}

describe('Uberiket API integration', () => {
  test('hentVeglenkesekvenser returns usable data', async () => {
    try {
      // Act
      // Prefer polygon query; fall back to vegsystemreferanse if polygon yields 0.
      const polygon = '262000 6650000, 262500 6650000, 262500 6650500, 262000 6650500, 262000 6650000'

      let data = await hentVeglenkesekvenser({
        antall: 5,
        polygon,
      })

      if (data.veglenkesekvenser.length === 0) {
        data = await hentVeglenkesekvenser({ antall: 5, vegsystemreferanse: 'EV6' })
      }

      // Assert
      expect(data).toBeTruthy()
      expect(Array.isArray(data.veglenkesekvenser)).toBe(true)
      expect(data.metadata).toBeTruthy()
      expect(data.veglenkesekvenser.length).toBeGreaterThan(0)

      const ids = data.veglenkesekvenser.slice(0, 3).map((vs) => vs.id)
      expect(ids.length).toBeGreaterThan(0)

      // Regression guard: fetching by explicit ID list must work.
      const byIdData = await hentVeglenkesekvenser({ antall: 5, ider: ids })

      const returnedIds = new Set(byIdData.veglenkesekvenser.map((vs) => vs.id))
      for (const id of ids) {
        expect(returnedIds.has(id)).toBe(true)
      }
    } catch (error) {
      const issues = formatZodLikeError(error)
      if (issues) {
        throw new Error(`Response validation failed (Zod issues):\n${issues}`)
      }
      throw error
    }
  }, 30_000)
})
