import test from 'node:test';
import assert from 'node:assert/strict';
import {api,setToken} from '../src/services/api.js';
test('parallel expired requests share one refresh and retry with the new token',async()=>{
 const native=globalThis.fetch;let refreshes=0,expired=0;setToken('expired');
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.credentials,'include');assert.equal(options.headers['X-Faiza-Request'],'1');
  if(url==='/api/auth/refresh'){refreshes++;await new Promise(r=>setTimeout(r,20));return Response.json({accessToken:'fresh',user:{id:'test-user',login:'test',fullName:'Тестовый сотрудник',active:true,roles:['cashier']}});}
  if(options.headers.Authorization==='Bearer expired'){expired++;return new Response(null,{status:401});}
  assert.equal(options.headers.Authorization,'Bearer fresh');return Response.json({ok:true});
 };
 try{assert.deepEqual(await Promise.all([api('/one'),api('/two')]),[{ok:true},{ok:true}]);assert.equal(expired,2);assert.equal(refreshes,1);}finally{globalThis.fetch=native;setToken(null);}
});
test('server errors preserve details and forbidden requests are never retried',async()=>{
 const native=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({detail:'Недостаточно прав'},{status:403});};
 try{await assert.rejects(()=>api('/users'),/Недостаточно прав/);assert.equal(calls,1);}finally{globalThis.fetch=native;}
});
