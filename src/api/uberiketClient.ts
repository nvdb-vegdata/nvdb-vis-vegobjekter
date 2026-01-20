import { client } from "./generated/uberiket/client.gen";
import {
  hentVeglenkesekvenser as sdkHentVeglenkesekvenser,
  hentVegobjekterMultiType as sdkHentVegobjekterMultiType,
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
  Geometristruktur,
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
  GeometriEgenskap,
  Geometristruktur,
};

type VeglenkesekvenserQuery = {
  polygon?: string;
  vegsystemreferanse?: string;
  antall?: number;
};

export async function hentVeglenkesekvenser({
  polygon,
  vegsystemreferanse,
  antall = 10,
}: VeglenkesekvenserQuery): Promise<VeglenkesekvenserSide> {
  const response = await sdkHentVeglenkesekvenser({
    query: {
      antall,
      polygon,
      vegsystemreferanse: vegsystemreferanse ? [vegsystemreferanse] : undefined,
      inkluder: ["alle"],
    },
  });

  if (response.error) {
    throw new Error(`Failed to fetch veglenkesekvenser: ${response.error}`);
  }

  return response.data as VeglenkesekvenserSide;
}

type VegobjekterQuery = {
  typeIds?: number[];
  stedfesting?: string;
  vegsystemreferanse?: string;
  dato?: string;
  antall?: number;
  start?: string;
};

export class VegobjekterRequestError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "VegobjekterRequestError";
    this.status = status;
    this.detail = detail;
  }
}

export function isVegobjekterRequestError(
  error: unknown
): error is VegobjekterRequestError {
  return error instanceof VegobjekterRequestError;
}

export async function hentVegobjekter({
  typeIds,
  stedfesting,
  vegsystemreferanse,
  dato,
  antall = 1000,
  start,
}: VegobjekterQuery): Promise<VegobjekterSide> {
  const response = await sdkHentVegobjekterMultiType({
    query: {
      typeIder: typeIds ? [typeIds.join(",")] as unknown as number[] : undefined,
      antall,
      inkluder: ["alle"],
      dato,
      start,
      stedfesting: stedfesting ? [stedfesting] : undefined,
      vegsystemreferanse: vegsystemreferanse ? [vegsystemreferanse] : undefined,
    },
  });

  if (response.error) {
    const status =
      typeof response.error === "object" && response.error
        ? (response.error as { status?: number }).status
        : undefined;
    const detail =
      typeof response.error === "object" && response.error
        ? (response.error as { detail?: string }).detail
        : undefined;
    throw new VegobjekterRequestError(
      `Failed to fetch vegobjekter: ${response.error}`,
      status,
      detail
    );
  }

  return response.data as VegobjekterSide;
}

export function getStedfestingFilter(veglenkesekvensIds: number[]): string {
  return veglenkesekvensIds.join(",");
}

export interface VeglenkeRange {
  veglenkesekvensId: number;
  startposisjon: number;
  sluttposisjon: number;
}

export interface VeglenkeMedPosisjon extends Veglenke {
  startposisjon: number;
  sluttposisjon: number;
}

export interface VeglenkesekvensMedPosisjoner extends Omit<Veglenkesekvens, 'veglenker'> {
  veglenker: VeglenkeMedPosisjon[];
}

export function enrichVeglenkesekvens(vs: Veglenkesekvens): VeglenkesekvensMedPosisjoner {
  const porter = vs.porter ?? [];
  const veglenker: VeglenkeMedPosisjon[] = (vs.veglenker ?? []).map(vl => {
    const startPort = porter.find(p => p.nummer === vl.startport);
    const endPort = porter.find(p => p.nummer === vl.sluttport);
    const startPos = startPort?.posisjon ?? 0;
    const endPos = endPort?.posisjon ?? 1;
    return {
      ...vl,
      startposisjon: Math.min(startPos, endPos),
      sluttposisjon: Math.max(startPos, endPos),
    };
  });
  return { ...vs, veglenker };
}

export function enrichVeglenkesekvenser(vss: Veglenkesekvens[]): VeglenkesekvensMedPosisjoner[] {
  return vss.map(enrichVeglenkesekvens);
}

export function getVeglenkePositionRange(
  veglenkesekvens: Veglenkesekvens,
  veglenke: Veglenke
): { start: number; end: number } | null {
  const porter = veglenkesekvens.porter;
  if (!porter) return null;

  const startPort = porter.find((p) => p.nummer === veglenke.startport);
  const endPort = porter.find((p) => p.nummer === veglenke.sluttport);

  if (!startPort || !endPort) return null;

  const start = Math.min(startPort.posisjon, endPort.posisjon);
  const end = Math.max(startPort.posisjon, endPort.posisjon);

  return { start, end };
}

export function buildStedfestingFilter(ranges: VeglenkeRange[]): string {
  const grouped = new Map<number, VeglenkeRange[]>()

  for (const range of ranges) {
    const existing = grouped.get(range.veglenkesekvensId)
    if (existing) {
      existing.push(range)
    } else {
      grouped.set(range.veglenkesekvensId, [range])
    }
  }

  const merged: VeglenkeRange[] = []

  for (const [veglenkesekvensId, items] of grouped.entries()) {
    const sorted = items
      .slice()
      .sort((a, b) => a.startposisjon - b.startposisjon)

    let current = sorted[0]
    if (!current) continue

    let currentStart = Math.min(current.startposisjon, current.sluttposisjon)
    let currentEnd = Math.max(current.startposisjon, current.sluttposisjon)

    for (let i = 1; i < sorted.length; i += 1) {
      const next = sorted[i]!
      const nextStart = Math.min(next.startposisjon, next.sluttposisjon)
      const nextEnd = Math.max(next.startposisjon, next.sluttposisjon)

      if (currentEnd === nextStart) {
        currentEnd = nextEnd
        continue
      }

      merged.push({
        veglenkesekvensId,
        startposisjon: currentStart,
        sluttposisjon: currentEnd,
      })
      currentStart = nextStart
      currentEnd = nextEnd
    }

    merged.push({
      veglenkesekvensId,
      startposisjon: currentStart,
      sluttposisjon: currentEnd,
    })
  }

  return merged
    .map((range) =>
      `${range.startposisjon}-${range.sluttposisjon}@${range.veglenkesekvensId}`,
    )
    .join(',')
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

export function getGeometriEgenskaper(vegobjekt: Vegobjekt): Geometristruktur[] {
  const egenskaper = vegobjekt.egenskaper;
  if (!egenskaper) return [];

  const result: Geometristruktur[] = [];
  for (const egenskap of Object.values(egenskaper)) {
    if (egenskap.type === "GeometriEgenskap") {
      result.push((egenskap as GeometriEgenskap).verdi);
    }
  }
  return result;
}
