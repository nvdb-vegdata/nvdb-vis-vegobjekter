import { useAtomValue, useSetAtom } from 'jotai'
import type Feature from 'ol/Feature'
import { useCallback, useMemo } from 'react'
import type { Stedfesting, VeglenkeMedPosisjon, Vegobjekt } from '../../api/uberiketClient'
import { isOnVeglenke } from '../../api/uberiketClient'
import { focusedVegobjektAtom, selectedTypesAtom } from '../../state/atoms'

const NVDB_API_BASE_URL = 'https://nvdbapiles.atlas.vegvesen.no'
const UBERIKET_API_BASE_URL = `${NVDB_API_BASE_URL}/uberiket`

interface Props {
  selectedFeature: Feature | null
  vegobjekterByType: Map<number, Vegobjekt[]>
  popupRef: React.RefObject<HTMLDivElement | null>
}

export default function VeglenkePopup({ selectedFeature, vegobjekterByType, popupRef }: Props) {
  const selectedTypes = useAtomValue(selectedTypesAtom)
  const setFocusedVegobjekt = useSetAtom(focusedVegobjektAtom)

  const handleVegobjektClick = useCallback(
    (typeId: number, vegobjektId: number) => {
      setFocusedVegobjekt({ typeId, id: vegobjektId, token: Date.now() })
    },
    [setFocusedVegobjekt],
  )

  const selectedVeglenkesekvensId = selectedFeature?.get('veglenkesekvensId') as number | undefined
  const selectedVeglenke = selectedFeature?.get('veglenke') as VeglenkeMedPosisjon | undefined
  const veglenkesekvensUrl = selectedVeglenkesekvensId ? `${UBERIKET_API_BASE_URL}/api/v1/vegnett/veglenkesekvenser/${selectedVeglenkesekvensId}` : null

  const vegobjekterOnSelected = useMemo(() => {
    if (!selectedVeglenkesekvensId) return []
    const result: {
      type: { id: number; navn?: string }
      objects: Vegobjekt[]
    }[] = []
    const startposisjon = selectedVeglenke?.startposisjon ?? 0
    const sluttposisjon = selectedVeglenke?.sluttposisjon ?? 1

    for (const type of selectedTypes) {
      const objects = vegobjekterByType.get(type.id) ?? []
      const matching = objects.filter((obj) =>
        isOnVeglenke(obj.stedfesting as Stedfesting | undefined, selectedVeglenkesekvensId, startposisjon, sluttposisjon),
      )
      if (matching.length > 0) {
        result.push({ type, objects: matching })
      }
    }

    return result
  }, [selectedVeglenkesekvensId, selectedVeglenke, selectedTypes, vegobjekterByType])

  return (
    <div ref={popupRef} className="ol-popup">
      {selectedFeature && (
        <div className="popup-content">
          <div className="popup-title">
            Veglenke{' '}
            {selectedVeglenkesekvensId && veglenkesekvensUrl ? (
              <a href={veglenkesekvensUrl} target="_blank" rel="noopener noreferrer">
                {selectedVeglenkesekvensId}
              </a>
            ) : (
              selectedVeglenkesekvensId
            )}
            :{selectedVeglenke?.nummer}
          </div>
          {vegobjekterOnSelected.length === 0 ? (
            <p style={{ fontSize: 12, color: '#666' }}>Ingen vegobjekter funnet på denne veglenken</p>
          ) : (
            vegobjekterOnSelected.map(({ type, objects }) => (
              <div key={type.id} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {type.navn} ({objects.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                  {objects.slice(0, 5).map((obj) => (
                    <li key={obj.id}>
                      <button type="button" className="popup-vegobjekt-link" onClick={() => handleVegobjektClick(type.id, obj.id)}>
                        ID: {obj.id}
                      </button>
                    </li>
                  ))}
                  {objects.length > 5 && <li>...og {objects.length - 5} til</li>}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
