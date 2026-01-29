import { useAtom, useAtomValue } from 'jotai'
import { click } from 'ol/events/condition'
import Feature from 'ol/Feature'
import type { Polygon } from 'ol/geom'
import { Draw, Select } from 'ol/interaction'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OLMap from 'ol/Map'
import Overlay from 'ol/Overlay'
import View from 'ol/View'
import 'ol/ol.css'
import { fromLonLat, toLonLat } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import proj4 from 'proj4'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { VeglenkesekvensMedPosisjoner, Vegobjekt } from '../../api/uberiketClient'
import { useHighlightRendering } from '../../hooks/useHighlightRendering'
import { useLocateVegobjekt } from '../../hooks/useLocateVegobjekt'
import { useVeglenkeRendering } from '../../hooks/useVeglenkeRendering'
import { hoveredVegobjektAtom, locateVegobjektAtom, polygonAtom, searchModeAtom, stedfestingAtom } from '../../state/atoms'
import {
  EGENGEOMETRI_LINE_STYLE,
  EGENGEOMETRI_POINT_STYLE,
  EGENGEOMETRI_POLYGON_STYLE,
  HIGHLIGHT_POINT_STYLE,
  HIGHLIGHT_STYLE,
  STEDFESTING_POINT_STYLE,
  STEDFESTING_STYLE,
  VEGLENKE_FADED_STYLE,
  VEGLENKE_SELECTED_STYLE,
  VEGLENKE_STYLE,
} from './mapStyles'
import SearchControls from './SearchControls'
import VeglenkePopup from './VeglenkePopup'

proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
proj4.defs('EPSG:5973', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs')
register(proj4)

interface Props {
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  vegobjekterByType: Map<number, Vegobjekt[]>
  isLoadingVeglenker?: boolean
}

export default function MapView({ veglenkesekvenser, vegobjekterByType, isLoadingVeglenker }: Props) {
  const [polygon, setPolygon] = useAtom(polygonAtom)
  const [searchMode, setSearchMode] = useAtom(searchModeAtom)
  const stedfesting = useAtomValue(stedfestingAtom)
  const hoveredVegobjekt = useAtomValue(hoveredVegobjektAtom)
  const locateVegobjekt = useAtomValue(locateVegobjektAtom)

  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<OLMap | null>(null)
  const drawSource = useRef(new VectorSource())
  const veglenkeSource = useRef(new VectorSource())
  const stedfestingSource = useRef(new VectorSource())
  const highlightSource = useRef(new VectorSource())
  const egengeometriSource = useRef(new VectorSource())
  const overlayRef = useRef<Overlay | null>(null)
  const drawInteraction = useRef<Draw | null>(null)
  const selectInteraction = useRef<Select | null>(null)
  const veglenkeLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
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
    veglenkeLayerRef.current = veglenkeLayer

    const stedfestingLayer = new VectorLayer({
      source: stedfestingSource.current,
      style: (feature) => (feature.getGeometry()?.getType() === 'Point' ? STEDFESTING_POINT_STYLE : STEDFESTING_STYLE),
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
      element: popupRef.current ?? undefined,
      autoPan: { animation: { duration: 250 } },
    })
    overlayRef.current = overlay

    const map = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), drawLayer, veglenkeLayer, stedfestingLayer, highlightLayer, egengeometriLayer],
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
        const feature = e.selected[0]
        if (!feature) return
        setSelectedFeature(feature)
        const geom = feature.getGeometry()
        if (geom) {
          const extent = geom.getExtent()
          const [minX, minY, maxX, maxY] = extent
          if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) return
          const center = [(minX + maxX) / 2, (minY + maxY) / 2]
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
        const viewCenter = view.getCenter()
        if (!viewCenter) return
        const center = toLonLat(viewCenter)
        const z = view.getZoom()
        const [centerLon, centerLat] = center
        if (centerLon === undefined || centerLat === undefined || z === undefined) return
        const url = new URL(window.location.href)
        url.searchParams.set('lon', centerLon.toFixed(5))
        url.searchParams.set('lat', centerLat.toFixed(5))
        url.searchParams.set('z', z.toFixed(1))
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
    if (searchMode === 'polygon') return
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current)
      drawInteraction.current = null
    }
    setIsDrawing(false)
    drawSource.current.clear()
    veglenkeSource.current.clear()
    stedfestingSource.current.clear()
    highlightSource.current.clear()
    egengeometriSource.current.clear()
    setSelectedFeature(null)
    overlayRef.current?.setPosition(undefined)
  }, [searchMode])

  useEffect(() => {
    if (!veglenkeLayerRef.current) return
    veglenkeLayerRef.current.setStyle(searchMode === 'stedfesting' ? VEGLENKE_FADED_STYLE : VEGLENKE_STYLE)
  }, [searchMode])

  useEffect(() => {
    if (searchMode !== 'polygon') return
    if (!mapInstance.current || !polygon) return
    if (drawSource.current.getFeatures().length > 0) return
    const feature = new Feature({ geometry: polygon })
    drawSource.current.addFeature(feature)
  }, [polygon, searchMode])

  useVeglenkeRendering({
    veglenkesekvenser,
    searchMode,
    stedfesting,
    veglenkeSource,
    stedfestingSource,
    drawSource,
    mapInstance,
  })

  useHighlightRendering({
    hoveredVegobjekt,
    veglenkesekvenser,
    highlightSource,
    egengeometriSource,
    veglenkeSource,
  })

  useLocateVegobjekt({
    locateVegobjekt,
    veglenkesekvenser,
    veglenkeSource,
    mapInstance,
  })

  const clearAll = useCallback(() => {
    drawSource.current.clear()
    veglenkeSource.current.clear()
    stedfestingSource.current.clear()
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
      if (polygon) {
        return
      }
    }
    if (!isDrawing) {
      startDrawing()
    }
  }, [isDrawing, polygon, searchMode, setSearchMode, startDrawing])

  const handleStrekningMode = useCallback(() => {
    setSearchMode('strekning')
  }, [setSearchMode])

  const handleStedfestingMode = useCallback(() => {
    setSearchMode('stedfesting')
  }, [setSearchMode])

  const cancelDrawing = useCallback(() => {
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current)
      drawInteraction.current = null
    }
    setIsDrawing(false)
  }, [])

  return (
    <>
      <div className="draw-controls">
        <div className="draw-controls-row">
          <button
            type="button"
            className={`btn ${searchMode === 'polygon' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handlePolygonMode}
            disabled={isDrawing && searchMode === 'polygon'}
          >
            Tegn område
          </button>
          <button type="button" className={`btn ${searchMode === 'strekning' ? 'btn-primary' : 'btn-secondary'}`} onClick={handleStrekningMode}>
            Søk på strekning
          </button>
          <button type="button" className={`btn ${searchMode === 'stedfesting' ? 'btn-primary' : 'btn-secondary'}`} onClick={handleStedfestingMode}>
            Stedfesting
          </button>
          {searchMode === 'polygon' && !isDrawing && (polygon || veglenkesekvenser) && (
            <button type="button" className="btn btn-danger" onClick={clearAll}>
              Nullstill
            </button>
          )}
        </div>

        {searchMode === 'polygon' && isDrawing && (
          <button type="button" className="btn btn-secondary" onClick={cancelDrawing}>
            Avbryt tegning
          </button>
        )}

        <SearchControls searchMode={searchMode} />
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <div className="map-loading-overlay" style={{ display: isLoadingVeglenker ? undefined : 'none' }}>
        <div className="spinner spinner-large" />
        <div className="map-loading-text">Henter veglenker...</div>
      </div>

      <VeglenkePopup selectedFeature={selectedFeature} vegobjekterByType={vegobjekterByType} popupRef={popupRef} />
    </>
  )
}
