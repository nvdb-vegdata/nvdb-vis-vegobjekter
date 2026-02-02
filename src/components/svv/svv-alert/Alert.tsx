import classNames from "classnames";
import {
  XmarkLarge,
  CircleInfoSolid,
  CircleCheckSolid,
  CircleExclamationSolid,
  CircleXmarkSolid,
} from "@komponentkassen/svv-icons";
import { WithTestId } from "@komponentkassen/svv-testid";
import { useAlertTestId } from "./test-parts";
import { AlertProps } from "./Alert.types";

function messageModifierClass(type: string) {
  switch (type) {
    case "error":
      return "svv-alert--error";
    case "warning":
      return "svv-alert--warning";
    case "info":
      return "svv-alert--info";
    case "success":
      return "svv-alert--success";
    case "infoMessage":
      return "svv-alert--infomessage";
    default:
      return "svv-alert--continousText";
  }
}

function iconForType(type: string) {
  switch (type) {
    case "error":
      return <CircleXmarkSolid className="svv-alert__icon" aria-hidden />;
    case "warning":
      return <CircleExclamationSolid className="svv-alert__icon" aria-hidden />;
    case "success":
      return <CircleCheckSolid className="svv-alert__icon" aria-hidden />;
    default:
      return <CircleInfoSolid className="svv-alert__icon" aria-hidden />;
  }
}

const CloseButton = ({
  onDismiss,
  closeText,
  testId,
}: { onDismiss: () => void; closeText: string } & WithTestId) => {
  const testIds = useAlertTestId(testId);

  return (
    <button
      className="svv-alert__close-button"
      type="button"
      onClick={onDismiss}
      data-testid={testIds.part("close")}
    >
      <XmarkLarge aria-hidden className="svv-alert__close_icon" />
      <span
        className={classNames(
          "svv-alert__close-button--text",
          !closeText && "svv-alert__close-button--text-hidden",
        )}
      >
        {closeText || "Lukk"}
      </span>
    </button>
  );
};

export function SVVAlert({
  type,
  isCenter,
  isFullWidth,
  className,
  children,
  heading,
  closeText = "",
  size = "md",
  onDismiss,
  headingLevel = "h2",
  testId,
}: AlertProps) {
  const modifierClass = messageModifierClass(type);
  const Heading = headingLevel;
  const testIds = useAlertTestId(testId);

  return (
    <div
      className={classNames(
        "svv-alert",
        `svv-alert--${size}`,
        modifierClass,
        {
          "svv-alert--center": isCenter,
          "svv-alert--fullWidth": isFullWidth,
          "svv-alert--padded": onDismiss,
        },
        className,
      )}
      data-testid={testIds.root}
    >
      {iconForType(type)}
      <div className="svv-alert__content">
        {heading && <Heading className="svv-alert__heading">{heading}</Heading>}
        {children}
      </div>
      {onDismiss && <CloseButton onDismiss={onDismiss} closeText={closeText!} testId={testId} />}
    </div>
  );
}

SVVAlert.displayName = "SVVAlert";
