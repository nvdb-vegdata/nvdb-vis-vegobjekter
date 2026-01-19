import { client } from "./generated/datakatalog/client.gen";
import {
  getVegobjekttyper as sdkGetVegobjekttyper,
  getVegobjekttype as sdkGetVegobjekttype,
} from "./generated/datakatalog/sdk.gen";
import { zVegobjekttype } from "./generated/datakatalog/zod.gen";
import type {
  Vegobjekttype,
  Egenskapstype,
  EgenskapstypeHeltallenum,
  EgenskapstypeTekstenum,
  EgenskapstypeFlyttallenum,
  EnumverdiHeltall,
  EnumverdiTekst,
  EnumverdiFlyttall,
} from "./generated/datakatalog/types.gen";

const BASE_URL = "https://nvdbapiles.atlas.vegvesen.no/datakatalog";

client.setConfig({
  baseUrl: BASE_URL,
  headers: {
    "X-Client": "nvdb-vis-vegobjekter",
  },
});

export type { Vegobjekttype, Egenskapstype };

let cachedTypes: Vegobjekttype[] | null = null;
const cachedTypesWithEgenskapstyper = new Map<number, Vegobjekttype>();

export type EnumVerdi = EnumverdiHeltall | EnumverdiTekst | EnumverdiFlyttall;

export type EgenskapstypeMedEnum =
  | EgenskapstypeHeltallenum
  | EgenskapstypeTekstenum
  | EgenskapstypeFlyttallenum;

export async function getVegobjekttyper(): Promise<Vegobjekttype[]> {
  if (cachedTypes) {
    return cachedTypes;
  }

  const response = await sdkGetVegobjekttyper();

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekttyper: ${response.error}`);
  }

  cachedTypes = response.data ?? [];
  return cachedTypes;
}

export async function getVegobjekttype(id: number): Promise<Vegobjekttype> {
  const response = await sdkGetVegobjekttype({
    path: { vegobjekttypeid: id },
  });

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekttype: ${response.error}`);
  }

  return zVegobjekttype.parse(response.data);
}

export async function getVegobjekttypeMedEgenskapstyper(
  id: number
): Promise<Vegobjekttype> {
  const cached = cachedTypesWithEgenskapstyper.get(id);
  if (cached) {
    return cached;
  }

  const response = await sdkGetVegobjekttype({
    path: { vegobjekttypeid: id },
    query: { inkluder: ["egenskapstyper"] },
  });

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekttype: ${response.error}`);
  }

  const result = zVegobjekttype.parse(response.data);
  cachedTypesWithEgenskapstyper.set(id, result);
  return result;
}

export function getEgenskapstypeById(
  vegobjekttype: Vegobjekttype,
  egenskapId: number
): Egenskapstype | undefined {
  return vegobjekttype.egenskapstyper?.find((e) => e.id === egenskapId);
}

function isEnumEgenskapstype(
  egenskapstype: Egenskapstype
): egenskapstype is EgenskapstypeMedEnum {
  return (
    egenskapstype.egenskapstype === "Heltallenum" ||
    egenskapstype.egenskapstype === "Tekstenum" ||
    egenskapstype.egenskapstype === "Flyttallenum"
  );
}

export function getEnumVerdiById(
  egenskapstype: Egenskapstype,
  verdiId: number
): EnumVerdi | undefined {
  if (!isEnumEgenskapstype(egenskapstype)) {
    return undefined;
  }
  return egenskapstype.tillatte_verdier?.find((v) => v.id === verdiId);
}
