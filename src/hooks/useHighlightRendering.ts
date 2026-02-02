import Feature from 'ol/Feature'
import WKT from 'ol/format/WKT'
import { LineString, Point } from 'ol/geom'
import type VectorSource from 'ol/source/Vector'
import type { MutableRefObject } from 'react'
import { useEffect } from 'react'
import type { Stedfesting, VeglenkeMedPosisjon, VeglenkesekvensMedPosisjoner, Vegobjekt } from '../api/uberiketClient'
import { getGeometriEgenskaper } from '../api/uberiketClient'
import { getClippedGeometries, getPointAtFraction, sliceLineStringByFraction } from '../utils/geometryUtils'

export function useHighlightRendering({
  hoveredVegobjekt,
  veglenkesekvenser,
  highlightSource,
  egengeometriSource,
  veglenkeSource,
}: {
  hoveredVegobjekt: Vegobjekt | null
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  highlightSource: MutableRefObject<VectorSource>
  egengeometriSource: MutableRefObject<VectorSource>
  veglenkeSource: MutableRefObject<VectorSource>
}) {
  useEffect(() => {
    highlightSource.current.clear()
    egengeometriSource.current.clear()

    if (!hoveredVegobjekt || !veglenkesekvenser) return

    const stedfesting = hoveredVegobjekt.stedfesting as Stedfesting | undefined
    if (stedfesting) {
      const clippedGeometries = getClippedGeometries(stedfesting, veglenkesekvenser)

      for (const clipped of clippedGeometries) {
        const veglenkeFeature = veglenkeSource.current.getFeatures().find((f) => {
          const vsId = f.get('veglenkesekvensId')
          const vl = f.get('veglenke') as VeglenkeMedPosisjon | undefined
          return vsId === clipped.veglenkesekvensId && vl?.nummer === clipped.veglenkeNummer
        })

        if (!veglenkeFeature) continue

        const geom = veglenkeFeature.getGeometry() as LineString | undefined
        if (!geom) continue

        try {
          const coords = geom.getCoordinates()
          const isPoint = clipped.startFraction === clipped.endFraction

          if (isPoint) {
            const pointCoord = getPointAtFraction(coords, clipped.startFraction)
            const pointGeom = new Point(pointCoord)
            const highlightFeature = new Feature({ geometry: pointGeom })
            highlightSource.current.addFeature(highlightFeature)
          } else {
            const slicedCoords = sliceLineStringByFraction(coords, clipped.startFraction, clipped.endFraction)

            if (slicedCoords.length >= 2) {
              const slicedGeom = new LineString(slicedCoords)
              const highlightFeature = new Feature({ geometry: slicedGeom })
              highlightSource.current.addFeature(highlightFeature)
            }
          }
        } catch (e) {
          console.warn('Failed to create highlight geometry', e)
        }
      }
    }

    const geometriEgenskaper = getGeometriEgenskaper(hoveredVegobjekt)
    const wktFormat = new WKT()
    for (const geometri of geometriEgenskaper) {
      try {
        const geom = wktFormat.readGeometry(geometri.wkt, {
          dataProjection: `EPSG:${geometri.srid}`,
          featureProjection: 'EPSG:25833',
        })
        const feature = new Feature({ geometry: geom })
        egengeometriSource.current.addFeature(feature)
      } catch (e) {
        console.warn('Failed to parse geometri-egenskap', e)
      }
    }
  }, [hoveredVegobjekt, veglenkesekvenser, highlightSource, egengeometriSource, veglenkeSource])
}
