import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

let projectionsReady = false

export function ensureProjections(): void {
  if (projectionsReady) return
  proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
  proj4.defs('EPSG:5973', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs')
  register(proj4)
  projectionsReady = true
}
