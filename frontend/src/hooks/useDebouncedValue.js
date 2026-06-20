// useDebouncedValue.js
// ====================
// Returns a debounced copy of a value. Used by the composer to run the live
// continuity preview only after the user pauses typing.

import { useEffect, useState } from 'react';

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
