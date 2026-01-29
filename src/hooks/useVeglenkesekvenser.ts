import { useQuery } from "@tanstack/react-query";
import { hentVeglenkesekvenser, enrichVeglenkesekvenser } from "../api/uberiketClient";
import { DEFAULT_VEGLENKESEKVENSER_LIMIT } from "../state/atoms";

type VeglenkesekvenserParams = {
  polygonUtm33?: string | null;
  vegsystemreferanse?: string | null;
  veglenkesekvensIds?: number[] | null;
  limit?: number;
};

export function useVeglenkesekvenser({
  polygonUtm33,
  vegsystemreferanse,
  veglenkesekvensIds,
  limit = DEFAULT_VEGLENKESEKVENSER_LIMIT,
}: VeglenkesekvenserParams) {
  const trimmedStrekning = vegsystemreferanse?.trim() ?? "";
  const normalizedIds = veglenkesekvensIds?.length
    ? [...veglenkesekvensIds].sort((a, b) => a - b)
    : null;
  const enabled =
    Boolean(polygonUtm33) || trimmedStrekning.length > 0 || Boolean(normalizedIds?.length);

  return useQuery({
    queryKey: [
      "veglenkesekvenser",
      polygonUtm33,
      trimmedStrekning,
      limit,
      normalizedIds?.join(",") ?? null,
    ],
    queryFn: async () => {
      const response = await hentVeglenkesekvenser({
        polygon: polygonUtm33 ?? undefined,
        vegsystemreferanse: trimmedStrekning || undefined,
        antall: limit,
        ider: normalizedIds ?? undefined,
      });
      return {
        ...response,
        veglenkesekvenser: enrichVeglenkesekvenser(response.veglenkesekvenser),
      };
    },
    enabled,
  });
}
