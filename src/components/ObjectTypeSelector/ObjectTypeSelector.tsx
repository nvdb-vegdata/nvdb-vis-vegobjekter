import { useAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import {
  getVegobjekttyper,
  type Vegobjekttype,
} from '../../api/datakatalogClient'
import { selectedTypesAtom, veglenkesekvensLimitAtom } from '../../state/atoms'

export default function ObjectTypeSelector() {
  const [veglenkesekvensLimit, setVeglenkesekvensLimit] = useAtom(
    veglenkesekvensLimitAtom,
  )
  const [selectedTypes, setSelectedTypes] = useAtom(selectedTypesAtom)
  const [allTypes, setAllTypes] = useState<Vegobjekttype[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true)
        const types = await getVegobjekttyper()
        setAllTypes(
          types.sort((a, b) => (a.navn ?? '').localeCompare(b.navn ?? '')),
        )
      } catch (err) {
        setError('Kunne ikke laste vegobjekttyper')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTypes()
  }, [])

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return allTypes
    const query = searchQuery.toLowerCase()
    return allTypes.filter(
      (t) =>
        t.navn?.toLowerCase().includes(query) ||
        t.id.toString().includes(query) ||
        t.beskrivelse?.toLowerCase().includes(query),
    )
  }, [allTypes, searchQuery])

  const isSelected = (type: Vegobjekttype) =>
    selectedTypes.some((t) => t.id === type.id)

  const handleTypeToggle = (type: Vegobjekttype) => {
    setSelectedTypes((prev) => {
      const exists = prev.some((t) => t.id === type.id)
      if (exists) {
        return prev.filter((t) => t.id !== type.id)
      }
      return [...prev, type]
    })
  }

  const handleTypeRemove = (typeId: number) => {
    setSelectedTypes((prev) => prev.filter((type) => type.id !== typeId))
  }

  if (isLoading) {
    return <div className="loading">Laster vegobjekttyper...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div>
      <div className="section-header-row">
        <div className="section-header">Vegobjekttyper</div>
        <div className="limit-inline">
          <label htmlFor="veglenke-limit">Maks veglenkesekvenser</label>
          <select
            id="veglenke-limit"
            className="limit-select"
            value={veglenkesekvensLimit}
            onChange={(e) => setVeglenkesekvensLimit(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="search-row">
        <div className="search-input-wrapper">
          <label className="search-label" htmlFor="type-search">
            Søk på navn eller ID
          </label>
          <input
            id="type-search"
            type="text"
            className="search-input"
            placeholder="fartsgrense, 105"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Tøm søk"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {selectedTypes.length > 0 && (
        <>
          <div className="selected-chips">
            {selectedTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className="selected-chip"
                onClick={() => handleTypeRemove(type.id)}
                aria-label={`Fjern ${type.navn ?? `type ${type.id}`}`}
              >
                <span className="selected-chip-label">
                  {type.navn ?? `Type ${type.id}`}
                </span>
                <span className="selected-chip-id">#{type.id}</span>
                <span className="selected-chip-remove">×</span>
              </button>
            ))}
          </div>
          <div className="selected-count">{selectedTypes.length} valgt</div>
        </>
      )}

      <ul className="object-type-list">
        {filteredTypes.slice(0, 100).map((type) => (
          <li
            key={type.id}
            className={`object-type-item ${isSelected(type) ? 'selected' : ''}`}
            onClick={() => handleTypeToggle(type)}
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
                <div
                  className="object-type-description"
                  title={type.beskrivelse}
                >
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
  )
}
