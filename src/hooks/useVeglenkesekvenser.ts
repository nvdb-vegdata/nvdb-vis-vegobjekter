import { useQuery } from "@tanstack/react-query";
import { hentVeglenkesekvenser, enrichVeglenkesekvenser } from "../api/uberiketClient";
import { DEFAULT_VEGLENKESEKVENSER_LIMIT } from "../state/atoms";

export function useVeglenkesekvenser(
  polygonUtm33: string | null,
  limit: number = DEFAULT_VEGLENKESEKVENSER_LIMIT
) {
  return useQuery({
    queryKey: ["veglenkesekvenser", polygonUtm33, limit],
    queryFn: async () => {
      const response = await hentVeglenkesekvenser(polygonUtm33!, limit);
      return {
        ...response,
        veglenkesekvenser: enrichVeglenkesekvenser(response.veglenkesekvenser),
      };
    },
    enabled: !!polygonUtm33,
  });
}
