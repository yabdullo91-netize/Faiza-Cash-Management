import {useEffect,useState,useCallback} from 'react';
import {readRoute,routeHash} from '../utils/route.js';
export function useRoute() {
  const [route,setRoute]=useState(()=>readRoute(window.location.hash));
  useEffect(()=>{const change=()=>setRoute(readRoute(window.location.hash));window.addEventListener('hashchange',change);window.addEventListener('popstate',change);return()=>{window.removeEventListener('hashchange',change);window.removeEventListener('popstate',change);};},[]);
  const navigate=useCallback((changes,{replace=false}={})=>{
    const next={...readRoute(window.location.hash),...changes};
    const hash=routeHash(next);
    if(replace)window.history.replaceState(null,'',hash);else window.history.pushState(null,'',hash);
    setRoute(readRoute(hash));
  },[]);
  return [route,navigate];
}
