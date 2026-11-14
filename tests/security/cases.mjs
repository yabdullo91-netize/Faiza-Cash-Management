import assert from 'node:assert/strict';
import crypto from 'node:crypto';
export async function runSecurityCases({test,request,ok,draft,date,box,posted,suffix,cookie,admin,currencies,base}) {
let cashier,foreign;
 await test('Protected endpoints reject anonymous requests',async()=>{
  for(const path of ['/users','/audit',`/operations?cashboxId=${box}`,`/cashboxes/${box}/balance`])
   assert.equal((await request(path,{auth:null,cookies:null})).status,401,path);
 });
 const password=crypto.randomBytes(12).toString('hex')+'Aa1';cashier=await ok('/users',{method:'POST',body:{login:'cashier'+suffix,fullName:'Test Cashier',password,roles:['cashier'],mustChangePassword:false}});
 const cashierLogin=await ok('/auth/login',{method:'POST',body:{login:cashier.login,password},auth:null,cookies:null});const cashierToken=cashierLogin.accessToken;
 await test('Cashier access grants and revocations are audited and take effect immediately',async()=>{
  assert.equal((await request('/users',{auth:cashierToken,cookies:null})).status,403);
  assert.equal((await request('/cashboxes/'+box+'/balance',{auth:cashierToken,cookies:null})).status,403);
  assert.deepEqual(await ok('/cashboxes',{auth:cashierToken,cookies:null}),[]);
  await ok('/access',{method:'POST',body:{userId:cashier.id,cashboxId:box}});
  assert.equal((await request('/cashboxes/'+box+'/balance',{auth:cashierToken,cookies:null})).status,200);
  assert.equal((await request('/operations/'+posted.id+'/reversals',{method:'POST',body:{reason:'Forbidden',date},auth:cashierToken,cookies:null})).status,403);
  assert.equal((await request(`/access/${cashier.id}/${box}`,{method:'DELETE'})).status,204);
  assert.equal((await request('/cashboxes/'+box+'/balance',{auth:cashierToken,cookies:null})).status,403);
  assert.deepEqual(await ok('/cashboxes',{auth:cashierToken,cookies:null}),[]);
  const events=await ok('/audit?entity=CashAccess&pageSize=100');
  const userEvents=events.items.filter(e=>JSON.parse(e.details).UserId===cashier.id);
  assert.ok(userEvents.some(e=>e.action==='cash_access_granted'));
  assert.ok(userEvents.some(e=>e.action==='cash_access_revoked'));
  await ok('/access',{method:'POST',body:{userId:cashier.id,cashboxId:box}});
 });
 await test('Cashier cannot escalate role, assign cash access or read audit',async()=>{
  const options={auth:cashierToken,cookies:null};
  assert.equal((await request('/audit',options)).status,403);
  assert.equal((await request('/users/'+cashier.id,{...options,method:'PATCH',body:{roles:['admin']}})).status,403);
  assert.equal((await request('/access',{...options,method:'POST',body:{userId:cashier.id,cashboxId:box}})).status,403);
  assert.equal((await request('/users',{...options,method:'POST',body:{login:'escalate'+suffix,password,fullName:'Escalation attempt',roles:['admin']}})).status,403);
 });
 await test('Foreign cashbox documents and exports remain forbidden after one cashbox is assigned',async()=>{
  foreign=await ok('/cashboxes',{method:'POST',body:{code:'FOREIGN'+suffix,name:'Foreign cashbox',currencyId:currencies[0].id,balanceLimit:null}});
  const row=await draft('income','1.00',crypto.randomUUID(),foreign.id);
  const options={auth:cashierToken,cookies:null};
  for(const path of [`/operations/${row.id}`,`/operations/${row.id}/document.pdf`,`/operations?cashboxId=${foreign.id}`,`/operations/?cashboxId=${foreign.id}`,`/summary?cashboxId=${foreign.id}&from=${date}&to=${date}`,`/reports/cashbook?cashboxId=${foreign.id}&from=${date}&to=${date}`,`/reports/cash.csv?cashboxId=${foreign.id}&from=${date}&to=${date}`,`/reports/cash.pdf?cashboxId=${foreign.id}&from=${date}&to=${date}`,`/analytics?cashboxId=${foreign.id}&from=${date}&to=${date}`,`/category-summary?cashboxId=${foreign.id}&from=${date}&to=${date}`])
   assert.equal((await request(path,options)).status,403,path);
  assert.equal((await request('/operations/',options)).status,400,'trailing slash must not bypass the required scope');
  assert.equal((await request('/operations?from='+date+'&to='+date,options)).status,400,'missing cashboxId must not expose all operations');
  assert.equal((await request('/operations/'+row.id+'/post',{...options,method:'POST',body:{expectedVersion:row.version}})).status,403);
  assert.equal((await request('/operations',{...options,method:'POST',body:{cashboxId:foreign.id,date,type:'income',amount:'1.00',description:'Forbidden',categoryId:row.categoryId,requestKey:crypto.randomUUID()}})).status,403);
  for(const path of ['/cashboxes','/cashboxes/']){const visible=await ok(path,options);assert.ok(visible.some(x=>x.id===box),path);assert.ok(!visible.some(x=>x.id===foreign.id),path);}
  assert.ok([403,404].includes((await request('/API/operations?cashboxId='+foreign.id,options)).status),'route casing must not reach an unscoped endpoint');
 });
 await test('All five roles stay scoped to their assigned cashboxes across route variants',async()=>{
  const credentials={};
  for(const role of ['accountant','manager','auditor']){
   const password=crypto.randomBytes(12).toString('hex')+'Aa1';
   const user=await ok('/users',{method:'POST',body:{login:role+suffix,fullName:'Test '+role,password,roles:[role],mustChangePassword:false}});
   const login=await ok('/auth/login',{method:'POST',body:{login:user.login,password},auth:null,cookies:null});
   credentials[role]={user,token:login.accessToken};
  }
  await ok('/access',{method:'POST',body:{userId:credentials.accountant.user.id,cashboxId:box}});
  await ok('/access',{method:'POST',body:{userId:credentials.manager.user.id,cashboxId:foreign.id}});
  await ok('/access',{method:'POST',body:{userId:credentials.auditor.user.id,cashboxId:box}});
  const assignments={accountant:box,cashier:box,manager:foreign.id,auditor:box};
  const tokens={accountant:credentials.accountant.token,cashier:cashierToken,manager:credentials.manager.token,auditor:credentials.auditor.token};
  const allBoxes=await ok('/cashboxes');
  assert.ok(allBoxes.some(x=>x.id===box)&&allBoxes.some(x=>x.id===foreign.id),'admin must retain global cashbox access');
  for(const role of Object.keys(assignments)){
   const options={auth:tokens[role],cookies:null},assigned=assignments[role],unassigned=assigned===box?foreign.id:box;
   for(const path of ['/cashboxes','/cashboxes/','/CaShBoXeS/?active=true']){
    const visible=await ok(path,options);
    assert.ok(visible.some(x=>x.id===assigned),`${role} should see its assigned cashbox via ${path}`);
    assert.ok(!visible.some(x=>x.id===unassigned),`${role} must not see an unassigned cashbox via ${path}`);
   }
   assert.equal((await request(`/operations?cashboxId=${assigned}&from=${date}&to=${date}`,options)).status,200,role);
   assert.equal((await request(`/operations/?cashboxId=${unassigned}&from=${date}&to=${date}`,options)).status,403,role);
   assert.equal((await request('/operations/',options)).status,400,role+' without cashboxId');
  }
  const assignedRow=await draft('income','1.00',crypto.randomUUID(),box);
  const foreignRow=await draft('income','1.00',crypto.randomUUID(),foreign.id);
  for(const role of ['accountant','cashier','auditor']){
   const options={auth:tokens[role],cookies:null};
   assert.equal((await request('/operations/'+assignedRow.id,options)).status,200,role+' direct read');
   assert.equal((await request('/operations/'+foreignRow.id+'/document.pdf',options)).status,403,role+' foreign PDF');
   assert.equal((await request(`/summary?cashboxId=${foreign.id}&from=${date}&to=${date}`,options)).status,403,role+' foreign summary');
   assert.equal((await request(`/analytics?cashboxId=${foreign.id}&from=${date}&to=${date}`,options)).status,403,role+' foreign analytics');
  }
  const manager={auth:tokens.manager,cookies:null};
  assert.equal((await request('/operations/'+foreignRow.id,manager)).status,200);
  assert.equal((await request('/operations/'+assignedRow.id,manager)).status,403);
 });
 await test('Cashier cannot edit delete or post another authors draft in an assigned cashbox',async()=>{
  const row=await draft('income','1.00');const options={auth:cashierToken,cookies:null};
  assert.equal((await request('/operations/'+row.id,{...options,method:'PATCH',body:{description:'Tamper',version:row.version}})).status,403);
  assert.equal((await request('/operations/'+row.id+'?version='+row.version,{...options,method:'DELETE'})).status,403);
  assert.equal((await request('/operations/'+row.id+'/post',{...options,method:'POST',body:{expectedVersion:row.version}})).status,403);
  assert.equal((await ok('/operations/'+row.id)).status,'draft');
 });
 await test('Cashier can post own draft with an empty request body and JSON content type',async()=>{
  const options={auth:cashierToken,cookies:null};
  const row=await ok('/operations',{...options,method:'POST',body:{cashboxId:box,date,type:'income',amount:'0.01',description:'Cashier own document',categoryId:posted.categoryId,counterpartyId:null,documentTypeId:null,requestKey:crypto.randomUUID()}});
  const result=await ok('/operations/'+row.id+'/post',{...options,method:'POST',body:{expectedVersion:row.version}});assert.equal(result.status,'posted');
  assert.equal((await request('/operations',{...options,method:'POST',body:[]})).status,400);
 });
 await test('Duplicate logins are rejected after normalization and public registration is absent',async()=>{
  assert.equal((await request('/users',{method:'POST',body:{login:'  '+cashier.login.toUpperCase()+'  ',password,fullName:'Duplicate',roles:['cashier']}})).status,409);
  assert.equal((await ok('/users?q='+encodeURIComponent(cashier.login))).total,1);
  assert.equal((await request('/auth/register',{method:'POST',auth:null,cookies:null,body:{login:'public'+suffix,password}})).status,404);
 });
 await test('Concurrent user creation cannot register the same login twice',async()=>{
  const login='parallel'+suffix;const body={login,password,fullName:'Concurrent registration',roles:['cashier']};
  const responses=await Promise.all([request('/users',{method:'POST',body}),request('/users',{method:'POST',body})]);
  assert.deepEqual(responses.map(x=>x.status).sort(),[201,409]);assert.equal((await ok('/users?q='+login)).total,1);
 });
 await test('Reused operation key cannot register a different payment',async()=>{
  const key=crypto.randomUUID(),row=await draft('income','1.00',key);const same=await draft('income','1.00',key);assert.equal(row.id,same.id);
  const response=await request('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'999.00',description:'Integration test income',categoryId:row.categoryId,counterpartyId:null,documentTypeId:null,requestKey:key}});
  assert.equal(response.status,409);assert.equal((await ok('/operations/'+row.id)).amount,'1.00');
 });
 await test('Cookie actions require CSRF header and reject foreign Origin',async()=>{const r=await fetch(base+'/api/auth/refresh',{method:'POST',headers:{Cookie:cookie}});assert.equal(r.status,403);assert.equal((await request('/auth/refresh',{method:'POST',extra:{Origin:'https://untrusted.invalid'}})).status,403);});
 await test('Refresh rotates, reuse revokes successor, logout revokes session',async()=>{const login=await request('/auth/login',{method:'POST',body:{login:cashier.login,password},auth:null,cookies:null});const original=login.headers.get('set-cookie').split(';')[0];const refreshed=await request('/auth/refresh',{method:'POST',cookies:original,auth:null});assert.equal(refreshed.status,200);const successor=refreshed.headers.get('set-cookie').split(';')[0];assert.notEqual(original,successor);assert.equal((await request('/auth/refresh',{method:'POST',cookies:original,auth:null})).status,401);assert.equal((await request('/auth/refresh',{method:'POST',cookies:successor,auth:null})).status,401);const again=await request('/auth/login',{method:'POST',body:{login:cashier.login,password},auth:null,cookies:null});const activeCookie=again.headers.get('set-cookie').split(';')[0];const activeToken=(await again.json()).accessToken;await ok('/auth/logout',{method:'POST',auth:activeToken,cookies:activeCookie});assert.equal((await request('/auth/refresh',{method:'POST',cookies:activeCookie,auth:null})).status,401);});

}
