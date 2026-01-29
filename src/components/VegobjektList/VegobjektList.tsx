import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { Vegobjekttype, Egenskapstype } from "../../api/datakatalogClient";
import { getVegobjekttypeById, getEgenskapstypeById, getEnumVerdiById } from "../../api/datakatalogClient";
import type { Vegobjekt, Stedfesting, EgenskapVerdi, EnumEgenskap } from "../../api/uberiketClient";
import { formatStedfesting, getEgenskapDisplayValue } from "../../api/uberiketClient";
import {
  selectedTypesAtom,
  focusedVegobjektAtom,
  hoveredVegobjektAtom,
  locateVegobjektAtom,
  vegobjekterErrorAtom,
} from "../../state/atoms";
import { downloadCsvPerType, downloadCsvAllTypes } from "../../utils/csvExport";

interface Props {
  vegobjekterByType: Map<number, Vegobjekt[]>;
  isLoading?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
}

const NVDB_API_BASE_URL = "https://nvdbapiles.atlas.vegvesen.no";
const UBERIKET_API_BASE_URL = `${NVDB_API_BASE_URL}/uberiket`;
const VEGKART_BASE_URL = "https://vegkart.atlas.vegvesen.no";

interface VegobjektDetails {
  id: number;
  typeId: number;
  versjonId?: number;
  gyldighetsperiode?: { startdato: string; sluttdato?: string };
  stedfestinger: string[];
  barn: { typeId: string; ids: number[] }[];
  egenskaper: { id: string; name: string; value: string }[];
}

function getEgenskapValue(
  egenskap: EgenskapVerdi,
  egenskapstype: Egenskapstype | undefined
): string {
  if (egenskap.type === "EnumEgenskap" && egenskapstype) {
    const enumVerdi = getEnumVerdiById(egenskapstype, (egenskap as EnumEgenskap).verdi);
    if (enumVerdi) {
      return enumVerdi.kortnavn ?? String(enumVerdi.verdi) ?? `ID: ${enumVerdi.id}`;
    }
  }
  return getEgenskapDisplayValue(egenskap);
}

function processVegobjekt(
  obj: Vegobjekt,
  typeId: number,
  vegobjekttype: Vegobjekttype | undefined
): VegobjektDetails {
  const egenskaper: VegobjektDetails["egenskaper"] = [];
  if (obj.egenskaper) {
    for (const [id, egenskap] of Object.entries(obj.egenskaper)) {
      const egenskapstype = vegobjekttype ? getEgenskapstypeById(vegobjekttype, Number(id)) : undefined;
      const name = egenskapstype?.navn ?? `Egenskap ${id}`;
      const value = getEgenskapValue(egenskap, egenskapstype);
      egenskaper.push({ id, name, value });
    }
  }

  const barn: VegobjektDetails["barn"] = [];
  if (obj.barn) {
    for (const [typeIdStr, ids] of Object.entries(obj.barn)) {
      barn.push({ typeId: typeIdStr, ids: Array.isArray(ids) ? ids : Array.from(ids as Set<number>) });
    }
  }

  return {
    id: obj.id,
    typeId,
    versjonId: obj.versjon,
    gyldighetsperiode: obj.gyldighetsperiode,
    stedfestinger: formatStedfesting(obj.stedfesting as Stedfesting | undefined),
    barn,
    egenskaper,
  };
}

function VegobjektItem({ 
  details, 
  vegobjekt,
  isExpanded,
  isHighlighted,
  onToggle,
  itemRef,
}: { 
  details: VegobjektDetails;
  vegobjekt: Vegobjekt;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  itemRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const setHoveredVegobjekt = useSetAtom(hoveredVegobjektAtom);
  const setLocateVegobjekt = useSetAtom(locateVegobjektAtom);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const uberiketUrl = `${UBERIKET_API_BASE_URL}/api/v1/vegobjekter/${details.typeId}/${details.id}`;
  const lesApiUrl = `${NVDB_API_BASE_URL}/vegobjekt?id=${details.id}`;
  const vegkartUrl = `${VEGKART_BASE_URL}#valgt:${details.id}`;

  const handleCopyId = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(details.id));
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div 
      ref={itemRef} 
      className={`vegobjekt-item${isHighlighted ? " vegobjekt-highlight" : ""}`}
      onMouseEnter={() => setHoveredVegobjekt(vegobjekt)}
      onMouseLeave={() => setHoveredVegobjekt(null)}
    >
      <div 
        className="vegobjekt-header" 
        onClick={onToggle}
      >
        <span className="vegobjekt-expand">{isExpanded ? "-" : "+"}</span>
        <span className="vegobjekt-id">ID: {details.id}</span>
        {details.versjonId && (
          <span className="vegobjekt-version">v{details.versjonId}</span>
        )}
        <div className="vegobjekt-header-actions">
          <button
            type="button"
            className={`vegobjekt-action-btn vegobjekt-copy-btn${copied ? " copied" : ""}`}
            aria-label={copied ? "ID kopiert" : "Kopier ID"}
            title={copied ? "Kopiert!" : "Kopier ID"}
            onClick={handleCopyId}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"
              />
            </svg>
          </button>
          <button
            type="button"
            className="vegobjekt-action-btn vegobjekt-locate-btn"
            aria-label="Finn i kart"
            title="Finn i kart"
            onClick={(event) => {
              event.stopPropagation();
              setLocateVegobjekt({ vegobjekt, token: Date.now() });
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 2a7 7 0 0 1 7 7c0 4.2-5.1 10.1-6.4 11.5a.8.8 0 0 1-1.2 0C10.1 19.1 5 13.2 5 9a7 7 0 0 1 7-7Zm0 4.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="vegobjekt-details">
          {details.gyldighetsperiode && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Gyldighetsperiode</div>
              <div className="vegobjekt-property">
                {details.gyldighetsperiode.startdato}
                {details.gyldighetsperiode.sluttdato 
                  ? ` - ${details.gyldighetsperiode.sluttdato}` 
                  : " - (aktiv)"}
              </div>
            </div>
          )}

          {details.stedfestinger.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Stedfesting</div>
              {details.stedfestinger.map((s, i) => (
                <div key={i} className="vegobjekt-property vegobjekt-stedfesting">
                  {s}
                </div>
              ))}
            </div>
          )}

          {details.barn.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Barn</div>
              {details.barn.map((b, i) => (
                <div key={i} className="vegobjekt-property">
                  <span className="vegobjekt-barn-type">Type {b.typeId}:</span>{" "}
                  {b.ids.slice(0, 5).join(", ")}
                  {b.ids.length > 5 && ` (+${b.ids.length - 5} til)`}
                </div>
              ))}
            </div>
          )}

          <div className="vegobjekt-section">
            <div className="vegobjekt-section-title">Lenker</div>
            <div className="vegobjekt-property">
              <a href={uberiketUrl} target="_blank" rel="noopener noreferrer">
                Uberiket API
              </a>
              {" | "}
              <a href={vegkartUrl} target="_blank" rel="noopener noreferrer">
                Vegkart
              </a>
              {" | "}
              <a href={lesApiUrl} target="_blank" rel="noopener noreferrer">
                Les API V4
              </a>
            </div>
          </div>

          {details.egenskaper.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Egenskaper</div>
              {details.egenskaper.map((e) => (
                <div key={e.id} className="vegobjekt-property">
                  <span className="vegobjekt-egenskap-name">{e.name}:</span>{" "}
                  <span className="vegobjekt-egenskap-value">{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypeGroup({ 
  type, 
  objects,
  focusedVegobjektId,
  focusedVegobjektToken,
}: { 
  type: Vegobjekttype; 
  objects: Vegobjekt[];
  focusedVegobjektId?: number;
  focusedVegobjektToken?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const focusedItemRef = useRef<HTMLDivElement | null>(null);
  const setFocusedVegobjekt = useSetAtom(focusedVegobjektAtom);

  const vegobjekttype = getVegobjekttypeById(type.id);

  useEffect(() => {
    if (focusedVegobjektId !== undefined && focusedVegobjektToken !== undefined) {
      setExpanded(true);

      setExpandedItems((prev) => {
        const next = new Set(prev);
        next.add(focusedVegobjektId);
        return next;
      });
      setHighlightedId(focusedVegobjektId);

      setTimeout(() => {
        focusedItemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setFocusedVegobjekt(null);
      }, 100);
    }
  }, [focusedVegobjektId, focusedVegobjektToken, setFocusedVegobjekt]);

  useEffect(() => {
    if (highlightedId === null) return;

    const currentId = highlightedId;
    const timer = setTimeout(() => {
      setHighlightedId((prev) => (prev === currentId ? null : prev));
    }, 1500);

    return () => clearTimeout(timer);
  }, [highlightedId]);

  const processedObjects = objects.map((obj) => ({
    vegobjekt: obj,
    details: processVegobjekt(obj, type.id, vegobjekttype),
  }));

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="vegobjekt-type-group">
      <div 
        className="vegobjekt-type-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="vegobjekt-expand">{expanded ? "-" : "+"}</span>
        <span className="vegobjekt-type-name">{type.navn}</span>
        <span className="vegobjekt-type-count">({objects.length})</span>
      </div>

      {expanded && (
        <div className="vegobjekt-type-content">
          {processedObjects.map(({ vegobjekt, details }) => (
            <VegobjektItem 
              key={details.id} 
              details={details}
              vegobjekt={vegobjekt}
              isExpanded={expandedItems.has(details.id)}
              isHighlighted={highlightedId === details.id}
              onToggle={() => toggleItem(details.id)}
              itemRef={focusedVegobjektId === details.id ? focusedItemRef : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VegobjektList({ 
  vegobjekterByType, 
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: Props) {
  const selectedTypes = useAtomValue(selectedTypesAtom);
  const focusedVegobjekt = useAtomValue(focusedVegobjektAtom);
  const errorMessage = useAtomValue(vegobjekterErrorAtom);

  const typesWithObjects = selectedTypes.filter((type) => {
    const objects = vegobjekterByType.get(type.id);
    return objects && objects.length > 0;
  });

  const totalCount = Array.from(vegobjekterByType.values())
    .reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="vegobjekt-list">
      <div className="vegobjekt-list-header">
        <span className="vegobjekt-list-title">Vegobjekter</span>
        <div className="vegobjekt-list-actions">
          {isLoading ? (
            <span className="inline-spinner">
              <span className="spinner spinner-small" />
            </span>
          ) : (
            <span className="vegobjekt-list-count">{totalCount} totalt</span>
          )}
          {totalCount > 0 && !isLoading && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-small csv-popover-anchor"
                // @ts-expect-error popoverTarget not in React 18 types
                popoverTarget="csv-popover"
              >
                Last ned CSV
              </button>
              {/* @ts-expect-error popover not in React 18 types */}
              <div id="csv-popover" className="csv-popover" popover="auto">
                <button
                  type="button"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvAllTypes(vegobjekterByType, selectedTypes);
                    document.getElementById("csv-popover")?.hidePopover();
                  }}
                >
                  Alle typer i én fil
                </button>
                <button
                  type="button"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvPerType(vegobjekterByType, selectedTypes);
                    document.getElementById("csv-popover")?.hidePopover();
                  }}
                >
                  Én fil per type
                </button>
              </div>
            </>
          )}
          {hasNextPage && !isLoading && (
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={onFetchNextPage}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Henter..." : "Neste side"}
            </button>
          )}
        </div>
      </div>
      <div className="vegobjekt-list-content">
        {isLoading ? (
          <div className="sidebar-loading">
            <span className="spinner spinner-small" />
            <span>Henter vegobjekter...</span>
          </div>
        ) : errorMessage ? (
          <div className="vegobjekt-list-empty vegobjekt-list-warning">
            {errorMessage}
          </div>
        ) : typesWithObjects.length === 0 ? (
          <div className="vegobjekt-list-empty">
            Ingen vegobjekter funnet i det valgte området.
          </div>
        ) : (
          typesWithObjects.map((type) => {
            const objects = vegobjekterByType.get(type.id) ?? [];
            return (
              <TypeGroup
                key={type.id}
                type={type}
                objects={objects}
                focusedVegobjektId={focusedVegobjekt?.typeId === type.id ? focusedVegobjekt.id : undefined}
                focusedVegobjektToken={focusedVegobjekt?.typeId === type.id ? focusedVegobjekt.token : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
