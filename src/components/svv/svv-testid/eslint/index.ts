import requireTestIdProp from "./require-testid-prop";
import noManualTestIdConcat from "./no-manual-testid-concat";
import validPartLiteral from "./valid-part-literal";

export const rules = {
  "require-testid-prop": requireTestIdProp,
  "no-manual-testid-concat": noManualTestIdConcat,
  "valid-part-literal": validPartLiteral,
};

export default { rules };
