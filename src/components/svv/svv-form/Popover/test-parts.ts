import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  close: "close",
  trigger: "trigger",
} as const;

export const usePopoverTestId = createUseTestId(parts);
