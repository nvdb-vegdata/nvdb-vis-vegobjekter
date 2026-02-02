import { ButtonHTMLAttributes, ReactNode, RefObject } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export const TOGGLE_GROUP_SIZES = ["sm", "md", "lg"] as const;
export type ToggleGroupSize = (typeof TOGGLE_GROUP_SIZES)[number];

export type ToggleButtonProps = {
  label?: string;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  active?: boolean;
  value: string;
  ref?: RefObject<HTMLButtonElement>;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  WithTestId;
