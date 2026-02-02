import { ReactNode } from "react";
import { SVVConditionalWrapper } from "../ConditionalWrapper/ConditionalWrapper";
import { useLayoutTestId } from "../test-parts";
import { LayoutPageTypeProps } from "./LayoutPageType.types";

export function SVVLayoutPageType({
  children,
  medium = false,
  article = false,
  testId,
}: LayoutPageTypeProps) {
  const testIds = useLayoutTestId(testId);
  return (
    <div className="svv-layout__content" data-testid={testIds.root}>
      <SVVConditionalWrapper
        condition={medium}
        // eslint-disable-next-line  @typescript-eslint/no-shadow
        renderWrapper={(children: ReactNode) => (
          <div className="svv-layout__content__medium">{children}</div>
        )}
      >
        <SVVConditionalWrapper
          condition={article}
          // eslint-disable-next-line  @typescript-eslint/no-shadow
          renderWrapper={(children: ReactNode) => (
            <div className="svv-layout__content__medium">
              <div className="svv-layout__content__article">{children}</div>
            </div>
          )}
        >
          {children}
        </SVVConditionalWrapper>
      </SVVConditionalWrapper>
    </div>
  );
}

SVVLayoutPageType.displayName = "SVVLayoutPageType";
