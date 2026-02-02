/*
The debounce function can be used to skip function execution if a function is called too many times over a periode.
*/

export function debounce(func: any, wait = 100) {
    let timeout: ReturnType<typeof setTimeout>;
    function debouncedFunc(this: any, ...args: any) {
      const later = () => {
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    }
  
    debouncedFunc.clear = () => {
      clearTimeout(timeout);
    };
  
    return debouncedFunc;
  }