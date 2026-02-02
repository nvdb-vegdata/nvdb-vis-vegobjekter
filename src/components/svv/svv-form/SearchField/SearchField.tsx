import { MagnifyingGlass } from "@komponentkassen/svv-icons";
import classNames from "classnames";
import React, { ReactNode, useId, useState } from "react";
import { SVVFormError } from "../FormError/FormError";
import { SVVLabel } from "../Label/Label";
import { Description } from "../Description/Description";
import { SVVConditionalWrapper } from "../ConditionalWrapper/ConditionalWrapper";
import { SearchFieldProps } from "./SearchField.types";
import { useSearchFieldTestId } from "./test-parts";

export function SVVSearchField({
  id,
  label,
  onSearch,
  className,
  errorMessage,
  inputSize = "medium",
  placeholder,
  required,
  popoverText,
  popoverTitle,
  searchText,
  buttonText = "Søk",
  description,
  wrapInFormTag = true,
  onTextChange,
  testId,
  ...rest
}: SearchFieldProps) {
  const generatedId = useId();
  const [errorMessageId] = useState(`feilmelding-${generatedId}`);
  const [descriptionId] = useState(`beskrivelse-${generatedId}`);
  const hasErrorMessage = !!errorMessage;
  const [text, setText] = useState(searchText || "");
  const testIds = useSearchFieldTestId(testId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(text);
  };

  return (
    <SVVConditionalWrapper
      condition={wrapInFormTag}
      renderWrapper={(children: ReactNode) => (
        <form onSubmit={handleSubmit} noValidate data-testid={testIds.root}>
          {children}
        </form>
      )}
    >
      <div
        className={classNames("svv-search-field", className)}
        {...(!wrapInFormTag && { "data-testid": testIds.root })}
      >
        {label && (
          <SVVLabel
            htmlFor={id}
            required={required}
            popoverText={popoverText}
            popoverTitle={popoverTitle}
            testId={testIds.part("label")}
          >
            {label}
          </SVVLabel>
        )}
        {description && <Description id={descriptionId} content={description} />}
        <div className="svv-search-field__container">
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
            aria-invalid={hasErrorMessage}
            aria-describedby={
              hasErrorMessage || description
                ? `${hasErrorMessage ? errorMessageId : ""} ${description ? descriptionId : ""}`.trim()
                : undefined
            }
            required={required}
            type="search"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (onTextChange) {
                onTextChange(e.target.value);
              }
              setText(e.target.value);
            }}
            value={text}
            onKeyDown={(key) => {
              if (!wrapInFormTag && key.code === "Enter") {
                onSearch(text);
              }
            }}
            {...rest}
          />
          <button
            className="svv-button"
            type={wrapInFormTag ? "submit" : "button"}
            onClick={() => {
              if (!wrapInFormTag) {
                onSearch(text);
              }
            }}
            disabled={rest.disabled}
            data-testid={testIds.part("trigger")}
          >
            <MagnifyingGlass />
            <span className="svv-search-field__text">{buttonText}</span>
          </button>
        </div>
        <div aria-live="assertive">
          {errorMessage && (
            <SVVFormError id={errorMessageId} testId={testIds.part("error")}>
              <p>{errorMessage}</p>
            </SVVFormError>
          )}
        </div>
      </div>
    </SVVConditionalWrapper>
  );
}

SVVSearchField.displayName = "SVVSearchField";
