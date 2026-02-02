import { SVVButton } from '@komponentkassen/svv-button'
import { SVVChip, SVVChipGroup } from '@komponentkassen/svv-chip'
import { SVVSearchField, SVVSelect } from '@komponentkassen/svv-form'
import { useAtom } from 'jotai'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getKategorier, getVegobjekttyper, isSelectableVegobjekttype, type Kategori, type Vegobjekttype } from '../../api/datakatalogClient'
import { allTypesSelectedAtom, selectedTypesAtom, veglenkesekvensLimitAtom } from '../../state/atoms'

export default function ObjectTypeSelector() {
  const [veglenkesekvensLimit, setVeglenkesekvensLimit] = useAtom(veglenkesekvensLimitAtom)
  const [selectedTypes, setSelectedTypes] = useAtom(selectedTypesAtom)
  const [allTypesSelected, setAllTypesSelected] = useAtom(allTypesSelectedAtom)
  const [allTypes, setAllTypes] = useState<Vegobjekttype[]>([])
  const [categories, setCategories] = useState<Kategori[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoading(true)
        const [types, kategoriList] = await Promise.all([getVegobjekttyper(), getKategorier()])
        const visibleTypes = types.filter(isSelectableVegobjekttype).sort((a, b) => (a.navn ?? '').localeCompare(b.navn ?? ''))
        const sortedCategories = [...kategoriList].sort((a, b) => {
          if (a.sorteringsnummer !== b.sorteringsnummer) {
            return a.sorteringsnummer - b.sorteringsnummer
          }
          return (a.navn ?? '').localeCompare(b.navn ?? '')
        })
        setAllTypes(visibleTypes)
        setCategories(sortedCategories)
      } catch (err) {
        setError('Kunne ikke laste vegobjekttyper eller kategorier')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTypes()
  }, [])

  useEffect(() => {
    if (!allTypesSelected || allTypes.length === 0) return
    setSelectedTypes(allTypes)
  }, [allTypes, allTypesSelected, setSelectedTypes])

  const filteredTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allTypes
    return allTypes.filter(
      (type) => type.navn?.toLowerCase().includes(query) || type.id.toString().includes(query) || type.beskrivelse?.toLowerCase().includes(query),
    )
  }, [allTypes, searchQuery])

  const ALL_CATEGORY_ID = 38

  const isSelected = (type: Vegobjekttype) => selectedTypes.some((t) => t.id === type.id)

  const handleTypeToggle = (type: Vegobjekttype) => {
    if (allTypesSelected) return
    setSelectedCategoryId('')
    setAllTypesSelected(false)
    setSelectedTypes((prev) => {
      const exists = prev.some((t) => t.id === type.id)
      if (exists) {
        return prev.filter((t) => t.id !== type.id)
      }
      return [...prev, type]
    })
  }

  const handleCategorySelect = (value: string) => {
    if (!value) {
      setSelectedCategoryId('')
      setAllTypesSelected(false)
      return
    }

    const categoryId = Number(value)
    if (!Number.isFinite(categoryId)) {
      setSelectedCategoryId('')
      setAllTypesSelected(false)
      return
    }

    setSelectedCategoryId(value)

    if (categoryId === ALL_CATEGORY_ID) {
      setAllTypesSelected(true)
      setSelectedTypes(allTypes)
      return
    }

    setAllTypesSelected(false)

    const categoryTypes = allTypes.filter((type) => type.kategorier.some((kategori) => kategori.id === categoryId))

    setSelectedTypes(categoryTypes)
  }

  const handleTypeRemove = (typeId: number) => {
    if (allTypesSelected) return
    setSelectedCategoryId('')
    setAllTypesSelected(false)
    setSelectedTypes((prev) => prev.filter((type) => type.id !== typeId))
  }

  const handleClearTypes = () => {
    setSelectedCategoryId('')
    setAllTypesSelected(false)
    setSelectedTypes([])
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
          <SVVSelect
            id="veglenke-limit"
            legend="Maks veglenkesekvenser"
            selectSize="xSmall"
            options={[
              { value: 10, text: '10' },
              { value: 20, text: '20' },
              { value: 50, text: '50' },
              { value: 100, text: '100' },
              { value: 200, text: '200' },
            ]}
            selected={veglenkesekvensLimit}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setVeglenkesekvensLimit(Number(e.target.value))}
            removeMargin
          />
        </div>
      </div>

      <div className="search-row">
        <SVVSearchField
          id="type-search"
          label="Søk på navn eller ID"
          placeholder="fartsgrense, 105"
          inputSize="small"
          searchText={searchQuery}
          onSearch={() => {}}
          onTextChange={(text: string) => setSearchQuery(text)}
        />
      </div>

      <div className="category-row">
        <SVVSelect
          id="category-select"
          legend="Velg kategori"
          options={categories.map((kategori) => ({
            value: kategori.id,
            text: `${kategori.navn ?? kategori.kortnavn ?? `Kategori ${kategori.id}`} (#${kategori.id})`,
          }))}
          selected={selectedCategoryId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCategorySelect(e.target.value)}
          emptyChoiceText="Velg kategori"
          isFullWidth
          removeMargin
        />
      </div>

      {selectedTypes.length > 0 && (
        <>
          <div className="selected-summary">
            <div className="selected-count">{allTypesSelected ? 'Alle valgt' : `${selectedTypes.length} valgt`}</div>
            <SVVButton size="sm" color="tertiary" className="clear-types-btn" onClick={handleClearTypes}>
              Fjern alle
            </SVVButton>
          </div>
          <SVVChipGroup className="selected-chips" size="sm">
            {allTypesSelected ? (
              <SVVChip title="Alle" removable onClick={handleClearTypes} aria-label="Fjern alle" />
            ) : (
              selectedTypes.map((type) => (
                <SVVChip
                  key={type.id}
                  title={`${type.navn ?? `Type ${type.id}`} #${type.id}`}
                  removable
                  onClick={() => handleTypeRemove(type.id)}
                  aria-label={`Fjern ${type.navn ?? `type ${type.id}`}`}
                />
              ))
            )}
          </SVVChipGroup>
        </>
      )}

      <ul className="object-type-list">
        {filteredTypes.map((type) => (
          <li
            key={type.id}
            className={`object-type-item ${isSelected(type) ? 'selected' : ''}`}
            onClick={() => {
              if (!allTypesSelected) {
                handleTypeToggle(type)
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !allTypesSelected) {
                e.preventDefault()
                handleTypeToggle(type)
              }
            }}
            aria-disabled={allTypesSelected}
          >
            <input type="checkbox" className="object-type-checkbox" checked={isSelected(type)} disabled={allTypesSelected} onChange={() => {}} />
            <div className="object-type-info">
              <div className="object-type-header">
                <div className="object-type-name">{type.navn}</div>
                <div className="object-type-id">ID: {type.id}</div>
              </div>
              {type.beskrivelse && (
                <div className="object-type-description" title={type.beskrivelse}>
                  {type.beskrivelse}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
