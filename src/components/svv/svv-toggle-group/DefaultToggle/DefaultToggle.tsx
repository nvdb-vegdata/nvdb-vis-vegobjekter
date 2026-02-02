import { SVVToggleGroup } from "../ToggleGroup/ToggleGroup";
import { SVVToggle } from "../Toggle/Toggle";
import { DefaultToggleGroup } from "./DefaultToggle.types";

export function SVVDefaultToggleGroup({
  options,
  size = "md",
  onChange,
  label,
  defaultValue,
  fullWidth = false,
  "aria-controls": ariaControls,
  className,
  flexWrapToggleButtons = false,
  testId,
}: DefaultToggleGroup) {
  return (
    <SVVToggleGroup
      size={size}
      label={label}
      defaultValue={defaultValue}
      onChange={onChange}
      fullWidth={fullWidth}
      aria-controls={ariaControls}
      className={className}
      flexWrapToggleButtons={flexWrapToggleButtons}
      testId={testId}
    >
      {options.map((o) => {
        const { value, icon, activeIcon, ref, ...props } = o;
        return (
          <SVVToggle
            value={value}
            label={o.label}
            icon={icon}
            activeIcon={activeIcon}
            key={value}
            ref={ref}
            {...props}
          />
        );
      })}
    </SVVToggleGroup>
  );
}

SVVDefaultToggleGroup.displayName = "SVVDefaultToggleGroup";
