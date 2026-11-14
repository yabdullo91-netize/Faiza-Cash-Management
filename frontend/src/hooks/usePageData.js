import {useEffect, useRef, useState} from 'react';
import {pageSnapshot} from '../services/contracts.js';

export function usePageData(key, loader, enabled = true) {
  const [snapshot, setSnapshot] = useState({key:null, status:'loading', data:null, error:null});
  const latestLoader = useRef(loader);
  latestLoader.current = loader;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let current = true;
    setSnapshot({key, status:'loading', data:null, error:null});
    const timer = setTimeout(async () => {
      try {
        const data = await latestLoader.current(controller.signal);
        if (current) setSnapshot({key, status:'success', data, error:null});
      } catch (error) {
        if (current && error.name !== 'AbortError') setSnapshot({key, status:'error', data:null, error});
      }
    }, 140);
    return () => { current = false; clearTimeout(timer); controller.abort(); };
  }, [key, enabled]);
  return pageSnapshot(snapshot, key);
}
