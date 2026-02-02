import React, { PropsWithChildren } from "react";
import classNames from "classnames";
import { WithTestId } from "@komponentkassen/svv-testid";
import { useLayoutTestId } from "../test-parts";
import { GridContainerProps } from "./Grid.types";

export const SVVGridContainer = ({
  spacing = "sm",
  rowSpacing,
  className,
  children,
  testId,
  ...rest
}: GridContainerProps) => {
  const Element = "div";
  const testIds = useLayoutTestId(testId);
  return (
    <Element
      className={classNames("svv-grid", className)}
      style={{
        columnGap: `var(--spacing-${spacing})`,
        rowGap: `var(--spacing-${rowSpacing ?? spacing})`,
      }}
      {...rest}
      data-testid={testIds.root}
    >
      {children}
    </Element>
  );
};

SVVGridContainer.displayName = "SVVGridContainer";

type GridItemSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type GridItemProps = PropsWithChildren<{
  xs?: GridItemSize;
  sm?: GridItemSize;
  md?: GridItemSize;
  lg?: GridItemSize;
  xl?: GridItemSize;
  className?: string;
}> &
  React.HTMLAttributes<HTMLDivElement> &
  WithTestId;

export const SVVGridItem = ({
  xs = 12,
  sm,
  md,
  lg,
  xl,
  className,
  children,
  testId,
  ...rest
}: GridItemProps) => {
  const testIds = useLayoutTestId(testId);
  return (
    <div
      className={classNames(className, "svv-grid-item", {
        [`svv-grid-item--xs-${xs}`]: xs,
        [`svv-grid-item--sm-${sm}`]: sm,
        [`svv-grid-item--md-${md}`]: md,
        [`svv-grid-item--lg-${lg}`]: lg,
        [`svv-grid-item--xl-${xl}`]: xl,
      })}
      {...rest}
      data-testid={testIds.root}
    >
      {children}
    </div>
  );
};

SVVGridItem.displayName = "SVVGridItem";
