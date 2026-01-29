const VEGSYSTEMREFERANSE_REGEX = /^(?:(\d{4})\s*)?([ERFKPS])(?:([VAPF])\s*)?(\d+)(?:\s*S(\d+(?:-\d+)?))?(?:\s*D(\d+(?:-\d+)?))?\s*$/i

export function isValidVegsystemreferanse(value: string): boolean {
  const match = VEGSYSTEMREFERANSE_REGEX.exec(value.trim())
  if (!match) return false
  const kommune = match[1]
  const kategori = match[2]?.toUpperCase() ?? ''
  const strekning = match[5]
  const delstrekning = match[6]
  if (kommune && !['K', 'P', 'S'].includes(kategori)) {
    return false
  }
  if (delstrekning && !strekning) {
    return false
  }
  return true
}
