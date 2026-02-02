import classNames from "classnames";
import { useButtonTestId } from "./test-parts";
import { ButtonRowType } from "./ButtonRow.types";

/**
 * @deprecated SVVButtonRow er fjernet i nyere versjoner, og vil bli permanent fjernet 01.03.2026.
 * Se dokumentasjon for anbefalt alternativ.
 */
export function SVVButtonRow({ isFormRow, children, testId }: ButtonRowType) {
  const testIds = useButtonTestId(testId);

  return (
    <div
      className={classNames("svv-button-row", {
        "svv-form-button-row": isFormRow,
      })}
      data-testid={testIds.root}
    >
      {children}
    </div>
  );
}

SVVButtonRow.displayName = "SVVButtonRow";
