import { useState, useEffect, useMemo } from "react";
import { getVegobjekttyper, type Vegobjekttype } from "../../api/datakatalogClient";

interface Props {
  selectedTypes: Vegobjekttype[];
  onTypeToggle: (type: Vegobjekttype) => void;
}

export default function ObjectTypeSelector({ selectedTypes, onTypeToggle }: Props) {
  const [allTypes, setAllTypes] = useState<Vegobjekttype[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true);
        const types = await getVegobjekttyper();
        setAllTypes(types.sort((a, b) => (a.navn ?? "").localeCompare(b.navn ?? "")));
      } catch (err) {
        setError("Kunne ikke laste vegobjekttyper");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTypes();
  }, []);

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return allTypes;
    const query = searchQuery.toLowerCase();
    return allTypes.filter(
      (t) =>
        t.navn?.toLowerCase().includes(query) ||
        t.id.toString().includes(query) ||
        t.beskrivelse?.toLowerCase().includes(query)
    );
  }, [allTypes, searchQuery]);

  const isSelected = (type: Vegobjekttype) =>
    selectedTypes.some((t) => t.id === type.id);

  if (isLoading) {
    return <div className="loading">Laster vegobjekttyper...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <div className="section-header">Vegobjekttyper</div>
      
      <input
        type="text"
        className="search-input"
        placeholder="Søk etter vegobjekttype..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {selectedTypes.length > 0 && (
        <div className="selected-count">
          {selectedTypes.length} valgt
        </div>
      )}

      <ul className="object-type-list">
        {filteredTypes.slice(0, 100).map((type) => (
          <li
            key={type.id}
            className={`object-type-item ${isSelected(type) ? "selected" : ""}`}
            onClick={() => onTypeToggle(type)}
          >
            <input
              type="checkbox"
              className="object-type-checkbox"
              checked={isSelected(type)}
              onChange={() => {}}
            />
            <div className="object-type-info">
              <div className="object-type-name">{type.navn}</div>
              <div className="object-type-id">ID: {type.id}</div>
              {type.beskrivelse && (
                <div className="object-type-description" title={type.beskrivelse}>
                  {type.beskrivelse}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filteredTypes.length > 100 && (
        <div className="selected-count">
          Viser 100 av {filteredTypes.length} typer. Bruk søk for å finne flere.
        </div>
      )}
    </div>
  );
}
