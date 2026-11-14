export function money(value) {
  if(value===undefined||value===null||value==='')return '—';
  const text=typeof value==='number'?(Number.isFinite(value)?value.toFixed(2):''):String(value);
  const match=/^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if(!match)return '—';
  const integer=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(BigInt(match[2]));
  return match[1]+integer+','+(match[3]||'').padEnd(2,'0').slice(0,2);
}
export const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Dushanbe'}).format(new Date());
export const monthStart=()=>today().slice(0,8)+'01';
export const dateText=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.slice(8)+'.'+value.slice(5,7)+'.'+value.slice(0,4):'—';
export const dateTimeText=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('ru-RU',{timeZone:'Asia/Dushanbe',dateStyle:'short',timeStyle:'short'}):'—';
export function records(count) {const n=Math.abs(count)%100,k=n%10;return `${count} ${n>=11&&n<=14?'записей':k===1?'запись':k>=2&&k<=4?'записи':'записей'}`;}
export const roleLabels={admin:'Администратор',accountant:'Бухгалтер',cashier:'Кассир',manager:'Руководитель',auditor:'Аудитор'};
export const rolesText=roles=>roles.length?roles.map(r=>roleLabels[r]||'Другая роль').join(', '):'Роль не назначена';
export function quickPeriod(kind,end=today()) {const start=new Date(end+'T00:00:00Z');if(kind==='week')start.setUTCDate(start.getUTCDate()-6);if(kind==='month')start.setUTCDate(1);return {from:start.toISOString().slice(0,10),to:end};}
export function normalizeAmount(value) {
  let text=String(value).trim().replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
  if(text.startsWith('.'))text='0'+text;
  if(!/^\d+(?:\.\d{1,2})?$/.test(text))throw new Error('Введите сумму с точкой или запятой, не более двух знаков после разделителя.');
  let [integer,fraction='']=text.split('.');integer=integer.replace(/^0+(?=\d)/,'');fraction=fraction.padEnd(2,'0');
  const cents=BigInt(integer)*100n+BigInt(fraction);
  if(cents<=0n)throw new Error('Сумма должна быть больше нуля.');
  if(cents>999999999999999999n)throw new Error('Сумма превышает допустимое значение.');
  return integer+'.'+fraction;
}
export function sumAmounts(values) {
  const total=values.reduce((sum,value)=>{const match=/^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));if(!match)throw new Error('Сервер вернул сумму в неверном формате.');const cents=BigInt(match[2])*100n+BigInt((match[3]||'').padEnd(2,'0'));return sum+(match[1]?-cents:cents);},0n);
  const absolute=total<0n?-total:total;return(total<0n?'-':'')+(absolute/100n)+'.'+String(absolute%100n).padStart(2,'0');
}
