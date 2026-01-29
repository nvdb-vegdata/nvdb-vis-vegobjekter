const BARE_ID_REGEX = /^@?(\d+)$/
const EXTENT_REGEX = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)@(\d+)$/
const POSITION_REGEX = /^(\d+(?:\.\d+)?)@(\d+)$/

type ParsedStedfesting = {
  veglenkesekvensIds: number[]
  stedfestingFilter: string
}

function isPositiveId(id: number): boolean {
  return Number.isFinite(id) && id > 0
}

function parseToken(token: string): { id: number; filter: string } | null {
  const bareMatch = BARE_ID_REGEX.exec(token)
  if (bareMatch) {
    const id = Number(bareMatch[1])
    if (!isPositiveId(id)) return null
    return { id, filter: `0-1@${id}` }
  }

  const extentMatch = EXTENT_REGEX.exec(token)
  if (extentMatch) {
    const id = Number(extentMatch[3])
    if (!isPositiveId(id)) return null
    return {
      id,
      filter: `${extentMatch[1]}-${extentMatch[2]}@${id}`,
    }
  }

  const positionMatch = POSITION_REGEX.exec(token)
  if (positionMatch) {
    const id = Number(positionMatch[2])
    if (!isPositiveId(id)) return null
    return {
      id,
      filter: `${positionMatch[1]}@${id}`,
    }
  }

  return null
}

export function parseStedfestingInput(input: string): ParsedStedfesting {
  const tokens = input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  const veglenkesekvensIdSet = new Set<number>()
  const filterSet = new Set<string>()

  for (const token of tokens) {
    const parsed = parseToken(token)
    if (!parsed) continue
    veglenkesekvensIdSet.add(parsed.id)
    filterSet.add(parsed.filter)
  }

  return {
    veglenkesekvensIds: Array.from(veglenkesekvensIdSet.values()),
    stedfestingFilter: Array.from(filterSet.values()).join(','),
  }
}

export function isValidStedfestingInput(input: string): boolean {
  const tokens = input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) return false

  return tokens.every((token) => parseToken(token) !== null)
}
