import classNames from "classnames";
import { useId, useState } from "react";
import { SVVCheckbox } from "./Checkbox";
import { SVVFormError } from "../FormError/FormError";
import { SVVPopover } from "../Popover/Popover";
import { CheckboxProps } from "./Checkbox.types";
import { CheckboxGroupProps } from "./CheckboxGroup.types";
import { useCheckboxTestId } from "./test-parts";

export function SVVCheckboxGroup({
  options,
  error,
  legend,
  direction,
  required,
  popoverText,
  popoverTitle,
  isFullWidth,
  removeMargin = false,
  description,
  sm,
  id,
  testId,
}: CheckboxGroupProps) {
  const generatedId = useId();
  const [errorMessageId] = useState(`feilmelding-${generatedId}`);
  const [descriptionId] = useState(`beskrivelse-${generatedId}`);
  const hasPopover = popoverText || popoverTitle;
  const testIds = useCheckboxTestId(testId);
  return (
    <fieldset
      className={classNames("svv-form-element", {
        "svv-form-element--inline": direction === "horizontal",
        "svv-form-element--with-errors": error,
        "svv-form-element--max-width": !isFullWidth,
        "svv-form-element--margin-bottom": !removeMargin,
      })}
      id={id}
      data-testid={testIds.root}
    >
      <legend className={classNames("svv-form-label", { "svv-form-label--inline": hasPopover })}>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {/* <div> er ikke lov som barn av legend */}
      {hasPopover && (
        <SVVPopover
          testId={testIds.part("panel")}
          explanationText={popoverText}
          title={popoverTitle}
        />
      )}
      {description && (
        <p className="svv-form-description" id={descriptionId}>
          {description}
        </p>
      )}
      <div className="svv-checkbox-wrapper">
        {options.map((o: CheckboxProps) => (
          <SVVCheckbox
            key={o.id}
            onChange={o.onChange}
            checked={o.checked}
            isFullwidth={isFullWidth}
            sm={sm}
            partOfGroup
            removeMargin
            {...((error || description) && {
              "aria-describedby":
                `${error ? errorMessageId : ""} ${description ? descriptionId : ""}`.trim(),
            })}
            {...o}
          />
        ))}
      </div>
      <div aria-live="assertive">
        {error && (
          <SVVFormError id={errorMessageId} testId={testIds.part("error")}>
            <p>{error}</p>
          </SVVFormError>
        )}
      </div>
    </fieldset>
  );
}

SVVCheckboxGroup.displayName = "SVVCheckboxGroup";
