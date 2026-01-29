import { useQuery } from '@tanstack/react-query'
import { getVegobjekttyper } from '../api/datakatalogClient'

export function useVegobjekttyper() {
  return useQuery({
    queryKey: ['vegobjekttyper'],
    queryFn: getVegobjekttyper,
    staleTime: Infinity,
  })
}
