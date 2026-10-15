import { useCallback, useEffect, useRef, useState } from "react";
import { get } from "../services/api";
import { errMsg } from "../utils/format";

/** Fetch + loading/error state. `params` changes (deep) trigger a refetch. Pass url=null to skip. */
export default function useFetch(url, params) {
  const [state, setState] = useState({ data: null, loading: !!url, error: null });
  const key = JSON.stringify([url, params]);
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!url) return;
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await get(url, params);
      if (id === seq.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (id === seq.current) setState({ data: null, loading: false, error: errMsg(e, "Couldn't load this.") });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
