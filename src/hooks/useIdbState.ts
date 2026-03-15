"use client";

import { useState, useEffect } from "react";
import { get, set, createStore } from "idb-keyval";

const customStore = createStore("STANDLO", "preferences");

export function useIdbState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    get(key, customStore).then((val) => {
      if (val !== undefined) {
        setState(val as T);
      } else {
        // save the initial pattern
        set(key, initialValue, customStore).catch(console.error);
      }
      setIsReady(true);
    }).catch((err) => {
      console.error(`Failed reading IDB key [${key}]`, err);
      setIsReady(true);
    });
  }, [key, initialValue]);

  // Provide a setter that also updates IDB
  const setPersistedState = (newValue: T | ((prev: T) => T)) => {
    setState((current) => {
      const computedValue = newValue instanceof Function ? newValue(current) : newValue;
      set(key, computedValue, customStore).catch(console.error);
      return computedValue;
    });
  };

  return [state, setPersistedState, isReady] as const;
}
