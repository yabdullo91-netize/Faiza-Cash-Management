import {userContract} from './contracts.js';
let accessToken = null;
let refreshing;
export const setToken = value => { accessToken = value; };
async function refresh() {
  refreshing ??= fetch('/api/auth/refresh', {method:'POST',credentials:'include',headers:{'X-Faiza-Request':'1'}}).then(async r=>{if(!r.ok) {setToken(null); throw new ApiError('Сеанс завершён. Войдите в систему повторно.',401);} const data=await r.json(); const user=userContract(data.user); accessToken=data.accessToken; return user;}).finally(()=>{refreshing=null;});
  return refreshing;
}
export const restoreSession=refresh;
export class ApiError extends Error { constructor(message,status=0,errors={}) {super(message);this.name='ApiError';this.status=status;this.errors=errors;} }
export async function api(path,{method='GET',body,raw=false,retry=true,signal}={}) {
  let r;
  try {r=await fetch('/api'+path,{method,signal,credentials:'include',headers:{'X-Faiza-Request':'1',...(body?{'Content-Type':'application/json'}:{}),...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},body:body?JSON.stringify(body):undefined});}
  catch(error){if(error.name==='AbortError')throw error;throw new ApiError('Сервер недоступен. Проверьте соединение и повторите попытку.');}
  if(r.status===401 && retry && !path.startsWith('/auth/')) { await refresh(); return api(path,{method,body,raw,retry:false,signal}); }
  if(!r.ok) { const p=await r.json().catch(()=>({})); throw new ApiError(p.detail || ({400:'Проверьте введённые данные.',401:'Сеанс завершён. Войдите повторно.',403:'Недостаточно прав для этого действия.',404:'Запись не найдена.',409:'Данные уже изменены. Обновите страницу.',429:'Слишком много запросов. Повторите позже.'}[r.status]) || 'Не удалось выполнить запрос. Повторите попытку.',r.status,p.errors); }
  return raw ? r.blob() : r.status===204 ? null : r.json();
}
export async function download(path,name) { const blob=await api(path,{raw:true}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
