import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

function hexToRgba(hex: string, alpha: number): string {
  const trimmed = hex.trim().replace(/^#/, '')
  const normalized =
    trimmed.length === 3
      ? trimmed
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : trimmed
  if (normalized.length !== 6) return `rgba(52, 152, 219, ${alpha})`
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return `rgba(52, 152, 219, ${alpha})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function createVeglenkeStyle(color: string): Style {
  return new Style({
    stroke: new Stroke({ color, width: 4 }),
  })
}

export function createVeglenkeFadedStyle(color: string): Style {
  return new Style({
    stroke: new Stroke({ color: hexToRgba(color, 0.35), width: 2 }),
  })
}

export function createVeglenkeSelectedStyle(color: string): Style {
  return new Style({
    stroke: new Stroke({ color, width: 6 }),
  })
}

export const HIGHLIGHT_STYLE = new Style({
  stroke: new Stroke({ color: '#f39c12', width: 8 }),
})

export function createStedfestingStyle(color: string): Style {
  return new Style({
    stroke: new Stroke({ color, width: 4 }),
  })
}

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
