import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
export async function runReviewCases({test,request,ok,draft,box,date,income,expense,admin}) {
  await test('Users response has explicit role arrays and never exposes password fields',async()=>{
    const page=await ok('/users');assert.ok(Number.isInteger(page.total));
    for(const user of page.items){assert.ok(Array.isArray(user.roles));assert.ok(user.roles.every(r=>typeof r==='string'));assert.equal(typeof user.fullName,'string');assert.ok(!('passwordHash'in user));}
    assert.ok(page.items.some(u=>u.id===admin.id&&u.roles.includes('admin')));
  });
  await test('Cashbook has deterministic running balances across server pages',async()=>{
    const first=await ok(`/reports/cashbook?cashboxId=${box}&from=${date}&to=${date}&page=1&pageSize=2`);
    const second=await ok(`/reports/cashbook?cashboxId=${box}&from=${date}&to=${date}&page=2&pageSize=2`);
    assert.equal(first.opening,'0.00');assert.equal(first.items[0].balance,'100.10');assert.equal(first.items[1].balance,'20.10');
    assert.equal(second.items[0].balance,'20.30');assert.equal(second.items[1].balance,'100.30');assert.equal(first.closing,'100.30');
    assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,4);
    const balance=await ok('/cashboxes/'+box+'/balance');assert.equal(balance.balance,first.closing);
    const csv=await request(`/reports/cash.csv?cashboxId=${box}&from=${date}&to=${date}`);assert.equal(csv.status,200);const text=await csv.text();assert.match(text,/Остаток после операции/);assert.match(text,/Остаток на начало/);assert.match(text,/Итоги периода/);
    assert.equal((await request(`/reports/cashbook?cashboxId=${box}&from=${date}&to=${date}&type=expense`)).status,400);
  });
  await test('Filtered CSV and PDF exports match the entire result set including drafts',async()=>{
    const marker='Экспорт-'+crypto.randomUUID();const saved=[];
    for(const amount of ['1.11','2.22','3.33'])saved.push(await ok('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount,description:marker,categoryId:income,counterpartyId:null,documentTypeId:null,requestKey:crypto.randomUUID()}}));
    const params=new URLSearchParams({cashboxId:box,from:date,to:date,q:marker,status:'draft',type:'income',categoryId:income,sort:'amount_desc'});
    const list=await ok('/operations?'+params+'&pageSize=1');assert.equal(list.total,3);assert.equal(list.items.length,1);
    const response=await request('/reports/cash.csv?'+params);assert.equal(response.status,200);const csv=await response.text();
    assert.equal(csv.split(marker).length-1,3);assert.ok(csv.indexOf('3.33')<csv.indexOf('1.11'));
    for(const row of saved)assert.ok(csv.includes('Черновик №'+row.id));
    const pdf=await request('/reports/cash.pdf?'+params);assert.equal(pdf.status,200);assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,4).toString(),'%PDF');
  });
  await test('Directories reject normalized duplicates and preserve archived references',async()=>{
    const suffix=crypto.randomUUID();const name='Категория '+suffix;
    await ok('/categories',{method:'POST',body:{name,type:'income',parentId:null}});
    assert.equal((await request('/categories',{method:'POST',body:{name:'  '+name.toUpperCase()+'  ',type:'income',parentId:null}})).status,409);
    const category=(await ok('/categories')).find(c=>c.name===name);
    const partyName='Контрагент '+suffix;await ok('/counterparties',{method:'POST',body:{name:partyName,kind:'client'}});
    assert.equal((await request('/counterparties',{method:'POST',body:{name:partyName.toUpperCase(),kind:'client'}})).status,409);
    const party=(await ok('/counterparties')).find(c=>c.name===partyName);
    const row=await ok('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'7.00',description:'Сохранение ссылок',categoryId:category.id,counterpartyId:party.id,documentTypeId:null,requestKey:crypto.randomUUID()}});
    await ok('/categories/'+category.id,{method:'PATCH',body:{active:false}});
    await ok('/counterparties/'+party.id,{method:'PATCH',body:{active:false}});
    const stored=await ok('/operations/'+row.id);assert.equal(stored.category,name);assert.equal(stored.counterparty,partyName);
    const edited=await ok('/operations/'+row.id,{method:'PATCH',body:{description:'Ссылка сохранена',version:stored.version}});assert.equal(edited.categoryId,category.id);
    const cleared=await ok('/operations/'+row.id,{method:'PATCH',body:{clearCounterparty:true,version:edited.version}});assert.equal(cleared.counterpartyId,null);
    assert.equal((await request('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'1.00',description:'Недопустимая категория',categoryId:category.id,requestKey:crypto.randomUUID()}})).status,400);
  });
  await test('Audit is human readable filterable and captures safe before-after changes',async()=>{
    const original='До изменения '+crypto.randomUUID();await ok('/counterparties',{method:'POST',body:{name:original,kind:'other'}});
    const row=(await ok('/counterparties')).find(c=>c.name===original);const changed='После изменения '+row.id;
    await ok('/counterparties/'+row.id,{method:'PATCH',body:{name:changed}});
    const page=await ok('/audit?action=data_modified&entity=Counterparty&userId='+admin.id+'&includeTechnical=true');
    const event=page.items.find(e=>e.entityId===row.id);assert.ok(event);assert.equal(event.userName,admin.fullName);assert.equal(event.actionName,'Изменена запись');assert.equal(event.entityName,'Контрагент');
    const details=JSON.parse(event.details);assert.equal(details.changes.Name.before,original);assert.equal(details.changes.Name.after,changed);
    const login=await ok('/audit?action=login');assert.ok(login.items.length);for(const e of login.items)assert.ok(!('password'in JSON.parse(e.details)));
    const options=await ok('/audit/options');assert.ok(options.users.some(u=>u.id===admin.id));
  });
  await test('Malformed money filters and document values return validation errors rather than 500',async()=>{
    for(const amount of ['не число','1e3','999999999999999999999999999999999999999'])assert.equal((await request('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount,description:'Проверка',categoryId:income,requestKey:crypto.randomUUID()}})).status,400);
    assert.equal((await request('/reports/cashbook?cashboxId='+box+'&from='+date+'&to=not-a-date')).status,400);
    assert.equal((await request('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'1.00',description:'Неверное направление',categoryId:expense,requestKey:crypto.randomUUID()}})).status,400);
  });
  await test('CSV protects formula-like content without unsafe character decoding',async()=>{
    const name='   =SUM(1;2) '+crypto.randomUUID();const row=await ok('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'1.00',description:name,categoryId:income,requestKey:crypto.randomUUID()}});
    const response=await request('/reports/cash.csv?'+new URLSearchParams({cashboxId:box,from:date,to:date,status:'draft',q:name.trim()}));
    assert.equal(response.status,200);assert.match(await response.text(),/"'=SUM\(1;2\)/);
  });
  await test('PDF supports long Russian descriptions and multi-page export',async()=>{
    const marker='Длинный отчёт '+crypto.randomUUID();
    const description=(marker+' · '+('Оплата материалов для хозяйственной деятельности организации, поставка по учебному договору. '.repeat(8))).slice(0,950);
    for(let i=0;i<12;i++)await ok('/operations',{method:'POST',body:{cashboxId:box,date,type:'income',amount:'1234.56',description:description+' №'+i,categoryId:income,requestKey:crypto.randomUUID()}});
    const response=await request('/reports/cash.pdf?'+new URLSearchParams({cashboxId:box,from:date,to:date,status:'draft',q:marker}));
    assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');fs.writeFileSync('.runtime/long-report.pdf',bytes);
  });
  await test('User role changes keep the same contract and produce readable audit records',async()=>{
    const password=crypto.randomBytes(14).toString('hex')+'Aa1';
    const user=await ok('/users',{method:'POST',body:{login:'review'+Date.now(),password,fullName:'Тестовый сотрудник',roles:['cashier']}});
    await ok('/users/'+user.id,{method:'PATCH',body:{roles:['accountant']}});
    const users=await ok('/users?q='+user.login);assert.deepEqual(users.items[0].roles,['accountant']);
    const audit=await ok('/audit?action=user_updated');const event=audit.items.find(e=>JSON.parse(e.details).id===user.id);assert.ok(event);
    assert.deepEqual(JSON.parse(event.details).changes.Roles,{before:['cashier'],after:['accountant']});assert.ok(!event.details.includes(password));
  });
}
