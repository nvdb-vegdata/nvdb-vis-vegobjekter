import { SVVAlert } from "@komponentkassen/svv-alert";
import classNames from "classnames";
import React, { ForwardedRef, forwardRef, useEffect, useId, useMemo, useState } from "react";
import { SVVFormError } from "../FormError/FormError";
import { SVVLabel } from "../Label/Label";
import { Description } from "../Description/Description";
import { TextAreaProps } from "./TextArea.types";
import { useTextAreaTestId } from "./test-parts";

function Component(
  {
    className,
    errorMessage,
    label,
    placeholder,
    id,
    required,
    maxLength,
    maxLengthHelperText = "maks antall tegn er ",
    maxLengthWarning = " tegn igjen til maks er nådd.",
    aboveMaxLengthWarning,
    value,
    onChange,
    popoverText,
    popoverTitle,
    isFullWidth = false,
    description,
    hideWarning = false,
    testId,
    ...rest
  }: TextAreaProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  const generatedId = useId();
  const [errorMessageId] = useState(`feilmelding-${generatedId}`);
  const [descriptionId] = useState(`beskrivelse-${generatedId}`);
  const testIds = useTextAreaTestId(testId);
  const hasErrorMessage = !!errorMessage;
  const maxLengthLabel = maxLength ? `(${maxLengthHelperText} ${maxLength})` : "";
  const warningNumber = maxLength ? maxLength - 10 : null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
  };

  const { showWarning, warningMessage } = useMemo(() => {
    let show = false;
    let message = "";
    if (maxLength) {
      if (
        !hideWarning &&
        warningNumber &&
        maxLength &&
        !errorMessage &&
        value.length > maxLength - 10
      ) {
        show = true;
        message = `${maxLength - value.length} ${maxLengthWarning}`;
      }

      if (value.length > maxLength) {
        message = aboveMaxLengthWarning || `Maks antall tegn er ${maxLength}`;
      }
    }

    return {
      showWarning: show,
      warningMessage: message,
    };
  }, [
    hideWarning,
    warningNumber,
    maxLength,
    errorMessage,
    value,
    aboveMaxLengthWarning,
    maxLengthWarning,
  ]);

  useEffect(() => {}, [ref]);
  return (
    <div
      className={classNames(
        "svv-form-element",
        { "svv-form-element--max-width": !isFullWidth },
        { "svv-form-element--disabled": rest.disabled },
        className,
      )}
      data-testid={testIds.root}
    >
      {label && (
        <SVVLabel
          htmlFor={id}
          required={required}
          popoverTitle={popoverTitle}
          popoverText={popoverText}
          testId={testIds.part("label")}
        >
          {label} {maxLengthLabel}
        </SVVLabel>
      )}
      {description && <Description id={descriptionId} content={description} />}
      <textarea
        id={id}
        className={classNames("svv-form-input__text", {
          "svv-form-input__text--error": hasErrorMessage,
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
          <SVVFormError id={errorMessageId} testId={testIds.part("error")}>
            <p>{errorMessage}</p>
          </SVVFormError>
        )}
      </div>
      <div>
        {showWarning && (
          <SVVAlert type="info" testId={testIds.part("warning")}>
            {warningMessage}
          </SVVAlert>
        )}
      </div>
    </div>
  );
}

export const SVVTextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(Component);

SVVTextArea.displayName = "SVVTextArea";
