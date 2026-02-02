import { ReactNode } from "react";
import classNames from "classnames";
import { SVVConditionalWrapper } from "../ConditionalWrapper/ConditionalWrapper";
import { useLayoutTestId } from "../test-parts";
import { LayoutBannerProps } from "./LayoutBanner.types";

export function SVVLayoutBanner({
  secondary = false,
  noPaddingTop = false,
  medium = false,
  children,
  testId,
}: LayoutBannerProps) {
  const testIds = useLayoutTestId(testId);
  return (
    <div
      className={`svv-layout__banner ${classNames({
        "svv-layout__banner--primary": !secondary,
        "svv-layout__banner--secondary": secondary,
        "svv-layout__banner--no-padding-top": noPaddingTop,
      })}`}
      data-testid={testIds.root}
    >
      <div className="svv-layout__content">
        <SVVConditionalWrapper
          condition={medium}
          // eslint-disable-next-line  @typescript-eslint/no-shadow
          renderWrapper={(children: ReactNode) => (
            <div className="svv-layout__content__medium">{children}</div>
          )}
        >
          {children}
        </SVVConditionalWrapper>
      </div>
    </div>
  );
}

SVVLayoutBanner.displayName = "SVVLayoutBanner";
