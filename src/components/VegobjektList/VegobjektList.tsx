import { useState, useEffect, useRef } from "react";
import type { Vegobjekttype, Egenskapstype } from "../../api/datakatalogClient";
import { getVegobjekttypeById, getEgenskapstypeById, getEnumVerdiById } from "../../api/datakatalogClient";
import type { Vegobjekt, Stedfesting, EgenskapVerdi, EnumEgenskap } from "../../api/uberiketClient";
import { formatStedfesting, getEgenskapDisplayValue } from "../../api/uberiketClient";

interface Props {
  selectedTypes: Vegobjekttype[];
  vegobjekterByType: Map<number, Vegobjekt[]>;
  isLoading?: boolean;
  focusedVegobjekt?: { typeId: number; id: number } | null;
  onVegobjektFocused?: () => void;
  onVegobjektHover?: (vegobjekt: Vegobjekt | null) => void;
}

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
  isExpanded,
  isHighlighted,
  onToggle,
  itemRef,
  onMouseEnter,
  onMouseLeave,
}: { 
  details: VegobjektDetails;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  itemRef?: React.RefObject<HTMLDivElement | null>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div 
      ref={itemRef} 
      className={`vegobjekt-item${isHighlighted ? " vegobjekt-highlight" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
  onVegobjektFocused,
  onVegobjektHover,
}: { 
  type: Vegobjekttype; 
  objects: Vegobjekt[];
  focusedVegobjektId?: number;
  onVegobjektFocused?: () => void;
  onVegobjektHover?: (vegobjekt: Vegobjekt | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const focusedItemRef = useRef<HTMLDivElement | null>(null);

  const vegobjekttype = getVegobjekttypeById(type.id);

  useEffect(() => {
    if (focusedVegobjektId !== undefined) {
      setExpanded(true);
      setExpandedItems((prev) => new Set(prev).add(focusedVegobjektId));
      setHighlightedId(focusedVegobjektId);
      
      setTimeout(() => {
        focusedItemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        onVegobjektFocused?.();
      }, 100);

      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [focusedVegobjektId, onVegobjektFocused]);

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
              isExpanded={expandedItems.has(details.id)}
              isHighlighted={highlightedId === details.id}
              onToggle={() => toggleItem(details.id)}
              itemRef={focusedVegobjektId === details.id ? focusedItemRef : undefined}
              onMouseEnter={() => onVegobjektHover?.(vegobjekt)}
              onMouseLeave={() => onVegobjektHover?.(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VegobjektList({ 
  selectedTypes, 
  vegobjekterByType, 
  isLoading,
  focusedVegobjekt,
  onVegobjektFocused,
  onVegobjektHover,
}: Props) {
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
        {isLoading ? (
          <span className="inline-spinner">
            <span className="spinner spinner-small" />
          </span>
        ) : (
          <span className="vegobjekt-list-count">{totalCount} totalt</span>
        )}
      </div>
      <div className="vegobjekt-list-content">
        {isLoading ? (
          <div className="sidebar-loading">
            <span className="spinner spinner-small" />
            <span>Henter vegobjekter...</span>
          </div>
        ) : typesWithObjects.length === 0 ? (
          <div className="vegobjekt-list-empty">
            Ingen vegobjekter funnet i det valgte området.
          </div>
        ) : (
          typesWithObjects.map((type) => (
            <TypeGroup
              key={type.id}
              type={type}
              objects={vegobjekterByType.get(type.id) ?? []}
              focusedVegobjektId={focusedVegobjekt?.typeId === type.id ? focusedVegobjekt.id : undefined}
              onVegobjektFocused={onVegobjektFocused}
              onVegobjektHover={onVegobjektHover}
            />
          ))
        )}
      </div>
    </div>
  );
}
