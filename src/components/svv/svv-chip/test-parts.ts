import { createUseTestId } from "@komponentkassen/svv-testid";

export const parts = {
  close: "close",
} as const;

export const useChipTestId = createUseTestId(parts);

