import fs from 'node:fs'
import path from 'node:path'
import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils'
import { TESTID_PARTS_FILE } from './config'

/**
 * Leser komponentens test-parts.ts (konfigurerbar sti).
 * Sikrer at tid.part("…") bruker en tillatt streng fra lista, og at det stammer fra overnevnte fil.
 */

type MessageIds = 'unknownPart' | 'notLiteral' | 'missingPartsFile'
const defaultFile = `./${TESTID_PARTS_FILE}`

function loadParts(partsFileAbs: string): Set<string> | null {
  if (!fs.existsSync(partsFileAbs)) return null

  try {
    const src = fs.readFileSync(partsFileAbs, 'utf8')

    // 1) Try to match the old-style array export: export const SOMETHING_PARTS = ["a","b"] as const
    const arrayMatch = src.match(/export\s+const\s+\w+_PARTS\s*=\s*\[([\s\S]*?)]\s*as\s+const/)
    if (arrayMatch) {
      const items = [...arrayMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1])
      return new Set(items)
    }

    // 2) Try to match an object export: export const parts = { keyA: "a", keyB: "b" } as const
    const objMatch = src.match(/export\s+const\s+\w+\s*=\s*{([\s\S]*?)}\s*as\s+const/)
    if (objMatch) {
      const body = objMatch[1]
      // Match property keys. Keys may be quoted or identifier-like. We capture the key name before the colon.
      const keyRe = /["'`]?([A-Za-z0-9_$-]+)["'`]?\s*:/g
      const keys = Array.from(body.matchAll(keyRe), (m) => m[1]).filter(Boolean)
      return new Set(keys)
    }

    // If nothing matched, return empty set (no validation)
    return new Set()
  } catch {
    return new Set()
  }
}

function isTidPartCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier' && node.callee.property.name === 'part'
}

export default ESLintUtils.RuleCreator(() => 'https://internal/docs/testing-policy')<[{ partsFile?: string }], MessageIds>({
  name: 'valid-part-literal',
  meta: {
    type: 'problem',
    docs: { description: `Sikre at tid.part('…') bruker en gyldig part fra ${TESTID_PARTS_FILE}` },
    messages: {
      unknownPart: "'{{part}}' er ikke definert i parts-listen for komponenten.",
      notLiteral: 'Argumentet til tid.part(...) må være en string literal (for å kunne valideres).',
      missingPartsFile: `Komponenten bruker tid.part() men mangler en ${TESTID_PARTS_FILE}-fil som definerer gyldige parts.`,
    },
    schema: [
      {
        type: 'object',
        properties: { partsFile: { type: 'string' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ partsFile: defaultFile }],

  create(context, [opts]) {
    const partsFileAbs = path.resolve(path.dirname(context.getFilename()), opts.partsFile ?? defaultFile)
    const parts = loadParts(partsFileAbs)

    return {
      CallExpression(node) {
        if (!isTidPartCall(node)) return

        const arg = node.arguments[0]
        if (!arg) return

        if (parts === null) {
          context.report({ node, messageId: 'missingPartsFile' })
          return
        }

        if (arg.type !== 'Literal' || typeof arg.value !== 'string') {
          context.report({ node: arg, messageId: 'notLiteral' })
          return
        }

        if (parts.size > 0 && !parts.has(arg.value)) {
          context.report({ node: arg, messageId: 'unknownPart', data: { part: arg.value } })
        }
      },
    }
  },
})
