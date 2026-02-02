import { WithTestId } from "@komponentkassen/svv-testid";

export type ErrorSummaryProps = {
  errorMessages: Array<{ id: string; errorMessage: string }>;
  label: string;
} & WithTestId;
