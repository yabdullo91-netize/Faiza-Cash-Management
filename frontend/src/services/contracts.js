export class ContractError extends Error {
  constructor(message) { super(message); this.name = 'ContractError'; }
}

export function userContract(user) {
  if (!user || typeof user.id !== 'string' || typeof user.login !== 'string' ||
      typeof user.fullName !== 'string' || typeof user.active !== 'boolean' ||
      !Array.isArray(user.roles) || user.roles.some(role => typeof role !== 'string')) {
    throw new ContractError('Сервер вернул неполные данные пользователя. Обновите список; если ошибка повторяется, обратитесь к администратору.');
  }
  return user;
}

export function usersPageContract(page) {
  if (!page || !Array.isArray(page.items) || !Number.isInteger(page.total) || page.total < 0) {
    throw new ContractError('Не удалось прочитать список пользователей: неверный формат ответа сервера.');
  }
  return {...page, items: page.items.map(userContract)};
}

// A response belongs to exactly one route/filter/revision. A previous page is
// never rendered with the next page's component, even before effects run.
export function pageSnapshot(snapshot, key) {
  return snapshot.key === key ? snapshot : {key, status:'loading', data:null, error:null};
}
