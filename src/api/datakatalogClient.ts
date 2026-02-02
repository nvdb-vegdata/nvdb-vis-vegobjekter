import './apiConfig'
import { getKategorier as sdkGetKategorier, getVegobjekttyper as sdkGetVegobjekttyper } from './generated/datakatalog/sdk.gen'
import type {
  Egenskapstype,
  EgenskapstypeFlyttallenum,
  EgenskapstypeHeltallenum,
  EgenskapstypeTekstenum,
  EnumverdiFlyttall,
  EnumverdiHeltall,
  EnumverdiTekst,
  Kategori,
  Vegobjekttype,
} from './generated/datakatalog/types.gen'

export type { Vegobjekttype, Egenskapstype, Kategori }

let cachedTypes: Vegobjekttype[] | null = null
let cachedTypesById: Map<number, Vegobjekttype> | null = null
let cachedKategorier: Kategori[] | null = null

export type EnumVerdi = EnumverdiHeltall | EnumverdiTekst | EnumverdiFlyttall

export type EgenskapstypeMedEnum = EgenskapstypeHeltallenum | EgenskapstypeTekstenum | EgenskapstypeFlyttallenum

export function isSelectableVegobjekttype(type: Vegobjekttype): boolean {
  return !type.sensitiv
}

export async function getVegobjekttyper(): Promise<Vegobjekttype[]> {
  if (cachedTypes) {
    return cachedTypes
  }

  const response = await sdkGetVegobjekttyper({
    query: { inkluder: ['alle'] },
  })

  if (response.error) {
    throw new Error(`Failed to fetch vegobjekttyper: ${response.error}`)
  }

  cachedTypes = response.data ?? []
  cachedTypesById = new Map(cachedTypes.map((t) => [t.id, t]))
  return cachedTypes
}

export async function getKategorier(): Promise<Kategori[]> {
  if (cachedKategorier) {
    return cachedKategorier
  }

  const response = await sdkGetKategorier()

  if (response.error) {
    throw new Error(`Failed to fetch kategorier: ${response.error}`)
  }

  cachedKategorier = response.data ?? []
  return cachedKategorier
}

export function getVegobjekttypeById(id: number): Vegobjekttype | undefined {
  return cachedTypesById?.get(id)
}

export function getEgenskapstypeById(vegobjekttype: Vegobjekttype, egenskapId: number): Egenskapstype | undefined {
  return vegobjekttype.egenskapstyper?.find((e) => e.id === egenskapId)
}

function isEnumEgenskapstype(egenskapstype: Egenskapstype): egenskapstype is EgenskapstypeMedEnum {
  return egenskapstype.egenskapstype === 'Heltallenum' || egenskapstype.egenskapstype === 'Tekstenum' || egenskapstype.egenskapstype === 'Flyttallenum'
}

export function getEnumVerdiById(egenskapstype: Egenskapstype, verdiId: number): EnumVerdi | undefined {
  if (!isEnumEgenskapstype(egenskapstype)) {
    return undefined
  }
  return egenskapstype.tillatte_verdier?.find((v) => v.id === verdiId)
}
