import { HTMLAttributes } from "react";
import { WithTestId } from "../svv-testid";

export const CHIP_SIZES = ["sm", "md", "lg"] as const;
export type ChipSize = (typeof CHIP_SIZES)[number];

export type ChipGroupProps = {
  size?: ChipSize;
} & HTMLAttributes<HTMLUListElement> &
  WithTestId;

export type ChipGroupContextProps = Pick<ChipGroupProps, "size">;
