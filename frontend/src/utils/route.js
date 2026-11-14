import {monthStart, today} from './format.js';
export const pages = ['overview','operations','cashboxes','counterparties','categories','reports','audit','users','settings'];
export const routeDefaults = () => ({page:'overview',box:'',from:monthStart(),to:today(),q:'',type:'',status:'',categoryId:'',counterpartyId:'',sort:'date_desc',index:1,action:'',entity:'',userId:'',technical:'false'});
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
export function readRoute(hash = '') {
  const [path, query] = hash.replace(/^#\/?/, '').split('?');
  const defaults = routeDefaults(), params = new URLSearchParams(query);
  const route = {...defaults,page:pages.includes(path)?path:'overview'};
  for (const key of Object.keys(defaults)) if (key !== 'page' && params.has(key)) route[key] = params.get(key);
  if (!validDate(route.from)) route.from = defaults.from;
  if (!validDate(route.to)) route.to = defaults.to;
  if (route.from > route.to) route.from = route.to;
  route.index = Math.max(1, Math.min(1000000, Number.parseInt(route.index,10)||1));
  if (!['','income','expense'].includes(route.type)) route.type='';
  if (!['','draft','posted'].includes(route.status)) route.status='';
  if (!['date_desc','date_asc','amount_desc','amount_asc'].includes(route.sort)) route.sort='date_desc';
  for (const key of ['box','categoryId','counterpartyId']) if (!/^\d*$/.test(route[key])) route[key]='';
  route.q=route.q.slice(0,200);
  route.technical=route.technical==='true'?'true':'false';
  return route;
}
export function routeHash(route) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(route)) if (key!=='page' && value!=='' && value!==null && value!==undefined) params.set(key,String(value));
  return '#/'+route.page+'?'+params;
}
export function operationParams(route) {
  const params = new URLSearchParams({cashboxId:route.box,from:route.from,to:route.to,sort:route.sort});
  for (const key of ['q','type','status','categoryId','counterpartyId']) if (route[key]) params.set(key,route[key]);
  return params;
}
