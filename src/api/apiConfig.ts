import { client as datakatalogClient } from './generated/datakatalog/client.gen'
import { client as uberiketClient } from './generated/uberiket/client.gen'

const TIMEOUT_MS = 20_000

const fetchWithTimeout = ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })) as typeof fetch

const commonConfig = {
  headers: { 'X-Client': 'nvdb-vis-vegobjekter' },
  fetch: fetchWithTimeout,
  querySerializer: { array: { explode: false, style: 'form' as const } },
}

datakatalogClient.setConfig({
  ...commonConfig,
  baseUrl: 'https://nvdbapiles.atlas.vegvesen.no/datakatalog',
})

uberiketClient.setConfig({
  ...commonConfig,
  baseUrl: 'https://nvdbapiles.atlas.vegvesen.no/uberiket',
})
