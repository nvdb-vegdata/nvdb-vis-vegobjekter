import { createUseTestId } from "../svv-testid";

export const parts = {
  close: "close",
} as const;

export const useChipTestId = createUseTestId(parts);

