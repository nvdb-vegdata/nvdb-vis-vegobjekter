import { createEmpty, extend, isEmpty as isExtentEmpty } from 'ol/extent'
import WKT from 'ol/format/WKT'
import { LineString, Point } from 'ol/geom'
import type OLMap from 'ol/Map'
import type VectorSource from 'ol/source/Vector'
import type { MutableRefObject } from 'react'
import { useEffect } from 'react'
import type { Stedfesting, VeglenkeMedPosisjon, VeglenkesekvensMedPosisjoner, Vegobjekt } from '../api/uberiketClient'
import { getGeometriEgenskaper } from '../api/uberiketClient'
import { getClippedGeometries, getPointAtFraction, sliceLineStringByFraction } from '../utils/geometryUtils'

export function useLocateVegobjekt({
  locateVegobjekt,
  veglenkesekvenser,
  veglenkeSource,
  mapInstance,
}: {
  locateVegobjekt: { vegobjekt: Vegobjekt; token: number } | null
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  veglenkeSource: MutableRefObject<VectorSource>
  mapInstance: MutableRefObject<OLMap | null>
}) {
  useEffect(() => {
    if (!locateVegobjekt || !veglenkesekvenser || !mapInstance.current) return

    const extents = [] as number[][]
    const stedfesting = locateVegobjekt.vegobjekt.stedfesting as Stedfesting | undefined

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
            extents.push(pointGeom.getExtent())
          } else {
            const slicedCoords = sliceLineStringByFraction(coords, clipped.startFraction, clipped.endFraction)

            if (slicedCoords.length >= 2) {
              const slicedGeom = new LineString(slicedCoords)
              extents.push(slicedGeom.getExtent())
            }
          }
        } catch (e) {
          console.warn('Failed to create locate geometry', e)
        }
      }
    }

    const wktFormat = new WKT()
    const geometriEgenskaper = getGeometriEgenskaper(locateVegobjekt.vegobjekt)
    for (const geometri of geometriEgenskaper) {
      try {
        const geom = wktFormat.readGeometry(geometri.wkt, {
          dataProjection: `EPSG:${geometri.srid}`,
          featureProjection: 'EPSG:25833',
        })
        extents.push(geom.getExtent())
      } catch (e) {
        console.warn('Failed to parse locate geometri-egenskap', e)
      }
    }

    if (extents.length === 0) return

    const combinedExtent = createEmpty()
    for (const extent of extents) {
      extend(combinedExtent, extent)
    }

    if (!isExtentEmpty(combinedExtent)) {
      mapInstance.current.getView().fit(combinedExtent, {
        padding: [60, 60, 60, 60],
        duration: 250,
        maxZoom: 17,
      })
    }
  }, [locateVegobjekt, veglenkesekvenser, veglenkeSource, mapInstance])
}
