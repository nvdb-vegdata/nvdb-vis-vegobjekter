import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import WKT from "ol/format/WKT";
import type { Polygon } from "ol/geom";
import {
  hentVegobjekter,
  buildStedfestingFilter,
  getVeglenkePositionRange,
  type Vegobjekt,
  type VeglenkeRange,
} from "../api/uberiketClient";
import type { Vegobjekttype } from "../api/datakatalogClient";
import type { Veglenkesekvens } from "../api/uberiketClient";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOverlappingVeglenkeRanges(
  veglenkesekvenser: Veglenkesekvens[],
  polygon: Polygon
): VeglenkeRange[] {
  const ranges: VeglenkeRange[] = [];
  const wktFormat = new WKT();
  const today = new Date().toISOString().split("T")[0]!;
  const polygonExtent = polygon.getExtent();

  for (const vs of veglenkesekvenser) {
    for (const vl of vs.veglenker ?? []) {
      const sluttdato = (vl as { gyldighetsperiode?: { sluttdato?: string } }).gyldighetsperiode?.sluttdato;
      if (sluttdato && sluttdato < today) {
        continue;
      }

      if (!vl.geometri?.wkt) continue;

      try {
        const geom = wktFormat.readGeometry(vl.geometri.wkt, {
          dataProjection: `EPSG:${vl.geometri.srid}`,
          featureProjection: "EPSG:3857",
        });

        if (!geom.intersectsExtent(polygonExtent)) {
          continue;
        }

        const posRange = getVeglenkePositionRange(vs, vl);
        if (posRange) {
          ranges.push({
            veglenkesekvensId: vs.id,
            startposisjon: posRange.start,
            sluttposisjon: posRange.end,
          });
        }
      } catch (e) {
        console.warn("Failed to parse veglenke geometry", e);
      }
    }
  }

  return ranges;
}

export function useVegobjekter(
  selectedTypes: Vegobjekttype[],
  veglenkesekvenser: Veglenkesekvens[] | undefined,
  polygon: Polygon | null
) {
  const stedfestingFilter = useMemo(() => {
    if (!veglenkesekvenser || !polygon) return "";
    const ranges = getOverlappingVeglenkeRanges(veglenkesekvenser, polygon);
    return buildStedfestingFilter(ranges);
  }, [veglenkesekvenser, polygon]);

  const enabled = selectedTypes.length > 0 && stedfestingFilter.length > 0;
  const today = getTodayDate();

  const queries = useQueries({
    queries: selectedTypes.map((type) => ({
      queryKey: ["vegobjekter", type.id, stedfestingFilter, today],
      queryFn: async () => {
        const result = await hentVegobjekter(type.id, stedfestingFilter, today);
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
