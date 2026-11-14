// Run from faiza-cash: node tests/catalog.mjs
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

try {
  const reset = spawnSync('C:/Program Files/PostgreSQL/18/bin/psql.exe', ['-h', '127.0.0.1', '-U', fields.username, '-d', testDatabase, '-w', '-v', 'ON_ERROR_STOP=1'], {
    env: {...process.env, PGPASSWORD: fields.password}, input: 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;', encoding: 'utf8'
  });
  assert.equal(reset.status, 0, 'Could not reset the dedicated test database');
  const initialPassword = crypto.randomBytes(20).toString('hex') + 'Aa1';
  log = fs.openSync('.runtime/catalog-server.log', 'w');
  server = spawn('dotnet', [dll], {
    env: {...process.env, ...cfg, ConnectionStrings__CashDb: cfg.ConnectionStrings__CashDb.replace(/Database=([^;]+)/i, 'Database=' + testDatabase),
      ASPNETCORE_URLS: base, ASPNETCORE_ENVIRONMENT: 'Test', Seed__AdminLogin: 'catalog-admin', Seed__AdminPassword: initialPassword,
      Jwt__Key: crypto.randomBytes(48).toString('hex'), Jwt__Issuer: 'FaizaCash', Jwt__Audience: 'FaizaCash', Logs__Directory: '.runtime/catalog-logs'},
    stdio: ['ignore', log, log]
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('Test API exited during startup; inspect .runtime/catalog-server.log');
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

  const invalidUser = {login: 'invalid-user-' + suffix, fullName: 'Catalog validation', password: 'ValidPassword123', roles: ['cashier'], mustChangePassword: false};
  await check('users: reject login over 80 characters', () => expect('/users', {method: 'POST', body: {...invalidUser, login: 'x'.repeat(81)}}, 400));
  await check('users: reject NUL in login', () => expect('/users', {method: 'POST', body: {...invalidUser, login: 'bad\u0000login-' + suffix}}, 400));
  await check('users: reject full name over 160 characters', () => expect('/users', {method: 'POST', body: {...invalidUser, fullName: 'x'.repeat(161)}}, 400));
  await check('users: reject passwords over 256 characters', () => expect('/users', {method: 'POST', body: {...invalidUser, password: 'A1' + 'x'.repeat(255)}}, 400));

  await check('scope: /api/catalog is not an implemented route', () => expect('/catalog', {}, 404));
  for (const endpoint of endpoints) {
    for (const token of [null, 'not-a-valid-jwt']) await check(`${endpoint}: absent/invalid token ${token === null ? 'none' : 'invalid'}`, () => expect(endpoint, {token}, 401));
    await check(`${endpoint}: anonymous write is denied`, () => expect(endpoint, {method: 'POST', body: {}, token: null}, 401));
    for (const role of Object.keys(tokens)) await check(`${endpoint}: ${role} reads`, async () => assert.ok(Array.isArray(await expect(endpoint, {token: tokens[role]}, 200))));
    for (const role of ['cashier', 'manager', 'auditor']) await check(`${endpoint}: ${role} cannot create`, () => expect(endpoint, {method: 'POST', token: tokens[role], body: endpoint === '/categories' ? categoryBody('Forbidden') : endpoint === '/counterparties' ? partyBody('Forbidden') : typeBody('FORBIDDEN')}, 403));
  }

  const ids = {};
  for (const endpoint of ['/categories', '/counterparties']) {
    const make = endpoint === '/categories' ? categoryBody : partyBody;
    const label = endpoint.slice(1) + '-' + suffix;
    await check(`${endpoint}: admin creates and reads normalized name`, async () => {
      await expect(endpoint, {method: 'POST', body: make('  ' + label + '   demo  ')}, 204);
      const rows = await expect(endpoint + '?q=' + label, {}, 200);
      const row = rows.find(x => x.name === label + ' demo'); assert.ok(row); ids[endpoint] = row.id;
    });
    await check(`${endpoint}: accountant creates`, () => expect(endpoint, {method: 'POST', token: tokens.accountant, body: make(label + '-accountant')}, 204));
    for (const [name, value] of [['blank', '  '], ['missing', undefined], ['too long', 'x'.repeat(161)]]) await check(`${endpoint}: reject ${name} name`, () => expect(endpoint, {method: 'POST', body: make(value)}, 400));
    await check(`${endpoint}: normalized duplicate returns 409`, () => expect(endpoint, {method: 'POST', body: make((' ' + label + '  DEMO ').toUpperCase())}, 409));
    await check(`${endpoint}: search finds matching record`, async () => assert.ok((await expect(endpoint + '?q=' + label, {}, 200)).some(x => x.id === ids[endpoint])));
    await check(`${endpoint}: read cache invalidated after rename`, async () => {
      await expect(endpoint, {}, 200);
      await expect(endpoint + '/' + ids[endpoint], {method: 'PATCH', body: {name: label + '-renamed', active: false}}, 204);
      const row = (await expect(endpoint, {}, 200)).find(x => x.id === ids[endpoint]); assert.equal(row.name, label + '-renamed'); assert.equal(row.active, false);
    });
    await check(`${endpoint}: invalid patch name`, () => expect(endpoint + '/' + ids[endpoint], {method: 'PATCH', body: {name: ' '}}, 400));
    await check(`${endpoint}: missing patch target`, () => expect(endpoint + '/9223372036854775807', {method: 'PATCH', body: {active: false}}, 404));
    for (const role of ['cashier', 'manager', 'auditor']) await check(`${endpoint}: ${role} cannot update`, () => expect(endpoint + '/' + ids[endpoint], {method: 'PATCH', token: tokens[role], body: {active: true}}, 403));
    await check(`${endpoint}: malformed JSON`, () => expect(endpoint, {method: 'POST', raw: '{'}, 400));
    await check(`${endpoint}: wrong JSON field type`, () => expect(endpoint, {method: 'POST', body: {...make(label + '-wrong'), name: 123}}, 400));
    await check(`${endpoint}: concurrent duplicates create one record`, async () => {
      const name = label + '-parallel';
      const responses = await Promise.all([request(endpoint, {method: 'POST', body: make(name)}), request(endpoint, {method: 'POST', body: make(name)})]);
      assert.deepEqual(responses.map(r => r.status).sort(), [204, 409]);
    });
    await check(`${endpoint}: NUL search rejected as invalid input`, () => expect(endpoint + '?q=%00', {}, 400), 'robustness: invalid client data must not produce 500');
    await check(`${endpoint}: NUL in name rejected as invalid input`, () => expect(endpoint, {method: 'POST', body: make('bad\u0000name-' + suffix)}, 400), 'robustness: invalid client data must not produce 500');
  }
  await check('categories: invalid direction', () => expect('/categories', {method: 'POST', body: {name: 'Invalid direction', type: 'transfer'}}, 400));
  await check('categories: nonexistent parent', () => expect('/categories', {method: 'POST', body: {...categoryBody('No parent ' + suffix), parentId: 9223372036854775}}, 400));
  await check('categories: invalid direction filter rejected', () => expect('/categories?type=invalid', {}, 400), 'contract improvement: reject unsupported enum filters');
  await check('counterparties: invalid kind', () => expect('/counterparties', {method: 'POST', body: {name: 'Invalid kind', kind: 'bank'}}, 400));
  await check('counterparties: taxCode length limit', () => expect('/counterparties', {method: 'POST', body: {...partyBody('Too long tax ' + suffix), taxCode: '1'.repeat(41)}}, 400));
  await check('counterparties: contact length limit', () => expect('/counterparties', {method: 'POST', body: {...partyBody('Too long contact ' + suffix), contact: 'x'.repeat(161)}}, 400));
  await check('counterparties: NUL in contact rejected', () => expect('/counterparties', {method: 'POST', body: {...partyBody('Bad contact ' + suffix), contact: 'a\u0000b'}}, 400), 'robustness: invalid client data must not produce 500');
  await check('document-types: admin creates', () => expect('/document-types', {method: 'POST', body: typeBody('TYPE-' + suffix)}, 204));
  await check('document-types: accountant creates', () => expect('/document-types', {method: 'POST', token: tokens.accountant, body: typeBody('ACCOUNTANT-' + suffix)}, 204));
  await check('document-types: blank code', () => expect('/document-types', {method: 'POST', body: {code: ' ', name: 'Test'}}, 400));
  await check('document-types: blank name', () => expect('/document-types', {method: 'POST', body: {code: 'BLANK', name: ' '}}, 400));
  await check('document-types: code length limit', () => expect('/document-types', {method: 'POST', body: typeBody('X'.repeat(25))}, 400));
  await check('document-types: name length limit', () => expect('/document-types', {method: 'POST', body: {code: 'LONG-NAME-' + suffix, name: 'x'.repeat(161)}}, 400));
  await check('document-types: NUL in code rejected', () => expect('/document-types', {method: 'POST', body: typeBody('bad\u0000code')}, 400), 'robustness: invalid client data must not produce 500');
  await check('document-types: duplicate normalized code rejected', async () => {
    const code = 'DUP-' + suffix;
    await expect('/document-types', {method: 'POST', body: typeBody(code)}, 204);
    await expect('/document-types', {method: 'POST', body: typeBody(' ' + code.toLowerCase() + ' ')}, 409);
  }, 'contract improvement: document code should identify one dictionary entry');
  await check('document-types: duplicate code persisted count', async () => {
    const rows = await expect('/document-types', {}, 200);
    assert.equal(rows.filter(x => x.code === 'DUP-' + suffix.toUpperCase()).length, 1);
  }, 'contract improvement: unique document type code');
  await check('document-types: concurrent normalized duplicates return one conflict', async () => {
    const code = 'PARALLEL-' + suffix;
    const responses = await Promise.all([
      request('/document-types', {method: 'POST', body: typeBody(code)}),
      request('/document-types', {method: 'POST', body: typeBody(' ' + code.toLowerCase() + ' ')})
    ]);
    assert.deepEqual(responses.map(response => response.status).sort(), [204, 409]);
  });
  await check('catalog reads: disabled user denied despite previously valid JWT', async () => {
    await expect('/users/' + users.cashier.id, {method: 'PATCH', body: {active: false}}, 204);
    for (const endpoint of endpoints) await expect(endpoint, {token: tokens.cashier}, 401);
  });
} catch (error) {
  console.error('SETUP/EXECUTION ERROR: ' + error.message);
  results.push({name: 'setup/execution', status: 'error', error: error.message});
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill(); await stopped;
  }
  if (log !== undefined) fs.closeSync(log);
  removeLock();
  const passed = results.filter(x => x.status === 'passed').length;
  const failed = results.filter(x => x.status !== 'passed').length;
  fs.writeFileSync('.runtime/catalog-test-results.json', JSON.stringify({time: new Date().toISOString(),scope: 'Categories, counterparties and document types; dedicated loopback PostgreSQL _test only', totals: {total: results.length, passed, failed}, results}, null, 2));
  console.log(`Catalog checks: ${passed} passed, ${failed} failed, ${results.length} total. Details: .runtime/catalog-test-results.json`);
  process.exitCode = failed ? 1 : 0;
}
