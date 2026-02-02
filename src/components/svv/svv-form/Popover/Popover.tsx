import { isValidElement, useEffect, useId, useRef, useState } from "react";
import { PopoverProps } from "./Popover.types";
import { usePopoverTestId } from "./test-parts";

export function SVVPopover({
  explanationText,
  closeText = "Lukk",
  title,
  ariaLabel = "Ordforklaring for ",
  headingLevel = "h3",
  testId,
}: PopoverProps) {
  const [open, setOpen] = useState<boolean>(false);
  const containerId = useId();
  const testIds = usePopoverTestId(testId);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const HLevel = headingLevel;

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "escape") {
      setOpen(false);
    }
  };

  const setArrowPlacement = () => {
    const left = triggerRef.current?.offsetLeft;

    let iconPos = 3;

    if (left) {
      iconPos += left;
    }

    const popover = document.getElementById(containerId);
    popover?.style.setProperty("--icon-position", `${iconPos}px`);
  };

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscapeKey, true);
      setArrowPlacement();
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey, true);
    };
  }, [open]);

  return (
    <div className="svv-popover-container" data-testid={testIds.root}>
      <button
        ref={triggerRef}
        type="button"
        className="svv-popover-trigger"
        aria-controls={containerId}
        aria-expanded={open}
        aria-label={`${ariaLabel}${title}`}
        onClick={() => setOpen(!open)}
        data-testid={testIds.part("trigger")}
      />

      <div ref={popoverRef} id={containerId} className="svv-helptext-container" hidden={!open}>
        <div>
          {title && (
            <HLevel className="svv-h6 svv-padding-bottom--px8" style={{ fontWeight: "600" }}>
              {title}
            </HLevel>
          )}
          <button
            className="svv-popover__close-button"
            type="button"
            onClick={() => setOpen(false)}
            aria-label={closeText}
            data-testid={testIds.part("close")}
          />
        </div>
        {isValidElement(explanationText) ? explanationText : <p>{explanationText}</p>}
      </div>
    </div>
  );
}

SVVPopover.displayName = "SVVPopover";
