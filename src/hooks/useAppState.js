import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { load, save } from "../lib/storage";
import { reducer } from "../lib/reducer";

// The store plus the health of the last write. A save that fails (quota full,
// storage blocked) must never pass unnoticed — the UI shows saveError until a
// later write succeeds.
export function useAppState() {
  const [data, dispatch] = useReducer(reducer, null, () => load(window.localStorage));
  const [saveError, setSaveError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const result = save(window.localStorage, data);
      setSaveError(prev => {
        if (result.ok) return null;
        // keep the first failure's details; they don't change between retries
        return prev && prev.reason === result.reason ? prev : result;
      });
    }, 250);
    return () => clearTimeout(timer.current);
  }, [data]);

  // Force an immediate write, e.g. right after the user frees up space.
  const retrySave = useCallback(() => {
    const result = save(window.localStorage, data);
    setSaveError(result.ok ? null : result);
    return result.ok;
  }, [data]);

  return [data, dispatch, { saveError, retrySave }];
}
