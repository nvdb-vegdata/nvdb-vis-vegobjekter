import { cloneElement, ForwardedRef, forwardRef, isValidElement, useContext, useId } from "react";
import classNames from "classnames";
import { WithTestId } from "@komponentkassen/svv-testid";
import { RovingIndexItem } from "@komponentkassen/svv-utils";
import { ToggleButtonProps } from "../shared.types";
import { ToggleGroupContext } from "../ToggleGroup/ToggleGroup";
import { useToggleTestId } from "./test-parts";

function SVVToggleComponent(
  props: ToggleButtonProps & WithTestId,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { activeIcon, icon, label, testId, ...rest } = props;
  const { value, ...buttonProps } = rest;

  const toggleGroup = useContext(ToggleGroupContext);
  const buttonId = `togglegroup-item-${useId()}`;
  const testIds = useToggleTestId(testId);

  return (
    <RovingIndexItem {...rest}>
      <button
        id={buttonId}
        className={classNames(
          "svv-toggle-button",
          !!icon && "svv-toggle-button--icon",
          !label && "svv-toggle-button--only-icon",
          toggleGroup.value === value && "svv-toggle-button--active",
        )}
        value={value}
        key={value}
        ref={ref}
        aria-label={value}
        role="radio"
        onClick={() => toggleGroup.onChange?.(value)}
        aria-checked={toggleGroup.value === value}
        aria-current={toggleGroup.value === value}
        type="button"
        {...buttonProps}
        data-testid={testIds.root}
      >
        {(activeIcon &&
          toggleGroup.value === value &&
          activeIcon &&
          isValidElement(activeIcon) &&
          cloneElement(activeIcon)) ||
          (icon && isValidElement(icon) && cloneElement(icon))}
        {label}
      </button>
    </RovingIndexItem>
  );
}

export const SVVToggle = forwardRef<HTMLButtonElement, ToggleButtonProps>(SVVToggleComponent);

SVVToggle.displayName = "SVVToggle";
