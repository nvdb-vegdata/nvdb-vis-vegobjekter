import { useAtom } from 'jotai'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useState } from 'react'
import { stedfestingAtom, stedfestingInputAtom, strekningAtom, strekningInputAtom } from '../../state/atoms'
import { isValidStedfestingInput } from '../../utils/stedfestingParser'
import { isValidVegsystemreferanse } from '../../utils/vegsystemreferanseValidator'

interface Props {
  searchMode: 'polygon' | 'strekning' | 'stedfesting'
}

export default function SearchControls({ searchMode }: Props) {
  const [, setStrekning] = useAtom(strekningAtom)
  const [strekningInput, setStrekningInput] = useAtom(strekningInputAtom)
  const [strekningError, setStrekningError] = useState<string | null>(null)
  const [, setStedfesting] = useAtom(stedfestingAtom)
  const [stedfestingInput, setStedfestingInput] = useAtom(stedfestingInputAtom)
  const [stedfestingError, setStedfestingError] = useState<string | null>(null)

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

  const trimmedStrekningInput = strekningInput.trim()
  const isStrekningValid = trimmedStrekningInput.length === 0 || isValidVegsystemreferanse(trimmedStrekningInput)
  const trimmedStedfestingInput = stedfestingInput.trim()
  const isStedfestingValid = trimmedStedfestingInput.length === 0 || isValidStedfestingInput(trimmedStedfestingInput)

  return (
    <>
      {searchMode === 'strekning' && (
        <div className="strekning-controls">
          <label className="search-label" htmlFor="strekning-input">
            Søk på strekning
          </label>
          <div className="strekning-input-row">
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
                <button className="search-clear-btn" type="button" onClick={clearStrekning} aria-label="Tøm strekning">
                  ×
                </button>
              )}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleStrekningSearch}
              disabled={trimmedStrekningInput.length === 0 || !isStrekningValid}
            >
              Søk
            </button>
          </div>
          {strekningError && <div className="strekning-error">{strekningError}</div>}
        </div>
      )}

      {searchMode === 'stedfesting' && (
        <div className="strekning-controls">
          <label className="search-label" htmlFor="stedfesting-input">
            Stedfesting
          </label>
          <div className="strekning-input-row">
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
                <button className="search-clear-btn" type="button" onClick={clearStedfesting} aria-label="Tøm stedfesting">
                  ×
                </button>
              )}
            </div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleStedfestingSearch}
              disabled={trimmedStedfestingInput.length === 0 || !isStedfestingValid}
            >
              Søk
            </button>
          </div>
          {stedfestingError && <div className="strekning-error">{stedfestingError}</div>}
        </div>
      )}
    </>
  )
}
