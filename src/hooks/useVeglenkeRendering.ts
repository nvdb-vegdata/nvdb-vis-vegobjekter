import { isEmpty as isExtentEmpty } from 'ol/extent'
import Feature from 'ol/Feature'
import WKT from 'ol/format/WKT'
import { LineString, Point } from 'ol/geom'
import type OLMap from 'ol/Map'
import type VectorSource from 'ol/source/Vector'
import type { MutableRefObject } from 'react'
import { useEffect } from 'react'
import type { VeglenkesekvensMedPosisjoner } from '../api/uberiketClient'
import type { SearchMode } from '../state/atoms'
import { getTodayDate } from '../utils/dateUtils'
import { getPointAtFraction, sliceLineStringByFraction } from '../utils/geometryUtils'
import { parseStedfestingRanges } from '../utils/stedfestingParser'

export function useVeglenkeRendering({
  veglenkesekvenser,
  searchMode,
  stedfesting,
  veglenkeSource,
  stedfestingSource,
  drawSource,
  mapInstance,
}: {
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  searchMode: SearchMode
  stedfesting: string
  veglenkeSource: MutableRefObject<VectorSource>
  stedfestingSource: MutableRefObject<VectorSource>
  drawSource: MutableRefObject<VectorSource>
  mapInstance: MutableRefObject<OLMap | null>
}) {
  useEffect(() => {
    if (!veglenkesekvenser) {
      veglenkeSource.current.clear()
      stedfestingSource.current.clear()
      return
    }

    veglenkeSource.current.clear()
    stedfestingSource.current.clear()
    const wktFormat = new WKT()
    const today = getTodayDate()

    const drawnFeatures = drawSource.current.getFeatures()
    const drawnPolygon = drawnFeatures.length > 0 ? drawnFeatures[0]?.getGeometry() : null

    const stedfestingRangesById =
      searchMode === 'stedfesting' && stedfesting.trim().length > 0
        ? parseStedfestingRanges(stedfesting).reduce((map, range) => {
            const existing = map.get(range.id)
            if (existing) {
              existing.push(range)
            } else {
              map.set(range.id, [range])
            }
            return map
          }, new Map<number, { start: number; end: number }[]>())
        : null

    for (const vs of veglenkesekvenser) {
      for (const vl of vs.veglenker ?? []) {
        const sluttdato = (vl as { gyldighetsperiode?: { sluttdato?: string } }).gyldighetsperiode?.sluttdato
        if (sluttdato && sluttdato < today) {
          continue
        }

        if (vl.geometri?.wkt) {
          try {
            const geom = wktFormat.readGeometry(vl.geometri.wkt, {
              dataProjection: `EPSG:${vl.geometri.srid}`,
              featureProjection: 'EPSG:3857',
            })

            if (drawnPolygon && !geom.intersectsExtent(drawnPolygon.getExtent())) {
              continue
            }

            if (stedfestingRangesById) {
              const ranges = stedfestingRangesById.get(vs.id)
              if (!ranges) continue
              const overlaps = ranges.some((range) => range.end >= vl.startposisjon && range.start <= vl.sluttposisjon)
              if (!overlaps) continue
            }

            const feature = new Feature({
              geometry: geom,
              veglenkesekvensId: vs.id,
              veglenke: vl,
            })
            veglenkeSource.current.addFeature(feature)

            if (stedfestingRangesById && geom.getType() === 'LineString') {
              const ranges = stedfestingRangesById.get(vs.id) ?? []
              const span = vl.sluttposisjon - vl.startposisjon
              if (span <= 0) continue
              const coords = (geom as LineString).getCoordinates()

              for (const range of ranges) {
                const clippedStart = Math.max(range.start, vl.startposisjon)
                const clippedEnd = Math.min(range.end, vl.sluttposisjon)
                if (clippedEnd < clippedStart) continue

                const startFraction = (clippedStart - vl.startposisjon) / span
                const endFraction = (clippedEnd - vl.startposisjon) / span

                if (startFraction === endFraction) {
                  const pointCoord = getPointAtFraction(coords, startFraction)
                  const pointGeom = new Point(pointCoord)
                  stedfestingSource.current.addFeature(new Feature({ geometry: pointGeom }))
                  continue
                }

                const slicedCoords = sliceLineStringByFraction(coords, startFraction, endFraction)

                if (slicedCoords.length >= 2) {
                  const slicedGeom = new LineString(slicedCoords)
                  stedfestingSource.current.addFeature(new Feature({ geometry: slicedGeom }))
                }
              }
            }
          } catch (e) {
            console.warn('Failed to parse geometry', e)
          }
        }
      }
    }

    const clippedExtent = stedfestingSource.current.getExtent()
    const baseExtent = veglenkeSource.current.getExtent()
    const extent = !isExtentEmpty(clippedExtent) ? clippedExtent : baseExtent
    if (mapInstance.current && !isExtentEmpty(extent)) {
      mapInstance.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 250,
        maxZoom: 16,
      })
    }
  }, [veglenkesekvenser, searchMode, stedfesting, veglenkeSource, stedfestingSource, drawSource, mapInstance])
}
