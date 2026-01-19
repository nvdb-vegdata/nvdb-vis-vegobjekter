import { useQuery } from "@tanstack/react-query";
import { hentVeglenkesekvenser } from "../api/uberiketClient";

export function useVeglenkesekvenser(polygonUtm33: string | null) {
  return useQuery({
    queryKey: ["veglenkesekvenser", polygonUtm33],
    queryFn: () => hentVeglenkesekvenser(polygonUtm33!, 10),
    enabled: !!polygonUtm33,
  });
}
