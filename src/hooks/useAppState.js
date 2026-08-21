import { useEffect, useReducer, useRef } from "react";
import { load, save } from "../lib/storage";
import { reducer } from "../lib/reducer";

export function useAppState() {
  const [data, dispatch] = useReducer(reducer, null, () => load(window.localStorage));
  const t = useRef(null);
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => save(window.localStorage, data), 250);
    return () => clearTimeout(t.current);
  }, [data]);
  return [data, dispatch];
}
