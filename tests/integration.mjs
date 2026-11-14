import {runSecurityCases} from './security/cases.mjs';
import {runReviewCases} from './review-cases.mjs';
import {spawn,spawnSync} from 'node:child_process';import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const suite=process.argv.find(x=>x.startsWith('--suite='))?.split('=')[1]||'all';
assert.ok(['all','integration','security'].includes(suite),'Use --suite=all|integration|security');
const cfg=JSON.parse(fs.readFileSync('.runtime/local.json','utf8'));cfg.ConnectionStrings__CashDb=cfg.ConnectionStrings__CashDb.replace(/Database=([^;]+)/,'Database=$1_test');cfg.ASPNETCORE_URLS='http://127.0.0.1:5081';cfg.ASPNETCORE_ENVIRONMENT='Test';cfg.Seed__AdminPassword=crypto.randomBytes(14).toString('hex')+'Aa1';cfg.Logs__Directory='.runtime/test-logs';
cfg.Jwt__Issuer='FaizaCash';cfg.Jwt__Audience='FaizaCash';
const fields=Object.fromEntries(cfg.ConnectionStrings__CashDb.split(';').map(x=>x.split('=')));
assert.match(fields.Database,/^faiza_[a-z0-9]+_test$/);
const sql=statement=>{const r=spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe',['-h','127.0.0.1','-U',fields.Username,'-d',fields.Database,'-w','-v','ON_ERROR_STOP=1'],{env:{...process.env,PGPASSWORD:fields.Password},input:statement,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
fs.mkdirSync('.runtime',{recursive:true});
const lock='.runtime/database-tests.lock';
try{fs.closeSync(fs.openSync(lock,'wx'));}catch{throw new Error('Another database test suite is active. Run suites sequentially; remove a stale lock only after checking its owner has exited.');}
process.on('exit',()=>{try{fs.unlinkSync(lock);}catch{}});
sql('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
const log=fs.openSync('.runtime/integration-server.log','w');
const server=spawn('dotnet',['backend/src/FaizaCash.Api/bin/Debug/net10.0/FaizaCash.Api.dll'],{env:{...process.env,...cfg},stdio:['ignore',log,log]});
const base='http://127.0.0.1:5081';const results=[];let token,cookie;
async function request(path,{method='GET',body,auth=token,cookies=cookie,extra={}}={}){return fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json','X-Faiza-Request':'1',...(auth?{Authorization:'Bearer '+auth}:{}),...(cookies?{Cookie:cookies}:{}),...extra},body:body?JSON.stringify(body):undefined});}
async function ok(path,options){const r=await request(path,options);assert.ok(r.ok,`${path}: ${r.status} ${await(!r.ok?r.text():Promise.resolve(''))}`);return r.status===204?null:r.json();}
async function test(name,run){try{await run();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed',error:e.message});console.error('FAIL '+name+': '+e.message);throw e;}}
let posted;
const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Dushanbe'}).format(new Date());
let box,income,expense,admin,cashier;
const draft=(type,amount,key=crypto.randomUUID(),boxId=box)=>ok('/operations',{method:'POST',body:{cashboxId:boxId,date,type,amount,description:'Integration test '+type,categoryId:type==='income'?income:expense,counterpartyId:null,documentTypeId:null,requestKey:key}});
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));if(i===79)throw new Error('API startup failed; inspect .runtime/integration-server.log');}
 await test('Migrations applied and initial administrator requires password change',async()=>{const r=await request('/auth/login',{method:'POST',body:{login:cfg.Seed__AdminLogin,password:cfg.Seed__AdminPassword},auth:null,cookies:null});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];const data=await r.json();token=data.accessToken;admin=data.user;assert.equal(admin.mustChangePassword,true);assert.equal((await request('/cashboxes')).status,403);await ok('/auth/change-password',{method:'POST',body:{oldPassword:cfg.Seed__AdminPassword,newPassword:crypto.randomBytes(16).toString('hex')+'Aa1'}});});
 const currencies=await ok('/currencies');const suffix=Date.now();box=(await ok('/cashboxes',{method:'POST',body:{code:'T'+suffix,name:'Test cashbox',currencyId:currencies[0].id,balanceLimit:null}})).id;
 await test('Cashbox limit changes record before/after values and reject negative limits',async()=>{
  assert.equal((await request('/cashboxes/'+box,{method:'PATCH',body:{balanceLimit:500.25}})).status,204);
  const audit=await ok('/audit?pageSize=100');
  const event=audit.items.find(x=>x.entity==='Cashbox'&&x.entityId===box&&x.action==='data_modified'&&JSON.parse(x.details).changes?.BalanceLimit);
  assert.ok(event);assert.deepEqual(JSON.parse(event.details).changes.BalanceLimit,{before:null,after:'500.25'});
  assert.equal((await request('/cashboxes/'+box,{method:'PATCH',body:{balanceLimit:-1}})).status,400);
 });
 await ok('/categories',{method:'POST',body:{name:'Income '+suffix,type:'income',parentId:null}});await ok('/categories',{method:'POST',body:{name:'Expense '+suffix,type:'expense',parentId:null}});const categories=await ok('/categories');income=categories.find(x=>x.name==='Income '+suffix).id;expense=categories.find(x=>x.name==='Expense '+suffix).id;
 if(suite!=='security'){
 await test('Operation filters reject unsupported enums and NUL text',async()=>{assert.equal((await request(`/operations?cashboxId=${box}&type=transfer`)).status,400);assert.equal((await request(`/operations?cashboxId=${box}&q=%00`)).status,400);});
 await test('Exact money and initial balance via posted operation',async()=>{const d=await draft('income','100.10');await ok('/operations/'+d.id+'/post',{method:'POST',body:{expectedVersion:d.version}});assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,'100.10');});
 await test('Reject zero, negative and sub-cent amounts',async()=>{for(const amount of ['0','-1','0.001']){const r=await request('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount,description:'Invalid',categoryId:income,requestKey:crypto.randomUUID()}});assert.equal(r.status,400);}});
 await test('Idempotent submission returns the same draft',async()=>{const key=crypto.randomUUID();const a=await draft('income','1.00',key),b=await draft('income','1.00',key);assert.equal(a.id,b.id);});
 await test('Idempotency compares the full payload including DocumentTypeId',async()=>{
  const firstCode='IDEMP-A-'+suffix,secondCode='IDEMP-B-'+suffix;
  for(const code of [firstCode,secondCode])assert.equal((await request('/document-types',{method:'POST',body:{code,name:code}})).status,204);
  const types=await ok('/document-types'),firstType=types.find(x=>x.code===firstCode).id,secondType=types.find(x=>x.code===secondCode).id,key=crypto.randomUUID();
  const body={cashboxId:box,date,type:'income',amount:'1.00',description:'Document type idempotency',categoryId:income,counterpartyId:null,documentTypeId:firstType,requestKey:key};
  const original=await ok('/operations',{method:'POST',body}),same=await ok('/operations',{method:'POST',body});
  assert.equal(same.id,original.id);assert.equal(original.documentTypeId,firstType);assert.equal(same.documentTypeId,firstType);
  assert.equal((await request('/operations',{method:'POST',body:{...body,documentTypeId:secondType}})).status,409);
 });
 await test('Posting rejects a version that became stale after confirmation',async()=>{const original=await draft('income','2.00');const changed=await ok('/operations/'+original.id,{method:'PATCH',body:{description:'Changed after confirmation',version:original.version}});const before=(await ok('/cashboxes/'+box+'/balance')).balance;const response=await request('/operations/'+original.id+'/post',{method:'POST',body:{expectedVersion:original.version}});assert.equal(response.status,409);assert.equal((await ok('/operations/'+original.id)).status,'draft');assert.equal((await ok('/operations/'+original.id)).version,changed.version);assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,before);});
 await test('Concurrent expenses cannot jointly overdraw the cashbox',async()=>{const a=await draft('expense','80.00'),b=await draft('expense','80.00');const rs=await Promise.all([a,b].map(x=>request('/operations/'+x.id+'/post',{method:'POST',body:{expectedVersion:x.version}})));assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);posted=[a,b][rs.findIndex(r=>r.status===200)];assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,'20.10');});
 await test('Repeated and simultaneous posting never doubles balance',async()=>{assert.equal((await request('/operations/'+posted.id+'/post',{method:'POST',body:{expectedVersion:posted.version}})).status,409);const d=await draft('income','0.20');const rs=await Promise.all([1,2].map(()=>request('/operations/'+d.id+'/post',{method:'POST',body:{expectedVersion:d.version}})));assert.deepEqual(rs.map(r=>r.status).sort(),[200,409]);assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,'20.30');});
 await test('Posted documents cannot be edited or deleted',async()=>{assert.equal((await request('/operations/'+posted.id,{method:'PATCH',body:{description:'tampered',version:1}})).status,403);assert.equal((await request('/operations/'+posted.id+'?version=1',{method:'DELETE'})).status,403);});
 await test('Reversal is linked, requires reason and cannot be repeated',async()=>{assert.equal((await request('/operations/'+posted.id+'/reversals',{method:'POST',body:{reason:'',date}})).status,400);const d=await ok('/operations/'+posted.id+'/reversals',{method:'POST',body:{reason:'Test correction',date}});assert.equal((await request('/operations/'+posted.id+'/reversals',{method:'POST',body:{reason:'Again',date}})).status,409);await ok('/operations/'+d.id+'/post',{method:'POST',body:{expectedVersion:d.version}});assert.equal((await ok('/operations/'+posted.id)).reversalId,d.id);assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,'100.30');});
 await test('Report totals agree with ledger and CSV handles export',async()=>{const report=await ok(`/summary?cashboxId=${box}&from=${date}&to=${date}`);assert.equal(report.closing,'100.30');assert.equal(report.income,'180.30');assert.equal(report.expense,'80.00');const r=await request(`/reports/cash.csv?cashboxId=${box}&from=${date}&to=${date}`);assert.equal(r.status,200);assert.match(await r.text(),/ПКО/);});
 await test('Server exports real PDF cashbook and cash document',async()=>{for(const path of [`/reports/cash.pdf?cashboxId=${box}&from=${date}&to=${date}`,`/operations/${posted.id}/document.pdf`]){const r=await request(path);assert.equal(r.status,200,await(!r.ok?r.text():Promise.resolve('')));assert.match(r.headers.get('content-type'),/application\/pdf/);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');assert.ok(bytes.length>2000);fs.writeFileSync(path.includes('/reports/')?'.runtime/cashbook.pdf':'.runtime/document.pdf',bytes);}});
 await test('Audit records committed posting actions',async()=>{const audit=await ok('/audit?pageSize=100');assert.ok(audit.items.some(x=>x.action==='operation_posted'&&x.entityId===posted.id));});
 await test('Audit failure rolls back posting, balance and document counter atomically',async()=>{
  const d=await draft('income','9.00');
  sql(`CREATE FUNCTION fail_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."Action"='operation_posted' THEN RAISE EXCEPTION 'test audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_audit BEFORE INSERT ON "AuditEvents" FOR EACH ROW EXECUTE FUNCTION fail_test_audit();`);
  try{assert.equal((await request('/operations/'+d.id+'/post',{method:'POST',body:{expectedVersion:d.version}})).status,500);assert.equal((await ok('/operations/'+d.id)).status,'draft');assert.equal((await ok('/cashboxes/'+box+'/balance')).balance,'100.30');}
  finally{sql('DROP TRIGGER test_audit ON "AuditEvents"; DROP FUNCTION fail_test_audit();');}
 });
 await runReviewCases({test,request,ok,draft,box,date,income,expense,admin});
 await test('CSV and PDF exports reject more than 10000 rows before producing a file',async()=>{
  sql(`INSERT INTO "Operations" ("CashboxId","Date","Type","Status","Amount","Description","CategoryId","DocumentNumber","PostingSeq","IsReversal","RequestKey","CreatedBy","PostedBy","PostedAt","CreatedAt","UpdatedAt","Version") SELECT ${box},'${date}'::date,'income','posted',0.01,'Export cap fixture',${income},'CAP-'||n::text,100000+n,false,gen_random_uuid(),'${admin.id}'::uuid,'${admin.id}'::uuid,NOW(),NOW(),NOW(),1 FROM generate_series(1,10001) AS n;`);
  for(const path of [`/reports/cash.csv?cashboxId=${box}&from=${date}&to=${date}`,`/reports/cash.pdf?cashboxId=${box}&from=${date}&to=${date}`]){
   const response=await request(path);assert.equal(response.status,413,path);assert.doesNotMatch(response.headers.get('content-type')||'',/application\/(csv|pdf)/,path);
  }
 });
 }else{posted=await draft('income','100.10');await ok('/operations/'+posted.id+'/post',{method:'POST',body:{expectedVersion:posted.version}});}
 if(suite!=='integration')await runSecurityCases({test,request,ok,draft,date,box,posted,suffix,cookie,admin,currencies,base});
 console.log(`Completed ${results.length} ${suite==='all'?'API':suite} checks on real PostgreSQL.`);
}catch(e){console.error(e.message);process.exitCode=1;}finally{server.kill();fs.closeSync(log);fs.writeFileSync(`.runtime/${suite==='all'?'test':suite+'-test'}-results.json`,JSON.stringify({time:new Date().toISOString(),database:'PostgreSQL (dedicated test database)',suite,results},null,2));}
