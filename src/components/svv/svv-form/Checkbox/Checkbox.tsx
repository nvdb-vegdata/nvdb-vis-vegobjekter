import { ForwardedRef, forwardRef, useId } from "react";
import classNames from "classnames";
import { WithTestId } from "@komponentkassen/svv-testid";
import { SVVFormError } from "../FormError/FormError";
import { CheckboxProps } from "./Checkbox.types";
import { useCheckboxTestId } from "./test-parts";

function Component(
  {
    id,
    label,
    description,
    description2,
    description3,
    sm,
    required,
    error,
    partOfGroup,
    removeMargin = false,
    isFullwidth,
    testId,
    ...rest
  }: CheckboxProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const hasDescription =
    description !== undefined || description2 !== undefined || description3 !== undefined;
  const descriptionId = useId();
  const testIds = useCheckboxTestId(testId);
  return (
    <div
      className={classNames("svv-form-checkbox-container", {
        "svv-form-checkbox-container--max-width": !isFullwidth,
        "svv-form-checkbox-container--margin-bottom": !removeMargin,
        "svv-form-element--with-errors": error,
      })}
      data-testid={testIds.root}
    >
      <input {...rest} type="checkbox" id={id} ref={ref} required={required} />
      <label
        className={classNames("svv-form-label", {
          "svv-label-grid": hasDescription,
          "svv-form-input--sm": sm,
        })}
        htmlFor={id}
      >
        {" "}
        <span>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </span>
        {hasDescription && (
          <span id={descriptionId}>
            {description && <span className="svv-label-description">{description}</span>}
            {description2 && <span className="svv-label-description">{description2}</span>}
            {description3 && <span className="svv-label-description">{description3}</span>}
          </span>
        )}
      </label>
      {!partOfGroup && (
        <div aria-live="assertive">
          {error && <SVVFormError id={`feilmelding-${id}`}>{error}</SVVFormError>}
        </div>
      )}
    </div>
  );
}

export const SVVCheckbox = forwardRef<HTMLInputElement, CheckboxProps & WithTestId>(Component);

SVVCheckbox.displayName = "SVVCheckbox";
