import React from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

export type FormErrorProps = React.PropsWithChildren<{
  className?: string;
  id?: string;
}> &
  WithTestId;
