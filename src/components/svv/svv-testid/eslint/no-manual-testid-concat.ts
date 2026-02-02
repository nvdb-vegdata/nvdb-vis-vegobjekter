import { TSESTree, ESLintUtils } from "@typescript-eslint/utils";
import { TESTID_ATTR_NAME, TESTID_PROP_NAME } from "./config";

/**
 * Forbyr ${testId}_foo, testId + '_foo', data-testid={testid && ${testid}_panel} etc.
 * Foreslår å bruke createUseTestId.
 */

type MessageIds = "noConcat";

function isTestIdIdentifier(id: TSESTree.Identifier | null | undefined): boolean {
  return !!id && id.name.toLowerCase() === TESTID_PROP_NAME.toLowerCase();
}

function isManualConcat(expr: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  // PrivateIdentifier kan ikke være testId
  if (expr.type === "PrivateIdentifier") return false;

  if (expr.type === "TemplateLiteral") {
    return expr.expressions.some(e => e.type === "Identifier" && isTestIdIdentifier(e));
  }

  if (expr.type === "BinaryExpression" && expr.operator === "+") {
    return isManualConcat(expr.left) || isManualConcat(expr.right);
  }

  if (expr.type === "LogicalExpression") {
    return isManualConcat(expr.left) || isManualConcat(expr.right);
  }

  if (expr.type === "ConditionalExpression") {
    return isManualConcat(expr.consequent) || isManualConcat(expr.alternate);
  }

  if (expr.type === "Identifier") {
    return isTestIdIdentifier(expr);
  }

  if (expr.type === "MemberExpression" && expr.object.type === "Identifier") {
    return isTestIdIdentifier(expr.object);
  }

  if (expr.type === "CallExpression" &&
      expr.callee.type === "MemberExpression" &&
      expr.callee.object.type === "Identifier") {
    // f.eks. testId.concat('_panel')
    return isTestIdIdentifier(expr.callee.object);
  }

  return false;
}

export default ESLintUtils.RuleCreator(() => "https://internal/docs/testing-policy")<[], MessageIds>({
  name: "no-manual-testid-concat",
  meta: {
    type: "suggestion",
    docs: { description: "Bruk createUseTestId – ikke manuell strengsammenslåing" },
    messages: {
      noConcat: `Ikke bygg data-testid manuelt fra \`${TESTID_PROP_NAME}\`. Bruk createUseTestId() i test-parts.ts og .root eller .part("…") fra den i komponenten.`,
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== TESTID_ATTR_NAME) return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;

        const expr = node.value.expression;
        if (expr.type === "JSXEmptyExpression") return;

        if (isManualConcat(expr)) {
          context.report({ node: node.value, messageId: "noConcat" });
        }
      },
    };
  },
});
