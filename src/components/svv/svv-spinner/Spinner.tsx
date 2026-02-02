import React from "react";
import classNames from "classnames";
import { useSpinnerTestId } from "./test-parts";
import { SpinnerProps } from "./Spinner.types";

export function SVVSpinner({
  ariaLabel,
  centered = true,
  size = "medium",
  inline = false,
  children,
  testId,
}: SpinnerProps) {
  const textId = React.useId();
  const testIds = useSpinnerTestId(testId);

  let ariaProps: { "aria-label"?: string; "aria-labelledby"?: string } = {};
  if (ariaLabel) {
    ariaProps = { "aria-label": ariaLabel };
  } else if (children) {
    ariaProps = { "aria-labelledby": textId };
  } else {
    ariaProps = { "aria-label": "Laster innhold" };
  }

  return (
    <div
      role="status"
      aria-live="polite"
      {...ariaProps}
      className={classNames("svv-spinner", {
        "svv-spinner--centered": centered,
        "svv-spinner--small": size === "small",
        "svv-spinner--large": size === "large",
        "svv-spinner--inline": inline,
      })}
      data-testid={testIds.root}
    >
      <div className="svv-spinner__circle" aria-hidden="true" />
      {children && (
        <p id={textId} className="svv-spinner__text">
          {children}
        </p>
      )}
    </div>
  );
}

SVVSpinner.displayName = "SVVSpinner";
