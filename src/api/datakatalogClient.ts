import { client } from "./generated/datakatalog/client.gen";
import { getVegobjekttyper as sdkGetVegobjekttyper } from "./generated/datakatalog/sdk.gen";
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
let cachedTypesById: Map<number, Vegobjekttype> | null = null;

export type EnumVerdi = EnumverdiHeltall | EnumverdiTekst | EnumverdiFlyttall;

export type EgenskapstypeMedEnum =
  | EgenskapstypeHeltallenum
  | EgenskapstypeTekstenum
  | EgenskapstypeFlyttallenum;

export async function getVegobjekttyper(): Promise<Vegobjekttype[]> {
  if (cachedTypes) {
    return cachedTypes;
  }

  const response = await sdkGetVegobjekttyper({
    query: { inkluder: ["alle"] },
  });

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekttyper: ${response.error}`);
  }

  cachedTypes = response.data ?? [];
  cachedTypesById = new Map(cachedTypes.map((t) => [t.id, t]));
  return cachedTypes;
}

export function getVegobjekttypeById(id: number): Vegobjekttype | undefined {
  return cachedTypesById?.get(id);
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
