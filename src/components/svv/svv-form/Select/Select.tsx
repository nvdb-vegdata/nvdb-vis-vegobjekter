import { ForwardedRef, forwardRef, useId, useState } from "react";
import classNames from "classnames";
import { SVVFormError } from "../FormError/FormError";
import { Description } from "../Description/Description";
import { SVVLabel } from "../Label/Label";
import { SelectProps } from "./Select.types";
import { useSelectTestId } from "./test-parts";

function Component(
  {
    selected,
    options,
    legend,
    emptyChoiceText,
    id,
    errorMessage,
    required,
    selectSize,
    popoverText,
    popoverTitle,
    removeMargin = false,
    isFullWidth = false,
    description,
    testId,
    ...rest
  }: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  const generatedId = useId();
  const [descriptionId] = useState(`beskrivelse-${generatedId}`);
  const [errorMessageId] = useState(`errormessage-${generatedId}`);
  const testIds = useSelectTestId(testId);

  const cssClass = classNames("svv-form-input__select", {
    "input--x-small": selectSize === "xSmall",
    "input--small": selectSize === "small",
    "input--medium": selectSize === "medium",
    "svv-form-input__text--error": errorMessage,
  });

  return (
    <div
      className={classNames("svv-form-element", {
        "svv-form-element--max-width": !isFullWidth,
        "svv-form-element--margin-bottom": !removeMargin,
      })}
      data-testid={testIds.root}
    >
      <SVVLabel
        htmlFor={id}
        popoverTitle={popoverTitle}
        popoverText={popoverText}
        required={required}
        testId={testIds.part("label")}
      >
        {legend}
      </SVVLabel>
      {description && <Description id={descriptionId} content={description} />}
      <select
        name="bestill-for"
        id={id}
        value={selected}
        aria-describedby={
          errorMessage || description
            ? `${errorMessage ? errorMessageId : ""} ${description ? descriptionId : ""}`.trim()
            : undefined
        }
        required={required}
        ref={ref}
        {...rest}
        {...(errorMessage && { className: "svv-form-input__text--error" })}
        {...(cssClass && { className: cssClass })}
      >
        {emptyChoiceText && <option value="">{emptyChoiceText}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} {...(o.disabled && { disabled: true })}>
            {o.text}
          </option>
        ))}
      </select>
      {errorMessage && (
        <SVVFormError id={errorMessageId} testId={testIds.part("error")}>
          <p>{errorMessage}</p>
        </SVVFormError>
      )}
    </div>
  );
}

export const SVVSelect = forwardRef<HTMLSelectElement, SelectProps>(Component);

SVVSelect.displayName = "SVVSelect";
