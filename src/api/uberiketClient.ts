import { Configuration, VegnettApi, VegobjekterApi } from "./generated/uberiket";
import {
  InkluderIVeglenkesekvenser,
  InkluderIVegobjekt,
  type Veglenkesekvens,
  type Veglenke,
  type VeglenkesekvenserSide,
  type Vegobjekt,
  type VegobjekterSide,
  type StedfestingLinje,
  type StedfestingPunkt,
} from "./generated/uberiket/models";

const BASE_URL = "https://nvdbapiles.atlas.vegvesen.no/uberiket";

const config = new Configuration({
  basePath: BASE_URL,
});

const vegnettApi = new VegnettApi(config);
const vegobjekterApi = new VegobjekterApi(config);

export type { Veglenkesekvens, Veglenke, Vegobjekt, StedfestingLinje, StedfestingPunkt };

export interface StedfestingLinjer {
  type: "StedfestingLinjer";
  linjer: StedfestingLinje[];
}

export interface StedfestingPunkter {
  type: "StedfestingPunkter";
  punkter: StedfestingPunkt[];
}

export interface StedfestingSving {
  type: "StedfestingSving";
  id: number;
  startpunkt: StedfestingPunkt;
  sluttpunkt: StedfestingPunkt;
}

export interface StedfestingMangler {
  type: "StedfestingMangler";
}

export type VegobjektStedfesting =
  | StedfestingLinjer
  | StedfestingPunkter
  | StedfestingSving
  | StedfestingMangler;

export interface VegobjektMedStedfesting extends Omit<Vegobjekt, "stedfesting"> {
  stedfesting?: VegobjektStedfesting;
}

export async function hentVeglenkesekvenser(
  polygon: string,
  antall = 10
): Promise<VeglenkesekvenserSide> {
  const response = await vegnettApi.hentVeglenkesekvenser(
    antall,
    undefined,
    undefined,
    undefined,
    polygon,
    new Set([InkluderIVeglenkesekvenser.Alle])
  );
  return response.data;
}

export async function hentVegobjekter(
  typeId: number,
  stedfesting: string[],
  antall = 1000
): Promise<VegobjekterSide> {
  const response = await vegobjekterApi.hentVegobjekter(
    typeId,
    antall,
    undefined,
    new Set([InkluderIVegobjekt.Stedfesting]),
    undefined,
    undefined,
    stedfesting
  );
  return response.data;
}

export function getStedfestingFilter(veglenkesekvensId: number): string {
  return `0-1@${veglenkesekvensId}`;
}

export function getVegobjektPositions(
  stedfesting: VegobjektStedfesting | undefined,
  veglenkesekvensId: number
): { start: number; slutt: number }[] {
  if (!stedfesting) return [];

  switch (stedfesting.type) {
    case "StedfestingLinjer":
      return stedfesting.linjer
        .filter((l) => l.id === veglenkesekvensId)
        .map((l) => ({ start: l.startposisjon, slutt: l.sluttposisjon }));

    case "StedfestingPunkter":
      return stedfesting.punkter
        .filter((p) => p.id === veglenkesekvensId)
        .map((p) => ({ start: p.posisjon, slutt: p.posisjon }));

    case "StedfestingSving":
      if (stedfesting.startpunkt.id === veglenkesekvensId) {
        return [{ start: stedfesting.startpunkt.posisjon, slutt: stedfesting.startpunkt.posisjon }];
      }
      if (stedfesting.sluttpunkt.id === veglenkesekvensId) {
        return [{ start: stedfesting.sluttpunkt.posisjon, slutt: stedfesting.sluttpunkt.posisjon }];
      }
      return [];

    default:
      return [];
  }
}

export function isOnVeglenke(
  stedfesting: VegobjektStedfesting | undefined,
  veglenkesekvensId: number,
  veglenkeStart: number,
  veglenkeEnd: number
): boolean {
  const positions = getVegobjektPositions(stedfesting, veglenkesekvensId);
  return positions.some(
    (pos) => pos.slutt >= veglenkeStart && pos.start <= veglenkeEnd
  );
}
