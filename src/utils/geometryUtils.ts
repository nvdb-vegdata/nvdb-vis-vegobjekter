import type { Stedfesting, VeglenkesekvensMedPosisjoner } from '../api/uberiketClient'
import { getVegobjektPositions } from '../api/uberiketClient'

export interface ClippedGeometry {
  veglenkesekvensId: number
  veglenkeNummer: number
  startFraction: number
  endFraction: number
}

function rangesOverlap(range1Start: number, range1End: number, range2Start: number, range2End: number): { overlapStart: number; overlapEnd: number } | null {
  const overlapStart = Math.max(range1Start, range2Start)
  const overlapEnd = Math.min(range1End, range2End)

  if (overlapStart >= overlapEnd) {
    return null
  }

  return { overlapStart, overlapEnd }
}

function pointInRange(point: number, rangeStart: number, rangeEnd: number): boolean {
  return point >= rangeStart && point <= rangeEnd
}

export function getClippedGeometries(stedfesting: Stedfesting | undefined, veglenkesekvenser: VeglenkesekvensMedPosisjoner[]): ClippedGeometry[] {
  if (!stedfesting) return []

  const results: ClippedGeometry[] = []

  for (const vs of veglenkesekvenser) {
    const positions = getVegobjektPositions(stedfesting, vs.id)
    if (positions.length === 0) continue

    for (const pos of positions) {
      const isPoint = pos.start === pos.slutt

      for (const vl of vs.veglenker) {
        const vlLength = vl.sluttposisjon - vl.startposisjon
        if (vlLength === 0) continue

        if (isPoint) {
          if (pointInRange(pos.start, vl.startposisjon, vl.sluttposisjon)) {
            const fraction = (pos.start - vl.startposisjon) / vlLength
            results.push({
              veglenkesekvensId: vs.id,
              veglenkeNummer: vl.nummer,
              startFraction: fraction,
              endFraction: fraction,
            })
          }
        } else {
          const overlap = rangesOverlap(vl.startposisjon, vl.sluttposisjon, pos.start, pos.slutt)

          if (overlap) {
            const startFraction = (overlap.overlapStart - vl.startposisjon) / vlLength
            const endFraction = (overlap.overlapEnd - vl.startposisjon) / vlLength

            results.push({
              veglenkesekvensId: vs.id,
              veglenkeNummer: vl.nummer,
              startFraction,
              endFraction,
            })
          }
        }
      }
    }
  }

  return results
}

function euclideanDistance(p1: number[], p2: number[]): number {
  const dx = (p2[0] ?? 0) - (p1[0] ?? 0)
  const dy = (p2[1] ?? 0) - (p1[1] ?? 0)
  return Math.sqrt(dx * dx + dy * dy)
}

function interpolatePoint(p1: number[], p2: number[], fraction: number): number[] {
  const x1 = p1[0] ?? 0
  const y1 = p1[1] ?? 0
  const x2 = p2[0] ?? 0
  const y2 = p2[1] ?? 0
  return [x1 + (x2 - x1) * fraction, y1 + (y2 - y1) * fraction]
}

function getLineLength(coords: number[][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += euclideanDistance(coords[i - 1] as number[], coords[i] as number[])
  }
  return total
}

function getPointAtDistance(coords: number[][], targetDistance: number): number[] {
  let cumulativeLength = 0
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1] as number[]
    const curr = coords[i] as number[]
    const segmentLength = euclideanDistance(prev, curr)
    if (cumulativeLength + segmentLength >= targetDistance) {
      const remainingDistance = targetDistance - cumulativeLength
      const fraction = segmentLength > 0 ? remainingDistance / segmentLength : 0
      return interpolatePoint(prev, curr, fraction)
    }
    cumulativeLength += segmentLength
  }
  return coords[coords.length - 1] ?? [0, 0]
}

export function sliceLineStringByFraction(coords: number[][], startFraction: number, endFraction: number): number[][] {
  if (coords.length < 2) return coords
  if (startFraction <= 0 && endFraction >= 1) return coords

  const totalLength = getLineLength(coords)
  if (totalLength === 0) return coords

  const startDistance = startFraction * totalLength
  const endDistance = endFraction * totalLength

  const result: number[][] = []
  let cumulativeLength = 0
  let passedStart = false

  for (let i = 0; i < coords.length; i++) {
    const coord = coords[i] as number[]

    if (i === 0) {
      if (startFraction <= 0) {
        result.push(coord)
        passedStart = true
      }
      continue
    }

    const prevCoord = coords[i - 1] as number[]
    const segmentLength = euclideanDistance(prevCoord, coord)
    const prevCumulativeLength = cumulativeLength
    cumulativeLength += segmentLength

    if (!passedStart && cumulativeLength >= startDistance) {
      result.push(getPointAtDistance(coords, startDistance))
      passedStart = true
    }

    if (passedStart) {
      if (cumulativeLength < endDistance) {
        result.push(coord)
      } else {
        if (prevCumulativeLength < endDistance) {
          result.push(getPointAtDistance(coords, endDistance))
        }
        break
      }
    }
  }

  if (result.length < 2) {
    return [getPointAtDistance(coords, startDistance), getPointAtDistance(coords, endDistance)]
  }

  return result
}

export function getPointAtFraction(coords: number[][], fraction: number): number[] {
  if (coords.length < 2) return coords[0] ?? [0, 0]

  const totalLength = getLineLength(coords)
  if (totalLength === 0) return coords[0] ?? [0, 0]

  const targetDistance = fraction * totalLength
  return getPointAtDistance(coords, targetDistance)
}
