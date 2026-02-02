import {
  useState,
  forwardRef,
  createContext,
  useMemo,
  useId,
  useRef,
  useEffect,
} from "react";
import classNames from "classnames";
import { RovingIndexRoot, useMergeRefs, debounce } from "@komponentkassen/svv-utils";
import { useToggleGroupTestId } from "./test-parts";
import { ToggleGroupContextProps, ToggleGroupProps } from "./ToggleGroup.types";

export const ToggleGroupContext = createContext<ToggleGroupContextProps>({});

export const SVVToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      children,
      value,
      defaultValue,
      size = "md",
      onChange,
      label,
      className,
      fullWidth = false,
      "aria-controls": ariaControls,
      flexWrapToggleButtons = false,
      testId,
    },
    ref,
  ) => {
    const id = useId();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [collapse, setCollapse] = useState<boolean>(false);
    const mergedRef = useMergeRefs([wrapperRef, ref]);
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
    const testIds = useToggleGroupTestId(testId);

    const onValueChange = useMemo(() => {
      if (!isControlled) {
        return (newValue: string) => {
          setUncontrolledValue(newValue);
          onChange?.(newValue);
        };
      }
      return onChange;
    }, [isControlled, onChange]);

    const val = useMemo(() => {
      if (!isControlled) {
        return uncontrolledValue;
      }
      return undefined;
    }, [uncontrolledValue, isControlled]);

    const toggleGroupContextValue = useMemo(() => {
      return {
        value: val,
        defaultValue,
        onChange: onValueChange,
        size,
      };
    }, [val, defaultValue, size, onValueChange]);

    const updateCollapseStatus = useMemo(
      () =>
        debounce(() => {
          if (wrapperRef?.current && listRef?.current) {
            const distance =
              (wrapperRef?.current.clientWidth || 2) - (listRef?.current.clientWidth || 0) - 2;
            if (distance > 0) setCollapse(false);
            if (distance < 0 && !collapse) setCollapse(distance < 0);
          }
        }),
      [wrapperRef, listRef, collapse],
    );
    useEffect(() => {
      window.addEventListener("resize", updateCollapseStatus);

      return () => {
        window.removeEventListener("resize", updateCollapseStatus);
        updateCollapseStatus.clear();
      };
    }, [wrapperRef, listRef, collapse, updateCollapseStatus]);

    useEffect(() => {
      updateCollapseStatus();
    });

    return (
      <div className="svv-toggle-group-wrapper" ref={mergedRef} data-testid={testIds.root}>
        {label && (
          <div
            id={`toggle-group-label${id}`}
            className={classNames("svv-toggle-group-label", `svv-toggle-group-label--${size}`)}
            data-testid={testIds.part("label")}
          >
            {label}
          </div>
        )}
        <ToggleGroupContext.Provider value={toggleGroupContextValue}>
          <RovingIndexRoot
            className={classNames(
              className,
              "svv-toggle-button-group",
              `svv-toggle-button-group--${size}`,
              fullWidth && "svv-toggle-button-group-full-width",
              flexWrapToggleButtons && collapse && "svv-toggle-button-group-flex-wrap",
            )}
            role="radiogroup"
            aria-describedby={label && `toggle-group-label${id}`}
            aria-controls={ariaControls || undefined}
            ref={listRef}
          >
            {children}
          </RovingIndexRoot>
        </ToggleGroupContext.Provider>
      </div>
    );
  },
);

SVVToggleGroup.displayName = "SVVToggleGroup";
