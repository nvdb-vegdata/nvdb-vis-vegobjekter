import { CircleXmarkSolid } from "@komponentkassen/svv-icons";
import { ErrorSummaryProps } from "./ErrorSummary.types";
import { useErrorSummaryTestId } from "./test-parts";

export function SVVErrorSummary({ errorMessages, label, testId }: ErrorSummaryProps) {
  const testIds = useErrorSummaryTestId(testId);

  return (
    <div className="svv-form-error-summary editorial" data-testid={testIds.root}>
      <CircleXmarkSolid className="svv-form-error-summary--icon" />
      <div>
        <p>{label}</p>
        <ul>
          {errorMessages.map((m) => (
            <li key={m.id}>
              <a href={`#${m.id}`} className="svv-form-error-summary--link">
                {m.errorMessage}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

SVVErrorSummary.displayName = "SVVErrorSummary";
