import { Polygon } from 'ol/geom'

const ROUNDING_FACTOR = 100

function roundDownTwoDecimals(value: number): number {
  return Math.floor(value * ROUNDING_FACTOR) / ROUNDING_FACTOR
}

function roundCoordinate(coord: number[]): number[] {
  const [x = 0, y = 0, ...rest] = coord
  return [roundDownTwoDecimals(x), roundDownTwoDecimals(y), ...rest]
}

function roundRing(ring: number[][]): number[][] {
  if (ring.length === 0) return ring
  const rounded = ring.map((coord) => roundCoordinate(coord))
  const first = rounded[0]
  const lastIndex = rounded.length - 1
  const last = rounded[lastIndex]
  if (!first || !last) return rounded
  if (first[0] !== last[0] || first[1] !== last[1]) {
    rounded[lastIndex] = [...first]
  }
  return rounded
}

export function roundPolygonToTwoDecimals(polygon: Polygon): Polygon {
  const roundedCoordinates = polygon.getCoordinates().map((ring) => roundRing(ring))
  return new Polygon(roundedCoordinates, polygon.getLayout())
}
