import { ChangeEventHandler, ReactNode, Ref } from "react";
import { WithTestId } from "@komponentkassen/svv-testid";

type Options = {
  value: string | number;
  text: ReactNode;
  disabled?: boolean;
  description?: ReactNode;
  description2?: ReactNode;
  description3?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export type BaseType = {
  onChange: ChangeEventHandler<HTMLInputElement> | ChangeEventHandler<HTMLSelectElement>;
  options: Array<Options>;
  selected: string | number;
  legend: string;
  required?: boolean;
  errorMessage?: string;
  id: string;
} & WithTestId;
