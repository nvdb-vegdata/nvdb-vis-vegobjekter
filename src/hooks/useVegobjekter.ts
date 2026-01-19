import { useQuery } from "@tanstack/react-query";
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
  const typeIds = useMemo(
    () => selectedTypes.map((type) => type.id).sort((a, b) => a - b),
    [selectedTypes]
  );
  const typeIdList = useMemo(() => typeIds.join(","), [typeIds]);

  const query = useQuery({
    queryKey: ["vegobjekter", typeIdList, stedfestingFilter, today],
    queryFn: async () => hentVegobjekter(typeIds, stedfestingFilter, today),
    enabled,
  });

  const vegobjekterByType = new Map<number, Vegobjekt[]>(
    selectedTypes.map((type) => [type.id, [] as Vegobjekt[]])
  );

  for (const vegobjekt of query.data?.vegobjekter ?? []) {
    const list = vegobjekterByType.get(vegobjekt.typeId);
    if (list) {
      list.push(vegobjekt);
    } else {
      vegobjekterByType.set(vegobjekt.typeId, [vegobjekt]);
    }
  }

  return {
    vegobjekterByType,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
