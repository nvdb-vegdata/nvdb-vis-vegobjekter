import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

export const VEGLENKE_STYLE = new Style({
  stroke: new Stroke({ color: '#3498db', width: 4 }),
})

export const VEGLENKE_FADED_STYLE = new Style({
  stroke: new Stroke({ color: 'rgba(52, 152, 219, 0.35)', width: 2 }),
})

export const VEGLENKE_SELECTED_STYLE = new Style({
  stroke: new Stroke({ color: '#e74c3c', width: 6 }),
})

export const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({ color: '#f39c12', width: 8 }),
})

export const STEDFESTING_STYLE = new Style({
  stroke: new Stroke({ color: '#3498db', width: 4 }),
})

export const STEDFESTING_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: 'rgba(52, 152, 219, 0.9)' }),
    stroke: new Stroke({ color: '#2e86c1', width: 2 }),
  }),
})

export const HIGHLIGHT_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: 'rgba(243, 156, 18, 0.8)' }),
    stroke: new Stroke({ color: '#e67e22', width: 3 }),
  }),
})

export const EGENGEOMETRI_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: 'rgba(155, 89, 182, 0.8)' }),
    stroke: new Stroke({ color: '#8e44ad', width: 2 }),
  }),
})

export const EGENGEOMETRI_LINE_STYLE = new Style({
  stroke: new Stroke({
    color: '#9b59b6',
    width: 4,
    lineDash: [8, 4],
  }),
})

export const EGENGEOMETRI_POLYGON_STYLE = new Style({
  fill: new Fill({ color: 'rgba(155, 89, 182, 0.3)' }),
  stroke: new Stroke({ color: '#8e44ad', width: 2 }),
})
