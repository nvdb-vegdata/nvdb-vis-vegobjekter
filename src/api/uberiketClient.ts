import { client } from "./generated/uberiket/client.gen";
import {
  hentVeglenkesekvenser as sdkHentVeglenkesekvenser,
  hentVegobjekter as sdkHentVegobjekter,
} from "./generated/uberiket/sdk.gen";
import type {
  Veglenkesekvens,
  Veglenke,
  VeglenkesekvenserSide,
  Vegobjekt,
  VegobjekterSide,
  StedfestingLinje,
  StedfestingPunkt,
  StedfestingLinjer,
  StedfestingPunkter,
  StedfestingSving,
  StedfestingMangler,
  EgenskapVerdi,
  EnumEgenskap,
  TekstEgenskap,
  HeltallEgenskap,
  FlyttallEgenskap,
  BoolskEgenskap,
  DatoEgenskap,
  GeometriEgenskap,
} from "./generated/uberiket/types.gen";

const BASE_URL = "https://nvdbapiles.atlas.vegvesen.no/uberiket";

client.setConfig({
  baseUrl: BASE_URL,
  headers: {
    "X-Client": "nvdb-vis-vegobjekter",
  },
});

export type Stedfesting =
  | StedfestingLinjer
  | StedfestingPunkter
  | StedfestingSving
  | StedfestingMangler;

export type {
  Veglenkesekvens,
  Veglenke,
  Vegobjekt,
  VegobjekterSide,
  VeglenkesekvenserSide,
  StedfestingLinje,
  StedfestingPunkt,
  StedfestingLinjer,
  StedfestingPunkter,
  StedfestingSving,
  StedfestingMangler,
  EgenskapVerdi,
  EnumEgenskap,
};

export async function hentVeglenkesekvenser(
  polygon: string,
  antall = 10
): Promise<VeglenkesekvenserSide> {
  const response = await sdkHentVeglenkesekvenser({
    query: {
      antall,
      polygon,
      inkluder: ["alle"],
    },
  });

  if (response.error) {
    throw new Error(`Failed to fetch veglenkesekvenser: ${response.error}`);
  }

  return response.data as VeglenkesekvenserSide;
}

export async function hentVegobjekter(
  typeId: number,
  stedfesting: string[],
  dato?: string,
  antall = 1000
): Promise<VegobjekterSide> {
  const response = await sdkHentVegobjekter({
    path: { typeId },
    query: {
      antall,
      inkluder: ["alle"],
      dato,
      stedfesting,
    },
  });

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekter: ${response.error}`);
  }

  return response.data as VegobjekterSide;
}

export function getStedfestingFilter(veglenkesekvensId: number): string {
  return `0-1@${veglenkesekvensId}`;
}

export function getVegobjektPositions(
  stedfesting: Stedfesting | undefined,
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
        return [
          {
            start: stedfesting.startpunkt.posisjon,
            slutt: stedfesting.startpunkt.posisjon,
          },
        ];
      }
      if (stedfesting.sluttpunkt.id === veglenkesekvensId) {
        return [
          {
            start: stedfesting.sluttpunkt.posisjon,
            slutt: stedfesting.sluttpunkt.posisjon,
          },
        ];
      }
      return [];

    default:
      return [];
  }
}

export function isOnVeglenke(
  stedfesting: Stedfesting | undefined,
  veglenkesekvensId: number,
  veglenkeStart: number,
  veglenkeEnd: number
): boolean {
  const positions = getVegobjektPositions(stedfesting, veglenkesekvensId);
  return positions.some(
    (pos) => pos.slutt >= veglenkeStart && pos.start <= veglenkeEnd
  );
}

export function formatStedfesting(
  stedfesting: Stedfesting | undefined
): string[] {
  if (!stedfesting) return [];

  switch (stedfesting.type) {
    case "StedfestingLinjer":
      return stedfesting.linjer.map(
        (l) =>
          `${l.startposisjon.toFixed(3)}-${l.sluttposisjon.toFixed(3)}@${l.id}`
      );

    case "StedfestingPunkter":
      return stedfesting.punkter.map((p) => `${p.posisjon.toFixed(3)}@${p.id}`);

    case "StedfestingSving":
      return [
        `Sving: ${stedfesting.startpunkt.posisjon.toFixed(3)}@${stedfesting.startpunkt.id} -> ${stedfesting.sluttpunkt.posisjon.toFixed(3)}@${stedfesting.sluttpunkt.id}`,
      ];

    default:
      return ["Mangler stedfesting"];
  }
}

export function getEgenskapDisplayValue(egenskap: EgenskapVerdi): string {
  switch (egenskap.type) {
    case "TekstEgenskap":
      return (egenskap as TekstEgenskap).verdi;
    case "HeltallEgenskap":
      return String((egenskap as HeltallEgenskap).verdi);
    case "FlyttallEgenskap":
      return String((egenskap as FlyttallEgenskap).verdi);
    case "BoolskEgenskap":
      return (egenskap as BoolskEgenskap).verdi ? "Ja" : "Nei";
    case "DatoEgenskap":
      return (egenskap as DatoEgenskap).verdi;
    case "EnumEgenskap":
      return `enum:${(egenskap as EnumEgenskap).verdi}`;
    case "GeometriEgenskap":
      return "[Geometri]";
    default:
      return "[Ukjent type]";
  }
}
