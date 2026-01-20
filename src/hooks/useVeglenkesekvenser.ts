import { useQuery } from "@tanstack/react-query";
import { hentVeglenkesekvenser, enrichVeglenkesekvenser } from "../api/uberiketClient";
import { DEFAULT_VEGLENKESEKVENSER_LIMIT } from "../state/atoms";

type VeglenkesekvenserParams = {
  polygonUtm33?: string | null;
  vegsystemreferanse?: string | null;
  limit?: number;
};

export function useVeglenkesekvenser({
  polygonUtm33,
  vegsystemreferanse,
  limit = DEFAULT_VEGLENKESEKVENSER_LIMIT,
}: VeglenkesekvenserParams) {
  const trimmedStrekning = vegsystemreferanse?.trim() ?? "";
  const enabled = Boolean(polygonUtm33) || trimmedStrekning.length > 0;

  return useQuery({
    queryKey: ["veglenkesekvenser", polygonUtm33, trimmedStrekning, limit],
    queryFn: async () => {
      const response = await hentVeglenkesekvenser({
        polygon: polygonUtm33 ?? undefined,
        vegsystemreferanse: trimmedStrekning || undefined,
        antall: limit,
      });
      return {
        ...response,
        veglenkesekvenser: enrichVeglenkesekvenser(response.veglenkesekvenser),
      };
    },
    enabled,
  });
}
