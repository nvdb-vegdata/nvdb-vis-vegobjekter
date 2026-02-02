import fs from 'node:fs'
import path from 'node:path'
import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils'
import type * as ts from 'typescript' // flyttet over config
import { TESTID_ATTR_NAME, TESTID_PROP_NAME } from './config'

/**
 * Finner eksporterte funksjons/arrow-komponenter som returnerer JSX.
 * Sjekker at funksjonsparametrene inneholder testid (enten destrukturert eller brukt i body).
 * Sjekker at det finnes en data-testid={...testid...} på minst ett JSX-element (vanligvis roten),
 * eller at testId forwardes som prop til et toppnivå custom komponent-element (kapitalisert) dersom allowForwardedProp er aktiv.
 */

/**
 * Traverserer AST og samler alle noder av en bestemt type
 */
function collectNodes<T extends TSESTree.Node>(node: TSESTree.Node, predicate: (n: TSESTree.Node) => n is T): T[] {
  const results: T[] = []
  const visited = new WeakSet<TSESTree.Node>()
  function visit(n: TSESTree.Node): void {
    if (visited.has(n)) return
    visited.add(n)
    if (predicate(n)) {
      results.push(n)
    }
    Object.keys(n).forEach((key) => {
      const child = (n as any)[key]
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach((c) => c && typeof c.type === 'string' && visit(c))
        } else if ((child as any).type) {
          visit(child as any)
        }
      }
    })
  }
  visit(node)
  return results
}

/**
 * Sjekker om et uttrykk refererer til testId på en eller annen måte
 */
function expressionReferencesTestId(expr: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (expr.type === 'Identifier') {
    return expr.name === TESTID_PROP_NAME || expr.name === 'testIds' || /TestId$/.test(expr.name)
  }
  if (expr.type === 'MemberExpression') {
    return expressionReferencesTestId(expr.object as TSESTree.Expression)
  }
  if (expr.type === 'CallExpression') {
    if (expr.callee.type === 'Identifier') {
      if (expr.callee.name === 'makeTestId' || /use.*TestId$/.test(expr.callee.name)) {
        return true
      }
    }
    if (expr.callee.type === 'MemberExpression') {
      return expressionReferencesTestId(expr.callee.object as TSESTree.Expression)
    }
    return expr.arguments.some((arg) => arg.type === 'Identifier' && arg.name === TESTID_PROP_NAME)
  }
  return expr.type === 'TemplateLiteral' || expr.type === 'BinaryExpression'
}

/**
 * Sjekker om et JSX-element har data-testid attributt som bruker testId
 * Utvidet: Dersom allowForwardedProp er true godtas også forwarded testId prop på kapitaliserte komponenter.
 */
function hasTestIdAttribute(node: TSESTree.Node, attrName: string, allowForwardedProp: boolean, forwardPropNames: string[]): boolean {
  const jsxElements = collectNodes(node, (n): n is TSESTree.JSXElement => n.type === 'JSXElement')
  return jsxElements.some((element) => {
    // Sjekk direkte data-testid attributt først
    const hasAttr = element.openingElement.attributes.some((attr) => {
      if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') return false
      if (attr.name.name !== attrName) return false
      if (!attr.value) return false
      if (attr.value.type === 'Literal') return true
      if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression
        if (expr.type === 'JSXEmptyExpression') return false
        return expressionReferencesTestId(expr)
      }
      return false
    })
    if (hasAttr) return true

    // Forwarded prop: kun hvis aktivert og element-navn har stor forbokstav
    if (!allowForwardedProp) return false
    if (element.openingElement.name.type !== 'JSXIdentifier') return false
    const { name } = element.openingElement.name as TSESTree.JSXIdentifier
    if (!/^[A-Z]/.test(name)) return false // kun custom komponenter

    // Finn forwarded prop attributt(er)
    return element.openingElement.attributes.some((attr) => {
      if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') return false
      if (!forwardPropNames.includes(attr.name.name)) return false
      if (!attr.value) return false
      if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression
        if (expr.type === 'JSXEmptyExpression') return false
        // Godta direkte identifikator med samme navn som prop (forwarding av custom namn)
        if (expr.type === 'Identifier' && expr.name === attr.name.name) return true
        return expressionReferencesTestId(expr)
      }
      return false // ikke godta rene literaler for forwarded prop
    })
  })
}

/**
 * Sjekker om en type inkluderer WithTestId eller testId-property
 */
function typeHasTestId(typeNode: any, aliasMap: Map<string, any>, importResolver?: (name: string) => boolean): boolean {
  if (!typeNode) return false
  const seen = new Set<any>()
  function check(node: any): boolean {
    if (!node || seen.has(node)) return false
    seen.add(node)
    switch (node.type) {
      case 'TSTypeReference':
        if (node.typeName?.type === 'Identifier') {
          const refName = node.typeName.name
          if (refName === 'WithTestId') return true
          const resolved = aliasMap.get(refName)
          if (resolved) return check(resolved)
          // Forsøk fil-basert import-resolusjon
          if (importResolver && importResolver(refName)) return true
        }
        return node.typeParameters?.params.some(check) ?? false
      case 'TSIntersectionType':
      case 'TSUnionType':
        return node.types.some(check)
      case 'TSTypeAnnotation':
        return check(node.typeAnnotation)
      case 'TSInterfaceDeclaration':
        if (node.extends?.some((ext: any) => ext.expression?.name === 'WithTestId')) {
          return true
        }
        return node.body.body.some((m: any) => m.key?.name === TESTID_PROP_NAME)
      case 'TSTypeLiteral':
        return (node.members || []).some((m: any) => m.type === 'TSPropertySignature' && m.key?.name === TESTID_PROP_NAME)
      default:
        return false
    }
  }
  return check(typeNode)
}

/**
 * Sjekker om en funksjon returnerer JSX
 */
function returnsJSX(fn: TSESTree.FunctionDeclaration | TSESTree.ArrowFunctionExpression): boolean {
  if (!fn.body) return false
  const jsxNodes = collectNodes(fn.body, (n): n is TSESTree.JSXElement | TSESTree.JSXFragment => n.type === 'JSXElement' || n.type === 'JSXFragment')
  return jsxNodes.length > 0
}

export default ESLintUtils.RuleCreator(() => 'https://internal/docs/testing-policy')<
  [
    {
      namePattern?: string
      filePattern?: string
      attributeName?: string
      onlyExported?: boolean
      allowForwardedProp?: boolean
      forwardPropNames?: string[]
    },
  ],
  'missingProp' | 'missingAttr'
>({
  name: 'require-testid-prop',
  meta: {
    type: 'problem',
    docs: {
      description: `Public React-komponenter må ha \`${TESTID_PROP_NAME}\`-prop og sette \`${TESTID_ATTR_NAME}\` (evt. forwarde \`${TESTID_PROP_NAME}\` til custom komponent).`,
    },
    messages: {
      missingProp: `Public komponent mangler \`${TESTID_PROP_NAME}?: string\` i props!`,
      missingAttr: `Komponenten må ha \`${TESTID_ATTR_NAME}\` bundet til \`${TESTID_PROP_NAME}\` på minst ett element, eller forwarde \`${TESTID_PROP_NAME}\` til et custom komponent-element.`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          namePattern: { type: 'string' },
          filePattern: { type: 'string' },
          attributeName: { type: 'string' },
          onlyExported: { type: 'boolean' },
          allowForwardedProp: { type: 'boolean' },
          forwardPropNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      namePattern: '^(SVV|[A-Z])',
      filePattern: 'src/',
      attributeName: TESTID_ATTR_NAME,
      onlyExported: true,
      allowForwardedProp: true,
      forwardPropNames: [TESTID_PROP_NAME],
    },
  ],
  create(context, [opts]) {
    // Ny helper for å bruke typechecker til å detektere testId dypere i typer
    function tsTypeHasTestId(esNode: TSESTree.Node | undefined): boolean {
      try {
        if (!esNode) return false
        const services: any = (context as any).parserServices
        if (!services || !services.program || !services.esTreeNodeToTSNodeMap) return false
        const tsNode = services.esTreeNodeToTSNodeMap.get(esNode)
        if (!tsNode) return false
        const checker: ts.TypeChecker = services.program.getTypeChecker()
        const rootType: ts.Type = checker.getTypeAtLocation(tsNode)
        const visited = new Set<ts.Type>()
        function inspect(t: ts.Type): boolean {
          if (!t || visited.has(t)) return false
          visited.add(t)
          const prop = t.getProperty?.(TESTID_PROP_NAME)
          if (prop) return true
          if ((t as ts.UnionOrIntersectionType).types) {
            return (t as ts.UnionOrIntersectionType).types.some(inspect)
          }
          const bases = (t as any).getBaseTypes?.() || []
          if (bases.length && bases.some(inspect)) return true
          const apparent = checker.getApparentType(t)
          if (inspect(apparent)) return true // forenklet
          return false
        }
        return inspect(rootType)
      } catch {
        /* ignore type resolution errors */ return false
      }
    }

    const nameRe = new RegExp(opts.namePattern ?? '^(SVV|[A-Z])')
    const fileOk = context.getFilename().includes(opts.filePattern ?? 'src/')
    const attrName = opts.attributeName ?? TESTID_ATTR_NAME
    const onlyExported = opts.onlyExported ?? true
    const allowForwardedProp = opts.allowForwardedProp ?? true
    const forwardPropNames = opts.forwardPropNames && opts.forwardPropNames.length > 0 ? opts.forwardPropNames : [TESTID_PROP_NAME]
    if (!fileOk) return {}

    const source = context.getSourceCode()
    const fileDir = path.dirname(context.getFilename())
    const importMap = new Map<string, string>()
    source.ast.body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        const importSource = node.source.value as string
        if (importSource.startsWith('.')) {
          let resolved = importSource
          if (!/\.(tsx?|jsx?)$/.test(resolved)) {
            const candidates = ['.ts', '.tsx', '/index.ts', '/index.tsx']
            const found = candidates.find((c) => fs.existsSync(path.resolve(fileDir, resolved + c)))
            if (found) {
              resolved = path.resolve(fileDir, resolved + found)
            }
          } else {
            resolved = path.resolve(fileDir, resolved)
          }
          node.specifiers.forEach((spec) => {
            if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
              importMap.set(spec.imported.name, resolved)
            }
          })
        }
      }
    })
    const importedCache = new Map<string, boolean>()
    function importResolver(typeName: string): boolean {
      if (importedCache.has(typeName)) return importedCache.get(typeName)!
      const filePath = importMap.get(typeName)
      if (!filePath) {
        importedCache.set(typeName, false)
        return false
      }
      try {
        const text = fs.readFileSync(filePath, 'utf8')
        const aliasRegex = new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`)
        const match = text.match(aliasRegex)
        if (match) {
          const body = match[1]
          const hasWithTestId = /WithTestId/.test(body)
          const hasTestIdProp = /testId\??:\s*string/.test(body)
          const result = hasWithTestId || hasTestIdProp
          importedCache.set(typeName, result)
          return result
        }
      } catch {
        /* ignore read errors */
      }
      importedCache.set(typeName, false)
      return false
    }
    // AliasMap flyttet etter source deklarasjon (var uendret logikk)
    const aliasMap = new Map<string, any>()
    source.ast.body.forEach((node) => {
      if (node.type === 'TSTypeAliasDeclaration') {
        aliasMap.set(node.id.name, node.typeAnnotation)
      } else if (node.type === 'TSInterfaceDeclaration') {
        aliasMap.set(node.id.name, node)
      }
    })

    // Flyttet etter importResolver for å unngå no-use-before-define
    function paramHasTestIdExtended(param: TSESTree.Parameter, localAliasMap: Map<string, any>): boolean {
      if (param.type === 'ObjectPattern') {
        const hasProperty = param.properties.some((p) => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === TESTID_PROP_NAME)
        if (hasProperty) return true
        if ((param as any).typeAnnotation && typeHasTestId((param as any).typeAnnotation, localAliasMap, importResolver)) {
          return true
        }
        return tsTypeHasTestId(param as any)
      }
      if (param.type === 'Identifier') {
        if ((param as any).typeAnnotation && typeHasTestId((param as any).typeAnnotation, localAliasMap, importResolver)) {
          return true
        }
        return tsTypeHasTestId(param as any)
      }
      return true
    }

    const processed = new WeakSet<TSESTree.Node>()
    const exportedNames = new Set<string>()
    source.ast.body.forEach((node) => {
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id?.name) {
            exportedNames.add(node.declaration.id.name)
          } else if (node.declaration.type === 'VariableDeclaration') {
            node.declaration.declarations.forEach((d) => {
              if (d.id.type === 'Identifier') exportedNames.add(d.id.name)
            })
          } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id?.name) {
            exportedNames.add(node.declaration.id.name)
          }
        }
        node.specifiers.forEach((spec) => {
          if (spec.local.type === 'Identifier') exportedNames.add(spec.local.name)
        })
      } else if (node.type === 'ExportDefaultDeclaration') {
        if (node.declaration && node.declaration.type === 'FunctionDeclaration' && node.declaration.id?.name) {
          exportedNames.add(node.declaration.id.name)
        } else if (node.declaration && node.declaration.type === 'ClassDeclaration' && node.declaration.id?.name) {
          exportedNames.add(node.declaration.id.name)
        }
      }
    })

    function isExported(name: string | null): boolean {
      if (!name) return false
      if (!onlyExported) return true
      return exportedNames.has(name)
    }

    function checkComponent(name: string | null, fnNode: TSESTree.FunctionDeclaration | TSESTree.ArrowFunctionExpression, reportNode: TSESTree.Node) {
      if (processed.has(fnNode)) return
      processed.add(fnNode)
      if (!name || !nameRe.test(name)) return
      if (!isExported(name)) return
      if (!returnsJSX(fnNode)) return

      const firstParam = fnNode.params[0]
      let hasProp = firstParam ? paramHasTestIdExtended(firstParam, aliasMap) : false

      // Fallback: sjekk om param destruktureres i body og inneholder testId
      if (!hasProp && firstParam && firstParam.type === 'Identifier') {
        const paramName = firstParam.name
        const varDecls = collectNodes(fnNode.body as TSESTree.Node, (n): n is TSESTree.VariableDeclarator => n.type === 'VariableDeclarator')
        const found = varDecls.some((d) => {
          if (d.id.type === 'ObjectPattern' && d.init && d.init.type === 'Identifier' && d.init.name === paramName) {
            return d.id.properties.some((p) => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === TESTID_PROP_NAME)
          }
          return false
        })
        if (found) hasProp = true
      }

      if (!hasProp) {
        context.report({ node: reportNode, messageId: 'missingProp' })
      }
      const hasAttr = hasTestIdAttribute(fnNode.body as TSESTree.Node, attrName, allowForwardedProp, forwardPropNames)
      if (!hasAttr) {
        context.report({ node: reportNode, messageId: 'missingAttr' })
      }
    }

    return {
      FunctionDeclaration(node) {
        checkComponent(node.id?.name ?? null, node, node.id ?? node)
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier') return
        if (node.init?.type === 'ArrowFunctionExpression') {
          checkComponent(node.id.name, node.init, node.id)
        }
      },
      // ExportNamedDeclaration visitor fjernet da FunctionDeclaration dekker behovet
    }
  },
})
