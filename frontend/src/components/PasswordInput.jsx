import React,{useRef,useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';

export function PasswordInput(props) {
  const [visible,setVisible]=useState(false);
  const inputRef=useRef(null);
  const toggle=()=>{
    setVisible(value=>!value);
    inputRef.current?.focus({preventScroll:true});
  };
  const Icon=visible?EyeOff:Eye;
  return <span className="password-input">
    <input {...props} ref={inputRef} type={visible?'text':'password'}/>
    <button className="password-visibility" type="button" aria-label={visible?'Скрыть пароль':'Показать пароль'} aria-pressed={visible} onClick={toggle}>
      <Icon aria-hidden="true" size={19}/>
    </button>
  </span>;
}
