import { ForwardedRef, forwardRef } from "react";
import classNames from "classnames";
import { SVVSpinner } from "@komponentkassen/svv-spinner";
import { ButtonIconType } from "./Button.types";
import { useButtonTestId } from "./test-parts";

export const SVVButtonIcon = forwardRef<HTMLButtonElement, ButtonIconType>(
  function ButtonInternal(
    props: ButtonIconType,
    ref: ForwardedRef<HTMLButtonElement>
  ) {
    const {
      square,
      size = "sm",
      ariaLabel,
      icon,
      className,
      loading,
      loadingString,
      testId,
      ...restProps
    } = props;
    const testIds = useButtonTestId(testId);

    return (
      <button
        aria-label={ariaLabel}
        ref={ref}
        {...restProps}
        className={classNames("svv-button--icon-only", {
          "svv-button--icon-only--square": square,
          "svv-button--icon-only--md": size === "md",
          "svv-button--icon-only--lg": size === "lg",
        }, className)}
        data-testid={testIds.root}
      >
        {loading ? <SVVSpinner inline size="small" aria-label={loadingString} /> : icon}
      </button>
    )
  }
);

SVVButtonIcon.displayName = "SVVButton";
