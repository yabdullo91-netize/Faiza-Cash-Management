import React,{useEffect,useRef,useState} from 'react';
import {LayoutDashboard,ArrowLeftRight,Wallet,Users,Tags,ChartNoAxesCombined,ShieldCheck,Settings,LogOut,Plus,ArrowUpRight,Sun,Moon,X,Menu,Building2,Check} from 'lucide-react';
import {api,ApiError,setToken,restoreSession,download} from '../services/api.js';
import {userContract,usersPageContract} from '../services/contracts.js';
import {usePageData} from '../hooks/usePageData.js';
import {useRoute} from '../hooks/useRoute.js';
import {operationParams} from '../utils/route.js';
import {rolesText,records} from '../utils/format.js';
import {Brand,Empty,CashCard,Field} from '../components/ui';
import {Dialog} from '../components/Dialog';
import {PageState} from '../components/PageState';
import {ErrorBoundary} from '../components/ErrorBoundary';
import {OperationDialog} from '../components/OperationDialog';
import {FinanceFilters,FinanceStats,FinanceCharts} from '../components/FinancePanels';
import {OperationsTable,OperationFilters} from '../components/OperationsTable';
import {Login,PasswordChange,PasswordForm} from '../pages/Login';
import {UsersPage} from '../pages/UsersPage';
import {ReportsPage} from '../pages/ReportsPage';
import {AuditFilters} from '../components/AuditFilters';
import {AuditPage} from '../pages/AuditPage';

const navigation=[
  {label:'Работа с деньгами',items:[['overview','Обзор',LayoutDashboard],['operations','Операции',ArrowLeftRight],['reports','Отчёты',ChartNoAxesCombined]]},
  {label:'Справочники',items:[['cashboxes','Кассы',Wallet],['counterparties','Контрагенты',Users],['categories','Категории',Tags]]},
  {label:'Администрирование',items:[['audit','Журнал аудита',ShieldCheck],['users','Пользователи',Users],['settings','Настройки',Settings]]}
];
const titles=Object.fromEntries(navigation.flatMap(g=>g.items.map(([id,title])=>[id,title])));
const subtitles={overview:'Остатки и движение наличных по проведённым документам.',operations:'Черновики и проведённые кассовые документы.',reports:'Движение денег, категории и учебная кассовая книга.',cashboxes:'Доступные кассы и текущие остатки.',counterparties:'Клиенты, поставщики и сотрудники.',categories:'Категории прихода и расхода.',audit:'Кто, когда и какое действие выполнил.',users:'Сотрудники, роли и доступ к кассам.',settings:'Параметры организации и вашей учётной записи.'};
export default function App(){
  const [user,setUser]=useState(null),[boot,setBoot]=useState(true),[route,navigate]=useRoute();
  const [revision,setRevision]=useState(0),[modal,setModal]=useState(null),[busy,setBusy]=useState(false),[busyLabel,setBusyLabel]=useState(''),[formError,setFormError]=useState(''),[actionError,setActionError]=useState(''),[notice,setNotice]=useState(''),[mobile,setMobile]=useState(false),[theme,setTheme]=useState(()=>localStorage.getItem('faiza-theme')||'light');
  const pending=useRef(false);
  const admin=Boolean(user?.roles.includes('admin')),accountant=admin||Boolean(user?.roles.includes('accountant')),auditAllowed=accountant||Boolean(user?.roles.some(r=>['manager','auditor'].includes(r))),canWrite=accountant||Boolean(user?.roles.includes('cashier'));
  const enabled=Boolean(user&&!user.mustChangePassword);
  useEffect(()=>{let active=true;restoreSession().then(u=>active&&setUser(u)).catch(()=>{}).finally(()=>active&&setBoot(false));return()=>{active=false;};},[]);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('faiza-theme',theme);},[theme]);
  useEffect(()=>{setActionError('');setMobile(false);setModal(null);},[route.page]);
  useEffect(()=>{
    if(!mobile)return;
    const overflow=document.body.style.overflow,previous=document.activeElement;
    document.body.style.overflow='hidden';document.querySelector('.sidebar a.active')?.focus();
    const close=e=>{if(e.key==='Escape')setMobile(false);};document.addEventListener('keydown',close);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',close);if(previous?.isConnected)previous.focus();};
  },[mobile]);
  const refresh=()=>setRevision(v=>v+1);
  const resources=usePageData('resources:'+user?.id+':'+revision,async signal=>{
    const [boxes,categories,parties,org,roles,access,auditOptions]=await Promise.all([...['/cashboxes','/categories','/counterparties','/settings','/roles'].map(path=>api(path,{signal})),admin?api('/access',{signal}):Promise.resolve([]),auditAllowed?api('/audit/options',{signal}):Promise.resolve(null)]);
    return {boxes,categories,parties,org,roles,access,auditOptions};
  },enabled);
  const refs=resources.data||{boxes:[],categories:[],parties:[],org:{name:'ООО «Фаиза»',currency:'TJS'},roles:[]};
  useEffect(()=>{if(resources.status==='success'&&!refs.boxes.some(b=>String(b.id)===route.box)){navigate({box:String(refs.boxes[0]?.id||''),index:1},{replace:true});}},[resources.status,resources.data,route.box,navigate]);
  const key=JSON.stringify({route,user:user?.id,revision,ready:resources.status});
  const page=usePageData(key,async signal=>{
    if(route.page==='users'&&!admin||route.page==='audit'&&!auditAllowed)throw new ApiError('Этот раздел недоступен для вашей роли.',403);
    if(['overview','operations','reports'].includes(route.page)){
      if(!route.box)return {emptyCashbox:true};
      const base=new URLSearchParams({cashboxId:route.box,from:route.from,to:route.to});
      if(route.page==='operations'){
        const filter=operationParams(route);filter.set('page',route.index);filter.set('pageSize',15);
        return {rows:await api('/operations?'+filter,{signal})};
      }
      const [summary,points,distribution]=await Promise.all([api('/summary?'+base,{signal}),api('/analytics?'+base,{signal}),api('/category-summary?'+base,{signal})]);
      if(route.page==='reports'){base.set('page',route.index);base.set('pageSize',15);return {summary,points,distribution,book:await api('/reports/cashbook?'+base,{signal})};}
      base.set('pageSize',6);base.set('sort','date_desc');return {summary,points,distribution,rows:await api('/operations?'+base,{signal})};
    }
    if(route.page==='users')return usersPageContract(await api('/users?'+new URLSearchParams({page:route.index,pageSize:15,...(route.q?{q:route.q}:{})}),{signal}));
    if(route.page==='audit'){
      const filter=new URLSearchParams({page:route.index,pageSize:15,from:route.from+'T00:00:00+05:00',to:route.to+'T23:59:59.9999999+05:00',includeTechnical:route.technical});
      for(const name of ['action','entity','userId'])if(route[name])filter.set(name,route[name]);
      return {events:await api('/audit?'+filter,{signal}),options:refs.auditOptions};
    }
    if(route.page==='settings')return refs.org;
    if(route.page==='cashboxes')return refs.boxes;
    return await api('/'+route.page+(route.q?'?q='+encodeURIComponent(route.q):''),{signal});
  },enabled&&resources.status==='success');
  const state=resources.status!=='success'?resources:page;
  const body=page.data;
  function change(changes,options={replace:true}){navigate(changes,options);}
  function go(page,extra={}){navigate({page,index:1,q:'',type:'',status:'',categoryId:'',counterpartyId:'',...extra});}
  function openModal(value){setFormError('');setModal({...value,key:value.key||crypto.randomUUID()});}
  async function task(run,{close=true,message='Изменения сохранены',label='Сохранение…',form=true,reload=true}={}){
    if(pending.current)return;
    pending.current=true;setBusy(true);setBusyLabel(label);setFormError('');setActionError('');
    try{const result=await run();if(close)setModal(null);if(message)setNotice(message);if(reload)refresh();return result;}
    catch(error){(form?setFormError:setActionError)(error.message);return null;}
    finally{pending.current=false;setBusy(false);setBusyLabel('');}
  }
  function startOperation(type,row=null){openModal({kind:'operation',type,row,box:route.box,categories:refs.categories,parties:refs.parties});}
  async function details(row){const result=await task(()=>api('/operations/'+row.id),{close:false,message:'',label:'Загрузка документа…',form:false,reload:false});if(result)openModal({kind:'details',row:result,categories:refs.categories,parties:refs.parties});}
  async function saveModal(data){
    const m=modal;let path,method='POST',payload=data;
    if(m.kind==='operation'){payload={...data,clearCounterparty:data.counterpartyId===null};path='/operations'+(m.row?'/'+m.row.id:'');method=m.row?'PATCH':'POST';}
    if(m.kind==='confirm'){path='/operations/'+m.row.id+'/post';payload={expectedVersion:m.row.version};}
    if(m.kind==='remove'){path='/operations/'+m.row.id+'?version='+m.row.version;method='DELETE';payload=undefined;}
    if(m.kind==='reverse')path='/operations/'+m.row.id+'/reversals';
    if(m.kind==='categories'){path='/categories';payload={...data,parentId:null};}
    if(m.kind==='counterparties')path='/counterparties';
    if(m.kind==='cashboxes'){path='/cashboxes';payload={...data,currencyId:Number(data.currencyId),balanceLimit:null};}
    if(m.kind==='users'){path='/users';payload={...data,mustChangePassword:true};}
    if(m.kind==='access'){path='/access';payload={userId:data.userId,cashboxId:Number(data.cashboxId)};}
    if(m.kind==='revokeAccess'){path='/access/'+m.access.userId+'/'+m.access.cashboxId;method='DELETE';payload=undefined;}
    if(m.kind==='directoryEdit'){path='/'+m.directory+'/'+m.row.id;method='PATCH';payload={name:data.name,active:data.active==='true'};}
    if(m.kind==='editUser'){path='/users/'+m.row.id;method='PATCH';payload={fullName:data.fullName,roles:data.roles};}
    const result=await task(()=>api(path,{method,body:payload}),{close:!['operation','confirm','reverse'].includes(m.kind),message:m.kind==='operation'?'Черновик сохранён. Проверьте и проведите документ.':m.kind==='confirm'?'Документ проведён. Остаток обновлён.':m.kind==='reverse'?'Обратный черновик создан. Проведите его для изменения остатка.':m.kind==='revokeAccess'?'Доступ к кассе отозван.':'Изменения сохранены'});
    if(result&&['operation','confirm','reverse'].includes(m.kind)){try{openModal({kind:'details',row:await api('/operations/'+result.id),categories:refs.categories,parties:refs.parties});}catch(e){setFormError(e.message);}}
  }
  async function exportFile(format){
    const params=route.page==='operations'?operationParams(route):new URLSearchParams({cashboxId:route.box,from:route.from,to:route.to});
    if(route.page==='operations'&&!route.status)params.set('status','all');
    await task(()=>download('/reports/cash.'+format+'?'+params,'Faiza-Cash.'+format),{close:false,message:'Файл подготовлен для скачивания',label:'Подготовка файла…',form:false,reload:false});
  }
  async function addDirectory(){if(route.page==='cashboxes'){try{openModal({kind:'cashboxes',currencies:await api('/currencies')});}catch(e){setActionError(e.message);}}else openModal({kind:route.page});}
  const onPage=index=>change({index});
  const resetFilters=()=>change({q:'',type:'',status:'',categoryId:'',counterpartyId:'',sort:'date_desc',index:1});
  if(boot)return <div className="splash"><Brand/><span className="loader"/>Восстановление сеанса…</div>;
  if(!user)return <Login onLogin={u=>{setUser(userContract(u));refresh();}}/>;
  if(user.mustChangePassword)return <PasswordChange onDone={()=>setUser({...user,mustChangePassword:false})}/>;
  const signIn=()=>{setToken(null);setUser(null);};
  return <div className="app-shell">
    {mobile&&<button className="menu-scrim" aria-label="Закрыть меню" onClick={()=>setMobile(false)}/>}
    <aside className={'sidebar '+(mobile?'open':'')} aria-label="Основная навигация"><Brand/><div className="workspace"><span className="workspace-icon"><Building2 size={20}/></span><div><strong>{refs.org.name}</strong><small>Кассовый учёт</small></div></div><nav>{navigation.map(group=>{const items=group.items.filter(([id])=>!(id==='users'&&!admin)&&!(id==='audit'&&!auditAllowed));return <div key={group.label} className="nav-group"><div className="nav-label">{group.label}</div>{items.map(([id,label,Icon])=><a key={id} className={route.page===id?'active':''} href={'#/'+id} aria-current={route.page===id?'page':undefined} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();go(id);}}><Icon size={20}/>{label}</a>)}</div>;})}</nav><div className="sidebar-bottom"><div className="profile"><span className="avatar">{user.fullName.slice(0,1)||'С'}</span><div><strong title={user.fullName}>{user.fullName}</strong><small>{rolesText(user.roles)}</small></div><button className="icon-btn" title="Выйти" aria-label="Выйти из системы" disabled={busy} onClick={()=>task(async()=>{await api('/auth/logout',{method:'POST'});setToken(null);setUser(null);},{message:'',form:false})}><LogOut size={19}/></button></div></div></aside>
    <main><header className="topbar"><button className="mobile-menu icon-btn" aria-label="Открыть меню" aria-expanded={mobile} onClick={()=>setMobile(v=>!v)}><Menu/></button><div className="breadcrumb">Faiza Cash <span>/</span><strong>{titles[route.page]}</strong></div><div className="top-actions"><span className="connection">Время Душанбе · TJS</span><button className="icon-btn" title={theme==='light'?'Включить тёмную тему':'Включить светлую тему'} aria-label="Сменить тему" onClick={()=>setTheme(t=>t==='light'?'dark':'light')}>{theme==='light'?<Moon size={20}/>:<Sun size={20}/>}</button></div></header>
    <div className="content"><div className="page-heading"><div><h1 id="main-title" tabIndex={-1}>{titles[route.page]}</h1><p>{subtitles[route.page]}</p></div><div className="heading-actions">{['overview','operations'].includes(route.page)&&canWrite&&<><button className="button secondary" disabled={busy||resources.status!=='success'||!refs.boxes.some(b=>b.active)} onClick={()=>startOperation('expense')}><ArrowUpRight size={19}/>Новый расход</button><button className="button primary" disabled={busy||resources.status!=='success'||!refs.boxes.some(b=>b.active)} onClick={()=>startOperation('income')}><Plus size={19}/>Новый приход</button></>}{['cashboxes','categories','counterparties','users'].includes(route.page)&&(admin||accountant&&['categories','counterparties'].includes(route.page))&&<button className="button primary" disabled={busy||resources.status!=='success'} onClick={addDirectory}><Plus size={19}/>{route.page==='users'?'Добавить сотрудника':'Добавить'}</button>}</div></div>
    {actionError&&<div className="error" role="alert"><span>{actionError}</span><button className="icon-btn" title="Закрыть сообщение" aria-label="Закрыть сообщение" onClick={()=>setActionError('')}><X size={19}/></button></div>}
    {notice&&<div role="status" className="toast"><Check size={20}/><span>{notice}</span><button aria-label="Закрыть уведомление" onClick={()=>setNotice('')}><X size={18}/></button></div>}
    {busyLabel&&<div className="action-progress" role="status">{busyLabel}</div>}
    {resources.status==='success'&&['overview','operations','reports'].includes(route.page)&&<FinanceFilters route={route} boxes={refs.boxes} onChange={change} onRefresh={refresh}/>}
    {resources.status==='success'&&route.page==='operations'&&<section className="panel filters-panel"><div className="panel-heading"><h2>Фильтры операций</h2></div><OperationFilters route={route} categories={refs.categories} parties={refs.parties} onChange={change} onReset={resetFilters}/></section>}
    {resources.status==='success'&&route.page==='users'&&admin&&<div className="table-filters"><label className="search-label">Поиск сотрудников<input value={route.q} onChange={e=>change({q:e.target.value,index:1})} placeholder="Имя или логин"/></label></div>}
    {resources.status==='success'&&['categories','counterparties'].includes(route.page)&&<div className="table-filters"><label className="search-label">Поиск по названию<input value={route.q} onChange={e=>change({q:e.target.value,index:1})} placeholder="Введите название"/></label></div>}
    {resources.status==='success'&&route.page==='audit'&&auditAllowed&&<AuditFilters route={route} options={refs.auditOptions} onChange={change}/>}
    <ErrorBoundary resetKey={route.page+':'+revision} onRetry={refresh} onHome={()=>go('overview')}><PageState state={state} onRetry={refresh} onLogin={signIn}>
      {body?.emptyCashbox?<section className="panel"><Empty text={admin?'Добавьте первую кассу в разделе «Кассы». Затем создайте категории и зарегистрируйте приход.':'Доступных касс нет. Попросите администратора назначить вам доступ.'}/></section>:<>
      {route.page==='overview'&&body&&<><FinanceStats summary={body.summary} currency={refs.org.currency}/><FinanceCharts points={body.points} distribution={body.distribution} currency={refs.org.currency}/><section className="panel"><div className="panel-heading"><div><h2>Последние операции</h2><p>Черновики не влияют на остаток.</p></div><button className="text-btn" onClick={()=>go('operations')}>Открыть журнал</button></div><OperationsTable data={body.rows} currency={refs.org.currency} onDetails={details} preview/></section></>}
      {route.page==='operations'&&body&&<section className="panel"><div className="panel-heading"><h2>Журнал операций</h2><div className="row-actions"><button className="button secondary" disabled={busy} onClick={()=>exportFile('csv')}>Скачать CSV</button><button className="button secondary" disabled={busy} onClick={()=>exportFile('pdf')}>Скачать PDF</button></div></div><p className="export-explanation">Экспорт: все найденные записи с выбранными фильтрами, включая черновики, если они выбраны.</p><OperationsTable data={body.rows} currency={refs.org.currency} onDetails={details} onPage={onPage}/></section>}
      {route.page==='reports'&&body&&<ReportsPage book={body.book} points={body.points} distribution={body.distribution} currency={refs.org.currency} onPage={onPage} onExport={exportFile} onDetails={details} busy={busy}/>}
      {route.page==='cashboxes'&&body&&<div className="directory-grid">{body.map(box=><CashCard key={box.id+':'+revision} box={box} currency={refs.org.currency} onOpen={()=>go('operations',{box:String(box.id)})} onEdit={admin?()=>openModal({kind:'directoryEdit',directory:'cashboxes',row:box}):null}/>)}{!body.length&&<section className="panel"><Empty text="Кассы не найдены. Администратор может добавить кассу и назначить доступ сотрудникам."/></section>}</div>}
      {['categories','counterparties'].includes(route.page)&&Array.isArray(body)&&<section className="panel"><div className="panel-heading"><h2>{titles[route.page]}</h2><span className="muted">{records(body.length)}</span></div><div className="table-scroll"><table><thead><tr><th>Название</th><th>{route.page==='categories'?'Направление':'Тип'}</th><th>Состояние</th><th>Действия</th></tr></thead><tbody>{body.map(row=><tr key={row.id}><td><strong>{row.name}</strong>{row.taxCode&&<small>ИНН {row.taxCode}</small>}</td><td>{({income:'↓ Приход',expense:'↑ Расход',client:'Клиент',supplier:'Поставщик',employee:'Сотрудник',other:'Прочее'})[row.type||row.kind]}</td><td><span className={'badge '+(row.active?'posted':'archived')}>{row.active?'Активен':'Архив'}</span></td><td>{accountant?<button className="text-btn" onClick={()=>openModal({kind:'directoryEdit',directory:route.page,row})}>Изменить</button>:'Только просмотр'}</td></tr>)}</tbody></table>{!body.length&&<Empty text="Записи не найдены. Измените поиск или добавьте запись в справочник."/>}</div></section>}
      {route.page==='users'&&admin&&body&&<><UsersPage data={body} user={user} boxes={refs.boxes} access={refs.access||[]} onModal={openModal} onRevoke={(assignment,userName,boxName)=>openModal({kind:'revokeAccess',access:assignment,userName,boxName})} onToggle={row=>task(()=>api('/users/'+row.id,{method:'PATCH',body:{active:!row.active}}),{form:false})} onPage={onPage}/></>}
      {route.page==='audit'&&auditAllowed&&body&&<AuditPage data={body.events} options={body.options} route={route} onChange={change} onPage={onPage}/>}
      {route.page==='settings'&&body&&<section className="panel settings-panel"><h2>Организация</h2><p className="muted">Учёт в сомони (TJS). Часовой пояс — Душанбе (UTC+5).</p><form key={revision} onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));data.currency='TJS';task(()=>api('/settings',{method:'PUT',body:data}),{form:false});}}><Field label="Название организации *"><input name="name" required maxLength={160} defaultValue={body.name} disabled={!admin}/></Field><Field label="Валюта учёта"><input value="TJS — сомони" readOnly aria-describedby="currency-hint"/></Field><p id="currency-hint" className="field-hint">В проекте используется одна валюта — TJS. Изменение валюты после начала учёта запрещено.</p>{admin?<button className="button primary" disabled={busy}>Сохранить настройки</button>:<p className="muted">Настройки организации изменяет администратор.</p>}</form><hr/><h2>Безопасность учётной записи</h2><p className="muted">Изменение пароля завершит возможность обновления прежних сеансов.</p><button className="button secondary" onClick={()=>openModal({kind:'password'})}>Сменить пароль</button><hr/><h2>О системе</h2><p className="muted">Интерфейс React передаёт запросы в API ASP.NET Core. Бизнес-правила проверяют операцию, PostgreSQL хранит документы и аудит. Учебное приложение; документы не являются официальными бухгалтерскими формами.</p></section>}
      </>}
    </PageState></ErrorBoundary><footer className="page-footer"><span>Faiza Cash · Кассовый учёт ООО «Фаиза»</span><span>Учебный проект</span></footer></div></main>
    {modal?.kind==='password'?<Dialog title="Смена пароля" onClose={()=>setModal(null)}><PasswordForm onDone={()=>{setModal(null);setNotice('Пароль изменён. При следующем входе используйте новый пароль.');}}/></Dialog>:modal&&<OperationDialog key={modal.key+':'+modal.kind} modal={modal} boxes={refs.boxes} currency={refs.org.currency} user={user} roles={refs.roles} busy={busy} error={formError} onClose={()=>!busy&&setModal(null)} onSave={saveModal} onModal={openModal} onDownload={(path,name)=>task(()=>download(path,name),{close:false,message:'Файл подготовлен для скачивания',form:true,reload:false})}/>}
  </div>;
}

