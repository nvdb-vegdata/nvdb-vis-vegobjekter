import { useLayoutTestId } from "../test-parts";
import { LayoutPageWrapperProps } from "./LayoutPageWrapper.types";

export function SVVLayoutPageWrapper({
  secondary = false,
  children,
  testId,
}: LayoutPageWrapperProps) {
  const testIds = useLayoutTestId(testId);
  return (
    <div
      className={`svv-layout__page-wrapper svv-layout__page-wrapper--${
        secondary ? "secondary" : "primary"
      }`}
      data-testid={testIds.root}
    >
      {children}
    </div>
  );
}

SVVLayoutPageWrapper.displayName = "SVVLayoutPageWrapper";
