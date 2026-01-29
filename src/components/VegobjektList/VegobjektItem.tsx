import { useSetAtom } from 'jotai'
import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Vegobjekt } from '../../api/uberiketClient'
import { hoveredVegobjektAtom, locateVegobjektAtom } from '../../state/atoms'
import type { VegobjektDetails } from '../../utils/vegobjektProcessing'

const NVDB_API_BASE_URL = 'https://nvdbapiles.atlas.vegvesen.no'
const UBERIKET_API_BASE_URL = `${NVDB_API_BASE_URL}/uberiket`
const VEGKART_BASE_URL = 'https://vegkart.atlas.vegvesen.no'

export default function VegobjektItem({
  details,
  vegobjekt,
  isExpanded,
  isHighlighted,
  onToggle,
  itemRef,
}: {
  details: VegobjektDetails
  vegobjekt: Vegobjekt
  isExpanded: boolean
  isHighlighted: boolean
  onToggle: () => void
  itemRef?: React.RefObject<HTMLLIElement | null>
}) {
  const setHoveredVegobjekt = useSetAtom(hoveredVegobjektAtom)
  const setLocateVegobjekt = useSetAtom(locateVegobjektAtom)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const uberiketUrl = `${UBERIKET_API_BASE_URL}/api/v1/vegobjekter/${details.typeId}/${details.id}`
  const lesApiUrl = `${NVDB_API_BASE_URL}/vegobjekt?id=${details.id}`
  const vegkartUrl = `${VEGKART_BASE_URL}#valgt:${details.id}`

  const handleCopyId = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!navigator.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(String(details.id))
      setCopied(true)
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <li
      ref={itemRef}
      className={`vegobjekt-item${isHighlighted ? ' vegobjekt-highlight' : ''}`}
      onMouseEnter={() => setHoveredVegobjekt(vegobjekt)}
      onMouseLeave={() => setHoveredVegobjekt(null)}
    >
      <div className="vegobjekt-header">
        <button type="button" className="vegobjekt-header-toggle" onClick={onToggle}>
          <span className="vegobjekt-expand">{isExpanded ? '-' : '+'}</span>
          <span className="vegobjekt-id">ID: {details.id}</span>
          {details.versjonId && <span className="vegobjekt-version">v{details.versjonId}</span>}
        </button>
        <div className="vegobjekt-header-actions">
          <button
            type="button"
            className={`vegobjekt-action-btn vegobjekt-copy-btn${copied ? ' copied' : ''}`}
            aria-label={copied ? 'ID kopiert' : 'Kopier ID'}
            title={copied ? 'Kopiert!' : 'Kopier ID'}
            onClick={handleCopyId}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
            </svg>
          </button>
          <button
            type="button"
            className="vegobjekt-action-btn vegobjekt-locate-btn"
            aria-label="Finn i kart"
            title="Finn i kart"
            onClick={(event) => {
              event.stopPropagation()
              setLocateVegobjekt({ vegobjekt, token: Date.now() })
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 2a7 7 0 0 1 7 7c0 4.2-5.1 10.1-6.4 11.5a.8.8 0 0 1-1.2 0C10.1 19.1 5 13.2 5 9a7 7 0 0 1 7-7Zm0 4.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="vegobjekt-details">
          {details.gyldighetsperiode && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Gyldighetsperiode</div>
              <div className="vegobjekt-property">
                {details.gyldighetsperiode.startdato}
                {details.gyldighetsperiode.sluttdato ? ` - ${details.gyldighetsperiode.sluttdato}` : ' - (aktiv)'}
              </div>
            </div>
          )}

          {details.stedfestinger.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Stedfesting</div>
              {details.stedfestinger.map((s) => (
                <div key={s} className="vegobjekt-property vegobjekt-stedfesting">
                  {s}
                </div>
              ))}
            </div>
          )}

          {details.barn.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Barn</div>
              {details.barn.map((b) => (
                <div key={b.typeId} className="vegobjekt-property">
                  <span className="vegobjekt-barn-type">Type {b.typeId}:</span> {b.ids.slice(0, 5).join(', ')}
                  {b.ids.length > 5 && ` (+${b.ids.length - 5} til)`}
                </div>
              ))}
            </div>
          )}

          <div className="vegobjekt-section">
            <div className="vegobjekt-section-title">Lenker</div>
            <div className="vegobjekt-property">
              <a href={uberiketUrl} target="_blank" rel="noopener noreferrer">
                Uberiket API
              </a>
              {' | '}
              <a href={vegkartUrl} target="_blank" rel="noopener noreferrer">
                Vegkart
              </a>
              {' | '}
              <a href={lesApiUrl} target="_blank" rel="noopener noreferrer">
                Les API V4
              </a>
            </div>
          </div>

          {details.egenskaper.length > 0 && (
            <div className="vegobjekt-section">
              <div className="vegobjekt-section-title">Egenskaper</div>
              {details.egenskaper.map((e) => (
                <div key={e.id} className="vegobjekt-property">
                  <span className="vegobjekt-egenskap-name">{e.name}:</span> <span className="vegobjekt-egenskap-value">{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
