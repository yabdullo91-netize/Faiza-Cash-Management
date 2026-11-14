import React,{useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function Dialog({title,children,footer,busy,onClose}) {
  const ref=useRef(null),close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    ref.current.querySelector('input,select,textarea,button')?.focus();
    return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();else document.getElementById('main-title')?.focus();};
  },[]);
  function keyDown(e){
    if(e.key==='Escape'&&!busy){e.stopPropagation();close.current();}
    if(e.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }
  return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><section className="modal accessible-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onKeyDown={keyDown}><header className="modal-heading"><h2 id="dialog-title">{title}</h2><button className="icon-btn" title="Закрыть" aria-label="Закрыть диалог" disabled={busy} onClick={onClose}><X/></button></header><div className="dialog-body">{children}</div>{footer&&<footer className="dialog-footer">{footer}</footer>}</section></div>;
}
