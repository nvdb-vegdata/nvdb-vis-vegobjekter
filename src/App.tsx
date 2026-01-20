import { useMemo, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { transform } from "ol/proj";
import WKT from "ol/format/WKT";
import MapView from "./components/Map/MapView";
import ObjectTypeSelector from "./components/ObjectTypeSelector/ObjectTypeSelector";
import VegobjektList from "./components/VegobjektList/VegobjektList";
import { useVeglenkesekvenser } from "./hooks/useVeglenkesekvenser";
import { useVegobjekter } from "./hooks/useVegobjekter";
import { useVegobjekttyper } from "./hooks/useVegobjekttyper";
import { isSelectableVegobjekttype, type Vegobjekttype } from "./api/datakatalogClient";
import { Polygon } from "ol/geom";
import {
  selectedTypeIdsAtom,
  selectedTypesAtom,
  polygonAtom,
  veglenkesekvensLimitAtom,
} from "./state/atoms";

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

export default function App() {
  const [selectedTypeIds, setSelectedTypeIds] = useAtom(selectedTypeIdsAtom);
  const [selectedTypes, setSelectedTypes] = useAtom(selectedTypesAtom);
  const polygon = useAtomValue(polygonAtom);
  const veglenkesekvensLimit = useAtomValue(veglenkesekvensLimitAtom);
  const { data: allTypes, isLoading: datakatalogLoading } = useVegobjekttyper();

  useEffect(() => {
    if (!allTypes || selectedTypeIds.length === 0) return;
    const types = selectedTypeIds
      .map((id) => allTypes.find((t) => t.id === id))
      .filter((t): t is Vegobjekttype => t !== undefined)
      .filter(isSelectableVegobjekttype);
    if (types.length > 0) {
      setSelectedTypes(types);
    }
    setSelectedTypeIds([]);
  }, [allTypes, selectedTypeIds, setSelectedTypes, setSelectedTypeIds]);

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
  } = useVeglenkesekvenser(polygonUtm33, veglenkesekvensLimit);

  const {
    vegobjekterByType,
    isLoading: vegobjekterLoading,
  } = useVegobjekter(selectedTypes, veglenkeResult?.veglenkesekvenser, polygon);

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
          <ObjectTypeSelector />
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
          veglenkesekvenser={veglenkeResult?.veglenkesekvenser}
          vegobjekterByType={vegobjekterByType}
          isLoadingVeglenker={veglenkerLoading}
        />
      </main>

      <aside className="sidebar-right">
        {veglenkeResult ? (
          <VegobjektList
            vegobjekterByType={vegobjekterByType}
            isLoading={vegobjekterLoading}
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
        </div>
      )}
    </div>
  );
}
