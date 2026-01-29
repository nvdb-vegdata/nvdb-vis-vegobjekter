import { useInfiniteQuery } from '@tanstack/react-query'
import WKT from 'ol/format/WKT'
import type { LineString, Polygon } from 'ol/geom'
import { useMemo } from 'react'
import type { Vegobjekttype } from '../api/datakatalogClient'
import { buildStedfestingFilter, hentVegobjekter, type VeglenkeRange, type VeglenkesekvensMedPosisjoner, type Vegobjekt } from '../api/uberiketClient'
import { getTodayDate } from '../utils/dateUtils'
import { getLineStringOverlapFractions } from '../utils/geometryUtils'

function getOverlappingVeglenkeRanges(veglenkesekvenser: VeglenkesekvensMedPosisjoner[], polygon: Polygon, polygonClip: boolean): VeglenkeRange[] {
  const ranges: VeglenkeRange[] = []
  const wktFormat = new WKT()
  const today = getTodayDate()
  const polygonExtent = polygon.getExtent()

  for (const vs of veglenkesekvenser) {
    for (const vl of vs.veglenker) {
      const sluttdato = (vl as { gyldighetsperiode?: { sluttdato?: string } }).gyldighetsperiode?.sluttdato
      if (sluttdato && sluttdato < today) {
        continue
      }

      if (!vl.geometri?.wkt) continue

      try {
        const geom = wktFormat.readGeometry(vl.geometri.wkt, {
          dataProjection: `EPSG:${vl.geometri.srid}`,
          featureProjection: 'EPSG:3857',
        })

        if (!geom.intersectsExtent(polygonExtent)) {
          continue
        }

        if (polygonClip && geom.getType() === 'LineString') {
          const span = vl.sluttposisjon - vl.startposisjon
          if (span <= 0) continue
          const coords = (geom as LineString).getCoordinates()
          const overlapFractions = getLineStringOverlapFractions(coords, polygon)
          if (overlapFractions.length === 0) continue

          for (const overlap of overlapFractions) {
            const startposisjon = vl.startposisjon + span * overlap.startFraction
            const sluttposisjon = vl.startposisjon + span * overlap.endFraction
            if (sluttposisjon - startposisjon <= 0) continue
            ranges.push({
              veglenkesekvensId: vs.id,
              startposisjon,
              sluttposisjon,
            })
          }
          continue
        }

        ranges.push({
          veglenkesekvensId: vs.id,
          startposisjon: vl.startposisjon,
          sluttposisjon: vl.sluttposisjon,
        })
      } catch (e) {
        console.warn('Failed to parse veglenke geometry', e)
      }
    }
  }

  return ranges
}

type VegobjekterParams = {
  selectedTypes: Vegobjekttype[]
  allTypesSelected: boolean
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[] | undefined
  polygon: Polygon | null
  polygonClip: boolean
  vegsystemreferanse?: string | null
  stedfestingFilterDirect?: string | null
}

export function useVegobjekter({
  selectedTypes,
  allTypesSelected,
  veglenkesekvenser,
  polygon,
  polygonClip,
  vegsystemreferanse,
  stedfestingFilterDirect,
}: VegobjekterParams) {
  const trimmedStrekning = vegsystemreferanse?.trim() ?? ''
  const directFilter = stedfestingFilterDirect?.trim() ?? ''
  const stedfestingFilter = useMemo(() => {
    if (directFilter.length > 0) return directFilter
    if (!veglenkesekvenser || !polygon || trimmedStrekning.length > 0) return ''
    const ranges = getOverlappingVeglenkeRanges(veglenkesekvenser, polygon, polygonClip)
    return buildStedfestingFilter(ranges)
  }, [directFilter, polygonClip, veglenkesekvenser, polygon, trimmedStrekning])

  const enabled = (allTypesSelected || selectedTypes.length > 0) && (trimmedStrekning.length > 0 || stedfestingFilter.length > 0)
  const today = getTodayDate()
  const typeIds = useMemo(() => selectedTypes.map((type) => type.id).sort((a, b) => a - b), [selectedTypes])
  const typeIdList = useMemo(() => typeIds.join(','), [typeIds])

  const query = useInfiniteQuery({
    queryKey: ['vegobjekter', allTypesSelected ? 'all' : typeIdList, stedfestingFilter, trimmedStrekning, today],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const typeIdsParam = allTypesSelected ? undefined : typeIds
      if (trimmedStrekning.length > 0) {
        return hentVegobjekter({
          typeIds: typeIdsParam,
          vegsystemreferanse: trimmedStrekning,
          dato: today,
          start: pageParam,
        })
      }
      return hentVegobjekter({
        typeIds: typeIdsParam,
        stedfesting: stedfestingFilter,
        dato: today,
        start: pageParam,
      })
    },
    enabled,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.metadata.neste?.start,
  })

  const vegobjekterByType = new Map<number, Vegobjekt[]>(selectedTypes.map((type) => [type.id, [] as Vegobjekt[]]))

  const allVegobjekter = query.data?.pages.flatMap((page) => page.vegobjekter) ?? []

  for (const vegobjekt of allVegobjekter) {
    const list = vegobjekterByType.get(vegobjekt.typeId)
    if (list) {
      list.push(vegobjekt)
    } else {
      vegobjekterByType.set(vegobjekt.typeId, [vegobjekt])
    }
  }

  return {
    vegobjekterByType,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}
