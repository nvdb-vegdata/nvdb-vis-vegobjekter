import { atom } from 'jotai'
import WKT from 'ol/format/WKT'
import { Polygon } from 'ol/geom'
import type { Vegobjekttype } from '../api/datakatalogClient'
import type { Vegobjekt } from '../api/uberiketClient'

export const DEFAULT_VEGLENKESEKVENSER_LIMIT = 10

function getInitialTypeIds(): number[] {
  const params = new URLSearchParams(window.location.search)
  const typesParam = params.get('types')
  if (!typesParam) return []
  return typesParam
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0)
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

export const selectedTypeIdsAtom = atom<number[]>(getInitialTypeIds())
export const selectedTypesAtom = atom<Vegobjekttype[]>([])
export const polygonAtom = atom<Polygon | null>(getInitialPolygon())
export const veglenkesekvensLimitAtom = atom(DEFAULT_VEGLENKESEKVENSER_LIMIT)
export const focusedVegobjektAtom = atom<{ typeId: number; id: number } | null>(
  null,
)
export const hoveredVegobjektAtom = atom<Vegobjekt | null>(null)
