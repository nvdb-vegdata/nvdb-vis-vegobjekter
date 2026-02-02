import { SVVButton, SVVButtonIcon } from '@komponentkassen/svv-button'
import { useAtom } from 'jotai'
import WKT from 'ol/format/WKT'
import { Polygon } from 'ol/geom'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { polygonAtom, polygonClipAtom, polygonWktInputAtom, stedfestingAtom, stedfestingInputAtom, strekningAtom, strekningInputAtom } from '../../state/atoms'
import { roundPolygonToTwoDecimals } from '../../utils/polygonRounding'
import { ensureProjections } from '../../utils/projections'
import { isValidStedfestingInput } from '../../utils/stedfestingParser'
import { isValidVegsystemreferanse } from '../../utils/vegsystemreferanseValidator'

interface Props {
  searchMode: 'polygon' | 'strekning' | 'stedfesting'
}

const POLYGON_WKT_REGEX = /^POLYGON\s*\(\(\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?)+\s*\)\)\s*$/i

function isValidPolygonWkt(value: string): boolean {
  return POLYGON_WKT_REGEX.test(value)
}

ensureProjections()

export default function SearchControls({ searchMode }: Props) {
  const [polygon, setPolygon] = useAtom(polygonAtom)
  const [polygonClip, setPolygonClip] = useAtom(polygonClipAtom)
  const [polygonWktInput, setPolygonWktInput] = useAtom(polygonWktInputAtom)
  const [polygonError, setPolygonError] = useState<string | null>(null)
  const [polygonCopied, setPolygonCopied] = useState(false)
  const lastPolygonWktRef = useRef('')
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, setStrekning] = useAtom(strekningAtom)
  const [strekningInput, setStrekningInput] = useAtom(strekningInputAtom)
  const [strekningError, setStrekningError] = useState<string | null>(null)
  const [, setStedfesting] = useAtom(stedfestingAtom)
  const [stedfestingInput, setStedfestingInput] = useAtom(stedfestingInputAtom)
  const [stedfestingError, setStedfestingError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!polygon) {
      if (lastPolygonWktRef.current !== '') {
        lastPolygonWktRef.current = ''
        setPolygonWktInput('')
      }
      if (polygonError !== null) {
        setPolygonError(null)
      }
      return
    }
    const format = new WKT()
    const roundedUtm = roundPolygonToTwoDecimals(polygon.clone())
    const roundedWkt = format.writeGeometry(roundedUtm)
    if (roundedWkt !== lastPolygonWktRef.current) {
      lastPolygonWktRef.current = roundedWkt
      setPolygonWktInput(roundedWkt)
    }
    if (polygonError !== null) {
      setPolygonError(null)
    }
  }, [polygon, polygonError, setPolygonWktInput])

  const handlePolygonChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPolygonWktInput(event.target.value)
      setPolygonError(null)
    },
    [setPolygonWktInput],
  )

  const handlePolygonSearch = useCallback(() => {
    const trimmed = polygonWktInput.trim()
    if (trimmed.length === 0) return
    if (!isValidPolygonWkt(trimmed)) {
      setPolygonError('Ugyldig WKT-format. Bruk f.eks. POLYGON((x y, ...)).')
      return
    }
    try {
      const format = new WKT()
      const geometry = format.readGeometry(trimmed, { dataProjection: 'EPSG:25833', featureProjection: 'EPSG:25833' })
      if (!(geometry instanceof Polygon)) {
        setPolygonError('Kun POLYGON er støttet i WKT-feltet.')
        return
      }
      setPolygonError(null)
      const roundedUtm = roundPolygonToTwoDecimals(geometry)
      setPolygon(roundedUtm)
    } catch {
      setPolygonError('Ugyldig WKT. Bruk f.eks. POLYGON((x y, ...)).')
    }
  }, [polygonWktInput, setPolygon])

  const handlePolygonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (polygonWktInput.trim().length > 0) {
          handlePolygonSearch()
        }
      }
    },
    [handlePolygonSearch, polygonWktInput],
  )

  const clearPolygon = useCallback(() => {
    setPolygonWktInput('')
    lastPolygonWktRef.current = ''
    setPolygon(null)
    setPolygonError(null)
    setPolygonCopied(false)
  }, [setPolygon, setPolygonWktInput])

  const handleCopyPolygonWkt = useCallback(async () => {
    const trimmed = polygonWktInput.trim()
    if (trimmed.length === 0) return
    try {
      await navigator.clipboard.writeText(trimmed)
      setPolygonCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => {
        setPolygonCopied(false)
      }, 1500)
    } catch {
      setPolygonError('Kunne ikke kopiere WKT.')
    }
  }, [polygonWktInput])

  const handleStrekningChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setStrekningInput(event.target.value)
      setStrekningError(null)
    },
    [setStrekningInput],
  )

  const handleStrekningSearch = useCallback(() => {
    const trimmed = strekningInput.trim()
    if (trimmed.length === 0) return
    if (!isValidVegsystemreferanse(trimmed)) {
      setStrekningError('Ugyldig vegsystemreferanse. Bruk f.eks. FV6 S1D1 (KSP kan ha kommunenummer). Kryssdel/sideanleggsdel og meterverdier er ikke støttet.')
      return
    }
    setStrekningError(null)
    setStrekning(trimmed)
  }, [setStrekning, strekningInput])

  const handleStrekningKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (strekningInput.trim().length > 0) {
          handleStrekningSearch()
        }
      }
    },
    [handleStrekningSearch, strekningInput],
  )

  const clearStrekning = useCallback(() => {
    setStrekningInput('')
    setStrekning('')
    setStrekningError(null)
  }, [setStrekningInput, setStrekning])

  const handleStedfestingChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setStedfestingInput(event.target.value)
      setStedfestingError(null)
    },
    [setStedfestingInput],
  )

  const handleStedfestingSearch = useCallback(() => {
    const trimmed = stedfestingInput.trim()
    if (trimmed.length === 0) return
    if (!isValidStedfestingInput(trimmed)) {
      setStedfestingError('Ugyldig stedfesting. Bruk f.eks. 1234, 0.2-0.5@5678 eller 0.8@9999.')
      return
    }
    setStedfestingError(null)
    setStedfesting(trimmed)
  }, [setStedfesting, stedfestingInput])

  const handleStedfestingKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (stedfestingInput.trim().length > 0) {
          handleStedfestingSearch()
        }
      }
    },
    [handleStedfestingSearch, stedfestingInput],
  )

  const clearStedfesting = useCallback(() => {
    setStedfestingInput('')
    setStedfesting('')
    setStedfestingError(null)
  }, [setStedfestingInput, setStedfesting])

  useEffect(() => {
    if (searchMode !== 'polygon' && (polygon || polygonWktInput || polygonError)) {
      clearPolygon()
    }
    if (searchMode !== 'strekning' && (strekningInput || strekningError)) {
      clearStrekning()
    }
    if (searchMode !== 'stedfesting' && (stedfestingInput || stedfestingError)) {
      clearStedfesting()
    }
  }, [
    clearPolygon,
    clearStedfesting,
    clearStrekning,
    polygon,
    polygonError,
    polygonWktInput,
    searchMode,
    stedfestingError,
    stedfestingInput,
    strekningError,
    strekningInput,
  ])

  const trimmedStrekningInput = strekningInput.trim()
  const isStrekningValid = trimmedStrekningInput.length === 0 || isValidVegsystemreferanse(trimmedStrekningInput)
  const trimmedStedfestingInput = stedfestingInput.trim()
  const isStedfestingValid = trimmedStedfestingInput.length === 0 || isValidStedfestingInput(trimmedStedfestingInput)
  const trimmedPolygonInput = polygonWktInput.trim()
  const isPolygonRegexValid = trimmedPolygonInput.length === 0 || isValidPolygonWkt(trimmedPolygonInput)
  const isPolygonValid = trimmedPolygonInput.length === 0 || (isPolygonRegexValid && polygonError === null)

  return (
    <>
      {searchMode === 'strekning' && (
        <div className="strekning-controls">
          <label className="search-label" htmlFor="strekning-input">
            Søk på strekning
          </label>
          <div className="search-input-row">
            <div className="search-input-wrapper">
              <input
                id="strekning-input"
                className="search-input"
                placeholder="Eks.: FV6666 S1"
                value={strekningInput}
                onChange={handleStrekningChange}
                onKeyDown={handleStrekningKeyDown}
              />
              {strekningInput && (
                <SVVButtonIcon className="search-clear-btn" ariaLabel="Tøm strekning" onClick={clearStrekning} icon={<span aria-hidden="true">×</span>} />
              )}
            </div>
            <SVVButton size="sm" color="primary" onClick={handleStrekningSearch} disabled={trimmedStrekningInput.length === 0 || !isStrekningValid}>
              Søk
            </SVVButton>
          </div>
          {strekningError && <div className="strekning-error">{strekningError}</div>}
        </div>
      )}

      {searchMode === 'stedfesting' && (
        <div className="strekning-controls">
          <label className="search-label" htmlFor="stedfesting-input">
            Stedfesting
          </label>
          <div className="search-input-row">
            <div className="search-input-wrapper">
              <input
                id="stedfesting-input"
                className="search-input"
                placeholder="Eks.: 1234, 0.2-0.5@5678"
                value={stedfestingInput}
                onChange={handleStedfestingChange}
                onKeyDown={handleStedfestingKeyDown}
              />
              {stedfestingInput && (
                <SVVButtonIcon className="search-clear-btn" ariaLabel="Tøm stedfesting" onClick={clearStedfesting} icon={<span aria-hidden="true">×</span>} />
              )}
            </div>
            <SVVButton size="sm" color="primary" onClick={handleStedfestingSearch} disabled={trimmedStedfestingInput.length === 0 || !isStedfestingValid}>
              Søk
            </SVVButton>
          </div>
          {stedfestingError && <div className="strekning-error">{stedfestingError}</div>}
        </div>
      )}

      {searchMode === 'polygon' && (
        <div className="strekning-controls polygon-controls">
          <label className="search-label" htmlFor="polygon-wkt-input">
            Polygon WKT
          </label>
          <div className="search-input-row">
            <div className="search-input-wrapper">
              <input
                id="polygon-wkt-input"
                className="search-input"
                placeholder="POLYGON((x y, x y, ...))"
                value={polygonWktInput}
                onChange={handlePolygonChange}
                onKeyDown={handlePolygonKeyDown}
              />
              {polygonWktInput && (
                <SVVButtonIcon className="search-clear-btn" ariaLabel="Tøm polygon WKT" onClick={clearPolygon} icon={<span aria-hidden="true">×</span>} />
              )}
            </div>
            <SVVButton size="sm" color="primary" onClick={handlePolygonSearch} disabled={trimmedPolygonInput.length === 0 || !isPolygonValid}>
              Søk
            </SVVButton>
            <SVVButtonIcon
              className={`vegobjekt-action-btn vegobjekt-copy-btn search-copy-btn${polygonCopied ? ' copied' : ''}`}
              ariaLabel={polygonCopied ? 'WKT kopiert' : 'Kopier WKT'}
              title={polygonCopied ? 'Kopiert!' : 'Kopier WKT'}
              onClick={handleCopyPolygonWkt}
              disabled={trimmedPolygonInput.length === 0 || !isPolygonRegexValid}
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
                </svg>
              }
            />
          </div>
          {polygonError && <div className="strekning-error">{polygonError}</div>}
          <label className="polygon-clip-toggle">
            <input type="checkbox" checked={polygonClip} onChange={() => setPolygonClip((prev) => !prev)} />
            Klipp veglenker til polygon
          </label>
        </div>
      )}
    </>
  )
}
