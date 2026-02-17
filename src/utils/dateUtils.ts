export function getTodayDate(): string {
  return new Date().toLocaleDateString('sv-SE')
}

const norwegianIsoDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatUtcTimestampToIsoDateInNorwegianTimeZone(timestamp: string): string {
  const parsed = new Date(timestamp)

  if (Number.isNaN(parsed.getTime())) {
    return timestamp
  }

  return norwegianIsoDateFormatter.format(parsed)
}

function normalizeIsoDate(value: string | undefined): string | null {
  if (!value) return null
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}

export function isDateWithinGyldighetsperiode(referenceDate: string, gyldighetsperiode?: { startdato?: string; sluttdato?: string }): boolean {
  const ref = normalizeIsoDate(referenceDate)
  if (!ref) return true

  const startdato = normalizeIsoDate(gyldighetsperiode?.startdato)
  const sluttdato = normalizeIsoDate(gyldighetsperiode?.sluttdato)

  if (startdato && ref < startdato) return false
  if (sluttdato && ref >= sluttdato) return false
  return true
}
