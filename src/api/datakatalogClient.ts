import { Configuration, DatakatalogenApi } from "./generated/datakatalog";
import type { Vegobjekttype } from "./generated/datakatalog/models";

const BASE_URL = "https://nvdbapiles.atlas.vegvesen.no/datakatalog";

const config = new Configuration({
  basePath: BASE_URL,
});

const api = new DatakatalogenApi(config);

export type { Vegobjekttype };

let cachedTypes: Vegobjekttype[] | null = null;

export async function getVegobjekttyper(): Promise<Vegobjekttype[]> {
  if (cachedTypes) {
    return cachedTypes;
  }

  const response = await api.getVegobjekttyper();
  cachedTypes = response.data;
  return cachedTypes;
}

export async function getVegobjekttype(id: number): Promise<Vegobjekttype> {
  const response = await api.getVegobjekttype(id);
  return response.data;
}
