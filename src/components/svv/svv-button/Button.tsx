import {
  forwardRef,
  isValidElement,
  cloneElement,
  ForwardedRef,
  type ElementType,
  type ComponentPropsWithRef,
  RefAttributes,
  ForwardRefExoticComponent,
} from "react";

import { SVVSpinner } from "@komponentkassen/svv-spinner";
import classNames from "classnames";
import { ButtonType } from "./Button.types";
import { useButtonTestId } from "./test-parts";

type ButtonProps<T extends ElementType> = ButtonType<T> &
  Omit<ComponentPropsWithRef<T>, keyof ButtonType<T>>;

const getCssClasses = <T extends ElementType>(buttonProps: ButtonProps<T>): string => {
  if (buttonProps.looksLikeLink) {
    return classNames("svv-button--cancel", {
      "svv-button--cancel--has-icon": buttonProps.icon,
      "svv-button--icon-right": buttonProps.iconPlacement === "right",
    });
  }
  return classNames(
    "svv-button",
    `svv-button--${buttonProps.size}`,
    `svv-button--${buttonProps.color}`,
    {
      "svv-button--disabled": buttonProps.disabled,
      "svv-button--loading": buttonProps.loading,
      "svv-button--icon": !!buttonProps.icon,
    },
    buttonProps.className,
  );
};

const SVVButtonInner = <T extends ElementType = "button">(
  props: ButtonProps<T>,
  ref?: ForwardedRef<any>,
) => {
  const {
    children,
    loading,
    icon,
    iconPlacement = "left",
    loadingString,
    size = "md",
    color = "primary",
    as,
    testId,
    ...restProps
  } = props as ButtonProps<T>;
  const Component = as || "button";
  const testIds = useButtonTestId(testId);

  return (
    <Component
      ref={ref}
      type={Component === "button" && !restProps.type ? "button" : restProps.type}
      {...restProps}
      className={getCssClasses({ ...props, color, size })}
      data-testid={testIds.root}
    >
      {icon &&
        iconPlacement === "left" &&
        (!loading || children) &&
        isValidElement(icon) &&
        cloneElement(icon, { "aria-hidden": true })}
      {children}
      {icon &&
        iconPlacement === "right" &&
        (!loading || children) &&
        isValidElement(icon) &&
        cloneElement(icon, { "aria-hidden": true })}
      {loading && <SVVSpinner inline size="small" aria-label={loadingString} />}
    </Component>
  );
};

export const SVVButton = forwardRef(SVVButtonInner) as ForwardRefExoticComponent<
  ButtonProps<any> & RefAttributes<any>
>;

SVVButton.displayName = "SVVButton";
