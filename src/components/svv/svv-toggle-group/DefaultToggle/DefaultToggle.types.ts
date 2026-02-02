import { WithTestId } from "@komponentkassen/svv-testid";
import { ToggleButtonProps, ToggleGroupSize } from "../shared.types";

export type DefaultToggleGroup = {
  options: Array<ToggleButtonProps>;
  size?: ToggleGroupSize;
  defaultValue?: string;
  fullWidth?: boolean;
  label?: string;
  onChange?: (newVal: string) => void;
  "aria-controls"?: string;
  className?: string;
  flexWrapToggleButtons?: boolean;
} & WithTestId;
