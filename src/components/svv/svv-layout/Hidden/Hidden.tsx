import { useLayoutEffect, useState } from "react";
import { breakpointValues, HiddenProps } from "./Hidden.types";

export const SVVHidden = ({ children, above, below }: HiddenProps) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useLayoutEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (
    (above && screenWidth > breakpointValues[above]) ||
    (below && screenWidth < breakpointValues[below])
  ) {
    return null;
  }

  return children;
};

SVVHidden.displayName = "SVVHidden";
