import { SVVButton } from '@komponentkassen/svv-button'
import { SVVChip, SVVChipGroup } from '@komponentkassen/svv-chip'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import type { Vegobjekt } from '../../api/uberiketClient'
import { focusedVegobjektAtom, selectedTypesAtom, vegobjekterErrorAtom } from '../../state/atoms'
import { downloadCsvAllTypes, downloadCsvPerType } from '../../utils/csvExport'
import TypeGroup from './TypeGroup'

interface Props {
  vegobjekterByType: Map<number, Vegobjekt[]>
  isLoading?: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
}

export default function VegobjektList({ vegobjekterByType, isLoading, hasNextPage, isFetchingNextPage, onFetchNextPage }: Props) {
  const selectedTypes = useAtomValue(selectedTypesAtom)
  const focusedVegobjekt = useAtomValue(focusedVegobjektAtom)
  const errorMessage = useAtomValue(vegobjekterErrorAtom)
  const [startDateAfter, setStartDateAfter] = useState('')
  const [startDateBefore, setStartDateBefore] = useState('')
  const filterSummaries = useMemo(
    () =>
      [
        startDateAfter ? { label: `Startdato etter ${startDateAfter}`, onClear: () => setStartDateAfter('') } : null,
        startDateBefore ? { label: `Startdato før ${startDateBefore}`, onClear: () => setStartDateBefore('') } : null,
      ].filter((item): item is { label: string; onClear: () => void } => item !== null),
    [startDateAfter, startDateBefore],
  )

  const filteredVegobjekterByType = useMemo(() => {
    const startAfterTime = startDateAfter ? Date.parse(startDateAfter) : null
    const startBeforeTime = startDateBefore ? Date.parse(startDateBefore) : null
    const hasStartAfter = typeof startAfterTime === 'number' && !Number.isNaN(startAfterTime)
    const hasStartBefore = typeof startBeforeTime === 'number' && !Number.isNaN(startBeforeTime)

    if (!hasStartAfter && !hasStartBefore) {
      return vegobjekterByType
    }

    return new Map(
      Array.from(vegobjekterByType.entries()).map(([typeId, objects]) => [
        typeId,
        objects.filter((obj) => {
          const startDate = obj.gyldighetsperiode?.startdato
          if (!startDate) return false

          const startTime = Date.parse(startDate)
          if (Number.isNaN(startTime)) return false

          if (hasStartAfter && startAfterTime !== null && startTime < startAfterTime) return false
          if (hasStartBefore && startBeforeTime !== null && startTime >= startBeforeTime) return false

          return true
        }),
      ]),
    )
  }, [vegobjekterByType, startDateAfter, startDateBefore])

  const typesWithObjects = selectedTypes.filter((type) => {
    const objects = filteredVegobjekterByType.get(type.id)
    return objects && objects.length > 0
  })

  const totalCount = Array.from(filteredVegobjekterByType.values()).reduce((sum, arr) => sum + arr.length, 0)
  const overallCount = Array.from(vegobjekterByType.values()).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="vegobjekt-list">
      <div className="vegobjekt-list-header">
        <div className="vegobjekt-list-heading">
          <span className="vegobjekt-list-title">Vegobjekter</span>
          {isLoading ? null : <span className="vegobjekt-list-count">{totalCount} totalt</span>}
        </div>
        <div className="vegobjekt-list-actions">
          {hasNextPage && !isLoading && (
            <SVVButton size="sm" color="primary" onClick={onFetchNextPage} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Henter...' : 'Hent flere'}
            </SVVButton>
          )}
          {overallCount > 0 && !isLoading && (
            <>
              <SVVButton size="sm" color="primary" className="csv-popover-anchor" popoverTarget="csv-popover">
                Last ned CSV
              </SVVButton>
              <div id="csv-popover" className="csv-popover" popover="auto">
                <SVVButton
                  size="sm"
                  color="tertiary"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvAllTypes(filteredVegobjekterByType, selectedTypes)
                    document.getElementById('csv-popover')?.hidePopover()
                  }}
                >
                  Alle typer i én fil
                </SVVButton>
                <SVVButton
                  size="sm"
                  color="tertiary"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvPerType(filteredVegobjekterByType, selectedTypes)
                    document.getElementById('csv-popover')?.hidePopover()
                  }}
                >
                  Én fil per type
                </SVVButton>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="vegobjekt-list-content">
        {overallCount > 0 && !isLoading && (
          <div className="vegobjekt-list-toolbar">
            <div className="vegobjekt-list-toolbar-left">
              {filterSummaries.length > 0 && (
                <SVVChipGroup className="filter-summary" size="sm">
                  {filterSummaries.map((filter) => (
                    <SVVChip key={filter.label} title={filter.label} removable onClick={filter.onClear} aria-label={`Fjern filter: ${filter.label}`} />
                  ))}
                </SVVChipGroup>
              )}
            </div>
            <div className="vegobjekt-list-toolbar-right">
              <SVVButton size="sm" color="secondary" className="filter-popover-anchor" popoverTarget="filter-popover">
                Filter
              </SVVButton>
              <div id="filter-popover" className="filter-popover" popover="auto">
                <label className="filter-popover-field">
                  <span className="filter-popover-label">Vis versjoner med startdato etter...</span>
                  <input type="date" className="filter-popover-input" value={startDateAfter} onChange={(event) => setStartDateAfter(event.target.value)} />
                </label>
                <label className="filter-popover-field">
                  <span className="filter-popover-label">Vis versjoner med startdato før...</span>
                  <input type="date" className="filter-popover-input" value={startDateBefore} onChange={(event) => setStartDateBefore(event.target.value)} />
                </label>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="sidebar-loading">
            <span className="spinner spinner-small" />
            <span>Henter vegobjekter...</span>
          </div>
        ) : errorMessage ? (
          <div className="vegobjekt-list-empty vegobjekt-list-warning">{errorMessage}</div>
        ) : typesWithObjects.length === 0 ? (
          <div className="vegobjekt-list-empty">Ingen vegobjekter funnet i det valgte området.</div>
        ) : (
          typesWithObjects.map((type) => {
            const objects = filteredVegobjekterByType.get(type.id) ?? []
            return (
              <TypeGroup
                key={type.id}
                type={type}
                objects={objects}
                focusedVegobjektId={focusedVegobjekt?.typeId === type.id ? focusedVegobjekt.id : undefined}
                focusedVegobjektToken={focusedVegobjekt?.typeId === type.id ? focusedVegobjekt.token : undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
