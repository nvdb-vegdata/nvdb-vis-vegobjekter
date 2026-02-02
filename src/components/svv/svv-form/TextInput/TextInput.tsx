import classNames from "classnames";
import React, { ForwardedRef, forwardRef, useEffect, useId, useState } from "react";
import { SVVAlert } from "@komponentkassen/svv-alert";
import { SVVFormError } from "../FormError/FormError";
import { SVVLabel } from "../Label/Label";
import { Description } from "../Description/Description";

import { TextInputProps } from "./TextInput.types";
import { useTextInputTestId } from "./test-parts";

function Component(
  {
    className,
    errorMessage,
    label,
    placeholder,
    inputSize = "medium",
    id,
    required,
    type = "text",
    maxLength,
    maxLengthHelperText = "maks antall tegn er ",
    maxLengthWarning = " tegn igjen til maks er nådd.",
    value,
    onChange,
    popoverText,
    popoverTitle,
    removeMargin = false,
    isFullWidth = false,
    description,
    showWarning = false,
    testId,
    ...rest
  }: TextInputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const generatedId = useId();
  const [errorMessageId] = useState(`feilmelding-${generatedId}`);
  const [descriptionId] = useState(`beskrivelse-${generatedId}`);
  const testIds = useTextInputTestId(testId);
  const hasErrorMessage = !!errorMessage;
  const maxLengthLabel = maxLength ? `(${maxLengthHelperText} ${maxLength})` : "";
  const warningNumber = maxLength ? maxLength - 10 : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  useEffect(() => {}, [ref]);
  return (
    <div
      className={classNames(
        "svv-form-element",
        {
          "svv-form-element--margin-bottom": !removeMargin,
          "svv-form-element--max-width": !isFullWidth,
          "svv-form-element--disabled": rest.disabled,
        },
        className,
      )}
      data-testid={testIds.root}
    >
      {label && (
        <SVVLabel
          htmlFor={id}
          required={required}
          popoverText={popoverText}
          popoverTitle={popoverTitle}
          testId={testIds.part("label")}
        >
          {label} {maxLengthLabel}
        </SVVLabel>
      )}
      {description && <Description id={descriptionId} content={description} />}
      <input
        id={id}
        className={classNames("svv-form-input__text", {
          "svv-form-input__text--error": hasErrorMessage,
          "input--x-small": inputSize === "xsmall",
          "input--small": inputSize === "small",
          "input--medium": inputSize === "medium",
          "input--large": inputSize === "large",
        })}
        placeholder={placeholder}
        ref={ref}
        aria-invalid={hasErrorMessage}
        aria-describedby={
          hasErrorMessage || description
            ? `${hasErrorMessage ? errorMessageId : ""} ${description ? descriptionId : ""}`.trim()
            : undefined
        }
        required={required}
        type={type}
        value={value}
        onChange={handleChange}
        {...rest}
      />
      {maxLengthHelperText && maxLength && (
        <div>
          <p>
            {value.length}/{maxLength}
          </p>
        </div>
      )}

      <div aria-live="assertive">
        {errorMessage && (
          <SVVFormError testId={testIds.part("error")} id={errorMessageId}>
            <p>{errorMessage}</p>
          </SVVFormError>
        )}
      </div>
      <div>
        {showWarning &&
          warningNumber &&
          maxLength &&
          !errorMessage &&
          value.length > maxLength - 10 && (
            <SVVAlert type="info" testId={testIds.part("warning")}>
              {maxLength - value.length} {maxLengthWarning}
            </SVVAlert>
          )}
      </div>
    </div>
  );
}

export const SVVTextInput = forwardRef<HTMLInputElement, TextInputProps>(Component);

SVVTextInput.displayName = "SVVTextInput";
