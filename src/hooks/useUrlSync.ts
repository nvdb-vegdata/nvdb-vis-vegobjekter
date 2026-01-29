import { useAtomValue } from 'jotai'
import WKT from 'ol/format/WKT'
import type { Polygon } from 'ol/geom'
import { useEffect } from 'react'
import type { Vegobjekttype } from '../api/datakatalogClient'
import {
  allTypesSelectedAtom,
  DEFAULT_VEGLENKESEKVENSER_LIMIT,
  polygonAtom,
  searchModeAtom,
  stedfestingAtom,
  strekningAtom,
  veglenkesekvensLimitAtom,
} from '../state/atoms'

function polygonToWkt(polygon: Polygon): string {
  const format = new WKT()
  return format.writeGeometry(polygon)
}

export function useUrlSync(selectedTypes: Vegobjekttype[]) {
  const allTypesSelected = useAtomValue(allTypesSelectedAtom)
  const polygon = useAtomValue(polygonAtom)
  const veglenkesekvensLimit = useAtomValue(veglenkesekvensLimitAtom)
  const searchMode = useAtomValue(searchModeAtom)
  const strekning = useAtomValue(strekningAtom)
  const stedfesting = useAtomValue(stedfestingAtom)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (searchMode === 'polygon' && polygon) {
      url.searchParams.set('polygon', polygonToWkt(polygon))
    } else {
      url.searchParams.delete('polygon')
    }
    if (searchMode === 'strekning' && strekning.trim().length > 0) {
      url.searchParams.set('strekning', strekning.trim())
    } else {
      url.searchParams.delete('strekning')
    }
    if (searchMode === 'stedfesting' && stedfesting.trim().length > 0) {
      url.searchParams.set('stedfesting', stedfesting.trim())
    } else {
      url.searchParams.delete('stedfesting')
    }
    if (allTypesSelected) {
      url.searchParams.set('types', 'all')
    } else if (selectedTypes.length > 0) {
      url.searchParams.set('types', selectedTypes.map((t) => t.id).join(','))
    } else {
      url.searchParams.delete('types')
    }
    if (veglenkesekvensLimit !== DEFAULT_VEGLENKESEKVENSER_LIMIT) {
      url.searchParams.set('veglenkesekvenslimit', veglenkesekvensLimit.toString())
    } else {
      url.searchParams.delete('veglenkesekvenslimit')
    }
    window.history.replaceState({}, '', url)
  }, [allTypesSelected, polygon, selectedTypes, searchMode, strekning, stedfesting, veglenkesekvensLimit])
}
