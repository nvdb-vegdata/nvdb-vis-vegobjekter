import { useEffect, useRef, useState, useCallback } from "react";
import OLMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { Draw, Select } from "ol/interaction";
import { Polygon } from "ol/geom";
import { fromLonLat, transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import Feature from "ol/Feature";
import { Style, Fill, Stroke } from "ol/style";
import WKT from "ol/format/WKT";
import Overlay from "ol/Overlay";
import { click } from "ol/events/condition";
import type { Vegobjekttype } from "../../api/datakatalogClient";
import type { VeglenkeData } from "../../App";
import {
  hentVeglenkesekvenser,
  hentVegobjekter,
  getStedfestingFilter,
  isOnVeglenke,
  type Veglenke,
  type VegobjektMedStedfesting,
  type VegobjektStedfesting,
} from "../../api/uberiketClient";
import "ol/ol.css";

// Register UTM33N projection
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

interface Props {
  selectedTypes: Vegobjekttype[];
  polygon: Polygon | null;
  onPolygonDrawn: (polygon: Polygon | null) => void;
  veglenkeData: VeglenkeData | null;
  onDataLoaded: (data: VeglenkeData) => void;
  onClearResults: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const VEGLENKE_STYLE = new Style({
  stroke: new Stroke({ color: "#3498db", width: 4 }),
});

const VEGLENKE_SELECTED_STYLE = new Style({
  stroke: new Stroke({ color: "#e74c3c", width: 6 }),
});

function polygonToUtm33(polygon: Polygon): string {
  const coords = polygon.getCoordinates()[0];
  if (!coords) return "";
  
  const utm33Coords = coords.map((coord) => {
    const [x, y] = transform(coord, "EPSG:3857", "EPSG:25833");
    return `${Math.round(x!)} ${Math.round(y!)}`;
  });
  
  return utm33Coords.join(", ");
}

export default function MapView({
  selectedTypes,
  polygon,
  onPolygonDrawn,
  veglenkeData,
  onDataLoaded,
  onClearResults,
  setIsLoading,
  setError,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<OLMap | null>(null);
  const drawSource = useRef(new VectorSource());
  const veglenkeSource = useRef(new VectorSource());
  const overlayRef = useRef<Overlay | null>(null);
  const drawInteraction = useRef<Draw | null>(null);
  const selectInteraction = useRef<Select | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

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

    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: { animation: { duration: 250 } },
    });
    overlayRef.current = overlay;

    const map = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), drawLayer, veglenkeLayer],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([10.0, 64.0]),
        zoom: 5,
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

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!veglenkeData) {
      veglenkeSource.current.clear();
      return;
    }

    veglenkeSource.current.clear();
    const wktFormat = new WKT();

    for (const vs of veglenkeData.veglenkesekvenser) {
      for (const vl of vs.veglenker ?? []) {
        if (vl.geometri?.wkt) {
          try {
            const geom = wktFormat.readGeometry(vl.geometri.wkt, {
              dataProjection: `EPSG:${vl.geometri.srid}`,
              featureProjection: "EPSG:3857",
            });
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
  }, [veglenkeData]);

  const startDrawing = useCallback(() => {
    if (!mapInstance.current) return;

    drawSource.current.clear();
    onPolygonDrawn(null);

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
  }, [onPolygonDrawn]);

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
    setSelectedFeature(null);
    overlayRef.current?.setPosition(undefined);
    onClearResults();
  }, [onClearResults]);

  const fetchData = useCallback(async () => {
    if (!polygon || selectedTypes.length === 0) return;

    setIsLoading(true);
    setError(null);
    veglenkeSource.current.clear();
    setSelectedFeature(null);
    overlayRef.current?.setPosition(undefined);

    try {
      const utm33Polygon = polygonToUtm33(polygon);
      const veglenkeResult = await hentVeglenkesekvenser(utm33Polygon, 10);

      if (veglenkeResult.veglenkesekvenser.length === 0) {
        setError("Ingen veglenker funnet i området");
        setIsLoading(false);
        return;
      }

      const vegobjekterByType = new Map<number, VegobjektMedStedfesting[]>();

      for (const type of selectedTypes) {
        const stedfestingFilters = veglenkeResult.veglenkesekvenser.map((vs) =>
          getStedfestingFilter(vs.id)
        );

        try {
          const objResult = await hentVegobjekter(type.id, stedfestingFilters);
          vegobjekterByType.set(
            type.id,
            objResult.vegobjekter as VegobjektMedStedfesting[]
          );
        } catch (e) {
          console.warn(`Failed to fetch vegobjekter for type ${type.id}`, e);
          vegobjekterByType.set(type.id, []);
        }
      }

      onDataLoaded({
        veglenkesekvenser: veglenkeResult.veglenkesekvenser,
        vegobjekterByType,
      });
    } catch (err) {
      console.error(err);
      setError("Kunne ikke hente data fra NVDB");
    } finally {
      setIsLoading(false);
    }
  }, [polygon, selectedTypes, onDataLoaded, setIsLoading, setError]);

  const getVegobjekterOnVeglenke = useCallback(
    (veglenkesekvensId: number, veglenke: Veglenke) => {
      if (!veglenkeData) return [];

      const result: { type: Vegobjekttype; objects: VegobjektMedStedfesting[] }[] = [];

      for (const type of selectedTypes) {
        const objects = veglenkeData.vegobjekterByType.get(type.id) ?? [];
        const matching = objects.filter((obj) =>
          isOnVeglenke(
            obj.stedfesting as VegobjektStedfesting | undefined,
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
    [veglenkeData, selectedTypes]
  );

  const selectedVeglenkesekvensId = selectedFeature?.get("veglenkesekvensId") as
    | number
    | undefined;
  const selectedVeglenke = selectedFeature?.get("veglenke") as Veglenke | undefined;
  const vegobjekterOnSelected =
    selectedVeglenkesekvensId && selectedVeglenke
      ? getVegobjekterOnVeglenke(selectedVeglenkesekvensId, selectedVeglenke)
      : [];

  return (
    <>
      <div className="draw-controls">
        {!isDrawing ? (
          <>
            <button className="btn btn-primary" onClick={startDrawing}>
              Tegn område
            </button>
            {polygon && selectedTypes.length > 0 && (
              <button className="btn btn-primary" onClick={fetchData}>
                Hent data ({selectedTypes.length} type(r))
              </button>
            )}
            {(polygon || veglenkeData) && (
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

      <div ref={popupRef} className="ol-popup">
        {selectedFeature && (
          <div className="popup-content">
            <div className="popup-title">
              Veglenkesekvens {selectedVeglenkesekvensId}
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
                      <li key={obj.id}>ID: {obj.id}</li>
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

      {veglenkeData && selectedTypes.length > 0 && (
        <div
          className="legend"
          style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000 }}
        >
          <div className="legend-title">Vegobjekter i området</div>
          {selectedTypes.map((type) => {
            const count = veglenkeData.vegobjekterByType.get(type.id)?.length ?? 0;
            return (
              <div key={type.id} className="legend-item">
                <span>
                  {type.navn}: {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
