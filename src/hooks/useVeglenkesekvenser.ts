import { useQuery } from "@tanstack/react-query";
import { hentVeglenkesekvenser, enrichVeglenkesekvenser } from "../api/uberiketClient";
import { DEFAULT_VEGLENKESEKVENSER_LIMIT } from "../state/atoms";

type VeglenkesekvenserParams = {
  polygonUtm33?: string | null;
  vegsystemreferanse?: string | null;
  veglenkesekvenserIds?: number[];
  limit?: number;
};

export function useVeglenkesekvenser({
  polygonUtm33,
  vegsystemreferanse,
  veglenkesekvenserIds,
  limit = DEFAULT_VEGLENKESEKVENSER_LIMIT,
}: VeglenkesekvenserParams) {
  const trimmedStrekning = vegsystemreferanse?.trim() ?? "";
  const enabled = Boolean(polygonUtm33) || trimmedStrekning.length > 0 || (veglenkesekvenserIds && veglenkesekvenserIds.length > 0);

  return useQuery({
    queryKey: ["veglenkesekvenser", polygonUtm33, trimmedStrekning, veglenkesekvenserIds, limit],
    queryFn: async () => {
      const response = await hentVeglenkesekvenser({
        polygon: polygonUtm33 ?? undefined,
        vegsystemreferanse: trimmedStrekning || undefined,
        ids: veglenkesekvenserIds,
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
