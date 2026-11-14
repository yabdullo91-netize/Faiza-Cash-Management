// Run from faiza-cash: node tests/ledger-integrity.mjs [--baseline]
// Uses only the dedicated loopback *_test database; resets its public schema.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import {spawn, spawnSync} from 'node:child_process';

const cfg = JSON.parse(fs.readFileSync('.runtime/local.json', 'utf8'));
const fields = Object.fromEntries(cfg.ConnectionStrings__CashDb.split(';').map(part => {
  const at = part.indexOf('=');
  return [part.slice(0, at).toLowerCase(), part.slice(at + 1)];
}));
assert.ok(['localhost', '127.0.0.1', '::1'].includes(fields.host), 'Tests require loopback PostgreSQL');
assert.match(fields.database, /^faiza_[a-z0-9]+$/, 'Expected development base name before _test suffix');
const testDatabase = fields.database + '_test';
assert.match(testDatabase, /^faiza_[a-z0-9]+_test$/);
const dll = 'backend/src/FaizaCash.Api/bin/Debug/net10.0/FaizaCash.Api.dll';
assert.ok(fs.existsSync(dll), 'Build the backend first');
await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(5081, '127.0.0.1', () => probe.close(resolve));
});

const lock = '.runtime/database-tests.lock';
fs.closeSync(fs.openSync(lock, 'wx'));
const removeLock = () => { try { fs.unlinkSync(lock); } catch {} };
process.once('exit', removeLock);
let server, log;
const results = [];
let currentCase;
const base = 'http://127.0.0.1:5081';
const baseline = process.argv.includes('--baseline');
const suffix = crypto.randomUUID().slice(0, 8);
const endpoints = ['/categories', '/counterparties', '/document-types'];
let adminToken;

async function request(url, {method = 'GET', body, token = adminToken, raw} = {}) {
  const response = await fetch(base + '/api' + url, {
    method,
    headers: {'Content-Type': 'application/json', 'X-Faiza-Request': '1', ...(token ? {Authorization: 'Bearer ' + token} : {})},
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  const result = {status: response.status, data};
  if (currentCase) currentCase.requests.push({method, url, body: raw !== undefined ? raw : body, auth: token ? 'Bearer <test token>' : 'none', status: result.status, response: text.slice(0, 2000)});
  return result;
}
async function expect(url, options, status) {
  const result = await request(url, options);
  assert.equal(result.status, status, `${options?.method || 'GET'} ${url}: expected ${status}, received ${result.status}`);
  return result.data;
}
async function check(name, run, contract = 'implemented') {
  currentCase = {name, contract, status: 'running', requests: []};
  try { await run(); currentCase.status = 'passed'; console.log('PASS ' + name); }
  catch (error) { currentCase.status = 'failed'; currentCase.error = error.message; console.log('FAIL ' + name + ': ' + error.message); }
  results.push(currentCase); currentCase = undefined;
}
const categoryBody = name => ({name, type: 'income', parentId: null});
const partyBody = name => ({name, kind: 'supplier', taxCode: null, contact: null});
const typeBody = code => ({code, name: 'Test document ' + code});

function sql(statement, mustSucceed = true) {
  const result = spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe', ['-h','127.0.0.1','-U',fields.username,'-d',testDatabase,'-w','-At','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'], {env:{...process.env,PGPASSWORD:fields.password},input:statement,encoding:'utf8'});
  if(mustSucceed)assert.equal(result.status,0,result.stderr);
  return result;
}
function scalar(statement) {return sql(statement).stdout.trim();}

try {
  const reset = spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe', ['-h', '127.0.0.1', '-U', fields.username, '-d', testDatabase, '-w', '-v', 'ON_ERROR_STOP=1'], {
    env: {...process.env, PGPASSWORD: fields.password}, input: 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;', encoding: 'utf8'
  });
  assert.equal(reset.status, 0, 'Could not reset the dedicated test database');
  const initialPassword = crypto.randomBytes(20).toString('hex') + 'Aa1';
  log = fs.openSync('.runtime/ledger-server.log', 'w');
  server = spawn('dotnet', [dll], {
    env: {...process.env, ...cfg, ConnectionStrings__CashDb: cfg.ConnectionStrings__CashDb.replace(/Database=([^;]+)/i, 'Database=' + testDatabase),
      ASPNETCORE_URLS: base, ASPNETCORE_ENVIRONMENT: 'Test', Seed__AdminLogin: 'catalog-admin', Seed__AdminPassword: initialPassword,
      Jwt__Key: crypto.randomBytes(48).toString('hex'), Jwt__Issuer: 'FaizaCash', Jwt__Audience: 'FaizaCash', Logs__Directory: '.runtime/ledger-logs'},
    stdio: ['ignore', log, log]
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('Test API exited during startup; inspect .runtime/ledger-server.log');
    try { ready = (await fetch(base + '/health', {signal: AbortSignal.timeout(1000)})).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Test API did not become ready');
  const login = await expect('/auth/login', {method: 'POST', body: {login: 'catalog-admin', password: initialPassword}, token: null}, 200);
  adminToken = login.accessToken;
  await expect('/auth/change-password', {method: 'POST', body: {oldPassword: initialPassword, newPassword: crypto.randomBytes(20).toString('hex') + 'Aa1'}}, 204);
  const tokens = {admin: adminToken};
  const users = {};
  for (const role of ['accountant', 'cashier', 'manager', 'auditor']) {
    const password = crypto.randomBytes(20).toString('hex') + 'Aa1';
    const username = 'catalog-' + role + '-' + suffix;
    users[role] = await expect('/users', {method: 'POST', body: {login: username, fullName: 'Catalog test ' + role, password, roles: [role], mustChangePassword: false}}, 201);
    tokens[role] = (await expect('/auth/login', {method: 'POST', body: {login: username, password}, token: null}, 200)).accessToken;
  }

  const date = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Dushanbe'}).format(new Date());
  const currencies=await expect('/currencies',{},200);
  const makeBox=async code=>(await expect('/cashboxes',{method:'POST',body:{code:code+'-'+suffix,name:code,currencyId:currencies[0].id}},201)).id;
  const boxA=await makeBox('ALLOWED'),boxB=await makeBox('FOREIGN');
  await expect('/access',{method:'POST',body:{userId:users.accountant.id,cashboxId:boxA}},204);
  await expect('/categories',{method:'POST',body:{name:'Ledger income '+suffix,type:'income'}},204);
  await expect('/categories',{method:'POST',body:{name:'Ledger expense '+suffix,type:'expense'}},204);
  const cats=await expect('/categories',{},200),income=cats.find(c=>c.name==='Ledger income '+suffix).id,expense=cats.find(c=>c.name==='Ledger expense '+suffix).id;
  const input=(box,type='income',amount='1000.00')=>({cashboxId:box,date,type,amount,description:'Ledger fixture',categoryId:type==='income'?income:expense,requestKey:crypto.randomUUID()});
  const draft=async(box,type='income',amount='1000.00')=>expect('/operations',{method:'POST',body:input(box,type,amount)},201);
  const posted=await draft(boxA);await expect('/operations/'+posted.id+'/post',{method:'POST',body:{expectedVersion:posted.version}},200);
  if(baseline){
    await check('CONFIRMED: JSON casing bypasses destination cash access',async()=>{
      await expect('/operations',{method:'POST',token:tokens.accountant,body:input(boxB)},403);
      const body=input(boxB);body.CashboxId=body.cashboxId;delete body.cashboxId;
      await expect('/operations',{method:'POST',token:tokens.accountant,body},201);
    });
    await check('CONFIRMED: reversal can be reduced and posted as a full correction link',async()=>{
      const reversal=await expect('/operations/'+posted.id+'/reversals',{method:'POST',body:{date,reason:'Baseline fixture'}},201);
      const changed=await expect('/operations/'+reversal.id,{method:'PATCH',body:{amount:'1.00',categoryId:expense,version:reversal.version}},200);
      await expect('/operations/'+changed.id+'/post',{method:'POST',body:{expectedVersion:changed.version}},200);
      assert.equal((await expect('/cashboxes/'+boxA+'/balance',{},200)).balance,'999.00');
      assert.equal((await expect('/operations/'+posted.id,{},200)).reversalId,reversal.id);
    });
    await check('CONFIRMED: database accepts orphan cashbox and unsupported status',async()=>{
      const d=await draft(boxA);sql(`UPDATE "Operations" SET "CashboxId"=9223372036854775807,"Status"='unsupported' WHERE "Id"=${d.id};`);
      assert.equal(scalar(`SELECT count(*) FROM "Operations" WHERE "Id"=${d.id} AND "Status"='unsupported';`),'1');
    });
    await check('CONFIRMED: database permits posting without required metadata',async()=>{
      const d=await draft(boxA);sql(`UPDATE "Operations" SET "Status"='posted' WHERE "Id"=${d.id};`);
      assert.equal(scalar(`SELECT count(*) FROM "Operations" WHERE "Id"=${d.id} AND "PostingSeq" IS NULL;`),'1');
    });
    await check('CONFIRMED: posted backlink and version can be replaced arbitrarily',async()=>{
      sql(`UPDATE "Operations" SET "ReversalId"=9223372036854775807,"Version"="Version"+100 WHERE "Id"=${posted.id};`);
    });
  } else {
    await runRegressions({check,expect,request,sql,scalar,draft,input,posted,boxA,boxB,date,income,expense,tokens,users,suffix});
  }
} catch(error){console.error('SETUP/EXECUTION ERROR: '+error.message);results.push({name:'setup/execution',status:'error',error:error.message});}
finally{
  if(server&&server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;}
  if(log!==undefined)fs.closeSync(log);removeLock();
  const passed=results.filter(x=>x.status==='passed').length,failed=results.filter(x=>x.status!=='passed').length;
  const file=baseline?'.runtime/ledger-baseline-results.json':'.runtime/ledger-regression-results.json';
  fs.writeFileSync(file,JSON.stringify({time:new Date().toISOString(),scope:'Dedicated loopback PostgreSQL _test only; no working database access',baseline,totals:{total:results.length,passed,failed},results},null,2));
  console.log(`Ledger checks: ${passed} passed, ${failed} failed; ${file}`);process.exitCode=failed?1:0;
}
async function runRegressions({check,expect,request,sql,scalar,draft,posted,boxA,boxB,date}) {
  const day = offset => new Date(Date.parse(date + 'T00:00:00Z') + offset * 86400000).toISOString().slice(0,10);
  const balance = async box => (await expect(`/cashboxes/${box}/balance`,{},200)).balance;
  const sequence = (box,type='income') => scalar(`SELECT COALESCE((SELECT "LastNumber" FROM "Sequences" WHERE "CashboxId"=${box} AND "Type"='${type}' AND "Year"=${Number(date.slice(0,4))}),0);`);

  await check('stale posting confirmation returns 409 without changing the ledger',async()=>{
    const row=await draft(boxA,'income','12.34');
    const changed=await expect(`/operations/${row.id}`,{method:'PATCH',body:{description:'Изменено после подтверждения',version:row.version}},200);
    const beforeBalance=await balance(boxA),beforeSequence=sequence(boxA);
    const response=await request(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}});
    assert.equal(response.status,409);
    const current=await expect(`/operations/${row.id}`,{},200);
    assert.equal(current.status,'draft');assert.equal(current.version,changed.version);assert.equal(current.documentNumber,null);
    assert.equal(await balance(boxA),beforeBalance);assert.equal(sequence(boxA),beforeSequence);
    assert.equal(scalar(`SELECT count(*) FROM "AuditEvents" WHERE "Action"='operation_posted' AND "EntityId"=${row.id};`),'0');
  });

  await check('a later receipt cannot fund an earlier expense',async()=>{
    const earlier=await draft(boxB,'expense','10.00');
    const datedEarlier=await expect(`/operations/${earlier.id}`,{method:'PATCH',body:{date:day(-2),version:earlier.version}},200);
    const earlyResponse=await request(`/operations/${earlier.id}/post`,{method:'POST',body:{expectedVersion:datedEarlier.version}});
    assert.equal(earlyResponse.status,409);
    assert.equal((await expect(`/operations/${earlier.id}`,{},200)).status,'draft');
    const later=await draft(boxB,'income','10.00');
    const changed=await expect(`/operations/${later.id}`,{method:'PATCH',body:{date:day(-1),version:later.version}},200);
    assert.equal((await request(`/operations/${changed.id}/post`,{method:'POST',body:{expectedVersion:changed.version}})).status,200);
    const afterReceipt=await balance(boxB);
    assert.equal((await request(`/operations/${earlier.id}/post`,{method:'POST',body:{expectedVersion:datedEarlier.version}})).status,409);
    assert.equal(await balance(boxB),afterReceipt);
  });

  await check('concurrent expenses cannot jointly create a negative balance',async()=>{
    const first=await draft(boxA,'expense','600.00'),second=await draft(boxA,'expense','600.00');
    const responses=await Promise.all([first,second].map(row=>request(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}})));
    assert.deepEqual(responses.map(x=>x.status).sort(),[200,409]);
    assert.equal(await balance(boxA),'400.00');
  });

  await check('repeated posting changes the balance and document counter only once',async()=>{
    const row=await draft(boxA,'income','1.00'),beforeBalance=await balance(boxA),beforeSequence=sequence(boxA);
    assert.equal((await request(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}})).status,200);
    const once=await balance(boxA),afterSequence=sequence(boxA);
    assert.equal((await request(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}})).status,409);
    assert.equal(await balance(boxA),once);assert.equal(sequence(boxA),afterSequence);
    assert.equal(Number(once)-Number(beforeBalance),1);assert.equal(Number(afterSequence),Number(beforeSequence)+1);
  });

  await check('reversal is immutable, linked, and posts exactly once',async()=>{
    const origin=await draft(boxA,'income','50.00');
    await expect(`/operations/${origin.id}/post`,{method:'POST',body:{expectedVersion:origin.version}},200);
    const beforeReversal=await balance(boxA);
    const reversal=await expect(`/operations/${origin.id}/reversals`,{method:'POST',body:{reason:'Regression test reversal',date}},201);
    assert.equal(await balance(boxA),beforeReversal);
    assert.equal((await request(`/operations/${reversal.id}`,{method:'PATCH',body:{amount:'1.00',version:reversal.version}})).status,409);
    const saved=await expect(`/operations/${reversal.id}`,{},200);
    assert.equal(saved.amount,'50.00');assert.equal(saved.type,'expense');assert.equal(saved.cashboxId,boxA);
    await expect(`/operations/${reversal.id}/post`,{method:'POST',body:{expectedVersion:saved.version}},200);
    assert.equal((await expect(`/operations/${origin.id}`,{},200)).reversalId,reversal.id);
    assert.equal(Number(await balance(boxA)),Number(beforeReversal)-50);
  });

  await check('audit failure rolls back posting and restores the document counter',async()=>{
    const row=await draft(boxA,'income','9.00');
    const beforeBalance=await balance(boxA),beforeSequence=sequence(boxA);
    sql(`CREATE FUNCTION fail_ledger_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."Action"='operation_posted' THEN RAISE EXCEPTION 'test audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_ledger_audit BEFORE INSERT ON "AuditEvents" FOR EACH ROW EXECUTE FUNCTION fail_ledger_audit();`);
    try {
      assert.equal((await request(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}})).status,500);
    } finally {
      sql('DROP TRIGGER fail_ledger_audit ON "AuditEvents"; DROP FUNCTION fail_ledger_audit();');
    }
    const afterFailure=await expect(`/operations/${row.id}`,{},200);
    assert.equal(afterFailure.status,'draft');assert.equal(afterFailure.documentNumber,null);
    assert.equal(await balance(boxA),beforeBalance);assert.equal(sequence(boxA),beforeSequence);
    const postedRow=await expect(`/operations/${row.id}/post`,{method:'POST',body:{expectedVersion:row.version}},200);
    assert.equal(Number(sequence(boxA)),Number(beforeSequence)+1);
    assert.ok(postedRow.documentNumber);
  });

  await check('summary aggregates agree with the ledger closing balance',async()=>{
    const summary=await expect(`/summary?cashboxId=${boxA}&from=${date}&to=${date}`,{},200);
    const closing=await balance(boxA);
    assert.equal(summary.closing,closing);
    assert.equal(Number(summary.closing),Number(summary.opening)+Number(summary.income)-Number(summary.expense));
    const cashbook=await expect(`/reports/cashbook?cashboxId=${boxA}&from=${date}&to=${date}`,{},200);
    assert.equal(cashbook.closing,closing);
  });
}
