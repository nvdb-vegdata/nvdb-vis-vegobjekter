import { useQueries } from "@tanstack/react-query";
import { hentVegobjekter, getStedfestingFilter, type Vegobjekt } from "../api/uberiketClient";
import type { Vegobjekttype } from "../api/datakatalogClient";
import type { Veglenkesekvens } from "../api/uberiketClient";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useVegobjekter(
  selectedTypes: Vegobjekttype[],
  veglenkesekvenser: Veglenkesekvens[] | undefined
) {
  const stedfestingFilters = veglenkesekvenser?.map((vs) => getStedfestingFilter(vs.id)) ?? [];
  const enabled = selectedTypes.length > 0 && stedfestingFilters.length > 0;
  const today = getTodayDate();

  const queries = useQueries({
    queries: selectedTypes.map((type) => ({
      queryKey: ["vegobjekter", type.id, stedfestingFilters, today],
      queryFn: async () => {
        const result = await hentVegobjekter(type.id, stedfestingFilters, today);
        return {
          typeId: type.id,
          vegobjekter: result.vegobjekter,
        };
      },
      enabled,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const vegobjekterByType = new Map<number, Vegobjekt[]>();
  for (const query of queries) {
    if (query.data) {
      vegobjekterByType.set(query.data.typeId, query.data.vegobjekter);
    }
  }

  return {
    vegobjekterByType,
    isLoading,
    isError,
  };
}
