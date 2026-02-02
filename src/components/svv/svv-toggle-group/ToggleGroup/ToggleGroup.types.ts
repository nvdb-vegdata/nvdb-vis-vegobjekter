import type { HTMLAttributes } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";
import { ToggleGroupSize } from "../shared.types";

export type ToggleGroupProps = {
  defaultValue?: string;
  value?: string;
  size?: ToggleGroupSize;
  label?: string;
  fullWidth?: boolean;
  onChange?: (newVal: string) => void;
  flexWrapToggleButtons?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "value"> &
  WithTestId;

export type ToggleGroupContextProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  size?: ToggleGroupSize;
};
