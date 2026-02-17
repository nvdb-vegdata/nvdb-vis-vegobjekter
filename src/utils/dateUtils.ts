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
