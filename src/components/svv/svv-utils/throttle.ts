// Throttle function to limit how often a function can be called within a specified time frame.
// This throttle also implements "trailing" behavior to ensure the last call is executed after the limit period.
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  trailing: boolean = false,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout | undefined;
  let lastRan: number | undefined;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else if (trailing) {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        () => {
          if (lastRan && Date.now() - lastRan >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        },
        lastRan ? limit - (Date.now() - lastRan) : limit,
      );
    }
  };
};
