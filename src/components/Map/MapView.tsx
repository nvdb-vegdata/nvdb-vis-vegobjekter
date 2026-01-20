import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import Feature from 'ol/Feature'
import OLMap from 'ol/Map'
import Overlay from 'ol/Overlay'
import View from 'ol/View'
import { click } from 'ol/events/condition'
import WKT from 'ol/format/WKT'
import { LineString, Point, Polygon } from 'ol/geom'
import { createEmpty, extend, isEmpty as isExtentEmpty, type Extent } from 'ol/extent'
import { Draw, Select } from 'ol/interaction'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import 'ol/ol.css'
import { fromLonLat, toLonLat } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getGeometriEgenskaper,
  isOnVeglenke,
  type Stedfesting,
  type VeglenkeMedPosisjon,
  type VeglenkesekvensMedPosisjoner,
  type Vegobjekt,
} from '../../api/uberiketClient'
import {
  focusedVegobjektAtom,
  hoveredVegobjektAtom,
  locateVegobjektAtom,
  polygonAtom,
  searchModeAtom,
  selectedTypesAtom,
  strekningAtom,
  strekningInputAtom,
} from '../../state/atoms'
import {
  getClippedGeometries,
  getPointAtFraction,
  sliceLineStringByFraction,
} from '../../utils/geometryUtils'

proj4.defs(
  'EPSG:25833',
  '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
)
proj4.defs(
  'EPSG:5973',
  '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
)
register(proj4)

interface Props {
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  vegobjekterByType: Map<number, Vegobjekt[]>
  isLoadingVeglenker?: boolean
}

const VEGLENKE_STYLE = new Style({
  stroke: new Stroke({ color: '#3498db', width: 4 }),
})

const VEGLENKE_SELECTED_STYLE = new Style({
  stroke: new Stroke({ color: '#e74c3c', width: 6 }),
})

const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({ color: '#f39c12', width: 8 }),
})

const HIGHLIGHT_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: 'rgba(243, 156, 18, 0.8)' }),
    stroke: new Stroke({ color: '#e67e22', width: 3 }),
  }),
})

const EGENGEOMETRI_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: 'rgba(155, 89, 182, 0.8)' }),
    stroke: new Stroke({ color: '#8e44ad', width: 2 }),
  }),
})

const EGENGEOMETRI_LINE_STYLE = new Style({
  stroke: new Stroke({
    color: '#9b59b6',
    width: 4,
    lineDash: [8, 4],
  }),
})

const EGENGEOMETRI_POLYGON_STYLE = new Style({
  fill: new Fill({ color: 'rgba(155, 89, 182, 0.3)' }),
  stroke: new Stroke({ color: '#8e44ad', width: 2 }),
})

export default function MapView({
  veglenkesekvenser,
  vegobjekterByType,
  isLoadingVeglenker,
}: Props) {
  const selectedTypes = useAtomValue(selectedTypesAtom)
  const [polygon, setPolygon] = useAtom(polygonAtom)
  const [searchMode, setSearchMode] = useAtom(searchModeAtom)
  const [strekning, setStrekning] = useAtom(strekningAtom)
  const [strekningInput, setStrekningInput] = useAtom(strekningInputAtom)
  const setFocusedVegobjekt = useSetAtom(focusedVegobjektAtom)
  const hoveredVegobjekt = useAtomValue(hoveredVegobjektAtom)
  const locateVegobjekt = useAtomValue(locateVegobjektAtom)

  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<OLMap | null>(null)
  const drawSource = useRef(new VectorSource())
  const veglenkeSource = useRef(new VectorSource())
  const highlightSource = useRef(new VectorSource())
  const egengeometriSource = useRef(new VectorSource())
  const overlayRef = useRef<Overlay | null>(null)
  const drawInteraction = useRef<Draw | null>(null)
  const selectInteraction = useRef<Select | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const params = new URLSearchParams(window.location.search)
    const lon = parseFloat(params.get('lon') || '10.0')
    const lat = parseFloat(params.get('lat') || '64.0')
    const zoom = parseFloat(params.get('z') || '5')

    const drawLayer = new VectorLayer({
      source: drawSource.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(52, 152, 219, 0.2)' }),
        stroke: new Stroke({ color: '#3498db', width: 2 }),
      }),
    })

    const veglenkeLayer = new VectorLayer({
      source: veglenkeSource.current,
      style: VEGLENKE_STYLE,
    })

    const highlightLayer = new VectorLayer({
      source: highlightSource.current,
      style: (feature) => {
        const geomType = feature.getGeometry()?.getType()
        if (geomType === 'Point') {
          return HIGHLIGHT_POINT_STYLE
        }
        return HIGHLIGHT_STYLE
      },
    })

    const egengeometriLayer = new VectorLayer({
      source: egengeometriSource.current,
      style: (feature) => {
        const geomType = feature.getGeometry()?.getType()
        if (geomType === 'Point' || geomType === 'MultiPoint') {
          return EGENGEOMETRI_POINT_STYLE
        } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
          return EGENGEOMETRI_POLYGON_STYLE
        }
        return EGENGEOMETRI_LINE_STYLE
      },
    })

    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } },
    })
    overlayRef.current = overlay

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        drawLayer,
        veglenkeLayer,
        highlightLayer,
        egengeometriLayer,
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([lon, lat]),
        zoom: zoom,
      }),
    })

    const select = new Select({
      condition: click,
      layers: [veglenkeLayer],
      style: VEGLENKE_SELECTED_STYLE,
    })

    select.on('select', (e) => {
      if (e.selected.length > 0) {
        const feature = e.selected[0]!
        setSelectedFeature(feature)
        const geom = feature.getGeometry()
        if (geom) {
          const extent = geom.getExtent()
          const center = [
            (extent[0]! + extent[2]!) / 2,
            (extent[1]! + extent[3]!) / 2,
          ]
          overlay.setPosition(center)
        }
      } else {
        setSelectedFeature(null)
        overlay.setPosition(undefined)
      }
    })

    map.addInteraction(select)
    selectInteraction.current = select
    mapInstance.current = map

    map.on('pointermove', (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel, {
        layerFilter: (layer) => layer === veglenkeLayer,
      })
      map.getTargetElement().style.cursor = hit ? 'pointer' : ''
    })

    let updateUrlTimeout: ReturnType<typeof setTimeout> | null = null
    map.on('moveend', () => {
      if (updateUrlTimeout) clearTimeout(updateUrlTimeout)
      updateUrlTimeout = setTimeout(() => {
        const view = map.getView()
        const center = toLonLat(view.getCenter()!)
        const z = view.getZoom()
        const url = new URL(window.location.href)
        url.searchParams.set('lon', center[0]!.toFixed(5))
        url.searchParams.set('lat', center[1]!.toFixed(5))
        url.searchParams.set('z', z!.toFixed(1))
        window.history.replaceState({}, '', url)
      }, 200)
    })

    return () => {
      if (updateUrlTimeout) clearTimeout(updateUrlTimeout)
      map.setTarget(undefined)
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (searchMode !== 'strekning') return
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current)
      drawInteraction.current = null
    }
    setIsDrawing(false)
    drawSource.current.clear()
    veglenkeSource.current.clear()
    highlightSource.current.clear()
    egengeometriSource.current.clear()
    setSelectedFeature(null)
    overlayRef.current?.setPosition(undefined)
  }, [searchMode])

  useEffect(() => {
    if (searchMode !== 'polygon') return
    if (!mapInstance.current || !polygon) return
    if (drawSource.current.getFeatures().length > 0) return
    const feature = new Feature({ geometry: polygon })
    drawSource.current.addFeature(feature)
  }, [polygon, searchMode])

  useEffect(() => {
    if (!veglenkesekvenser) {
      veglenkeSource.current.clear()
      return
    }

    veglenkeSource.current.clear()
    const wktFormat = new WKT()
    const today = new Date().toISOString().split('T')[0]!

    const drawnFeatures = drawSource.current.getFeatures()
    const drawnPolygon =
      drawnFeatures.length > 0 ? drawnFeatures[0]?.getGeometry() : null

    for (const vs of veglenkesekvenser) {
      for (const vl of vs.veglenker ?? []) {
        const sluttdato = (vl as { gyldighetsperiode?: { sluttdato?: string } })
          .gyldighetsperiode?.sluttdato
        if (sluttdato && sluttdato < today) {
          continue
        }

        if (vl.geometri?.wkt) {
          try {
            const geom = wktFormat.readGeometry(vl.geometri.wkt, {
              dataProjection: `EPSG:${vl.geometri.srid}`,
              featureProjection: 'EPSG:3857',
            })

            if (
              drawnPolygon &&
              !geom.intersectsExtent(drawnPolygon.getExtent())
            ) {
              continue
            }

            const feature = new Feature({
              geometry: geom,
              veglenkesekvensId: vs.id,
              veglenke: vl,
            })
            veglenkeSource.current.addFeature(feature)
          } catch (e) {
            console.warn('Failed to parse geometry', e)
          }
        }
      }
    }

    const extent = veglenkeSource.current.getExtent()
    if (mapInstance.current && !isExtentEmpty(extent)) {
      mapInstance.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: 250,
        maxZoom: 16,
      })
    }
  }, [veglenkesekvenser])

  useEffect(() => {
    highlightSource.current.clear()
    egengeometriSource.current.clear()

    if (!hoveredVegobjekt || !veglenkesekvenser) return

    const stedfesting = hoveredVegobjekt.stedfesting as Stedfesting | undefined
    if (stedfesting) {
      const clippedGeometries = getClippedGeometries(
        stedfesting,
        veglenkesekvenser,
      )

      for (const clipped of clippedGeometries) {
        const veglenkeFeature = veglenkeSource.current
          .getFeatures()
          .find((f) => {
            const vsId = f.get('veglenkesekvensId')
            const vl = f.get('veglenke') as VeglenkeMedPosisjon | undefined
            return (
              vsId === clipped.veglenkesekvensId &&
              vl?.nummer === clipped.veglenkeNummer
            )
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
            const slicedCoords = sliceLineStringByFraction(
              coords,
              clipped.startFraction,
              clipped.endFraction,
            )

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
          featureProjection: 'EPSG:3857',
        })
        const feature = new Feature({ geometry: geom })
        egengeometriSource.current.addFeature(feature)
      } catch (e) {
        console.warn('Failed to parse geometri-egenskap', e)
      }
    }
  }, [hoveredVegobjekt, veglenkesekvenser])

  useEffect(() => {
    if (!locateVegobjekt || !veglenkesekvenser || !mapInstance.current) return

    const extents = [] as number[][]
    const stedfesting = locateVegobjekt.vegobjekt.stedfesting as
      | Stedfesting
      | undefined

    if (stedfesting) {
      const clippedGeometries = getClippedGeometries(
        stedfesting,
        veglenkesekvenser,
      )

      for (const clipped of clippedGeometries) {
        const veglenkeFeature = veglenkeSource.current
          .getFeatures()
          .find((f) => {
            const vsId = f.get('veglenkesekvensId')
            const vl = f.get('veglenke') as VeglenkeMedPosisjon | undefined
            return (
              vsId === clipped.veglenkesekvensId &&
              vl?.nummer === clipped.veglenkeNummer
            )
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
            const slicedCoords = sliceLineStringByFraction(
              coords,
              clipped.startFraction,
              clipped.endFraction,
            )

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
          featureProjection: 'EPSG:3857',
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
  }, [locateVegobjekt, veglenkesekvenser])

  const clearAll = useCallback(() => {
    drawSource.current.clear()
    veglenkeSource.current.clear()
    highlightSource.current.clear()
    egengeometriSource.current.clear()
    setSelectedFeature(null)
    overlayRef.current?.setPosition(undefined)
    setPolygon(null)
  }, [setPolygon])

  const startDrawing = useCallback(() => {
    if (!mapInstance.current) return

    drawSource.current.clear()
    veglenkeSource.current.clear()
    setSelectedFeature(null)
    overlayRef.current?.setPosition(undefined)
    setPolygon(null)

    const draw = new Draw({
      source: drawSource.current,
      type: 'Polygon',
    })

    draw.on('drawend', (event) => {
      const feature = event.feature
      const geom = feature.getGeometry() as Polygon
      setPolygon(geom)
      mapInstance.current?.removeInteraction(draw)
      setIsDrawing(false)
    })

    mapInstance.current.addInteraction(draw)
    drawInteraction.current = draw
    setIsDrawing(true)
  }, [setPolygon])

  const handlePolygonMode = useCallback(() => {
    if (searchMode !== 'polygon') {
      setSearchMode('polygon')
    }
    if (!isDrawing) {
      startDrawing()
    }
  }, [isDrawing, searchMode, setSearchMode, startDrawing])

  const handleStrekningMode = useCallback(() => {
    setSearchMode('strekning')
  }, [setSearchMode])

  const cancelDrawing = useCallback(() => {
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current)
      drawInteraction.current = null
    }
    setIsDrawing(false)
  }, [])

  const handleVegobjektClick = useCallback(
    (typeId: number, vegobjektId: number) => {
      setFocusedVegobjekt({ typeId, id: vegobjektId })
    },
    [setFocusedVegobjekt],
  )

  const handleStrekningChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setStrekningInput(event.target.value)
    },
    [setStrekningInput],
  )

  const handleStrekningSearch = useCallback(() => {
    setStrekning(strekningInput.trim())
  }, [setStrekning, strekningInput])

  const handleStrekningKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (strekningInput.trim().length > 0) {
          handleStrekningSearch()
        }
      }
    },
    [handleStrekningSearch, strekningInput],
  )

  const clearStrekning = useCallback(() => {
    setStrekningInput('')
    setStrekning('')
  }, [setStrekningInput, setStrekning])

  const getVegobjekterOnVeglenke = useCallback(
    (veglenkesekvensId: number, veglenke?: VeglenkeMedPosisjon) => {
      const result: {
        type: { id: number; navn?: string }
        objects: Vegobjekt[]
      }[] = []
      const startposisjon = veglenke?.startposisjon ?? 0
      const sluttposisjon = veglenke?.sluttposisjon ?? 1

      for (const type of selectedTypes) {
        const objects = vegobjekterByType.get(type.id) ?? []
        const matching = objects.filter((obj) =>
          isOnVeglenke(
            obj.stedfesting as Stedfesting | undefined,
            veglenkesekvensId,
            startposisjon,
            sluttposisjon,
          ),
        )
        if (matching.length > 0) {
          result.push({ type, objects: matching })
        }
      }

      return result
    },
    [vegobjekterByType, selectedTypes],
  )

  const selectedVeglenkesekvensId = selectedFeature?.get(
    'veglenkesekvensId',
  ) as number | undefined
  const selectedVeglenke = selectedFeature?.get('veglenke') as
    | VeglenkeMedPosisjon
    | undefined
  const vegobjekterOnSelected = selectedVeglenkesekvensId
    ? getVegobjekterOnVeglenke(selectedVeglenkesekvensId, selectedVeglenke)
    : []

  return (
    <>
      <div className="draw-controls">
        <div className="draw-controls-row">
          <button
            className={`btn ${searchMode === 'polygon' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handlePolygonMode}
            disabled={isDrawing && searchMode === 'polygon'}
          >
            Tegn område
          </button>
          <button
            className={`btn ${searchMode === 'strekning' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleStrekningMode}
          >
            Søk på strekning
          </button>
          {searchMode === 'polygon' &&
            !isDrawing &&
            (polygon || veglenkesekvenser) && (
              <button className="btn btn-danger" onClick={clearAll}>
                Nullstill
              </button>
            )}
        </div>

        {searchMode === 'polygon' && isDrawing && (
          <button className="btn btn-secondary" onClick={cancelDrawing}>
            Avbryt tegning
          </button>
        )}

        {searchMode === 'strekning' && (
          <div className="strekning-controls">
            <label className="search-label" htmlFor="strekning-input">
              Søk på strekning
            </label>
            <div className="strekning-input-row">
              <div className="search-input-wrapper">
                <input
                  id="strekning-input"
                  className="search-input"
                  placeholder="Eks.: FV6666 S1"
                  value={strekningInput}
                  onChange={handleStrekningChange}
                  onKeyDown={handleStrekningKeyDown}
                />
                {strekningInput && (
                  <button
                    className="search-clear-btn"
                    type="button"
                    onClick={clearStrekning}
                    aria-label="Tøm strekning"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleStrekningSearch}
                disabled={strekningInput.trim().length === 0}
              >
                Søk
              </button>
            </div>
            {strekning && strekning.trim() !== strekningInput.trim() && (
              <div className="strekning-hint">Søket bruker: {strekning}</div>
            )}
          </div>
        )}
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <div
        className="map-loading-overlay"
        style={{ display: isLoadingVeglenker ? undefined : 'none' }}
      >
        <div className="spinner spinner-large" />
        <div className="map-loading-text">Henter veglenker...</div>
      </div>

      <div ref={popupRef} className="ol-popup">
        {selectedFeature && (
          <div className="popup-content">
            <div className="popup-title">
              Veglenke {selectedVeglenkesekvensId}:{selectedVeglenke?.nummer}
            </div>
            {vegobjekterOnSelected.length === 0 ? (
              <p style={{ fontSize: 12, color: '#666' }}>
                Ingen vegobjekter funnet på denne veglenken
              </p>
            ) : (
              vegobjekterOnSelected.map(({ type, objects }) => (
                <div key={type.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>
                    {type.navn} ({objects.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                    {objects.slice(0, 5).map((obj) => (
                      <li key={obj.id}>
                        <button
                          className="popup-vegobjekt-link"
                          onClick={() => handleVegobjektClick(type.id, obj.id)}
                        >
                          ID: {obj.id}
                        </button>
                      </li>
                    ))}
                    {objects.length > 5 && (
                      <li>...og {objects.length - 5} til</li>
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}
