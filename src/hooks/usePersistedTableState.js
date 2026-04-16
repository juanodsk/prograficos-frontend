import { useEffect, useState } from "react";

const buildStorageKey = (viewKey) => `prograficos:table-state:${viewKey}`;

const readPersistedTableState = (viewKey, defaults) => {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const rawValue = window.localStorage.getItem(buildStorageKey(viewKey));

    if (!rawValue) {
      return defaults;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return defaults;
    }

    return {
      ...defaults,
      ...parsedValue,
    };
  } catch {
    return defaults;
  }
};

export const usePersistedTableState = (viewKey, defaults) => {
  const [state, setState] = useState(() =>
    readPersistedTableState(viewKey, defaults),
  );

  useEffect(() => {
    setState(readPersistedTableState(viewKey, defaults));
  }, [defaults, viewKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        buildStorageKey(viewKey),
        JSON.stringify(state),
      );
    } catch {
      // Ignore storage errors and keep the UI working.
    }
  }, [state, viewKey]);

  return [state, setState];
};

export default usePersistedTableState;
