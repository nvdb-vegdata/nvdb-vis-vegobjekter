import type { Veglenke, Veglenkesekvens, Stedfesting } from "../api/uberiketClient";
import { getVegobjektPositions } from "../api/uberiketClient";

export interface ClippedGeometry {
  veglenkesekvensId: number;
  veglenkeNummer: number;
  startFraction: number;
  endFraction: number;
}

function getVeglenkeRange(veglenke: Veglenke): { start: number; end: number } {
  if (veglenke.superstedfesting) {
    return {
      start: veglenke.superstedfesting.startposisjon,
      end: veglenke.superstedfesting.sluttposisjon,
    };
  }
  return { start: 0, end: 1 };
}

function rangesOverlap(
  range1Start: number,
  range1End: number,
  range2Start: number,
  range2End: number
): { overlapStart: number; overlapEnd: number } | null {
  const overlapStart = Math.max(range1Start, range2Start);
  const overlapEnd = Math.min(range1End, range2End);
  
  if (overlapStart >= overlapEnd) {
    return null;
  }
  
  return { overlapStart, overlapEnd };
}

export function getClippedGeometries(
  stedfesting: Stedfesting | undefined,
  veglenkesekvenser: Veglenkesekvens[]
): ClippedGeometry[] {
  if (!stedfesting) return [];
  
  const results: ClippedGeometry[] = [];
  
  for (const vs of veglenkesekvenser) {
    const positions = getVegobjektPositions(stedfesting, vs.id);
    if (positions.length === 0) continue;
    
    for (const pos of positions) {
      for (const vl of vs.veglenker ?? []) {
        const vlRange = getVeglenkeRange(vl);
        const overlap = rangesOverlap(vlRange.start, vlRange.end, pos.start, pos.slutt);
        
        if (overlap) {
          const vlLength = vlRange.end - vlRange.start;
          const startFraction = (overlap.overlapStart - vlRange.start) / vlLength;
          const endFraction = (overlap.overlapEnd - vlRange.start) / vlLength;
          
          results.push({
            veglenkesekvensId: vs.id,
            veglenkeNummer: vl.nummer,
            startFraction,
            endFraction,
          });
        }
      }
    }
  }
  
  return results;
}

function euclideanDistance(p1: number[], p2: number[]): number {
  const dx = p2[0]! - p1[0]!;
  const dy = p2[1]! - p1[1]!;
  return Math.sqrt(dx * dx + dy * dy);
}

function interpolatePoint(p1: number[], p2: number[], fraction: number): number[] {
  return [
    p1[0]! + (p2[0]! - p1[0]!) * fraction,
    p1[1]! + (p2[1]! - p1[1]!) * fraction,
  ];
}

function getLineLength(coords: number[][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += euclideanDistance(coords[i - 1]!, coords[i]!);
  }
  return total;
}

function getPointAtDistance(coords: number[][], targetDistance: number): number[] {
  let cumulativeLength = 0;
  for (let i = 1; i < coords.length; i++) {
    const segmentLength = euclideanDistance(coords[i - 1]!, coords[i]!);
    if (cumulativeLength + segmentLength >= targetDistance) {
      const remainingDistance = targetDistance - cumulativeLength;
      const fraction = segmentLength > 0 ? remainingDistance / segmentLength : 0;
      return interpolatePoint(coords[i - 1]!, coords[i]!, fraction);
    }
    cumulativeLength += segmentLength;
  }
  return coords[coords.length - 1]!;
}

export function sliceLineStringByFraction(
  coords: number[][],
  startFraction: number,
  endFraction: number
): number[][] {
  if (coords.length < 2) return coords;
  if (startFraction <= 0 && endFraction >= 1) return coords;

  const totalLength = getLineLength(coords);
  if (totalLength === 0) return coords;

  const startDistance = startFraction * totalLength;
  const endDistance = endFraction * totalLength;

  const result: number[][] = [];
  let cumulativeLength = 0;
  let passedStart = false;

  for (let i = 0; i < coords.length; i++) {
    const coord = coords[i]!;

    if (i === 0) {
      if (startFraction <= 0) {
        result.push(coord);
        passedStart = true;
      }
      continue;
    }

    const prevCoord = coords[i - 1]!;
    const segmentLength = euclideanDistance(prevCoord, coord);
    const prevCumulativeLength = cumulativeLength;
    cumulativeLength += segmentLength;

    if (!passedStart && cumulativeLength >= startDistance) {
      result.push(getPointAtDistance(coords, startDistance));
      passedStart = true;
    }

    if (passedStart) {
      if (cumulativeLength < endDistance) {
        result.push(coord);
      } else {
        if (prevCumulativeLength < endDistance) {
          result.push(getPointAtDistance(coords, endDistance));
        }
        break;
      }
    }
  }

  if (result.length < 2) {
    return [
      getPointAtDistance(coords, startDistance),
      getPointAtDistance(coords, endDistance),
    ];
  }

  return result;
}
