import classNames from "classnames";
import { ReactNode } from "react";
import { SVVConditionalWrapper } from "@komponentkassen/svv-layout";
import { SVVPopover } from "../Popover/Popover";

import { LabelProps } from "./Label.types";
import { useLabelTestId } from "./test-parts";

export function SVVLabel({
  children,
  className,
  htmlFor,
  id,
  required,
  popoverText,
  popoverTitle,
  testId,
}: LabelProps) {
  const testIds = useLabelTestId(testId);

  const wrap = !!(popoverText && popoverTitle);
  return (
    <SVVConditionalWrapper
      condition={!!(popoverText && popoverTitle)}
      // eslint-disable-next-line  @typescript-eslint/no-shadow
      renderWrapper={(children: ReactNode) => <div data-testid={testIds.root}>{children}</div>}
    >
      <label
        className={classNames("svv-form-label", className, {
          "svv-form-label--inline": popoverText,
        })}
        htmlFor={htmlFor}
        id={id}
        data-testid={wrap ? undefined : testIds.root}
      >
        {children} {required && <span aria-hidden="true"> *</span>}
      </label>
      {(popoverTitle || popoverText) && (
        <SVVPopover
          testId={testIds.part("panel")}
          title={popoverTitle}
          explanationText={popoverText}
        />
      )}
    </SVVConditionalWrapper>
  );
}

SVVLabel.displayName = "SVVLabel";
