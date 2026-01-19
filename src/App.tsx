import { useState, useCallback } from "react";
import MapView from "./components/Map/MapView";
import ObjectTypeSelector from "./components/ObjectTypeSelector/ObjectTypeSelector";
import type { Vegobjekttype } from "./api/datakatalogClient";
import type { Veglenkesekvens, VegobjektMedStedfesting } from "./api/uberiketClient";
import type { Polygon } from "ol/geom";

export interface VeglenkeData {
  veglenkesekvenser: Veglenkesekvens[];
  vegobjekterByType: Map<number, VegobjektMedStedfesting[]>;
}

export default function App() {
  const [selectedTypes, setSelectedTypes] = useState<Vegobjekttype[]>([]);
  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [veglenkeData, setVeglenkeData] = useState<VeglenkeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDataLoaded = useCallback((data: VeglenkeData) => {
    setVeglenkeData(data);
  }, []);

  const handleClearResults = useCallback(() => {
    setVeglenkeData(null);
    setPolygon(null);
  }, []);

  const totalVeglenker = veglenkeData?.veglenkesekvenser.reduce(
    (sum, vs) => sum + (vs.veglenker?.length ?? 0),
    0
  ) ?? 0;

  const totalVegobjekter = veglenkeData
    ? Array.from(veglenkeData.vegobjekterByType.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      )
    : 0;

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
          {isLoading ? (
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
          veglenkeData={veglenkeData}
          onDataLoaded={handleDataLoaded}
          onClearResults={handleClearResults}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      </main>

      {error && (
        <div
          className="error"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8 }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
