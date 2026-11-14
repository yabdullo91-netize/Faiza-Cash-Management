import test from 'node:test';
import assert from 'node:assert/strict';
import {usersPageContract,userContract,pageSnapshot,ContractError} from '../src/services/contracts.js';
import {normalizeAmount,money,records,quickPeriod,dateText,sumAmounts} from '../src/utils/format.js';
import {readRoute,routeHash,operationParams} from '../src/utils/route.js';

test('switching operations to users never exposes operation rows as users',()=>{
  const old={key:'operations:cashbox1',status:'success',data:{items:[{id:1,amount:'100.00'}]}};
  assert.deepEqual(pageSnapshot(old,'users:page1'),{key:'users:page1',status:'loading',data:null,error:null});
  assert.throws(()=>usersPageContract({total:1,items:old.data.items}),ContractError);
  const valid={id:'u1',login:'cashier',fullName:'Кассир',active:true,roles:['cashier']};
  assert.equal(usersPageContract({total:1,items:[valid]}).items[0],valid);
});
test('missing roles are a contract error, empty roles are explicitly supported',()=>{
  const user={id:'u1',login:'test',fullName:'Сотрудник',active:true};
  assert.throws(()=>userContract(user),/неполные данные/);
  assert.deepEqual(userContract({...user,roles:[]}).roles,[]);
  assert.throws(()=>usersPageContract({items:[],total:'1'}),ContractError);
});
test('a late response for another cashbox or period is not rendered',()=>{
  const old={key:'overview:box1:2026-11-01',status:'success',data:{closing:'999.00'}};
  assert.equal(pageSnapshot(old,'overview:box2:2026-11-01').data,null);
  assert.equal(pageSnapshot(old,'overview:box1:2026-11-12').data,null);
  assert.equal(pageSnapshot(old,old.key).data.closing,'999.00');
});
test('amount input accepts comma and dot without floating-point arithmetic',()=>{
  for(const input of ['1 500,25','1500.25','001500,25'])assert.equal(normalizeAmount(input),'1500.25');
  assert.equal(normalizeAmount(',5'),'0.50');
  assert.equal(normalizeAmount('9999999999999999.99'),'9999999999999999.99');
  for(const input of ['0','-1','1.001','1e3','10000000000000000','1,2,3'])assert.throws(()=>normalizeAmount(input));
  assert.equal(money('9999999999999999.99').replace(/[\s\u00a0\u202f]/g,''),'9999999999999999,99');
  assert.equal(money(undefined),'—');
  assert.equal(sumAmounts(['9999999999999999.99','0.01']),'10000000000000000.00');
});
test('route roundtrip preserves filters page and direct section links',()=>{
  const route=readRoute('#/operations?box=3&from=2026-11-01&to=2026-11-12&type=expense&categoryId=2&counterpartyId=5&status=posted&q=Оплата&index=4&sort=amount_desc');
  assert.deepEqual(readRoute(routeHash(route)),route);
  const filters=operationParams(route);assert.equal(filters.get('categoryId'),'2');assert.equal(filters.get('counterpartyId'),'5');assert.equal(filters.get('q'),'Оплата');
  assert.equal(readRoute('#/users').page,'users');assert.equal(readRoute('#/not-a-page').page,'overview');
  assert.equal(readRoute('#/operations?index=-4&box=hello&type=anything').index,1);
});
test('Russian dates counts and inclusive quick periods are unambiguous',()=>{
  assert.equal(dateText('2026-11-12'),'12.11.2026');
  assert.equal(records(1),'1 запись');assert.equal(records(3),'3 записи');assert.equal(records(11),'11 записей');assert.equal(records(21),'21 запись');
  assert.deepEqual(quickPeriod('week','2026-11-12'),{from:'2026-11-06',to:'2026-11-12'});
});
