import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { WithTestId } from "../svv-testid";
import { ChipSize } from "./ChipGroup.types";

export type ChipProps = PropsWithChildren<{
  title: string;
  removable?: boolean;
  size?: ChipSize;
}> &
  ButtonHTMLAttributes<HTMLButtonElement> &
  WithTestId;
