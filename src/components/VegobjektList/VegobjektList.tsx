import { useAtomValue } from 'jotai'
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

  const typesWithObjects = selectedTypes.filter((type) => {
    const objects = vegobjekterByType.get(type.id)
    return objects && objects.length > 0
  })

  const totalCount = Array.from(vegobjekterByType.values()).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="vegobjekt-list">
      <div className="vegobjekt-list-header">
        <div className="vegobjekt-list-heading">
          <span className="vegobjekt-list-title">Vegobjekter</span>
          {isLoading ? null : <span className="vegobjekt-list-count">{totalCount} totalt</span>}
        </div>
        <div className="vegobjekt-list-actions">
          {hasNextPage && !isLoading && (
            <button type="button" className="btn btn-primary btn-small" onClick={onFetchNextPage} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Henter...' : 'Hent flere'}
            </button>
          )}
          {totalCount > 0 && !isLoading && (
            <>
              <button type="button" className="btn btn-secondary btn-small csv-popover-anchor" popoverTarget="csv-popover">
                Last ned CSV
              </button>
              <div id="csv-popover" className="csv-popover" popover="auto">
                <button
                  type="button"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvAllTypes(vegobjekterByType, selectedTypes)
                    document.getElementById('csv-popover')?.hidePopover()
                  }}
                >
                  Alle typer i én fil
                </button>
                <button
                  type="button"
                  className="csv-popover-option"
                  onClick={() => {
                    downloadCsvPerType(vegobjekterByType, selectedTypes)
                    document.getElementById('csv-popover')?.hidePopover()
                  }}
                >
                  Én fil per type
                </button>
              </div>
            </>
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
          <div className="vegobjekt-list-empty vegobjekt-list-warning">{errorMessage}</div>
        ) : typesWithObjects.length === 0 ? (
          <div className="vegobjekt-list-empty">Ingen vegobjekter funnet i det valgte området.</div>
        ) : (
          typesWithObjects.map((type) => {
            const objects = vegobjekterByType.get(type.id) ?? []
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
