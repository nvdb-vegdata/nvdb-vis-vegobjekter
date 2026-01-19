import { useEffect, useRef, useState, useCallback } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { Draw, Select } from "ol/interaction";
import { Polygon, LineString } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import Feature from "ol/Feature";
import { Style, Fill, Stroke } from "ol/style";
import WKT from "ol/format/WKT";
import Overlay from "ol/Overlay";
import { click } from "ol/events/condition";
import type { Vegobjekttype } from "../../api/datakatalogClient";
import {
  isOnVeglenke,
  type Veglenke,
  type Veglenkesekvens,
  type Vegobjekt,
  type Stedfesting,
} from "../../api/uberiketClient";
import { getClippedGeometries, sliceLineStringByFraction } from "../../utils/geometryUtils";
import "ol/ol.css";

proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5973", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
register(proj4);

interface Props {
  selectedTypes: Vegobjekttype[];
  polygon: Polygon | null;
  onPolygonDrawn: (polygon: Polygon | null) => void;
  veglenkesekvenser: Veglenkesekvens[] | undefined;
  vegobjekterByType: Map<number, Vegobjekt[]>;
  onClearResults: () => void;
  isLoadingVeglenker?: boolean;
  onVegobjektClick?: (typeId: number, vegobjektId: number) => void;
  hoveredVegobjekt?: Vegobjekt | null;
}

const VEGLENKE_STYLE = new Style({
  stroke: new Stroke({ color: "#3498db", width: 4 }),
});

const VEGLENKE_SELECTED_STYLE = new Style({
  stroke: new Stroke({ color: "#e74c3c", width: 6 }),
});

const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({ color: "#f39c12", width: 8 }),
});

export default function MapView({
  selectedTypes,
  polygon,
  onPolygonDrawn,
  veglenkesekvenser,
  vegobjekterByType,
  onClearResults,
  isLoadingVeglenker,
  onVegobjektClick,
  hoveredVegobjekt,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<OLMap | null>(null);
  const drawSource = useRef(new VectorSource());
  const veglenkeSource = useRef(new VectorSource());
  const highlightSource = useRef(new VectorSource());
  const overlayRef = useRef<Overlay | null>(null);
  const drawInteraction = useRef<Draw | null>(null);
  const selectInteraction = useRef<Select | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const params = new URLSearchParams(window.location.search);
    const lon = parseFloat(params.get("lon") || "10.0");
    const lat = parseFloat(params.get("lat") || "64.0");
    const zoom = parseFloat(params.get("z") || "5");

    const drawLayer = new VectorLayer({
      source: drawSource.current,
      style: new Style({
        fill: new Fill({ color: "rgba(52, 152, 219, 0.2)" }),
        stroke: new Stroke({ color: "#3498db", width: 2 }),
      }),
    });

    const veglenkeLayer = new VectorLayer({
      source: veglenkeSource.current,
      style: VEGLENKE_STYLE,
    });

    const highlightLayer = new VectorLayer({
      source: highlightSource.current,
      style: HIGHLIGHT_STYLE,
    });

    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } },
    });
    overlayRef.current = overlay;

    const map = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), drawLayer, veglenkeLayer, highlightLayer],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([lon, lat]),
        zoom: zoom,
      }),
    });

    const select = new Select({
      condition: click,
      layers: [veglenkeLayer],
      style: VEGLENKE_SELECTED_STYLE,
    });

    select.on("select", (e) => {
      if (e.selected.length > 0) {
        const feature = e.selected[0]!;
        setSelectedFeature(feature);
        const geom = feature.getGeometry();
        if (geom) {
          const extent = geom.getExtent();
          const center = [(extent[0]! + extent[2]!) / 2, (extent[1]! + extent[3]!) / 2];
          overlay.setPosition(center);
        }
      } else {
        setSelectedFeature(null);
        overlay.setPosition(undefined);
      }
    });

    map.addInteraction(select);
    selectInteraction.current = select;
    mapInstance.current = map;

    map.on("pointermove", (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel, {
        layerFilter: (layer) => layer === veglenkeLayer,
      });
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    let updateUrlTimeout: ReturnType<typeof setTimeout> | null = null;
    map.on("moveend", () => {
      if (updateUrlTimeout) clearTimeout(updateUrlTimeout);
      updateUrlTimeout = setTimeout(() => {
        const view = map.getView();
        const center = toLonLat(view.getCenter()!);
        const z = view.getZoom();
        const url = new URL(window.location.href);
        url.searchParams.set("lon", center[0]!.toFixed(5));
        url.searchParams.set("lat", center[1]!.toFixed(5));
        url.searchParams.set("z", z!.toFixed(1));
        window.history.replaceState({}, "", url);
      }, 200);
    });

    return () => {
      if (updateUrlTimeout) clearTimeout(updateUrlTimeout);
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !polygon) return;
    if (drawSource.current.getFeatures().length > 0) return;
    const feature = new Feature({ geometry: polygon });
    drawSource.current.addFeature(feature);
  }, [polygon]);

  useEffect(() => {
    if (!veglenkesekvenser) {
      veglenkeSource.current.clear();
      return;
    }

    veglenkeSource.current.clear();
    const wktFormat = new WKT();
    const today = new Date().toISOString().split("T")[0]!;

    const drawnFeatures = drawSource.current.getFeatures();
    const drawnPolygon = drawnFeatures.length > 0 ? drawnFeatures[0]?.getGeometry() : null;

    for (const vs of veglenkesekvenser) {
      for (const vl of vs.veglenker ?? []) {
        const sluttdato = (vl as { gyldighetsperiode?: { sluttdato?: string } }).gyldighetsperiode?.sluttdato;
        if (sluttdato && sluttdato < today) {
          continue;
        }

        if (vl.geometri?.wkt) {
          try {
            const geom = wktFormat.readGeometry(vl.geometri.wkt, {
              dataProjection: `EPSG:${vl.geometri.srid}`,
              featureProjection: "EPSG:3857",
            });

            if (drawnPolygon && !geom.intersectsExtent(drawnPolygon.getExtent())) {
              continue;
            }

            const feature = new Feature({
              geometry: geom,
              veglenkesekvensId: vs.id,
              veglenke: vl,
            });
            veglenkeSource.current.addFeature(feature);
          } catch (e) {
            console.warn("Failed to parse geometry", e);
          }
        }
      }
    }
  }, [veglenkesekvenser]);

  useEffect(() => {
    highlightSource.current.clear();
    
    if (!hoveredVegobjekt || !veglenkesekvenser) return;
    
    const stedfesting = hoveredVegobjekt.stedfesting as Stedfesting | undefined;
    if (!stedfesting) return;
    
    const clippedGeometries = getClippedGeometries(stedfesting, veglenkesekvenser);
    
    for (const clipped of clippedGeometries) {
      const veglenkeFeature = veglenkeSource.current.getFeatures().find((f) => {
        const vsId = f.get("veglenkesekvensId");
        const vl = f.get("veglenke") as Veglenke | undefined;
        return vsId === clipped.veglenkesekvensId && vl?.nummer === clipped.veglenkeNummer;
      });
      
      if (!veglenkeFeature) continue;
      
      const geom = veglenkeFeature.getGeometry() as LineString | undefined;
      if (!geom) continue;
      
      try {
        const coords = geom.getCoordinates();
        const slicedCoords = sliceLineStringByFraction(coords, clipped.startFraction, clipped.endFraction);
        
        if (slicedCoords.length >= 2) {
          const slicedGeom = new LineString(slicedCoords);
          const highlightFeature = new Feature({ geometry: slicedGeom });
          highlightSource.current.addFeature(highlightFeature);
        }
      } catch (e) {
        console.warn("Failed to slice geometry", e);
      }
    }
  }, [hoveredVegobjekt, veglenkesekvenser]);

  const startDrawing = useCallback(() => {
    if (!mapInstance.current) return;

    drawSource.current.clear();
    veglenkeSource.current.clear();
    setSelectedFeature(null);
    overlayRef.current?.setPosition(undefined);
    onClearResults();

    const draw = new Draw({
      source: drawSource.current,
      type: "Polygon",
    });

    draw.on("drawend", (event) => {
      const feature = event.feature;
      const geom = feature.getGeometry() as Polygon;
      onPolygonDrawn(geom);
      mapInstance.current?.removeInteraction(draw);
      setIsDrawing(false);
    });

    mapInstance.current.addInteraction(draw);
    drawInteraction.current = draw;
    setIsDrawing(true);
  }, [onPolygonDrawn, onClearResults]);

  const cancelDrawing = useCallback(() => {
    if (drawInteraction.current && mapInstance.current) {
      mapInstance.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }
    setIsDrawing(false);
  }, []);

  const clearAll = useCallback(() => {
    drawSource.current.clear();
    veglenkeSource.current.clear();
    highlightSource.current.clear();
    setSelectedFeature(null);
    overlayRef.current?.setPosition(undefined);
    onClearResults();
  }, [onClearResults]);

  const getVegobjekterOnVeglenke = useCallback(
    (veglenkesekvensId: number) => {
      const result: { type: Vegobjekttype; objects: Vegobjekt[] }[] = [];

      for (const type of selectedTypes) {
        const objects = vegobjekterByType.get(type.id) ?? [];
        const matching = objects.filter((obj) =>
          isOnVeglenke(
            obj.stedfesting as Stedfesting | undefined,
            veglenkesekvensId,
            0,
            1
          )
        );
        if (matching.length > 0) {
          result.push({ type, objects: matching });
        }
      }

      return result;
    },
    [vegobjekterByType, selectedTypes]
  );

  const selectedVeglenkesekvensId = selectedFeature?.get("veglenkesekvensId") as number | undefined;
  const selectedVeglenke = selectedFeature?.get("veglenke") as Veglenke | undefined;
  const vegobjekterOnSelected = selectedVeglenkesekvensId
    ? getVegobjekterOnVeglenke(selectedVeglenkesekvensId)
    : [];

  return (
    <>
      <div className="draw-controls">
        {!isDrawing ? (
          <>
            <button className="btn btn-primary" onClick={startDrawing}>
              Tegn område
            </button>
            {(polygon || veglenkesekvenser) && (
              <button className="btn btn-danger" onClick={clearAll}>
                Nullstill
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-secondary" onClick={cancelDrawing}>
            Avbryt tegning
          </button>
        )}
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div className="map-loading-overlay" style={{ display: isLoadingVeglenker ? undefined : "none" }}>
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
              <p style={{ fontSize: 12, color: "#666" }}>
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
                          onClick={() => onVegobjektClick?.(type.id, obj.id)}
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
  );
}
