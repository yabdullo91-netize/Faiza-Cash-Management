import React from 'react';
import {LockKeyhole} from 'lucide-react';
import {Pager,Empty} from '../components/ui';
import {usersPageContract} from '../services/contracts.js';
import {rolesText} from '../utils/format.js';

export function UsersPage({data,user,boxes=[],access=[],onModal,onToggle,onRevoke,onPage}) {
  const page=usersPageContract(data);
  return <section className="panel">
    <div className="panel-heading">
      <div><h2>Сотрудники и доступ к кассам</h2><p>Права применяются сервером. Доступ к каждой кассе назначается отдельно.</p></div>
      <button className="button secondary" disabled={!page.items.length} onClick={()=>onModal({kind:'access',users:page.items})}><LockKeyhole size={18}/>Выдать доступ к кассе</button>
    </div>
    <div className="table-scroll"><table>
      <thead><tr><th>Сотрудник</th><th>Логин</th><th>Роль</th><th>Состояние</th><th>Назначенные кассы</th><th>Действия</th></tr></thead>
      <tbody>{page.items.map(row=>{
        const assignments=access.filter(item=>item.userId===row.id);
        return <tr key={row.id}>
          <td><strong>{row.fullName||'Имя не указано'}</strong></td>
          <td>{row.login}</td>
          <td>{rolesText(row.roles)}</td>
          <td><span className={'badge '+(row.active?'posted':'archived')}>{row.active?'Активен':'Отключён'}</span></td>
          <td>{assignments.length?assignments.map(item=>{
            const boxName=boxes.find(box=>box.id===item.cashboxId)?.name||`Касса №${item.cashboxId}`;
            return <div className="access-assignment" key={`${item.userId}:${item.cashboxId}`}>
              <span>{boxName}</span>
              <button className="text-btn" aria-label={`Отозвать доступ: ${row.fullName} — ${boxName}`} onClick={()=>onRevoke(item,row.fullName,boxName)}>Отозвать</button>
            </div>;
          }):<span className="muted">Нет назначенных касс</span>}</td>
          <td><div className="row-actions"><button className="text-btn" onClick={()=>onModal({kind:'editUser',row})}>Изменить</button>{row.id!==user.id&&<button className="text-btn" onClick={()=>onToggle(row)}>{row.active?'Отключить':'Включить'}</button>}</div></td>
        </tr>;
      })}</tbody>
    </table>{!page.items.length&&<Empty text="Сотрудники не найдены. Измените поиск или добавьте пользователя."/>}</div>
    <Pager index={page.page} total={page.total} onChange={onPage}/>
  </section>;
}
