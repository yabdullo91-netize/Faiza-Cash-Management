import {demoCategories,demoParties,demoOperations} from './demo-data.mjs';
import {api,setToken} from '../frontend/src/services/api.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
// Explicitly run only against a local educational database. No production hook.
const config=JSON.parse(fs.readFileSync('.runtime/local.json','utf8'));
const base=process.env.FAIZA_API||'http://localhost:5080';const nativeFetch=globalThis.fetch;
globalThis.fetch=(url,options)=>nativeFetch(new URL(url,base),options);
const login=await api('/auth/login',{method:'POST',body:{login:config.Seed__AdminLogin,password:process.env.FAIZA_ADMIN_PASSWORD||config.Seed__AdminPassword}});setToken(login.accessToken);
if(login.user.mustChangePassword){
 if(!process.argv.includes('--bootstrap')){console.log('Сначала смените первоначальный пароль в интерфейсе и задайте FAIZA_ADMIN_PASSWORD. Режим --bootstrap доступен только для явно запрошенной первоначальной подготовки учебной базы.');process.exit(1);}
 const newPassword=crypto.randomBytes(16).toString('hex')+'Aa1';
 await api('/auth/change-password',{method:'POST',body:{oldPassword:config.Seed__AdminPassword,newPassword}});
 config.Seed__AdminPassword=newPassword;fs.writeFileSync('.runtime/local.json',JSON.stringify(config,null,2));
 console.log('Пароль локального администратора изменён. Данные доступа сохранены только в .runtime/local.json.');
}
const boxes=await api('/cashboxes');if(boxes.length){console.log('Наполнение пропущено: в базе уже есть кассы. Существующие записи не изменялись.');process.exit(0);}
const currencies=await api('/currencies');await api('/cashboxes',{method:'POST',body:{code:'MAIN',name:'Основная касса',currencyId:currencies[0].id,balanceLimit:null}});
for(const [name,type]of demoCategories)await api('/categories',{method:'POST',body:{name,type,parentId:null}});
for(const [name,kind]of demoParties)await api('/counterparties',{method:'POST',body:{name,kind,taxCode:null,contact:null}});
const box=(await api('/cashboxes'))[0],cats=await api('/categories'),parties=await api('/counterparties');
const end=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Dushanbe'}).format(new Date());
for(const item of demoOperations(end)){
 const category=cats.find(c=>c.name===item.category&&c.type===item.type),party=item.party?parties.find(p=>p.name===item.party):null;
 if(!category||item.party&&!party)throw new Error('Не найдены справочники учебного набора.');
 const row=await api('/operations',{method:'POST',body:{cashboxId:box.id,date:item.date,type:item.type,amount:item.amount,description:item.description,categoryId:category.id,counterpartyId:party?.id||null,documentTypeId:null,requestKey:crypto.randomUUID()}});
 if(item.status==='posted')await api('/operations/'+row.id+'/post',{method:'POST'});
}
console.log('Учебное наполнение завершено: 21 проведённый документ и 3 черновика. Существующие документы не изменены.');
