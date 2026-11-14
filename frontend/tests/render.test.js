import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('users table renders roles and empty results without join crashes',async()=>{
  const server=await createServer({configFile:false,server:{middlewareMode:true},optimizeDeps:{noDiscovery:true}});
  try{
    const {UsersPage}=await server.ssrLoadModule('/src/pages/UsersPage.jsx');
    const user={id:'u1',login:'admin',fullName:'Администратор',active:true,roles:['admin']};
    const assigned={userId:'u2',cashboxId:7};
    const props={user,boxes:[{id:7,name:'Основная касса'}],access:[assigned],onModal(){},onToggle(){},onRevoke(){},onPage(){}};
    const html=renderToStaticMarkup(React.createElement(UsersPage,{...props,data:{items:[user,{...user,id:'u2',login:'no-role',roles:[]}],page:1,total:2}}));
    assert.match(html,/Администратор/);assert.match(html,/Роль не назначена/);assert.doesNotMatch(html,/undefined/);
    assert.match(html,/Основная касса/);assert.match(html,/aria-label="Отозвать доступ: Администратор — Основная касса"/);
    assert.match(renderToStaticMarkup(React.createElement(UsersPage,{...props,data:{items:[],page:1,total:0}})),/Сотрудники не найдены/);
    assert.throws(()=>renderToStaticMarkup(React.createElement(UsersPage,{...props,data:{items:[{id:10,amount:'100.00'}],page:1,total:1}})),/неполные данные/);
  }finally{await server.close();}
});
test('document dialog keeps actions outside its scroll area and respects draft ownership',async()=>{
  const server=await createServer({configFile:false,server:{middlewareMode:true},optimizeDeps:{noDiscovery:true}});
  try{
    const {OperationDialog}=await server.ssrLoadModule('/src/components/OperationDialog.jsx');
    const {PasswordInput}=await server.ssrLoadModule('/src/components/PasswordInput.jsx');
    const user={id:'u1',roles:['cashier']};const row={id:1,cashboxId:1,type:'income',date:'2026-11-12',status:'draft',amount:'1.00',description:'<script>danger()</script>',authorId:'u2',categoryId:1};
    const base={modal:{kind:'details',row},boxes:[{id:1,name:'Основная касса',active:true}],currency:'TJS',user,roles:[],busy:false,onClose(){},onSave(){},onModal(){},onDownload(){}};
    const foreign=renderToStaticMarkup(React.createElement(OperationDialog,base));
    assert.match(foreign,/role="dialog"/);assert.match(foreign,/aria-modal="true"/);assert.match(foreign,/class="dialog-footer"/);
    assert.doesNotMatch(foreign,/<script>/);assert.match(foreign,/&lt;script&gt;/);assert.doesNotMatch(foreign,/>Провести</);
    const own=renderToStaticMarkup(React.createElement(OperationDialog,{...base,modal:{kind:'details',row:{...row,authorId:'u1'}}}));assert.match(own,/>Провести</);
    const create=renderToStaticMarkup(React.createElement(OperationDialog,{...base,modal:{kind:'operation',type:'income',categories:[{id:1,name:'Категория',type:'income',active:true}],parties:[]}}));assert.match(create,/form="document-form"/);assert.match(create,/inputMode="decimal"/i);assert.match(create,/черновик/);
    const password=renderToStaticMarkup(React.createElement(PasswordInput,{name:'password',autoComplete:'new-password'}));
    assert.match(password,/type="password"/);assert.match(password,/autoComplete="new-password"/);assert.match(password,/type="button"/);assert.match(password,/aria-label="Показать пароль"/);assert.match(password,/aria-pressed="false"/);
  }finally{await server.close();}
});
