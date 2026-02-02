import classNames from "classnames";
import React, { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";
import { useLayoutTestId } from "../test-parts";
import { GridSize } from "../Grid/Grid.types";
import { ResponsiveProp } from "./Stack.types";

export function getResponsiveValue<T = string>(
  componentName: string,
  componentProp: string,
  responsiveProp?: ResponsiveProp<T>,
) {
  if (!responsiveProp) {
    return {};
  }

  if (typeof responsiveProp === "string") {
    return {
      [`--__svv-${componentName}-${componentProp}-xs`]: responsiveProp,
    };
  }

  return Object.fromEntries(
    Object.entries(responsiveProp).map(([breakpointAlias, responsiveValue]) => [
      `--__svv-${componentName}-${componentProp}-${breakpointAlias}`,
      responsiveValue,
    ]),
  );
}

type StackProps = PropsWithChildren<{
  align?: ResponsiveProp<"start" | "center" | "end" | "baseline" | "stretch">;
  justify?: ResponsiveProp<
    "start" | "center" | "end" | "space-around" | "space-between" | "space-evenly"
  >;
  wrap?: boolean;
  gap?: ResponsiveProp<GridSize>;
  direction?: ResponsiveProp<"row" | "column" | "row-reverse" | "column-reverse">;
  className?: string;
  flex?: ResponsiveProp<string>;
  alignSelf?: ResponsiveProp<
    "auto" | "stretch" | "center" | "flex-start" | "flex-end" | "baseline" | "initial" | "inherit"
  >;
}> &
  React.HTMLAttributes<HTMLDivElement> &
  WithTestId;

export const SVVStack = ({
  align = "stretch",
  justify = "start",
  wrap = true,
  gap = "none",
  direction = "row",
  className,
  children,
  alignSelf,
  flex,
  testId,
  ...rest
}: StackProps) => {
  const style: React.CSSProperties = {
    ...rest.style,
    ...getResponsiveValue(`stack`, "direction", direction),
    ...getResponsiveValue(`stack`, "align", align),
    ...getResponsiveValue(`stack`, "justify", justify),
    ...getResponsiveValue(`stack`, "align-self", alignSelf),
    ...getResponsiveValue(
      `stack`,
      "gap",
      typeof gap === "string"
        ? `var(--spacing-${gap})`
        : Object.fromEntries(
            Object.entries(gap).map(([key, value]) => [key, `var(--spacing-${value})`]),
          ),
    ),
    ...getResponsiveValue(`stack`, "flex", flex),
  };
  const testIds = useLayoutTestId(testId);
  return (
    <div
      className={classNames(className, "svv-stack", {
        "svv-stack--wrap": wrap,
        "svv-stack--direction": direction,
        "svv-stack--align": align,
        "svv-stack--align-self": alignSelf,
        "svv-stack--justify": justify,
        "svv-stack--gap": gap,
        "svv-stack--flex": flex,
      })}
      style={style}
      {...rest}
      data-testid={testIds.root}
    >
      {children}
    </div>
  );
};

SVVStack.displayName = "SVVStack";
