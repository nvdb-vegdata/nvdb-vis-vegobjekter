import React, { forwardRef, isValidElement, cloneElement, ForwardedRef } from "react";
import { SVVSpinner } from "@komponentkassen/svv-spinner";
import classNames from "classnames";
import { ButtonCustomType } from "./Button.types";
import { useButtonTestId } from "./test-parts";

export const getCssClasses = (buttonProps: ButtonCustomType) => {
  if (buttonProps.looksLikeLink) {
    return classNames("svv-button--cancel", {
      "svv-button--cancel--has-icon": buttonProps.icon,
      "svv-button--icon-right": buttonProps.iconPlacement === "right",
    });
  }
  return classNames(
    "svv-button",
    `svv-button--${buttonProps.small ? "sm" : "md"}`,
    {
      "svv-button--secondary": buttonProps.color === "secondary",
      "svv-button--disabled": buttonProps.disabled,
      "svv-button--loading": buttonProps.loading,
      "svv-button--icon": !!buttonProps.icon,
    },
    buttonProps.className,
  );
};

/**
 * @deprecated SVVButtonCustom er fjernet i nyere versjoner, og vil bli permanent fjernet 01.03.2026.
 * Bruk SVVButton med as-attributtet for å få samme funksjonalitet.
 */
export const SVVButtonCustom = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonCustomType>(
  function ButtonInternal(
    props: ButtonCustomType,
    ref: ForwardedRef<HTMLButtonElement | HTMLAnchorElement>,
  ) {
    const {
      children,
      loading,
      icon,
      loadingString,
      // Fjern buttonType fra restProps for å unngå å rendre denne i DOM-en
      // når vi spreader rest til <Element>

      asElement,
      hrefAttribute,
      // Fjern boolske props fra restProps. React gir en warning hvis disse sendes
      // til <button> vha {...restProps}
      // eslint-disable-next-line
      small,
      // eslint-disable-next-line
      looksLikeLink,
      // eslint-disable-next-line
      iconPlacement,
      // eslint-disable-next-line
      color,
      testId,
      ...restProps
    } = props;

    const Element = asElement;
    const testIds = useButtonTestId(testId);

    return (
      <Element
        ref={ref}
        {...(hrefAttribute && props.href && { [hrefAttribute]: props.href })}
        {...restProps}
        className={getCssClasses(props)}
        data-testid={testIds.root}
      >
        {icon &&
          isValidElement(icon) &&
          cloneElement(icon as React.ReactElement, { "aria-hidden": true })}
        {loading && <SVVSpinner inline size="small" aria-label={loadingString} />}
        {children}
      </Element>
    );
  },
);

SVVButtonCustom.displayName = "SVVButtonCustom";
