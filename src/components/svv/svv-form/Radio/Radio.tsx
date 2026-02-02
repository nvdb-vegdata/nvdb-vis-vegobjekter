import { ForwardedRef, forwardRef, useId } from "react";
import classNames from "classnames";

import { RadioProps } from "./Radio.types";
import { useRadioTestId } from "./test-parts";

function Component(
  {
    text,
    description,
    description2,
    description3,
    ariaDescribedby,
    sm,
    testId,
    ...rest
  }: RadioProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const id = useId();
  const textId = useId();
  const descriptionId = useId();
  const testIds = useRadioTestId(testId);

  const hasDescription =
    description !== undefined || description2 !== undefined || description3 !== undefined;
  const describedByIds = [];

  if (hasDescription) {
    describedByIds.push(descriptionId);
  }

  if (ariaDescribedby) {
    describedByIds.push(ariaDescribedby);
  }

  return (
    <div className="svv-form-radio-container" data-testid={testIds.root}>
      <input
        type="radio"
        id={id}
        aria-labelledby={textId}
        ref={ref}
        {...(describedByIds.length > 0 && { "aria-describedby": describedByIds.join(" ") })}
        {...rest}
      />
      <label
        className={classNames("svv-form-label", {
          "svv-label-grid": hasDescription,
          "svv-form-input--sm": sm,
        })}
        htmlFor={id}
      >
        <span id={textId} {...(hasDescription && { "aria-hidden": true })}>
          {text}
        </span>
        {hasDescription && (
          <span id={descriptionId}>
            {description && <span className="svv-label-description">{description}</span>}
            {description2 && <span className="svv-label-description">{description2}</span>}
            {description3 && <span className="svv-label-description">{description3}</span>}
          </span>
        )}
      </label>
    </div>
  );
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(Component);

Radio.displayName = "Radio";
