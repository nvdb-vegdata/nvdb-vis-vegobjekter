import { useState, useCallback, useMemo, useEffect } from "react";
import { transform } from "ol/proj";
import WKT from "ol/format/WKT";
import MapView from "./components/Map/MapView";
import ObjectTypeSelector from "./components/ObjectTypeSelector/ObjectTypeSelector";
import VegobjektList from "./components/VegobjektList/VegobjektList";
import { useVeglenkesekvenser } from "./hooks/useVeglenkesekvenser";
import { useVegobjekter } from "./hooks/useVegobjekter";
import { useVegobjekttyper } from "./hooks/useVegobjekttyper";
import type { Vegobjekttype } from "./api/datakatalogClient";
import type { Vegobjekt } from "./api/uberiketClient";
import { Polygon } from "ol/geom";

function polygonToUtm33(polygon: Polygon): string {
  const coords = polygon.getCoordinates()[0];
  if (!coords) return "";

  const utm33Coords = coords.map((coord) => {
    const [x, y] = transform(coord, "EPSG:3857", "EPSG:25833");
    return `${Math.round(x!)} ${Math.round(y!)}`;
  });

  return utm33Coords.join(", ");
}

function polygonToWkt(polygon: Polygon): string {
  const format = new WKT();
  return format.writeGeometry(polygon);
}

function wktToPolygon(wkt: string): Polygon | null {
  try {
    const format = new WKT();
    const geom = format.readGeometry(wkt);
    if (geom instanceof Polygon) {
      return geom;
    }
  } catch {
    console.warn("Failed to parse WKT from URL");
  }
  return null;
}

function getInitialTypeIds(): number[] {
  const params = new URLSearchParams(window.location.search);
  const typesParam = params.get("types");
  if (!typesParam) return [];
  return typesParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
}

function getInitialPolygon(): Polygon | null {
  const params = new URLSearchParams(window.location.search);
  const wkt = params.get("polygon");
  if (!wkt) return null;
  return wktToPolygon(wkt);
}

export default function App() {
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>(getInitialTypeIds);
  const [selectedTypes, setSelectedTypes] = useState<Vegobjekttype[]>([]);
  const [polygon, setPolygon] = useState<Polygon | null>(getInitialPolygon);
  const [focusedVegobjekt, setFocusedVegobjekt] = useState<{ typeId: number; id: number } | null>(null);
  const [hoveredVegobjekt, setHoveredVegobjekt] = useState<Vegobjekt | null>(null);
  const { data: allTypes, isLoading: datakatalogLoading } = useVegobjekttyper();

  useEffect(() => {
    if (!allTypes || selectedTypeIds.length === 0) return;
    const types = selectedTypeIds
      .map((id) => allTypes.find((t) => t.id === id))
      .filter((t): t is Vegobjekttype => t !== undefined);
    if (types.length > 0) {
      setSelectedTypes(types);
      setSelectedTypeIds([]);
    }
  }, [allTypes, selectedTypeIds]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (polygon) {
      url.searchParams.set("polygon", polygonToWkt(polygon));
    } else {
      url.searchParams.delete("polygon");
    }
    if (selectedTypes.length > 0) {
      url.searchParams.set("types", selectedTypes.map((t) => t.id).join(","));
    } else {
      url.searchParams.delete("types");
    }
    window.history.replaceState({}, "", url);
  }, [polygon, selectedTypes]);

  const polygonUtm33 = useMemo(
    () => (polygon ? polygonToUtm33(polygon) : null),
    [polygon]
  );

  const {
    data: veglenkeResult,
    isLoading: veglenkerLoading,
    error: veglenkerError,
  } = useVeglenkesekvenser(polygonUtm33);

  const {
    vegobjekterByType,
    isLoading: vegobjekterLoading,
  } = useVegobjekter(selectedTypes, veglenkeResult?.veglenkesekvenser, polygon);

  const handleTypeToggle = useCallback((type: Vegobjekttype) => {
    setSelectedTypes((prev) => {
      const exists = prev.some((t) => t.id === type.id);
      if (exists) {
        return prev.filter((t) => t.id !== type.id);
      }
      return [...prev, type];
    });
  }, []);

  const handlePolygonDrawn = useCallback((drawnPolygon: Polygon | null) => {
    setPolygon(drawnPolygon);
  }, []);

  const handleClearResults = useCallback(() => {
    setPolygon(null);
  }, []);

  const handleVegobjektClick = useCallback((typeId: number, id: number) => {
    setFocusedVegobjekt({ typeId, id });
  }, []);

  const handleVegobjektFocused = useCallback(() => {
    setFocusedVegobjekt(null);
  }, []);

  const handleVegobjektHover = useCallback((vegobjekt: Vegobjekt | null) => {
    setHoveredVegobjekt(vegobjekt);
  }, []);

  const isLoading = datakatalogLoading || veglenkerLoading || vegobjekterLoading;

  const totalVeglenker = veglenkeResult?.veglenkesekvenser.reduce(
    (sum, vs) => sum + (vs.veglenker?.length ?? 0),
    0
  ) ?? 0;

  const totalVegobjekter = Array.from(vegobjekterByType.values()).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>NVDB Vegobjekt Visualisering</h1>
          <p>Velg objekttyper og tegn et område på kartet</p>
        </header>

        <div className="sidebar-content">
          <ObjectTypeSelector
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
          />
        </div>

        <div className="status-bar">
          {datakatalogLoading ? (
            "Laster datakatalog..."
          ) : isLoading ? (
            "Laster data..."
          ) : (
            <>
              {selectedTypes.length} type(r) valgt
              {totalVeglenker > 0 && ` | ${totalVeglenker} veglenke(r)`}
              {totalVegobjekter > 0 && ` | ${totalVegobjekter} objekt(er)`}
            </>
          )}
        </div>
      </aside>

      <main className="map-container">
        <MapView
          selectedTypes={selectedTypes}
          polygon={polygon}
          onPolygonDrawn={handlePolygonDrawn}
          veglenkesekvenser={veglenkeResult?.veglenkesekvenser}
          vegobjekterByType={vegobjekterByType}
          onClearResults={handleClearResults}
          isLoadingVeglenker={veglenkerLoading}
          onVegobjektClick={handleVegobjektClick}
          hoveredVegobjekt={hoveredVegobjekt}
        />
      </main>

      <aside className="sidebar-right">
        {veglenkeResult ? (
          <VegobjektList
            selectedTypes={selectedTypes}
            vegobjekterByType={vegobjekterByType}
            isLoading={vegobjekterLoading}
            focusedVegobjekt={focusedVegobjekt}
            onVegobjektFocused={handleVegobjektFocused}
            onVegobjektHover={handleVegobjektHover}
          />
        ) : (
          <div className="sidebar-right-help">
            <div className="sidebar-right-header">
              <h2>Vegobjekter</h2>
            </div>
            <div className="sidebar-right-content">
              <div className="help-section">
                <h3>Kom i gang</h3>
                <ol>
                  <li>Velg en eller flere vegobjekttyper fra listen til venstre</li>
                  <li>Klikk "Tegn område" og tegn en polygon på kartet</li>
                  <li>Vegobjektene i området vises her</li>
                </ol>
              </div>
              <div className="help-section">
                <h3>Tips</h3>
                <ul>
                  <li>Klikk på en veglenke for å se hvilke objekter som ligger der</li>
                  <li>Utvid objekter i listen for å se detaljer</li>
                  <li>Bruk søkefeltet for å finne objekttyper</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </aside>

      {veglenkerError && (
        <div
          className="error"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
        >
          Kunne ikke hente data fra NVDB
          <button onClick={handleClearResults} style={{ marginLeft: 8 }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
