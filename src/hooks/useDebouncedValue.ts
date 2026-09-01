import { useEffect, useState } from "react";

/**
 * Trail a fast-changing value by `delay` ms.
 *
 * Use this for anything that feeds a query key. A raw input value in a query
 * key means one request per keystroke, because every character produces a new
 * key with no cached data; the debounced value settles once the user stops
 * typing. Keep the input itself bound to the raw state so typing stays
 * instant - only the fetch trails.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
