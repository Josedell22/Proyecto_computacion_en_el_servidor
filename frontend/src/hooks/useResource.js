import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

export function useResource(path) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: "" });
    api(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload };
}
