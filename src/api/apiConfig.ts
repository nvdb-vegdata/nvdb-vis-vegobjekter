import { client as datakatalogClient } from './generated/datakatalog/client.gen'
import { client as uberiketClient } from './generated/uberiket/client.gen'

const HEADERS = {
  'X-Client': 'nvdb-vis-vegobjekter',
}

datakatalogClient.setConfig({
  baseUrl: 'https://nvdbapiles.atlas.vegvesen.no/datakatalog',
  headers: HEADERS,
  querySerializer: {
    array: {
      explode: false,
      style: 'form',
    },
  },
})

uberiketClient.setConfig({
  baseUrl: 'https://nvdbapiles.atlas.vegvesen.no/uberiket',
  headers: HEADERS,
  querySerializer: {
    array: {
      explode: false,
      style: 'form',
    },
  },
})
