export const MAP_PROJECTION = 'EPSG:25833'

export const MAP_EXTENT = [-2500000, 3500000, 3045984, 9045984] as const
export const TILE_ORIGIN = [-2500000, 9045984] as const

// Kartverket WMTS (utm33n) uses OGC WMTS scale denominator (0.28mm pixel size)
// and supports TileMatrix 00..18.
export const KARTVERKET_WMTS_RESOLUTIONS = [
  21664, 10832, 5416, 2708, 1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.578125, 5.2890625, 2.64453125, 1.322265625, 0.6611328125, 0.33056640625,
  0.165283203125, 0.0826416015625,
]

export const KARTVERKET_WMTS_MATRIX_IDS = KARTVERKET_WMTS_RESOLUTIONS.map((_, index) => index.toString())

// ArcGIS cached tiles (services.geodataonline.no) uses dpi=96 which gives slightly
// different resolutions than WMTS. If we reuse the WMTS pyramid, tiles will drift
// further away from the origin the farther you pan.
export const GEODATA_XYZ_RESOLUTIONS = [
  21674.7100160867, 10837.35500804335, 5418.677504021675, 2709.3387520108377, 1354.6693760054188, 677.3346880027094, 338.6673440013547, 169.33367200067735,
  84.66683600033868, 42.33341800016934, 21.16670900008467, 10.583354500042335, 5.291677250021167, 2.6458386250105836, 1.3229193125052918, 0.6614596562526459,
  0.33072982812632296,
]

export const GEODATA_XYZ_URL = 'https://services.geodataonline.no/arcgis/rest/services/Trafikkportalen/GeocacheTrafikkJPG/MapServer/tile/{z}/{y}/{x}'
export const KARTVERKET_WMTS_URL = 'https://cache.kartverket.no/v1/service?'
export const KARTVERKET_LAYER = 'topo'
export const KARTVERKET_MATRIX_SET = 'utm33n'

export const DEFAULT_VIEW_CENTER_LON_LAT = [10, 64] as const
export const DEFAULT_VIEW_ZOOM = 4
