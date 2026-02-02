import { PropsWithChildren } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type ButtonRowType = {
  isFormRow?: boolean;
} & PropsWithChildren &
  WithTestId;
