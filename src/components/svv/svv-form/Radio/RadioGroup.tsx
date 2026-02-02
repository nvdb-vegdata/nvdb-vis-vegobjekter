import React, { useId, useState } from "react";
import classNames from "classnames";
import { Radio } from "./Radio";
import { SVVFormError } from "../FormError/FormError";
import { SVVPopover } from "../Popover/Popover";
import { RadioGroupProps } from "./RadioGroup.types";
import { useRadioTestId } from "./test-parts";

function Component({
  onChange,
  options,
  selected,
  legend,
  required = false,
  errorMessage = "",
  name,
  direction = "horizontal",
  popoverText,
  popoverTitle,
  removeMargin = false,
  isFullWidth,
  description,
  sm,
  id,
  testId,
  ...rest
}: RadioGroupProps) {
  const generatedId = useId();
  const [feilmeldingId] = useState(`feilmelding-${generatedId}`);
  const [beskrivelseId] = useState(`beskrivelse-${generatedId}`);
  const hasPopover = popoverText || popoverTitle;
  const testIds = useRadioTestId(testId);

  return (
    <fieldset
      className={classNames("svv-form-element", {
        "svv-form-element--inline": direction === "horizontal",
        "svv-form-element--with-errors": errorMessage,
        "svv-form-element--margin-bottom": !removeMargin,
        "svv-form-element--max-width": !isFullWidth,
      })}
      id={id}
      data-testid={testIds.root}
    >
      <legend className={classNames("svv-form-label", { "svv-form-label--inline": hasPopover })}>
        {legend}
        {required && <span aria-hidden="true"> *</span>}
      </legend>
      {(popoverTitle || popoverText) && (
        <SVVPopover title={popoverTitle} explanationText={popoverText} />
      )}
      {description && <p className="svv-form-description">{description}</p>}
      <div className="svv-radio-group-wrapper">
        {options.map((o) => (
          <Radio
            key={o.value}
            name={name}
            onChange={onChange}
            value={o.value}
            text={o.text}
            checked={o.value === selected}
            required={required || false}
            ariaDescribedby={
              errorMessage || description
                ? `${errorMessage ? feilmeldingId : ""} ${description ? beskrivelseId : ""}`.trim()
                : undefined
            }
            disabled={o.disabled || rest.disabled}
            description={o.description}
            description2={o.description2}
            description3={o.description3}
            ref={o.ref}
            sm={sm}
          />
        ))}
      </div>
      <div aria-live="assertive">
        {errorMessage && (
          <SVVFormError id={feilmeldingId}>
            <p>{errorMessage}</p>
          </SVVFormError>
        )}
      </div>
    </fieldset>
  );
}

export const SVVRadioGroup = Component as React.FC<RadioGroupProps>;

SVVRadioGroup.displayName = "SVVRadioGroup";
