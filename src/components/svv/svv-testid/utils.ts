/* eslint-disable no-redeclare */

/**
 * Normaliserer test-id
 */
export function normalizeTestId(input: string): string {
  return input.trim()
}

/**
 * Lag test-id i formatet root_part
 */
export function makeTestId(root?: string, part?: string): string | undefined {
  if (!root) return undefined
  const r = normalizeTestId(root)
  return part ? `${r}_${normalizeTestId(part)}` : r
}

/**
 * createUseTestId
 * - Uten parts: createUseTestId() -> (root) => { root }
 * - Med parts: createUseTestId(parts) -> (root) => { root, part(name) }
 */
export function createUseTestId(): (root?: string) => {
  readonly root: string | undefined
}

export function createUseTestId<const P extends Record<string, string>>(
  parts: P,
): (root?: string) => {
  readonly root: string | undefined
  readonly part: (partName: keyof P) => string
}

export function createUseTestId(parts?: Record<string, string>) {
  if (!parts) {
    return (root?: string) => ({ root: makeTestId(root) })
  }

  // Validate by KEYS (property names) — callers should use the keys like `monthLabel`.
  const validKeys = new Set<string>(Object.keys(parts))

  return (root?: string) => {
    const rootId = makeTestId(root)
    return {
      root: rootId,
      part(partName: string): string | undefined {
        if (!rootId) {
          return undefined
        }
        if (!validKeys.has(partName)) {
          // eslint-disable-next-line no-console
          console.warn(`[test-id] Ugyldig part "${partName}". Tillatt: ${[...validKeys].join(', ')}`)
        }
        // Use the mapped value (e.g. "month-label") if present, otherwise fall back to the provided string
        const partValue = (parts as Record<string, string>)[partName] ?? partName
        const partId = normalizeTestId(partValue)
        return rootId ? `${rootId}_${partId}` : partId
      },
    }
  }
}
