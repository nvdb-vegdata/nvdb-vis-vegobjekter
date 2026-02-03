import { useSetAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { isVegobjekterRequestError } from '../api/uberiketClient'
import { vegobjekterErrorAtom } from '../state/atoms'

export function useVegobjekterErrorMessage(error: Error | null) {
  const setVegobjekterError = useSetAtom(vegobjekterErrorAtom)

  const message = useMemo(() => {
    if (!error) return null
    if (isVegobjekterRequestError(error)) {
      if (error.status === 400) {
        return 'Vegobjektsøket ble for stort. Prøv et mindre område eller færre typer.'
      }
      if (error.status === 414) {
        return 'Forespørselen er for lang. Prøv et mindre område.'
      }
      if (error.status === 502 || error.status === 503) {
        return 'Vegobjektsøket feilet. Prøv et mindre område eller færre typer.'
      }
      if (error.status === 504) {
        return 'Kunne ikke hente data, forespørselen tok for lang tid. Prøv et mindre område eller færre typer.'
      }
    }

    if (error.name === 'TimeoutError') {
      return 'Forespørselen tok for lang tid. Prøv et mindre område eller færre typer.'
    }

    if (error instanceof TypeError || (error instanceof Error && error.message.toLowerCase().includes('failed to fetch'))) {
      return 'Vegobjektsøket feilet. Prøv et mindre område eller færre typer.'
    }

    return 'Kunne ikke hente vegobjekter. Prøv et mindre område eller færre typer.'
  }, [error])

  useEffect(() => {
    setVegobjekterError(message)
  }, [setVegobjekterError, message])
}
