import { WithTestId } from "@komponentkassen/svv-testid";
import { CheckboxProps } from "./Checkbox.types";

export const CHECKBOX_DIRECTIONS = ["vertical", "horizontal"] as const;
export type CheckboxDirection = (typeof CHECKBOX_DIRECTIONS)[number];

export type CheckboxGroupProps = {
  legend: string;
  options: Array<CheckboxProps>;
  error?: string;
  direction?: CheckboxDirection;
  required?: boolean;
  popoverTitle?: string;
  popoverText?: string;
  isFullWidth?: boolean;
  removeMargin?: boolean;
  description?: string;
  sm?: boolean;
  id: string;
} & WithTestId;
