import { useInfiniteQuery } from '@tanstack/react-query'
import WKT from 'ol/format/WKT'
import type { LineString, Polygon } from 'ol/geom'
import { useCallback, useMemo, useState } from 'react'
import type { Vegobjekttype } from '../api/datakatalogClient'
import { hentVegobjekterMultiType } from '../api/generated/uberiket/sdk.gen'
import type { InkluderIVegobjekt } from '../api/generated/uberiket/types.gen'
import { buildStedfestingFilter, type VeglenkeRange, type VeglenkesekvensMedPosisjoner, type Vegobjekt, VegobjekterRequestError } from '../api/uberiketClient'
import { getTodayDate, isDateWithinGyldighetsperiode } from '../utils/dateUtils'
import { getLineStringOverlapFractions } from '../utils/geometryUtils'

function getOverlappingVeglenkeRanges(
  veglenkesekvenser: VeglenkesekvensMedPosisjoner[],
  polygon: Polygon,
  polygonClip: boolean,
  referenceDate: string,
): VeglenkeRange[] {
  const ranges: VeglenkeRange[] = []
  const wktFormat = new WKT()
  const polygonExtent = polygon.getExtent()

  for (const vs of veglenkesekvenser) {
    for (const vl of vs.veglenker) {
      if (!isDateWithinGyldighetsperiode(referenceDate, vl.gyldighetsperiode)) {
        continue
      }

      if (!vl.geometri?.wkt) continue

      try {
        const geom = wktFormat.readGeometry(vl.geometri.wkt, {
          dataProjection: `EPSG:${vl.geometri.srid}`,
          featureProjection: 'EPSG:25833',
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
  searchDate?: string | null
}

export function useVegobjekter({
  selectedTypes,
  allTypesSelected,
  veglenkesekvenser,
  polygon,
  polygonClip,
  vegsystemreferanse,
  stedfestingFilterDirect,
  searchDate,
}: VegobjekterParams) {
  const trimmedStrekning = vegsystemreferanse?.trim() ?? ''
  const trimmedSearchDate = searchDate?.trim() ?? ''
  const today = getTodayDate()
  const referenceDate = trimmedSearchDate.length > 0 ? trimmedSearchDate : today
  const directFilter = stedfestingFilterDirect?.trim() ?? ''
  const stedfestingFilter = useMemo(() => {
    if (directFilter.length > 0) return directFilter
    if (!veglenkesekvenser || !polygon || trimmedStrekning.length > 0) return ''
    const ranges = getOverlappingVeglenkeRanges(veglenkesekvenser, polygon, polygonClip, referenceDate)
    return buildStedfestingFilter(ranges)
  }, [directFilter, polygonClip, referenceDate, veglenkesekvenser, polygon, trimmedStrekning])

  const enabled = (allTypesSelected || selectedTypes.length > 0) && (trimmedStrekning.length > 0 || stedfestingFilter.length > 0)
  const typeIds = useMemo(() => selectedTypes.map((type) => type.id).sort((a, b) => a - b), [selectedTypes])
  const typeIdList = useMemo(() => typeIds.join(','), [typeIds])

  const queryParams = useMemo(
    () => ({
      typeIder: allTypesSelected ? undefined : typeIds,
      antall: 1000,
      inkluder: ['alle'] as InkluderIVegobjekt[],
      dato: trimmedSearchDate.length > 0 ? trimmedSearchDate : undefined,
      vegsystemreferanse: trimmedStrekning.length > 0 ? [trimmedStrekning] : undefined,
      stedfesting: trimmedStrekning.length > 0 ? undefined : [stedfestingFilter],
    }),
    [allTypesSelected, stedfestingFilter, trimmedSearchDate, trimmedStrekning, typeIds],
  )

  const query = useInfiniteQuery({
    queryFn: async ({ pageParam, signal }) => {
      try {
        let start: string | undefined
        if (typeof pageParam === 'string') {
          start = pageParam || undefined
        } else if (pageParam && typeof pageParam === 'object') {
          start = (pageParam as { query?: { start?: string } }).query?.start
        }
        const { data } = await hentVegobjekterMultiType({
          query: {
            ...queryParams,
            start,
          },
          signal,
          throwOnError: true,
        })
        return data
      } catch (error) {
        const e = error as { status?: number; detail?: string; title?: string } | undefined
        const status = typeof e?.status === 'number' ? e.status : undefined
        const detail = typeof e?.detail === 'string' ? e.detail : undefined

        if (status || detail) {
          throw new VegobjekterRequestError(`Failed to fetch vegobjekter: ${e?.title ?? 'request failed'}`, status, detail)
        }

        const message = error instanceof Error ? error.message : String(error)
        throw new Error(message)
      }
    },
    queryKey: ['vegobjekter', allTypesSelected ? 'all' : typeIdList, stedfestingFilter, trimmedStrekning, trimmedSearchDate || `today:${today}`],
    enabled,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.metadata.neste?.start,
  })

  const [isFetchingBatch, setIsFetchingBatch] = useState(false)

  const fetchNextBatch = useCallback(async () => {
    if (isFetchingBatch || !query.hasNextPage) return
    setIsFetchingBatch(true)

    try {
      let loaded = 0
      let pages = query.data?.pages ?? []
      let hasNext: boolean = query.hasNextPage === true

      while (hasNext && loaded < 10000) {
        const previousPageCount = pages.length
        const result = await query.fetchNextPage()
        pages = result.data?.pages ?? pages
        const newPages = pages.slice(previousPageCount)
        loaded += newPages.reduce((sum, page) => sum + (page.vegobjekter?.length ?? 0), 0)
        hasNext = result.hasNextPage === true

        if (newPages.length === 0) break
      }
    } finally {
      setIsFetchingBatch(false)
    }
  }, [isFetchingBatch, query.data, query.fetchNextPage, query.hasNextPage])

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

  const error = useMemo(() => {
    if (!query.error) return null
    if (query.error instanceof Error) return query.error
    const e = query.error as { detail?: string; title?: string; status?: number } | undefined
    const message = e?.detail ?? e?.title ?? 'Kunne ikke hente vegobjekter. Prv igjen senere.'
    return new Error(message)
  }, [query.error])

  return {
    vegobjekterByType,
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: fetchNextBatch,
    isFetchingNextPage: isFetchingBatch,
  }
}
