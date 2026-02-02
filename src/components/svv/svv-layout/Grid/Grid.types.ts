import React, { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const GRID_SIZES = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"] as const;
export type GridSize = (typeof GRID_SIZES)[number];

export type GridContainerProps = PropsWithChildren<{
  spacing?: GridSize;
  rowSpacing?: GridSize;
  className?: string;
}> &
  React.HTMLAttributes<HTMLDivElement> &
  WithTestId;
