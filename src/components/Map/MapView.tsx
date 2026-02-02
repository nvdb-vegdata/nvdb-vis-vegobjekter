import { useAtom, useAtomValue } from 'jotai'
import { click } from 'ol/events/condition'
import Feature from 'ol/Feature'
import type { Polygon } from 'ol/geom'
import type ImageTile from 'ol/ImageTile'
import { Draw, Select } from 'ol/interaction'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OLMap from 'ol/Map'
import Overlay from 'ol/Overlay'
import View from 'ol/View'
import 'ol/ol.css'
import { transform } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import WMTS from 'ol/source/WMTS'
import XYZ from 'ol/source/XYZ'
import { Fill, Stroke, Style } from 'ol/style'
import TileGrid from 'ol/tilegrid/TileGrid'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VeglenkesekvensMedPosisjoner, Vegobjekt } from '../../api/uberiketClient'
import { getBaatToken, useBaatToken } from '../../hooks/useBaatToken'
import { useHighlightRendering } from '../../hooks/useHighlightRendering'
import { useLocateVegobjekt } from '../../hooks/useLocateVegobjekt'
import { useVeglenkeRendering } from '../../hooks/useVeglenkeRendering'
import {
  DEFAULT_VEGLENKE_COLOR,
  hoveredVegobjektAtom,
  locateVegobjektAtom,
  polygonAtom,
  polygonClipAtom,
  searchModeAtom,
  stedfestingAtom,
  veglenkeColorAtom,
} from '../../state/atoms'
import { safeReplaceState } from '../../utils/historyUtils'
import {
  DEFAULT_VIEW_CENTER_LON_LAT,
  DEFAULT_VIEW_ZOOM,
  GEODATA_XYZ_RESOLUTIONS,
  GEODATA_XYZ_URL,
  KARTVERKET_LAYER,
  KARTVERKET_MATRIX_SET,
  KARTVERKET_WMTS_MATRIX_IDS,
  KARTVERKET_WMTS_RESOLUTIONS,
  KARTVERKET_WMTS_URL,
  MAP_EXTENT,
  MAP_PROJECTION,
  TILE_ORIGIN,
} from '../../utils/mapConfig'
import { roundPolygonToTwoDecimals } from '../../utils/polygonRounding'
import { ensureProjections } from '../../utils/projections'
import {
  createStedfestingStyle,
  createVeglenkeFadedStyle,
  createVeglenkeStyle,
  EGENGEOMETRI_LINE_STYLE,
  EGENGEOMETRI_POINT_STYLE,
  EGENGEOMETRI_POLYGON_STYLE,
  HIGHLIGHT_POINT_STYLE,
  HIGHLIGHT_STYLE,
  STEDFESTING_POINT_STYLE,
} from './mapStyles'
import SearchControls from './SearchControls'
import VeglenkePopup from './VeglenkePopup'

ensureProjections()

interface Props {
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  vegobjekterByType: Map<number, Vegobjekt[]>
  isLoadingVeglenker?: boolean
}

export default function MapView({ veglenkesekvenser, vegobjekterByType, isLoadingVeglenker }: Props) {
  const [polygon, setPolygon] = useAtom(polygonAtom)
  const [polygonClip, _setPolygonClip] = useAtom(polygonClipAtom)
  const [searchMode, setSearchMode] = useAtom(searchModeAtom)
  const stedfesting = useAtomValue(stedfestingAtom)
  const hoveredVegobjekt = useAtomValue(hoveredVegobjektAtom)
  const locateVegobjekt = useAtomValue(locateVegobjektAtom)
  const [veglenkeColor, setVeglenkeColor] = useAtom(veglenkeColorAtom)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const veglenkeStyle = useMemo(() => createVeglenkeStyle(veglenkeColor), [veglenkeColor])
  const veglenkeFadedStyle = useMemo(() => createVeglenkeFadedStyle(veglenkeColor), [veglenkeColor])
  const stedfestingLineStyle = useMemo(() => createStedfestingStyle(veglenkeColor), [veglenkeColor])

  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<OLMap | null>(null)
  const drawSource = useRef(new VectorSource())
  const veglenkeSource = useRef(new VectorSource())
  const stedfestingSource = useRef(new VectorSource())
  const highlightSource = useRef(new VectorSource())
  const egengeometriSource = useRef(new VectorSource())
  const selectedSource = useRef(new VectorSource())
  const overlayRef = useRef<Overlay | null>(null)
  const drawInteraction = useRef<Draw | null>(null)
  const selectInteraction = useRef<Select | null>(null)
  const veglenkeLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const stedfestingLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const selectedLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const clipOnlySelectionRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useBaatToken()

  useEffect(() => {
    ;(window as unknown as { nvdbMap?: unknown }).nvdbMap = {
      setVeglenkeColor: (color: string) => setVeglenkeColor(color),
      getVeglenkeColor: () => veglenkeColor,
    }
  }, [setVeglenkeColor, veglenkeColor])

  useEffect(() => {
    if (!settingsOpen) return

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (settingsRef.current?.contains(target)) return
      setSettingsOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const params = new URLSearchParams(window.location.search)
    const lon = parseFloat(params.get('lon') || DEFAULT_VIEW_CENTER_LON_LAT[0].toString())
    const lat = parseFloat(params.get('lat') || DEFAULT_VIEW_CENTER_LON_LAT[1].toString())
    const zoom = parseFloat(params.get('z') || DEFAULT_VIEW_ZOOM.toString())

    const drawLayer = new VectorLayer({
      source: drawSource.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(52, 152, 219, 0.2)' }),
        stroke: new Stroke({ color: '#3498db', width: 2 }),
      }),
    })

    const initialVeglenkeStyle = createVeglenkeStyle('#3498db')
    const initialStedfestingLineStyle = createStedfestingStyle('#3498db')
    const initialSelectedStyle = new Style({ stroke: new Stroke({ color: '#e74c3c', width: 6 }) })

    const veglenkeLayer = new VectorLayer({
      source: veglenkeSource.current,
      style: initialVeglenkeStyle,
    })
    veglenkeLayerRef.current = veglenkeLayer

    const stedfestingLayer = new VectorLayer({
      source: stedfestingSource.current,
      style: (feature) => (feature.getGeometry()?.getType() === 'Point' ? STEDFESTING_POINT_STYLE : initialStedfestingLineStyle),
    })
    stedfestingLayerRef.current = stedfestingLayer

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

    const selectedLayer = new VectorLayer({
      source: selectedSource.current,
      style: initialSelectedStyle,
      zIndex: 100,
    })
    selectedLayerRef.current = selectedLayer

    const overlay = new Overlay({
      element: popupRef.current ?? undefined,
      autoPan: { animation: { duration: 250 } },
    })
    overlayRef.current = overlay

    const geodataTileGrid = new TileGrid({
      extent: [...MAP_EXTENT],
      origin: [...TILE_ORIGIN],
      resolutions: GEODATA_XYZ_RESOLUTIONS,
      tileSize: 256,
    })

    const kartverketTileGrid = new WMTSTileGrid({
      origin: [...TILE_ORIGIN],
      resolutions: KARTVERKET_WMTS_RESOLUTIONS,
      matrixIds: KARTVERKET_WMTS_MATRIX_IDS,
    })

    const detailResolution = KARTVERKET_WMTS_RESOLUTIONS[15] ?? KARTVERKET_WMTS_RESOLUTIONS[KARTVERKET_WMTS_RESOLUTIONS.length - 1]

    const geodataLayer = new TileLayer({
      className: 'basemap-geodata',
      source: new XYZ({
        url: GEODATA_XYZ_URL,
        projection: MAP_PROJECTION,
        tileGrid: geodataTileGrid,
      }),
      minResolution: detailResolution,
    })

    const kartverketLayer = new TileLayer({
      className: 'basemap-kartverket',
      source: new WMTS({
        url: KARTVERKET_WMTS_URL,
        layer: KARTVERKET_LAYER,
        matrixSet: KARTVERKET_MATRIX_SET,
        format: 'image/png',
        projection: MAP_PROJECTION,
        tileGrid: kartverketTileGrid,
        style: 'default',
        requestEncoding: 'KVP',
        tileLoadFunction: (tile, src) => {
          const token = getBaatToken()
          const nextSrc = token && !src.includes('gkt=') ? `${src}&gkt=${token}` : src
          const image = (tile as ImageTile).getImage() as HTMLImageElement
          image.src = nextSrc
        },
      }),
      maxResolution: detailResolution,
    })

    const map = new OLMap({
      target: mapRef.current,
      layers: [geodataLayer, kartverketLayer, drawLayer, veglenkeLayer, stedfestingLayer, highlightLayer, egengeometriLayer, selectedLayer],
      overlays: [overlay],
      view: new View({
        projection: MAP_PROJECTION,
        resolutions: KARTVERKET_WMTS_RESOLUTIONS,
        center: transform([lon, lat], 'EPSG:4326', MAP_PROJECTION),
        zoom: zoom,
      }),
    })

    const select = new Select({
      condition: click,
      layers: (layer) => {
        return clipOnlySelectionRef.current ? layer === stedfestingLayer : layer === veglenkeLayer || layer === stedfestingLayer
      },
      style: null,
      hitTolerance: 10,
    })

    select.on('select', (e) => {
      selectedSource.current.clear()
      if (e.selected.length > 0) {
        const feature = e.selected[0]
        if (!feature) return
        const geom = feature.getGeometry()?.clone()
        if (geom) {
          const selection = new Feature({
            geometry: geom,
            veglenkesekvensId: feature.get('veglenkesekvensId'),
            veglenke: feature.get('veglenke'),
          })

          selectedSource.current.addFeature(selection)
          setSelectedFeature(selection)
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
        layerFilter: (layer) => {
          return clipOnlySelectionRef.current ? layer === stedfestingLayer : layer === veglenkeLayer || layer === stedfestingLayer
        },
        hitTolerance: 10,
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
        const center = transform(viewCenter, MAP_PROJECTION, 'EPSG:4326')
        const z = view.getZoom()
        const [centerLon, centerLat] = center
        if (centerLon === undefined || centerLat === undefined || z === undefined) return
        const url = new URL(window.location.href)
        url.searchParams.set('lon', centerLon.toFixed(5))
        url.searchParams.set('lat', centerLat.toFixed(5))
        url.searchParams.set('z', z.toFixed(1))
        const nextUrl = `${url.pathname}${url.search}${url.hash}`
        safeReplaceState(nextUrl, 'map-view')
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
    selectedSource.current.clear()
    setSelectedFeature(null)
    overlayRef.current?.setPosition(undefined)
  }, [searchMode])

  useEffect(() => {
    const shouldFade = searchMode === 'stedfesting' || (searchMode === 'polygon' && polygonClip)
    clipOnlySelectionRef.current = searchMode === 'polygon' && polygonClip
    if (veglenkeLayerRef.current) {
      veglenkeLayerRef.current.setStyle(shouldFade ? veglenkeFadedStyle : veglenkeStyle)
    }
    if (stedfestingLayerRef.current) {
      const lineStyle = stedfestingLineStyle
      stedfestingLayerRef.current.setStyle((feature) => (feature.getGeometry()?.getType() === 'Point' ? STEDFESTING_POINT_STYLE : lineStyle))
    }
  }, [polygonClip, searchMode, stedfestingLineStyle, veglenkeFadedStyle, veglenkeStyle])

  useEffect(() => {
    if (searchMode !== 'polygon') return
    if (!mapInstance.current) return
    drawSource.current.clear()
    if (!polygon) return
    const feature = new Feature({ geometry: polygon })
    drawSource.current.addFeature(feature)
  }, [polygon, searchMode])

  useVeglenkeRendering({
    veglenkesekvenser,
    searchMode,
    stedfesting,
    polygonClip,
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
    selectedSource.current.clear()
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
      const roundedUtm = roundPolygonToTwoDecimals(geom.clone())
      setPolygon(roundedUtm)
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
            className={`btn draw-toggle-btn ${searchMode === 'polygon' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={isDrawing && searchMode === 'polygon' ? cancelDrawing : handlePolygonMode}
          >
            {isDrawing && searchMode === 'polygon' ? 'Avbryt' : 'Tegn område'}
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

        <SearchControls searchMode={searchMode} />
      </div>

      <div className="map-settings" ref={settingsRef}>
        <button type="button" className="btn-icon" aria-label="Innstillinger" title="Innstillinger" onClick={() => setSettingsOpen((prev) => !prev)}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96c-.5-.38-1.04-.69-1.64-.92l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.6.23-1.14.54-1.64.92l-2.39-.96a.5.5 0 0 0-.6.22L2.7 7.46a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.38 1.04.69 1.64.92l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.6-.23 1.14-.54 1.64-.92l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="map-settings-popover ui-popover" role="dialog" aria-label="Kartinnstillinger">
            <div className="map-settings-row">
              <label className="map-settings-label" htmlFor="veglenke-color">
                Veglenke-farge
              </label>
              <input id="veglenke-color" type="color" value={veglenkeColor} onChange={(e) => setVeglenkeColor(e.target.value)} aria-label="Veglenke-farge" />
            </div>
            <div className="map-settings-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setVeglenkeColor(DEFAULT_VEGLENKE_COLOR)}>
                Tilbakestill
              </button>
            </div>
          </div>
        )}
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
