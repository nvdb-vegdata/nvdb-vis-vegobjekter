import { atom } from 'jotai'
import WKT from 'ol/format/WKT'
import { Polygon } from 'ol/geom'
import type { Vegobjekttype } from '../api/datakatalogClient'
import type { Vegobjekt } from '../api/uberiketClient'

export const DEFAULT_VEGLENKESEKVENSER_LIMIT = 10

function getInitialTypeIds(): number[] {
  const params = new URLSearchParams(window.location.search)
  const typesParam = params.get('types')
  if (!typesParam || typesParam === 'all') return []
  return typesParam
    .split(',')
    .map(Number)
    .filter((n) => !Number.isNaN(n) && n > 0)
}

function getInitialAllTypesSelected(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('types') === 'all'
}

function getInitialPolygon(): Polygon | null {
  const params = new URLSearchParams(window.location.search)
  const wkt = params.get('polygon')
  if (!wkt) return null
  try {
    const format = new WKT()
    const geom = format.readGeometry(wkt)
    if (geom instanceof Polygon) {
      return geom
    }
  } catch {
    console.warn('Failed to parse WKT from URL')
  }
  return null
}

export type SearchMode = 'polygon' | 'strekning' | 'stedfesting'

function getInitialStrekning(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('strekning')?.trim() ?? ''
}

function getInitialStedfesting(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('stedfesting')?.trim() ?? ''
}

function getInitialSearchMode(): SearchMode {
  const stedfesting = getInitialStedfesting()
  if (stedfesting.length > 0) return 'stedfesting'
  const strekning = getInitialStrekning()
  return strekning.length > 0 ? 'strekning' : 'polygon'
}

function getInitialVeglenkesekvensLimit(): number {
  const params = new URLSearchParams(window.location.search)
  const limitParam = params.get('veglenkesekvenslimit')
  if (!limitParam) return DEFAULT_VEGLENKESEKVENSER_LIMIT
  const parsedLimit = Number(limitParam)
  if (!Number.isFinite(parsedLimit)) return DEFAULT_VEGLENKESEKVENSER_LIMIT
  const allowedLimits = new Set([10, 20, 50, 100])
  return allowedLimits.has(parsedLimit) ? parsedLimit : DEFAULT_VEGLENKESEKVENSER_LIMIT
}

function getInitialPolygonClip(): boolean {
  const params = new URLSearchParams(window.location.search)
  const clipParam = params.get('polygonclip')?.toLowerCase()
  if (!clipParam) return true
  if (clipParam === '0' || clipParam === 'false') return false
  return clipParam === '1' || clipParam === 'true'
}

export const selectedTypeIdsAtom = atom<number[]>(getInitialTypeIds())
export const selectedTypesAtom = atom<Vegobjekttype[]>([])
export const allTypesSelectedAtom = atom(getInitialAllTypesSelected())
export const polygonAtom = atom<Polygon | null>(getInitialPolygon())
export const polygonClipAtom = atom<boolean>(getInitialPolygonClip())
export const veglenkesekvensLimitAtom = atom(getInitialVeglenkesekvensLimit())
export const searchModeAtom = atom<SearchMode>(getInitialSearchMode())
export const strekningAtom = atom<string>(getInitialStrekning())
export const strekningInputAtom = atom<string>(getInitialStrekning())
export const stedfestingAtom = atom<string>(getInitialStedfesting())
export const stedfestingInputAtom = atom<string>(getInitialStedfesting())
export const focusedVegobjektAtom = atom<{
  typeId: number
  id: number
  token: number
} | null>(null)
export const locateVegobjektAtom = atom<{
  vegobjekt: Vegobjekt
  token: number
} | null>(null)
export const hoveredVegobjektAtom = atom<Vegobjekt | null>(null)
export const vegobjekterErrorAtom = atom<string | null>(null)
