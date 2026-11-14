import React from 'react';
export function PageState({state,onRetry,onLogin,children}) {
  if(state.status==='loading')return <section className="panel page-state" role="status" aria-live="polite"><span className="loader"/><h2>Загрузка данных…</h2><p>Финансовые показатели появятся после ответа сервера.</p></section>;
  if(state.status==='error'){const code=state.error?.status;return <section className="panel page-state" role="alert"><h2>{code===403?'Недостаточно прав':code===401?'Сеанс завершён':'Не удалось загрузить данные'}</h2><p>{state.error.message}</p><button className="button primary" onClick={code===401?onLogin:onRetry}>{code===401?'Войти повторно':'Повторить загрузку'}</button></section>;}
  return children;
}
