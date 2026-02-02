import classNames from "classnames";
import { useLayoutTestId } from "../test-parts";
import { LayoutContentProps } from "./LayoutContent.types";

export function SVVLayoutContent({
  secondary = false,
  fullWidth = false,
  children,
  testId,
}: LayoutContentProps) {
  const testIds = useLayoutTestId(testId);
  return (
    <div
      className={`svv-layout__content ${classNames({
        "svv-layout__content--primary": !secondary,
        "svv-layout__content--secondary": secondary,
        "svv-layout__content--full-width": fullWidth,
      })}`}
      data-testid={testIds.root}
    >
      {children}
    </div>
  );
}

SVVLayoutContent.displayName = "SVVLayoutContent";
