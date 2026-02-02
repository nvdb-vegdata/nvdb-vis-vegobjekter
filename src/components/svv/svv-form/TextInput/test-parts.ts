import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  label: "label",
  error: "error",
  warning: "warning",
} as const;

export const useTextInputTestId = createUseTestId(parts);
