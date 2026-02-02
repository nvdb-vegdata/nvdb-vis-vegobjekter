import {
  forwardRef,
  ForwardedRef,
  ElementType,
  ComponentPropsWithRef,
  RefAttributes,
  ForwardRefExoticComponent,
} from "react";
import classNames from "classnames";
import { CancelButtonType } from "./Button.types";
import { useButtonTestId } from "./test-parts";

type ButtonProps<T extends ElementType> = CancelButtonType<T> &
  Omit<ComponentPropsWithRef<T>, keyof CancelButtonType<T>>;

const SVVButtonCancelInner = <T extends ElementType = "a">(
  props: ButtonProps<T>,
  ref?: ForwardedRef<any>,
) => {
  const { children, asElement, hrefAttribute, className, as, testId, href, ...restProps } = props;

  const Element = asElement ?? as ?? "a";
  const testIds = useButtonTestId(testId);

  return (
    <div className="cancel-button-container" data-testid={testIds.root}>
      {asElement !== undefined ? (
        <Element
          {...(hrefAttribute && href && { [hrefAttribute]: href })}
          {...restProps}
          ref={ref}
          className={classNames("svv-button--cancel", className)}
        >
          {children}
        </Element>
      ) : (
        <Element {...restProps} ref={ref} className={classNames("svv-button--cancel", className)}>
          {children}
        </Element>
      )}
    </div>
  );
};

/**
 * @deprecated SVVButtonCancel er fjernet i nyere versjoner, og vil bli permanent fjernet 01.03.2026.
 * Bruk SVVLink istedenfor.
 */
export const SVVButtonCancel = forwardRef(SVVButtonCancelInner) as ForwardRefExoticComponent<
  ButtonProps<any> & RefAttributes<any>
>;

SVVButtonCancel.displayName = "SVVButtonCancel";
