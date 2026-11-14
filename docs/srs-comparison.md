# Сопоставление предоставленного старого ТЗ с редакцией 4.0

Дата: 13.11.2026. [Актуальное ТЗ](../ТЗ_диплом_Фаиза_v4.0.md). Исходный файл назван v1.1, но паспорт внутри — 3.0; сравнивается его фактическое содержимое, без приписывания ему истории настоящей 1.1. Архив сохранён побайтно.

Код есть не означает успешный запуск. HTTP/БД/production в этой сессии не проверялись; unit 19 и frontend 12 прошли. Новые OLD-идентификаторы присвоены позициям, где исходник не имел ID; исходные номера модулей и правил сохранены. В каждой позиции: точная прежняя формулировка, результат, доказательства и действие в редакции. Неподтверждённые обязательства не отменяются.

## 1. Функциональные модули: каждая маркированная позиция

### OLD-M01-01 — модуль 1, пункт 1

Прежнее требование: вход по логину и паролю; сообщение об ошибке не раскрывает, что именно неверно;

**Код есть; HTTP не проверен.** Вход и единое сообщение 401 есть. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-02 — модуль 1, пункт 2

Прежнее требование: JWT access token (срок жизни 15 минут) и refresh token (7 дней) с ротацией; refresh token передаётся в httpOnly Secure SameSite cookie, не хранится в localStorage;

**Частично.** JWT 15 минут, refresh 7 дней и ротация есть; Secure зависит от HTTPS, на локальном HTTP false. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-03 — модуль 1, пункт 3

Прежнее требование: выход с отзывом refresh token; блокировка и разблокировка учётной записи администратором;

**Код есть; HTTP не проверен.** Logout отзывает refresh; active меняет admin. Access живёт до истечения. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-04 — модуль 1, пункт 4

Прежнее требование: пароль: не менее 10 символов, буквы и цифры; хэширование стойким алгоритмом (Argon2id, bcrypt либо PBKDF2 с достаточным числом итераций);

**Код есть; HTTP не проверен.** PBKDF2-SHA512/600000, соль и fixed time; политика 10 символов/буквы/цифры. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-05 — модуль 1, пункт 5

Прежнее требование: защита от подбора: после 5 неудачных попыток за 15 минут с одного IP вход для этого логина с этого IP блокируется на 15 минут; для самого логина без привязки к IP действует только нарастающая задержка ответа. Учётная запись не блокируется чужими попытками, поэтому её нельзя вывести из строя намеренным подбором (журнал `login_attempts`, события видны администратору);

**Частично.** Счётчик login+IP за 15 минут и лимит IP есть; самостоятельной задержки по глобальному логину нет, окно скользящее. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-06 — модуль 1, пункт 6

Прежнее требование: смена пароля пользователем; сброс пароля администратором с принудительной сменой при входе;

**Частично.** Свой пароль меняется; административный reset-password отсутствует. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-07 — модуль 1, пункт 7

Прежнее требование: создание и изменение пользователя, назначение ролей — администратором;

**Код есть; HTTP не проверен.** Создание и PATCH ролей admin; cashier добавлен; UI не предлагает новые manager/auditor. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-08 — модуль 1, пункт 8

Прежнее требование: первый администратор создаётся при начальном развёртывании (seed или команда из README), пароль задаётся через переменные окружения;

**Код есть; HTTP не проверен.** Seed первого admin только при отсутствии пользователей и допустимом пароле из конфигурации. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M01-09 — модуль 1, пункт 9

Прежнее требование: серверная проверка доступа для каждого защищённого метода API.

**Код есть; HTTP не проверен.** RequireAuthorization/атрибуты, AccessMiddleware; не независимый аудит всех методов. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-01, FC-02.

### OLD-M02-01 — модуль 2, пункт 1

Прежнее требование: создать кассу: код, название, валюта, статус, необязательный лимит остатка (Д-7);

**Код есть; HTTP не проверен.** Создание/архивирование и balanceLimit есть, UI не вводит лимит. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-03.

### OLD-M02-02 — модуль 2, пункт 2

Прежнее требование: задать начальный остаток и дату начала учёта (одна запись на кассу, Д-3); изменять можно только до первой проведённой операции;

**Частично.** Openings есть в схеме/расчётах, команды ввода нет; обычный UI задаёт остаток приходом. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-03.

### OLD-M02-03 — модуль 2, пункт 3

Прежнее требование: несколько касс (Д-2); итоговые показатели всегда в разрезе валюты;

**Противоречит реализации.** Несколько касс есть, но все в одной валюте организации. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-03.

### OLD-M02-04 — модуль 2, пункт 4

Прежнее требование: запретить удаление кассы с операциями; допускается отключение;

**Код есть; HTTP не проверен.** Удаления кассы API нет; active изменяется. FK операций на кассу нет, прямой SQL защищён не полностью. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-03.

### OLD-M02-05 — модуль 2, пункт 5

Прежнее требование: хранить настройки: формат номера документа, порог согласования, параметры отчётов.

**Не найдено.** Настроек формата номера/порога/параметров отчётов нет; только организация/валюта. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция FC-03.

### OLD-M03-01 — модуль 3, пункт 1

Прежнее требование: категории прихода и расхода (иерархия, привязка к типу операции);

**Частично.** Тип и parentId есть; UI плоский, без дерева и управления родителем. Доказательства: [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-04.

### OLD-M03-02 — модуль 3, пункт 2

Прежнее требование: контрагенты (название, налоговый код при наличии, контакт, вид: клиент, поставщик, сотрудник, прочее);

**Код есть; HTTP не проверен.** Создание всех указанных реквизитов есть, PATCH только name/active. Доказательства: [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-04.

### OLD-M03-03 — модуль 3, пункт 3

Прежнее требование: типы документов-оснований;

**Частично.** Есть GET/POST document-types, нет PATCH и UI выбора типа. Доказательства: [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-04.

### OLD-M03-04 — модуль 3, пункт 4

Прежнее требование: активность элементов, поиск; деактивация вместо удаления для используемых элементов;

**Частично.** Категории/контрагенты ищутся и архивируются; document-types без поиска/PATCH. Доказательства: [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-04.

### OLD-M03-05 — модуль 3, пункт 5

Прежнее требование: не создавать подсистемы продаж, поставок или управления клиентами.

**Код есть; HTTP не проверен.** Подсистем продаж/поставок нет, контрагент остаётся реквизитом. Доказательства: [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-04.

### OLD-M04-01 — модуль 4, пункт 1

Прежнее требование: создать приходную или расходную запись: касса, дата, сумма, содержание, категория, тип документа-основания, контрагент;

**Частично.** Основные поля есть; контрагент/тип основания optional, UI тип не выбирает. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M04-02 — модуль 4, пункт 2

Прежнее требование: автоматически сохранять автора и время создания;

**Код есть; HTTP не проверен.** CreatedBy/CreatedAt задаёт сервер. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M04-03 — модуль 4, пункт 3

Прежнее требование: валидация обязательных полей, положительной суммы, того, что дата операции не раньше даты начала учёта кассы;

**Проверено ограниченным тестом.** Money/ввод проверены; остальные Validate правила найдены, HTTP не запускался. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M04-04 — модуль 4, пункт 4

Прежнее требование: черновик можно изменять (`PATCH`) и удалять; параллельное изменение защищается версией строки (при конфликте — ответ 409);

**Код есть; HTTP не проверен.** PATCH/DELETE draft, Version concurrency token, 409 при конфликте. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M04-05 — модуль 4, пункт 5

Прежнее требование: номер документа присваивается при проведении (раздел 7.3), не при создании черновика;

**Код есть; HTTP не проверен.** Номер назначает LedgerService только на post. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M04-06 — модуль 4, пункт 6

Прежнее требование: понятные сообщения об ошибках.

**Частично.** Есть русские Problem Details/клиентские сообщения; часть ответов пустая, не все DB-ошибки обработаны. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-05.

### OLD-M05-01 — модуль 5, пункт 1

Прежнее требование: проводить операцию в одной транзакции: проверка периода, проверка остатка, присвоение номера, смена статуса, запись аудита;

**Частично.** Транзакция остатка/номера/аудита есть, контроль закрытого периода отсутствует. Доказательства: [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-06, FC-07.

### OLD-M05-02 — модуль 5, пункт 2

Прежнее требование: создавать сторно с обязательной причиной и ссылкой на оригинал;

**Противоречит реализации.** Причина/ссылка есть; создаётся draft, а не posted; строгая неизменность обратного draft не обеспечена (D-01). Доказательства: [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-06, FC-07.

### OLD-M05-03 — модуль 5, пункт 3

Прежнее требование: не допускать правки и удаления проведённых и сторнированных операций;

**Частично.** API и DB защищают posted; триггер разрешает ReversalId/Version, отдельного reversed нет. Доказательства: [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-06, FC-07.

### OLD-M05-04 — модуль 5, пункт 4

Прежнее требование: журналировать пользователя, время и основание каждой операции.

**Код есть; HTTP не проверен.** Автор/время/основание хранятся; бизнес-события и безопасные снимки. Доказательства: [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-06, FC-07.

### OLD-M06-01 — модуль 6, пункт 1

Прежнее требование: список операций, сортировка по дате и номеру;

**Частично.** Дата/сумма с id как вторым ключом; отдельной сортировки по номеру нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-08.

### OLD-M06-02 — модуль 6, пункт 2

Прежнее требование: фильтры: касса, период, тип, статус, категория, контрагент, смена;

**Частично.** Все перечисленные кроме смены; статусы только draft/posted. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-08.

### OLD-M06-03 — модуль 6, пункт 3

Прежнее требование: поиск по номеру документа и тексту содержания;

**Код есть; HTTP не проверен.** q по содержанию и DocumentNumber. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-08.

### OLD-M06-04 — модуль 6, пункт 4

Прежнее требование: серверная пагинация;

**Код есть; HTTP не проверен.** Серверные page/pageSize, предел 100, UI 15. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-08.

### OLD-M06-05 — модуль 6, пункт 5

Прежнее требование: карточка операции: реквизиты, автор, время, история статусов, согласования, вложения, связанное сторно.

**Частично.** Реквизиты/автор/время/сторно есть; истории статусов/согласований/вложений нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-08.

### OLD-M07-01 — модуль 7, пункт 1

Прежнее требование: остаток = начальный остаток + проведённые приходы − проведённые расходы (сторно учитываются как обычные проведённые операции противоположного типа);

**Код есть; HTTP не проверен.** Формула есть, обе posted-записи сторно учитываются. Отдельный Opening не вводится UI. Доказательства: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09.

### OLD-M07-02 — модуль 7, пункт 2

Прежнее требование: остаток на любую дату; остаток до и после операции в учётном порядке (раздел 7.2);

**Частично.** Balance(date), остаток после строки книги есть; before отдельным полем не выдаётся. Доказательства: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09.

### OLD-M07-03 — модуль 7, пункт 3

Прежнее требование: запрет проведения операции, после которой остаток **в любой точке учётной последовательности, начиная с этой операции**, становится отрицательным (раздел 7.2); расчёт опирается на контрольные точки закрытых дней;

**Частично.** Хронологическое правило проверено unit; контрольных точек закрытых дней нет. Доказательства: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09.

### OLD-M07-04 — модуль 7, пункт 4

Прежнее требование: предупреждение при превышении лимита кассы (Д-7);

**Не найдено.** BalanceLimit хранится, предупреждения нет. Доказательства: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция FC-09.

### OLD-M07-05 — модуль 7, пункт 5

Прежнее требование: защита от параллельного проведения блокировкой кассы в транзакции (раздел 7.4).

**Код есть; HTTP не проверен.** FOR UPDATE кассы внутри транзакции LedgerService, текущий PostgreSQL-прогон не выполнен. Доказательства: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09.

### OLD-M08-01 — модуль 8, пункт 1

Прежнее требование: сводка по кассе и периоду: остаток на начало и конец, суммы и количество приходов и расходов;

**Частично.** Суммы/остатки есть, число приходов/расходов summary не возвращает. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M08-02 — модуль 8, пункт 2

Прежнее требование: детализация по дням, категориям, типам, контрагентам;

**Частично.** Дни/категории/типы есть; отдельной агрегированной детализации контрагентов нет. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M08-03 — модуль 8, пункт 3

Прежнее требование: **кассовая книга** за кассовый день (Д-4);

**Код есть; HTTP не проверен.** Книга за период включает и один день, не требует смены. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M08-04 — модуль 8, пункт 4

Прежнее требование: **печатные формы ПКО и РКО** для проведённой операции (Д-4);

**Частично.** Учебные PDF приходного/расходного документа, не согласованная официальная форма. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M08-05 — модуль 8, пункт 5

Прежнее требование: печатный вид отчётов и экспорт CSV (UTF-8 с BOM, разделитель «;», защита от формульной инъекции: значения, начинающиеся с `=`, `+`, `-`, `@`, экранируются); экспорт в Excel (.xlsx) — необязательно;

**Частично.** CSV/BOM/защита и PDF есть; XLSX отсутствует. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M08-06 — модуль 8, пункт 6

Прежнее требование: события экспорта записываются в `report_exports`.

**Противоречит реализации.** События экспорта записываются в AuditEvents, report_exports нет. Доказательства: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-10.

### OLD-M09-01 — модуль 9, пункт 1

Прежнее требование: текущий остаток по каждой кассе (в её валюте);

**Код есть; HTTP не проверен.** Карточки касс запрашивают Balance, обзор работает по выбранной кассе. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09, FC-12.

### OLD-M09-02 — модуль 9, пункт 2

Прежнее требование: приход и расход за период; динамика по дням и месяцам;

**Частично.** Итоги периода и дневной график; месячной агрегации нет. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09, FC-12.

### OLD-M09-03 — модуль 9, пункт 3

Прежнее требование: переход от показателя к отфильтрованному журналу;

**Частично.** Есть переход к журналу выбранной кассы; клики по каждому показателю с соответствующим фильтром не реализованы. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09, FC-12.

### OLD-M09-04 — модуль 9, пункт 4

Прежнее требование: предупреждения: превышен лимит, есть неподтверждённые операции, незакрытые прошлые дни;

**Не найдено.** Предупреждения лимита/согласования/прошлых незакрытых дней отсутствуют. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция FC-09, FC-12.

### OLD-M09-05 — модуль 9, пункт 5

Прежнее требование: никаких KPI продаж, склада или доставки.

**Код есть; HTTP не проверен.** Продажных/складских KPI нет. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-09, FC-12.

### OLD-M10-01 — модуль 10, пункт 1

Прежнее требование: регистрировать: входы и неудачные попытки (без паролей и токенов), создание, правку и удаление черновиков, отправку на согласование, согласование и отклонение, проведение, сторно, закрытие и открытие дня, действия с пользователями, кассами, настройками, импортом, экспортом;

**Частично.** Существующие бизнес-события и технический аудит есть; событий отсутствующих подсистем нет. Доказательства: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-11.

### OLD-M10-02 — модуль 10, пункт 2

Прежнее требование: хранить пользователя, тип события, объект, идентификатор, время и безопасное описание изменения;

**Код есть; HTTP не проверен.** User/action/entity/time/details и безопасный allowlist. Доказательства: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-11.

### OLD-M10-03 — модуль 10, пункт 3

Прежнее требование: фильтры по периоду, пользователю, объекту;

**Код есть; HTTP не проверен.** from/to/userId/entity, также action/includeTechnical. Доказательства: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-11.

### OLD-M10-04 — модуль 10, пункт 4

Прежнее требование: журнал только добавляется: в интерфейсе и на уровне БД нет правки и удаления записей (раздел 7.5);

**Частично.** Нет UI/API правки/удаления, DB trigger UPDATE/DELETE; владелец схемы/ TRUNCATE не защищены. Доказательства: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция FC-11.

### OLD-M10-05 — модуль 10, пункт 5

Прежнее требование: (Could) защита от подмены: каждая запись хранит хэш предыдущей (`prev_hash`, `hash`), запись цепочки выполняется под блокировкой; метод проверки сообщает о первой нарушенной записи.

**Не найдено.** Нет prev_hash/hash, блокировки цепочки и verify endpoint. Доказательства: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция FC-11.

### OLD-M11-01 — модуль 11, пункт 1

Прежнее требование: демонстрационный набор загружается SQL-скриптом;

**Противоречит реализации.** Демонстрация загружается JS-скриптом через API, не SQL. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [integration.mjs](../tests/integration.mjs), [seed-demo.mjs](../scripts/seed-demo.mjs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §15.

### OLD-M11-02 — модуль 11, пункт 2

Прежнее требование: генератор данных (команда или скрипт) создаёт контрольный объём (100 000 операций, 5 касс) для проверки производительности по разделу 8.3;

**Не найдено.** Генератора 100000 операций/5 касс нет; учебный набор 21 posted + 3 draft. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [integration.mjs](../tests/integration.mjs), [seed-demo.mjs](../scripts/seed-demo.mjs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §15.

### OLD-M11-03 — модуль 11, пункт 3

Прежнее требование: импорт CSV (начальные данные, справочники) — только по отдельному согласованию;

**Не найдено.** CSV import не найден, не считается отменённым. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [integration.mjs](../tests/integration.mjs), [seed-demo.mjs](../scripts/seed-demo.mjs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §15.

### OLD-M11-04 — модуль 11, пункт 4

Прежнее требование: предпросмотр: проверка структуры, дублей и ошибок до подтверждения импорта; импорт атомарный;

**Не найдено.** Preview/атомарного commit импорта нет. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [integration.mjs](../tests/integration.mjs), [seed-demo.mjs](../scripts/seed-demo.mjs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §15.

### OLD-M11-05 — модуль 11, пункт 5

Прежнее требование: реальные персональные и финансовые данные не используются без разрешения.

**Код есть; HTTP не проверен.** Поставляется вымышленный набор; рабочие данные в обследовании не читались. Доказательства: [App.jsx](../frontend/src/app/App.jsx), [integration.mjs](../tests/integration.mjs), [seed-demo.mjs](../scripts/seed-demo.mjs). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §15.

### OLD-M12-01 — модуль 12, пункт 1

Прежнее требование: инструкции и скрипты резервного копирования и восстановления PostgreSQL (включая каталог вложений);

**Частично.** Инструкция pg_dump/restore и тестовый скрипт есть; расписания и вложений нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [backup.md](../docs/backup.md). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §12, §15–17.

### OLD-M12-02 — модуль 12, пункт 2

Прежнее требование: конфигурация через переменные окружения, секреты не хранятся в Git;

**Код есть; HTTP не проверен.** Окружение/игнорирование настроек есть; содержимое секретов и история на утечки не проверены. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [backup.md](../docs/backup.md). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §12, §15–17.

### OLD-M12-03 — модуль 12, пункт 3

Прежнее требование: проверка доступности БД и статуса API (`/health`);

**Код есть; HTTP не проверен.** GET /health проверяет CanConnectAsync. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [backup.md](../docs/backup.md). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §12, §15–17.

### OLD-M12-04 — модуль 12, пункт 4

Прежнее требование: ночная сверка (фоновое задание): пересчёт остатков по закрытым дням и сравнение с `closing_balance`, поиск пропусков в нумерации и (если включена) проверка хэш-цепочки аудита; результат записывается в аудит и создаёт уведомление администратору;

**Не найдено.** HostedService/ночная сверка/уведомление не найдены. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [backup.md](../docs/backup.md). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §15–17.

### OLD-M12-05 — модуль 12, пункт 5

Прежнее требование: миграции схемы при развёртывании.

**Код есть; HTTP не проверен.** Program применяет MigrateAsync при старте. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [backup.md](../docs/backup.md). Действие: заменить нормативное обещание точным фактическим поведением и ограничениями; новая редакция §12, §15–17.

### OLD-M13-01 — модуль 13, пункт 1

Прежнее требование: кассовый день создаётся автоматически при первой проведённой операции на дату, имеет статус «Открыт» и привязывается к операциям (`cash_shift_id`); остаток на начало дня вычисляется как остаток на конец предыдущей даты (для первого дня — начальный остаток кассы);

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-02 — модуль 13, пункт 2

Прежнее требование: закрытие дня D выполняет `accountant`; оно закрывает и все более ранние даты кассы (даты без операций отдельной записи не требуют), поэтому дни без операций не блокируют закрытие; закрыть можно дату не позже текущей и не раньше даты начала учёта;

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-03 — модуль 13, пункт 3

Прежнее требование: при закрытии фиксируется расчётный остаток (`closing_balance`); фактический остаток по пересчёту вводится суммой либо по номиналам купюр и монет (`denominations`), расхождение вычисляется и попадает в отчёт и уведомление;

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-04 — модуль 13, пункт 4

Прежнее требование: закрыть день нельзя, пока на эту или более раннюю дату есть операции в статусах `draft`, `pending_approval`, `approved`: их сначала проводят, удаляют или переносят на открытую дату;

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-05 — модуль 13, пункт 5

Прежнее требование: после закрытия проведение и сторно на эту и более ранние даты запрещены; исправление закрытого дня выполняется сторно текущей датой;

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-06 — модуль 13, пункт 6

Прежнее требование: открытие закрытого дня — только `admin`, с обязательной причиной; событие попадает в аудит;

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M13-07 — модуль 13, пункт 7

Прежнее требование: отчёт «Кассовая книга» строится по закрытому или открытому дню.

**Не найдено.** Shifts/ShiftId есть только как задел модели; создания/закрытия/пересчёта/запрета периода/reopen нет. Доказательства: [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12, §18.

### OLD-M14-01 — модуль 14, пункт 1

Прежнее требование: при включённой настройке порога (Д-6) расход с суммой выше порога (настройка `approval.expense_threshold.<КОД ВАЛЮТЫ>`) после команды «провести» переходит в статус «На согласовании»;

**Не найдено.** Нет настройки порога, статусов/команд/истории согласования. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §11–12.

### OLD-M14-02 — модуль 14, пункт 2

Прежнее требование: `manager` согласует или отклоняет с комментарием (отклонение — комментарий обязателен); согласовать собственную операцию нельзя;

**Не найдено.** Нет настройки порога, статусов/команд/истории согласования. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §11–12.

### OLD-M14-03 — модуль 14, пункт 3

Прежнее требование: после согласования `accountant` проводит операцию; проверки остатка и периода выполняются в момент проведения;

**Не найдено.** Нет настройки порога, статусов/команд/истории согласования. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §11–12.

### OLD-M14-04 — модуль 14, пункт 4

Прежнее требование: отклонённая операция возвращается автору как черновик (команда `return-to-draft`) с видимым комментарием; автор может отозвать операцию из `pending_approval` или `approved` обратно в черновик (`recall`), история решений при этом сохраняется;

**Не найдено.** Нет настройки порога, статусов/команд/истории согласования. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §11–12.

### OLD-M14-05 — модуль 14, пункт 5

Прежнее требование: история решений хранится в `approval_steps` и отображается в карточке.

**Не найдено.** Нет настройки порога, статусов/команд/истории согласования. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §11–12.

### OLD-M15-01 — модуль 15, пункт 1

Прежнее требование: к операции можно приложить скан или фото основания: PDF, JPG, PNG, не более 5 МБ, не более 5 файлов на операцию;

**Не найдено.** Нет хранения, загрузки, проверки или скачивания вложений. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §8, §12.

### OLD-M15-02 — модуль 15, пункт 2

Прежнее требование: проверяются реальный тип и размер файла; имя на диске формируется системой;

**Не найдено.** Нет хранения, загрузки, проверки или скачивания вложений. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §8, §12.

### OLD-M15-03 — модуль 15, пункт 3

Прежнее требование: к черновику вложения можно добавлять и удалять; к проведённой операции — только добавлять, удаление запрещено;

**Не найдено.** Нет хранения, загрузки, проверки или скачивания вложений. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §8, §12.

### OLD-M15-04 — модуль 15, пункт 4

Прежнее требование: файлы доступны только авторизованным пользователям через API (прямых публичных ссылок нет).

**Не найдено.** Нет хранения, загрузки, проверки или скачивания вложений. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §8, §12.

### OLD-M16-01 — модуль 16, пункт 1

Прежнее требование: шаблон хранит кассу, тип, категорию, контрагента, содержание и необязательную сумму; создаётся с нуля или из существующей операции;

**Не найдено.** Нет модели/CRUD/планировщика/команды шаблонов. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M16-02 — модуль 16, пункт 2

Прежнее требование: команда «Создать черновик из шаблона» формирует черновик с текущей датой; необязательное расписание (еженедельно, ежемесячно) заставляет фоновое задание создавать **только черновики**, которые бухгалтер проверяет и проводит сам; автоматического проведения нет;

**Не найдено.** Нет модели/CRUD/планировщика/команды шаблонов. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M16-03 — модуль 16, пункт 3

Прежнее требование: повторный запуск задания за тот же период не создаёт дубликатов;

**Не найдено.** Нет модели/CRUD/планировщика/команды шаблонов. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M16-04 — модуль 16, пункт 4

Прежнее требование: шаблоны доступны `accountant`, у каждого шаблона есть владелец.

**Не найдено.** Нет модели/CRUD/планировщика/команды шаблонов. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M17-01 — модуль 17, пункт 1

Прежнее требование: уведомления внутри системы (Д-10): операция ожидает согласования (`manager`); операция согласована или отклонена (автор); превышен лимит кассы; расхождение при закрытии дня; результат ночной сверки (`admin`); есть незакрытые прошлые дни (`accountant`);

**Не найдено.** Нет модели, адресатов, счётчика или доставки персональных уведомлений. UI toast не заменяет подсистему. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M17-02 — модуль 17, пункт 2

Прежнее требование: счётчик непрочитанных в шапке, список, отметка «прочитано»; уведомление видит только адресат;

**Не найдено.** Нет модели, адресатов, счётчика или доставки персональных уведомлений. UI toast не заменяет подсистему. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

### OLD-M17-03 — модуль 17, пункт 3

Прежнее требование: уведомления не содержат паролей, токенов и лишних персональных данных.

**Не найдено.** Нет модели, адресатов, счётчика или доставки персональных уведомлений. UI toast не заменяет подсистему. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: сохранить как незакрытый прежний объём, не включать в реализованное; новая редакция §12.

## 2. Допущения Д-1…Д-10

- **Д-1: Противоречит реализации.** Старое: Основная валюта — TJS (сомони); система поддерживает несколько валют, одна касса — одна валюта, итоги разных валют не суммируются. Одна валюта организации, UI TJS; несколько валют не реализованы. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: FC-03, сохранить отличие до согласования.

- **Д-2: Код есть; HTTP не проверен.** Старое: В демонстрации одна основная касса; схема и API рассчитаны на несколько касс. Несколько касс поддержаны; demo создаёт MAIN, привязки пользователей отдельные. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs). Действие: FC-03, сохранить отличие до согласования.

- **Д-3: Частично.** Старое: Начальный остаток задаётся один раз на кассу на дату начала учёта; операции ранее этой даты запрещены. Openings есть, но API ввода/правки нет; начало UI через приход. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: FC-03/D-02, сохранить отличие до согласования.

- **Д-4: Частично.** Старое: ПКО, РКО и кассовая книга реализуются как печатные формы с настраиваемым набором реквизитов. PDF учебные, фиксированные, набор реквизитов не настраивается/официально не утверждён. Источники: [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs). Действие: FC-10, сохранить отличие до согласования.

- **Д-5: Частично.** Старое: Исправление проведённой записи выполняется сторно. Физическое удаление и правка проведённых операций запрещены. Исправление обратным draft с причиной; строгая семантика не защищена. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs). Действие: FC-07/D-01, сохранить отличие до согласования.

- **Д-6: Не найдено.** Старое: Согласование расходов по порогу суммы отключено по умолчанию и включается настройкой. Не отключённая настройка по умолчанию, а отсутствующий процесс согласования. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: §12, сохранить отличие до согласования.

- **Д-7: Частично.** Старое: Лимит остатка кассы — необязательная настройка; при превышении выводится предупреждение, проведение не блокируется. balanceLimit хранится, предупреждения нет. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: FC-03, сохранить отличие до согласования.

- **Д-8: Код есть; HTTP не проверен.** Старое: Интеграция с бухгалтерской программой не выполняется; обмен данными — CSV-экспорт. CSV выгрузка есть, интеграции с бухгалтерской программой не найдено. Источники: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs). Действие: FC-10, сохранить отличие до согласования.

- **Д-9: Код есть; HTTP не проверен.** Старое: Дата и границы периодов считаются в часовом поясе Asia/Dushanbe (UTC+5). UTC-события и DateOnly/границы в Asia/Dushanbe заданы кодом. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [App.jsx](../frontend/src/app/App.jsx). Действие: §11, сохранить отличие до согласования.

- **Д-10: Не найдено.** Старое: Уведомления только внутри системы (без e-mail и SMS). Нет персональных уведомлений, даже внутренних; есть только toast. Источники: [App.jsx](../frontend/src/app/App.jsx), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: §12, сохранить отличие до согласования.

## 3. Права исходного раздела 5

Каждая строка прежней матрицы получает отдельный результат. В актуальном ТЗ §3 приведена полная действующая матрица; назначение кассы — новое отдельное условие.

- **OLD-RIGHT-01 — Пользователи, роли, настройки: Изменено.** Admin только меняет название/валюту организации; универсальных настроек нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-02 — Кассы, начальные остатки, валюты: Частично.** Создание/архивирование касс admin; openings и POST currencies отсутствуют. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-03 — Справочники (категории, контрагенты, типы документов): Частично.** Категории/контрагенты admin/accountant; document-types только GET/POST. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-04 — Создание, правка, удаление черновиков: Противоречит.** Добавлены admin и cashier; cashier только свой draft. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-05 — Проведение операций: Противоречит.** Проводят admin/accountant/cashier, cashier только свой draft. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-06 — Сторно: Противоречит.** Сторно admin/accountant, отдельно draft. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-07 — Согласование / отклонение расходов: Не найдено.** Согласования нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-08 — Отзыв своей операции с согласования: Не найдено.** Отзыва нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-09 — Закрытие кассового дня: Не найдено.** Закрытия нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-10 — Открытие закрытого дня (с причиной, аудируется): Не найдено.** Открытия дня нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-11 — Загрузка вложений: Не найдено.** Загрузки вложений нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-12 — Просмотр журнала, карточек, отчётов, печатных форм: Изменено.** Все пять ролей читают назначенные кассы, admin все; PDF учебный. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-13 — Просмотр аудита: Противоречит.** Добавлен accountant; cashier не читает, аудит всей организации. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-14 — Проверка целостности аудита: Не найдено.** Hash verify нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-15 — Импорт справочников и начальных остатков: Не найдено.** Импорта справочников/openings нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-16 — Шаблоны повторяющихся операций: Не найдено.** Шаблонов нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

- **OLD-RIGHT-17 — Собственные уведомления: Не найдено.** Персональных уведомлений нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs). Действие: заменить матрицей §3; незакрытые права не считать реализованными.

## 4. Жизненный цикл и правила раздела 7

7.1: шесть прежних статусов и диаграмма заменены фактическими draft→posted; сторно не меняет статус оригинала. Команды post/reversals при недопустимом повторе дают 409, но не обязательно возвращают текущее состояние в теле. 7.2: последовательность Date/PostingSeq и запрет отрицательной точки сохранены, расчёт C# в памяти вместо SQL/контрольных точек; первой нарушенной точки в ответе нет. 7.3: счётчик касса/тип/год и транзакционность есть, формат жёсткий, отдельной настройки и полноценной печатной ссылки сторно на номер оригинала нет. 7.4: блокировка кассы есть для post, создание обратного draft блокирует оригинал, смены не проверяются. 7.5: UPDATE/DELETE audit и DELETE posted защищены триггерами, но допускаются ReversalId/Version и нет GRANT-модели/защиты владельца. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs), [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs). Действие: FC-05…FC-11, §10–11, D-01/D-02.

- **7.6.1 — Код есть.** Старое: Сумма операции строго больше нуля. Факт: Положительная сумма проверяется приложением и CHECK. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.2 — Код есть.** Старое: Тип операции — «Приход» или «Расход». Факт: income/expense, CHECK Type. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.3 — Частично.** Старое: У проведённой операции заполнены касса, дата, сумма, содержание, категория и присвоенный номер; реквизиты документа-основания обязательны в объёме, утверждённом кафедрой и бухгалтером. Факт: Основные поля обязательны в API; тип основания/контрагент optional, формы не утверждены, полноты posted CHECK нет. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.4 — Код есть.** Старое: В остатке учитываются только проведённые операции (включая сторно). Факт: Только posted, обе записи сторно. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.5 — Проверено ограниченным тестом.** Старое: Остаток не может быть отрицательным ни в одной точке учётной последовательности (7.2). Факт: CanPost проверяет каждую точку; 19 unit, HTTP отдельно. Источники: [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.6 — Частично.** Старое: Проведённая операция не удаляется и не меняется (7.5); исправление — только сторно. Факт: Основные posted поля защищены, ReversalId/Version исключения; обратный draft изменяем. Источники: [20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.7 — Код есть.** Старое: Денежные суммы хранятся в `numeric(18,2)`, не в типах с плавающей точкой. Факт: numeric(18,2)/decimal; UI строка/BigInt. Источники: [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.8 — Код есть.** Старое: Дата операции не раньше даты начала учёта кассы и не позже текущей даты (будущие даты запрещены). Факт: Validate и LedgerService проверяют даты, начала при наличии Opening. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.9 — Не найдено.** Старое: Нельзя проводить и сторнировать операции на закрытые даты (при реализованном модуле 13). Факт: Контроля закрытого дня нет. Источники: [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.10 — Противоречит реализации.** Старое: Все итоги формируются в разрезе валюты; суммирование разных валют запрещено. Факт: Валюты не суммируются, поскольку валюта одна; многовалютность не реализована. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.11 — Не найдено.** Старое: Согласовать операцию может только пользователь, не являющийся её автором (модуль 14). Факт: Согласования нет. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.12 — Код есть.** Старое: Отчёт строится по дате операции с явными границами периода и указанием кассы. Факт: Date/from/to включительно и cashboxId. Источники: [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.13 — Частично.** Старое: Каждое значимое действие записывается в аудит. Факт: Реализованные действия дают события; отсутствующие подсистемы — нет, безопасные снимки ограничены. Источники: [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.14 — Частично.** Старое: Кассу, у которой есть операции, нельзя удалить; справочные элементы с использованием — только деактивировать. Факт: Удалений кассы/справочников API нет, но полного набора DB FK нет. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.15 — Частично.** Старое: Повторная команда не создаёт двойного эффекта (7.1). Факт: RequestKey/post/reversals защищены, исключение DocumentTypeId в повторном payload. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.

- **7.6.16 — Не найдено.** Старое: День нельзя закрыть, пока на его дату или более раннюю есть незавершённые операции (модуль 13). Факт: Закрытия/учёта незавершённых при закрытии нет. Источники: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs). Действие: описать в §10–11 и соответствующем FC, сохранить недостающее как незакрытое.


## 5. Нефункциональные требования и каждая позиция приёмки

### OLD-8.1-1

Старое: Backend: C#, ASP.NET Core Web API (актуальная LTS-версия .NET на момент старта).

**Код есть.** net10.0; LTS-статус внешне не перепроверялся. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-2

Старое: ORM: Entity Framework Core; схема создаётся и меняется только миграциями.

**Код есть.** EF Core MigrateAsync. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-3

Старое: Frontend: JavaScript + React; API-клиент отделён от UI-компонентов.

**Проверено ограниченным тестом.** JS/React и выделенный клиент, frontend tests/build. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-4

Старое: База данных: PostgreSQL.

**Код есть.** Npgsql/PostgreSQL; текущая БД не подключалась. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-5

Старое: Контейнеризация: Docker и Docker Compose.

**Непроверено.** Dockerfiles/Compose есть, контейнеры не запускались. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-6

Старое: Слои backend: Entities, DTO, Repositories, Services, Controllers, Middleware, Validation.

**Частично.** Четыре проекта, нет отдельного repository/validation слоя. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.1-7

Старое: Браузеры: актуальные версии Chrome, Edge, Firefox, Safari.

**Непроверено.** Кроссбраузерных результатов нет. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-1

Старое: TLS при удалённом развёртывании;

**Непроверено.** TLS deployment не обследован, Compose Development. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-2

Старое: JWT и ролевая авторизация на сервере; refresh token в httpOnly cookie;

**Код есть.** JWT/роли/HttpOnly, Secure только HTTPS. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-3

Старое: стойкое хэширование паролей, политика паролей, блокировка при подборе;

**Код есть.** PBKDF2/политика/счётчики; глобального login-delay нет. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-4

Старое: серверная валидация, ограничение размера запросов и загружаемых файлов;

**Частично.** Валидация и 6MiB есть; вложения отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-5

Старое: безопасные заголовки; frontend и API публикуются с одного origin через обратный прокси (путь `/api`), поэтому cookie работает с `SameSite=Strict`, а CORS в production закрыт; защита от CSRF для запросов с cookie;

**Частично.** CSP/Origin/CSRF и nginx есть; совместимость Host/Origin/forwarded TLS не проверена. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-6

Старое: защита экспортируемых файлов от формульной инъекции (модуль 8);

**Код есть.** CSV Cell экранирует формулоподобный текст. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-7

Старое: секреты и строки подключения через `.env` или секрет-хранилище; в репозитории только `.env.example`;

**Частично.** Примеры/ignore есть; реальные секреты и история не проверены, local.json используется. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.2-8

Старое: логи не содержат паролей, токенов и лишних персональных данных.

**Непроверено.** Логгер не пишет тело; полный анализ сторонних сообщений/исключений не выполнен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.3-1

Старое: страница журнала (с фильтрами и пагинацией) — до 2 секунд;

**Непроверено.** Нагрузочный норматив сохраняется как прежняя цель; нет замеров на 100000/5/10. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.3-2

Старое: остаток на дату — до 1 секунды;

**Непроверено.** Нагрузочный норматив сохраняется как прежняя цель; нет замеров на 100000/5/10. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.3-3

Старое: отчёт за месяц — до 3 секунд;

**Непроверено.** Нагрузочный норматив сохраняется как прежняя цель; нет замеров на 100000/5/10. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.3-4

Старое: проведение операции (с проверкой по 7.2) — до 2 секунд.

**Непроверено.** Нагрузочный норматив сохраняется как прежняя цель; нет замеров на 100000/5/10. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.4-1

Старое: единый формат ошибок API (Problem Details);

**Частично.** Problem Details для многих ошибок, часть ответов пустая. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.4-2

Старое: структурированные логи приложения;

**Код есть.** JSON console/jsonl, 14 дней/10 MiB. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.4-3

Старое: README: установка, запуск, создание администратора, резервное копирование и восстановление;

**Документация есть.** README/backup, фактический запуск не полностью принят. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.4-4

Старое: миграции EF Core — единственный источник схемы; SQL-скрипты содержат только демонстрационные данные;

**Противоречит реализации.** Миграции есть, demo JS через API, SQL demo не найден. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-8.4-5

Старое: разделение настроек разработки и production.

**Частично.** Development и non-Development ветви есть; production не проверен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs), [CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs).

### OLD-12.1-1

Старое: модульные тесты Domain и Application (xUnit): правила остатка, сторно, нумерация, переходы статусов; покрытие строк не менее 70% для этих слоёв;

**Частично.** 19 unit только Money/BalanceRules; нет покрытия >=70%, номеров/всего сторно в unit. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.1-2

Старое: интеграционные тесты API на реальном PostgreSQL (контейнер): авторизация, права по ролям, транзакции, триггеры неизменяемости;

**Непроверено.** Реальный PostgreSQL предусмотрен скриптом, локально вместо контейнера; сейчас не запускался. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.1-3

Старое: тесты frontend (формы, валидация, права в интерфейсе);

**Проверено ограниченным тестом.** 12 клиентских проверок прошли, не живой браузер. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.1-4

Старое: ручные сценарии приёмки (12.2).

**Непроверено.** Сценарии описаны, ручная приёмка не выполнена. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-1

Старое: вход, неверный пароль, ограничение после 5 неудачных попыток с одного IP, учётная запись не блокируется чужими попытками, заблокированный администратором пользователь;

**Непроверено.** Login/лимиты/active в коде, общий сценарий текущего HTTP не проверен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-2

Старое: доступ и запрет каждого метода для каждой роли (матрица раздела 5);

**Частично.** Матрица изменена; security tests не охватывают автоматически все сочетания и сейчас не запускались. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-3

Старое: создание прихода, черновика расхода, правка и удаление черновика, проведение;

**Непроверено.** CRUD/post есть, HTTP-набор не выполнен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-4

Старое: отказ при сумме ≤ 0, при отсутствии обязательных полей, при дате позже текущей или раньше начала учёта;

**Частично.** Суммы/ввод проверены unit/client, остальные поля только код. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-5

Старое: отказ при недостаточном остатке, **включая проведение задним числом, которое делает отрицательным остаток на более поздней дате**;

**Проверено ограниченным тестом.** Хронология остатка unit прошла, не транзакционная интеграция. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-6

Старое: параллельное проведение двух расходов по одной кассе: не более одного проходит при недостатке средств;

**Непроверено.** Параллельные расходы есть в integration tests, сейчас не запускались. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-7

Старое: сторно прихода, из-за которого остаток уходит в минус, — отказ; повторное сторно — отказ;

**Частично.** Обратный расход проверяется на post; повторный reversal запрещён, общий draft имеет D-01. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-8

Старое: номера документов без пропусков и дублей (в том числе при ошибке в транзакции);

**Непроверено.** Транзакционный счётчик и сценарий сбоя есть, сейчас не запускались. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-9

Старое: согласование: расход выше порога, отклонение, самосогласование запрещено;

**Не найдено.** Согласование отсутствует. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-10

Старое: закрытие дня, запрет проведения в закрытый день, открытие администратором с причиной;

**Не найдено.** Смены отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-11

Старое: попытка обновить или удалить проведённую операцию напрямую в БД — отклоняется триггером;

**Частично.** Триггер есть, но ReversalId/Version меняемы; прямой SQL в этой сессии не выполнялся. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-12

Старое: вложения: допустимый и недопустимый тип, размер, запрет удаления у проведённой операции;

**Не найдено.** Вложения отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-13

Старое: верный остаток на дату и итоги периода в разрезе валют;

**Частично.** Формула есть, одна валюта, актуальный HTTP не проверен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-14

Старое: поиск, фильтры, пагинация; экспорт CSV и кассовая книга с верным периодом и итогами;

**Непроверено.** Код/тестовые сценарии есть, PostgreSQL не запускался. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-15

Старое: порядок внутри дня: расход не проводится раньше покрывающего его прихода; проведение задним числом встаёт в конец своей даты;

**Проверено ограниченным тестом.** Порядок подтверждён BalanceRules unit, очередь SQL post не испытывалась. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-16

Старое: двойное нажатие «провести» и повтор запроса не создают двойного проведения (409);

**Непроверено.** 409 по post есть, тест предусмотрен, сейчас не выполнен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-17

Старое: закрытие дня с незавершёнными операциями — отказ; закрытие дня после дней без операций проходит;

**Не найдено.** Закрытие дня отсутствует. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-18

Старое: отзыв с согласования и возврат отклонённой операции;

**Не найдено.** Recall/return отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-19

Старое: экспорт CSV: значения, начинающиеся с `=`, `+`, `-`, `@`, экранированы;

**Непроверено.** Cell и regression scenario есть, актуальный CSV не выгружался. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-20

Старое: хэш-цепочка аудита: ручная подмена записи обнаруживается проверкой (если включена);

**Не найдено.** Hash chain отсутствует. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-21

Старое: ночная сверка выявляет искусственно внесённое расхождение остатка;

**Не найдено.** Nightly job отсутствует. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-22

Старое: шаблоны: повторный запуск расписания не создаёт дубликатов черновиков;

**Не найдено.** Templates отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-23

Старое: уведомления видит только адресат;

**Не найдено.** Notifications отсутствуют. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.2-24

Старое: резервное копирование и восстановление по инструкции.

**Документация/скрипт.** Backup workflow есть; прежний отчёт положительный, сейчас не повторялся. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-1

Старое: данные сохраняются в PostgreSQL и доступны после перезапуска;

**Непроверено.** Требуется запуск/перезапуск тестовой БД, не выполнялся. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-2

Старое: остатки соответствуют формуле и учитывают только проведённые операции;

**Частично.** Алгоритм и unit есть, реальные итоги HTTP не сверялись. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-3

Старое: остаток не бывает отрицательным ни в одной точке учётной последовательности;

**Проверено ограниченным тестом.** Правило unit выполнено, не доказательство всех конкурирующих HTTP путей. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-4

Старое: проведённая операция не исчезает и не меняется ни через API, ни напрямую в БД;

**Частично.** Основные поля защищены, ReversalId/Version исключены, D-01/D-02 открыты. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-5

Старое: запрет доступа проверяется сервером, а не только скрытием кнопок;

**Код есть.** Server-side roles/CashAccess, security прогон отложен. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-6

Старое: показатели производительности раздела 8.3 выполнены на контрольном объёме данных;

**Непроверено.** Замеров нагрузки нет. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-7

Старое: отчёты и CSV соответствуют фильтрам;

**Непроверено.** Фильтры кода/предусмотренных тестов согласованы, актуального CSV/БД прогона нет. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-8

Старое: проект запускается по README командой Docker Compose с демонстрационными данными;

**Непроверено.** Compose не запускался; demo только по явной команде. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).

### OLD-12.3-9

Старое: автотесты проходят, покрытие не ниже заданного.

**Частично.** 19+12 пройдены, API-наборы не повторены, coverage не измерено. Действие: сохранить неподтверждённые цели отдельно от факта в §14/17; критерии отсутствующих функций остаются незакрытыми. Доказательства и команды: [реестр V-01…V-07](../docs/srs-evidence.md), [integration.mjs](../tests/integration.mjs), [cases.mjs](../tests/security/cases.mjs), [BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs).


## 6. Все строки прежнего словаря API

Для каждой строки сохранён старый контракт. Слово «есть» означает статическое обнаружение обработчика, а не успешный HTTP-прогон. Авторитетный актуальный словарь и права — §9 редакции 4.0. Параметры typeId/statusId/roleIds старого ТЗ заменены строковыми type/status/roles, деньги выдаются строкой. GET карточки пользователя/кассы не следует путать с PATCH того же пути.

### OLD-API-01 — `POST /api/auth/login`

Старое: вход `{login,password}`; результат/права access token, refresh cookie, данные пользователя.

Есть: login/password, 200 и cookie; ограничения FC-01. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-02 — `POST /api/auth/refresh`

Старое: вход refresh cookie; результат/права новая пара токенов.

Есть: ротация refresh, CSRF/Origin, reuse отзывает активные refresh пользователя. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-03 — `POST /api/auth/logout`

Старое: вход refresh cookie; результат/права отзыв токена.

Есть: JWT, отзыв переданного refresh, 204; access не отзывается. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-04 — `GET /api/auth/me`

Старое: вход —; результат/права текущий пользователь и роли.

Есть: безопасный UserDto и роли строками. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-05 — `POST /api/auth/change-password`

Старое: вход old, new; результат/права смена пароля.

Есть: поля именно oldPassword/newPassword, отзыв refresh. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-06 — `GET /api/users`

Старое: вход page, pageSize, q; результат/права пользователи; admin.

Есть: page/pageSize/q, только admin, UserDto. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-07 — `GET /api/users/{id}`

Старое: вход —; результат/права карточка; admin.

Не найден GET карточки пользователя; данные читаются страницей GET users. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-08 — `POST /api/users`

Старое: вход login, password, fullName, roleIds; результат/права создать; admin.

Есть: roles[] кодами вместо roleIds, mustChangePassword; admin. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-09 — `PATCH /api/users/{id}`

Старое: вход изменяемые поля, isActive; результат/права изменить, заблокировать; admin.

Есть: active вместо isActive, fullName/roles; собственное отключение/снятие admin запрещено. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-10 — `POST /api/users/{id}/reset-password`

Старое: вход —; результат/права временный пароль; admin.

Не найден административный reset-password. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-11 — `GET /api/roles`

Старое: вход —; результат/права список ролей.

Есть: GET roles для JWT. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-12 — `GET /api/currencies`, `POST /api/currencies`

Старое: вход code, name; результат/права чтение — все; создание — admin.

Частично: только GET currencies, POST отсутствует. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-13 — `GET /api/cashboxes`

Старое: вход active; результат/права список касс.

Есть: доступные кассы; active применяется только для admin, не-admin перехватывается middleware. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-14 — `GET /api/cashboxes/{id}`

Старое: вход —; результат/права карточка кассы.

Не найден GET карточки кассы; читается массивом. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-15 — `POST /api/cashboxes`

Старое: вход code, name, currencyId, balanceLimit; результат/права создать; admin.

Есть: admin, валюта организации, 201; проверки кода/названия. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-16 — `PATCH /api/cashboxes/{id}`

Старое: вход name, active, balanceLimit; результат/права обновить; admin.

Есть: admin PATCH name/active/balanceLimit; null/отрицательный лимит игнорируется. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-17 — `PUT /api/cashboxes/{id}/opening`

Старое: вход effectiveDate, amount; результат/права начальный остаток; admin.

Не найден PUT opening; только модель и расчёты, UI приходный документ. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-18 — `GET /api/cashboxes/{id}/balance`

Старое: вход date; результат/права остаток на дату.

Есть: date optional, по умолчанию Local.Today. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-19 — `GET/POST/PATCH /api/categories`

Старое: вход typeId, parentId, name, active; результат/права чтение — все; запись — admin, accountant.

Частично: GET/POST, PATCH /categories/{id}; type строкой, name/active для PATCH, без удаления. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-20 — `GET/POST/PATCH /api/counterparties`

Старое: вход q, name, kind, taxCode; результат/права чтение — все; запись — admin, accountant.

Частично: GET/POST, PATCH /counterparties/{id}; PATCH только name/active, не taxCode/contact/kind. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-21 — `GET/POST/PATCH /api/document-types`

Старое: вход code, name, active; результат/права чтение — все; запись — admin, accountant.

Частично: GET/POST document-types, PATCH нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-22 — `GET /api/operations`

Старое: вход from, to, cashboxId, typeId, statusId, categoryId, counterpartyId, q, sort, page, pageSize; результат/права страница журнала.

Есть с изменениями: type/status строками, без shift; сортировки по дате/сумме; cashbox обязателен не-admin. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-23 — `POST /api/operations`

Старое: вход касса, дата, тип, сумма, содержание, категория, документ, контрагент; результат/права создать черновик; accountant.

Противоречит: создают admin/accountant/cashier; requestKey обязателен, 201 либо повтор 200. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-24 — `GET /api/operations/{id}`

Старое: вход —; результат/права карточка и история.

Частично: View без полной истории/DocumentTypeId/PostedBy/PostingSeq. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-25 — `PATCH /api/operations/{id}`

Старое: вход поля, версия; результат/права изменить черновик; accountant.

Есть с изменением прав: admin/accountant и cashier свой; version/clearCounterparty. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-26 — `DELETE /api/operations/{id}`

Старое: вход версия; результат/права удалить черновик; accountant.

Есть с изменением прав: admin/accountant и cashier свой; version query, 204. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-27 — `POST /api/operations/{id}/post`

Старое: вход —; результат/права провести (или отправить на согласование); accountant.

Есть с изменением прав: без согласования, admin/accountant/cashier свой; 200 либо 409. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-28 — `POST /api/operations/{id}/approve`

Старое: вход comment; результат/права согласовать; manager.

Не найден approve. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-29 — `POST /api/operations/{id}/reject`

Старое: вход comment (обязателен); результат/права отклонить; manager.

Не найден reject. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-30 — `POST /api/operations/{id}/return-to-draft`

Старое: вход —; результат/права вернуть отклонённую в черновик; автор.

Не найден return-to-draft. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-31 — `POST /api/operations/{id}/recall`

Старое: вход —; результат/права отозвать с согласования в черновик; автор.

Не найден recall. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-32 — `POST /api/operations/{id}/reversals`

Старое: вход reason, date; результат/права сторно; accountant.

Противоречит: admin/accountant создают обратный draft, причина и дата; отдельное проведение. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-33 — `GET /api/operations/{id}/attachments`

Старое: вход —; результат/права список вложений.

Не найден список attachments. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-34 — `POST /api/operations/{id}/attachments`

Старое: вход файл; результат/права загрузить; accountant.

Не найдена загрузка attachments. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-35 — `GET /api/attachments/{id}`

Старое: вход —; результат/права скачать.

Не найдено скачивание attachments. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-36 — `DELETE /api/attachments/{id}`

Старое: вход —; результат/права удалить вложение черновика; accountant.

Не найдено удаление attachments. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-37 — `GET /api/operations/{id}/print`

Старое: вход —; результат/права печатная форма ПКО/РКО.

Замена по текущему коду: GET /api/operations/{id}/document.pdf, учебный PDF, также draft. Историческая отмена /print не доказана. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-38 — `GET /api/shifts`

Старое: вход cashboxId, from, to; результат/права кассовые дни.

Не найден GET shifts; Shifts лишь задел схемы. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-39 — `POST /api/shifts/close`

Старое: вход cashboxId, date, countedAmount; результат/права закрыть день; accountant.

Не найден shifts/close. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-40 — `POST /api/shifts/{id}/reopen`

Старое: вход reason; результат/права открыть день; admin.

Не найден shifts/{id}/reopen. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-41 — `GET /api/summary`

Старое: вход from, to, cashboxId; результат/права остатки и итоги.

Есть: суммы без количества документов; от/до optional с defaults. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-42 — `GET /api/reports/cash`

Старое: вход from, to, cashboxId, groupBy; результат/права детальный отчёт.

Не найден reports/cash с groupBy; используются summary/analytics/category-summary и cashbook. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-43 — `GET /api/reports/cash.csv`

Старое: вход те же фильтры; результат/права CSV-файл (с защитой от формульной инъекции).

Есть: все фильтры журнала, весь набор без пагинации, status default posted/all явно, CSV защита, AuditEvents. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-44 — `GET /api/reports/cash.xlsx`

Старое: вход те же фильтры; результат/права Excel-файл (необязательно).

Не найден XLSX. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-45 — `GET /api/reports/cash-book`

Старое: вход cashboxId, date; результат/права кассовая книга.

Замена по текущему коду: GET /api/reports/cashbook, cashboxId/from/to, пагинация/остатки; старого cash-book нет. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-46 — `POST /api/import/preview`

Старое: вход type (categories, counterparties, openings), CSV; результат/права проверка без записи; admin.

Не найден import/preview. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-47 — `POST /api/import/commit`

Старое: вход токен предпросмотра; результат/права импорт; admin.

Не найден import/commit. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-48 — `GET /api/audit`

Старое: вход from, to, userId, entity, page; результат/права аудит; admin, manager, auditor.

Противоречит правам: также accountant; action/includeTechnical/pageSize добавлены, общий аудит организации. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-49 — `GET /api/audit/verify`

Старое: вход from, to; результат/права проверка хэш-цепочки; admin, auditor.

Не найден audit/verify и hash chain. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-50 — `GET /api/settings`, `PUT /api/settings`

Старое: вход key, value; результат/права настройки; admin.

Изменено: GET всем JWT, PUT admin {name,currency}; нет key/value конфигурации. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-51 — `GET/POST/PATCH/DELETE /api/templates`

Старое: вход поля шаблона, schedule; результат/права шаблоны; accountant.

Не найден templates CRUD. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-52 — `POST /api/templates/{id}/create-draft`

Старое: вход —; результат/права создать черновик из шаблона; accountant.

Не найден templates create-draft. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-53 — `GET /api/notifications`

Старое: вход unreadOnly, page; результат/права свои уведомления.

Не найден notifications. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-54 — `POST /api/notifications/{id}/read`

Старое: вход —; результат/права отметить прочитанным.

Не найден notifications read. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

### OLD-API-55 — `GET /health`

Старое: вход —; результат/права статус API и БД.

Есть: CanConnectAsync, 200/503 при false, исключение может стать 500. Доказательства: [ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs), [ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs), [DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs), [AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs). Действие: использовать контракт §9; отсутствующий маршрут оставить незакрытым прежним требованием.

## 7. Каждая строка предварительной схемы БД

Сопоставляется прежний проект схемы, а не миграция работающей БД. Точное описание текущих 17 таблиц и действительных FK — §10; [InitialLedger](../backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.cs), [CashDb](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs), [Models](../backend/src/FaizaCash.Domain/Entities/Models.cs). Ненайденные таблицы не считаются официально отменёнными.

- **OLD-DB-01 — `users`.** Users: нет locked_until/created_at; Active/MustChangePassword, логин unique. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-02 — `roles`.** Roles: добавлен cashier, manager/auditor сохраняются. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-03 — `user_roles`.** UserRoles: составной PK и два FK есть. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-04 — `refresh_tokens`.** RefreshTokens: Hash unique, FK UserId; ReplacedBy только UUID без FK. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-05 — `login_attempts`.** LoginAttempts: Login/Ip/Succeeded/CreatedAt, связи FK нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-06 — `currencies`.** Currencies: Code unique, MinorUnits smallint, одна валюта организации. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-07 — `cashboxes`.** Cashboxes: CurrencyId FK, BalanceLimit, Active; код unique. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-08 — `cashbox_openings`.** Openings: CashboxId unique FK, Date/Amount/CreatedBy, нет CreatedAt и FK автора; API ввода нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-09 — `operation_types`.** operation_types не найдено; Operations.Type строка и CHECK. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-10 — `operation_statuses`.** operation_statuses не найдено; Status строка, workflow draft/posted, CHECK списка статусов нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-11 — `operation_categories`.** Categories: Type строка, ParentId не FK; операции имеют FK категории с Cascade. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-12 — `counterparties`.** Counterparties: реквизиты есть; операции имеют optional FK, снимка старого имени нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-13 — `document_types`.** DocumentTypes: есть, но Operations.DocumentTypeId без FK; GET/POST, UI нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-14 — `document_sequences`.** Sequences: составной ключ CashboxId/Type/Year, без FK кассы/типа; счётчик под блокировкой кассы. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-15 — `cash_operations`.** Operations: поля перечислены §10, Version concurrency; нет DocumentYear и FK cashbox/type/status/document/shift/postedBy; частичные unique номера/сторно и RequestKey. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-16 — `operation_documents`.** operation_documents не найдено, вложений нет. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-17 — `operation_corrections`.** operation_corrections не найдено; ссылки и reason в Operations, обратный документ сначала draft. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-18 — `approval_steps`.** approval_steps не найдено. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-19 — `cash_shifts`.** Shifts: только Id/CashboxId/Date/Status/OpeningBalance/ClosingBalance, unique касса/дата; без FK/закрытия/пересчёта/номиналов. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-20 — `audit_events`.** AuditEvents: Details text, не jsonb; нет prev_hash/hash и FK пользователя, trigger UPDATE/DELETE есть. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-21 — `app_settings`.** app_settings не найдено; Organizations с Name/Currency/TimeZone, без key/value/updated metadata. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-22 — `report_exports`.** report_exports не найдено; выгрузки дают AuditEvents. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-23 — `operation_templates`.** operation_templates не найдено. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

- **OLD-DB-24 — `notifications`.** notifications не найдено. Действие: заменить предварительную строку фактическим словарём §10, отсутствие сохранить как пробел.

Старые индексы/ограничения после таблицы: реализованы уникальные логины/коды, номер по кассе, индекс касса-дата-очередь, FK-индексы контрагента и CreatedAt аудита. Нет уникального PostingSeq, уведомительных/export/login composite индексов из проекта, составного audit(entity,entityId), гарантии NOT NULL всех posted-реквизитов и полного набора FK. ER старого ТЗ поэтому не описывает текущую физическую схему. Дополнительно появились CashAccess и Organizations. Применять §10 вместо копирования старой ER.

## 8. Все прежние экраны раздела 11

- **OLD-UI-01.** Старое: **Вход:** логин, пароль, сообщения об ошибке и блокировке. Результат: Вход/ошибки есть, реальный браузер не проверен. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-02.** Старое: **Сводка:** период, касса, остаток, приход и расход, график, предупреждения. Результат: Обзор есть без лимитных/дневных/approval предупреждений. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-03.** Старое: **Журнал:** таблица, фильтры, поиск, сортировка, пагинация, добавление. Результат: Журнал есть, фильтра смены/номера sort нет. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-04.** Старое: **Форма операции:** тип, касса, дата, сумма, категория, основание, контрагент, комментарий, вложения. Результат: Форма есть без комментария, типа основания и вложений. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-05.** Старое: **Карточка операции:** реквизиты, статус, автор, история и согласования, вложения, действия по роли. Результат: Карточка есть без коллекций истории/approval/attachments. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-06.** Старое: **Сторно:** связь с оригиналом, причина, подтверждение. Результат: Сторно есть, но сначала draft, D-01 открыт. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-07.** Старое: **Согласование:** очередь операций на согласовании для `manager`. Результат: Очередь согласования не найдена. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-08.** Старое: **Кассовые дни:** список дней, закрытие, ввод пересчёта по номиналам, расхождение. Результат: Кассовые дни/номиналы не найдены. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-09.** Старое: **Отчёты:** параметры, итоги, детализация, кассовая книга, ПКО/РКО, печать и CSV. Результат: Учебная книга/PDF/CSV есть; официальность форм не установлена. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-10.** Старое: **Кассы и остатки:** список касс, валюта, начальный остаток, лимит. Результат: Кассы есть, отдельного openings/лимита UI нет. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-11.** Старое: **Справочники:** категории, контрагенты, типы документов. Результат: Категории/контрагенты есть, отдельного UI document-types нет. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-12.** Старое: **Пользователи и роли:** администратору. Результат: Пользователи/роли есть, новые manager/auditor UI не предлагает. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-13.** Старое: **Аудит и настройки:** журнал событий, проверка целостности, параметры системы. Результат: Аудит/название организации есть, hash verify/универсальных настроек нет. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-14.** Старое: **Шаблоны:** список шаблонов, создание черновика, расписание. Результат: Шаблоны не найдены. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

- **OLD-UI-15.** Старое: **Уведомления:** список и счётчик непрочитанных в шапке. Результат: Персональные уведомления не найдены. Доказательства: [App](../frontend/src/app/App.jsx), [OperationDialog](../frontend/src/components/OperationDialog.jsx). Действие: §8, FC-12; отсутствующие экраны не считать реализованными.

Общий UI-абзац: русский интерфейс и адаптивный CSS есть; пользовательских настроек даты/валюты и таджикской локализации нет. Ширины/браузеры/клавиатура требуют V-06.

## 9. Прочие разделы, этапы, риски и идеи

Разделы 1–2: назначение диплома и термины сохранены, но определения сторно/кассового дня заменены фактическим workflow; утверждение соответствия ГОСТ/IEEE не делается без методики кафедры. Поля автора/кафедры/согласования из старого паспорта не используются как доказательство утверждения. Раздел 3.1 — внешний отраслевой контекст, не проверялся и не используется для вывода о регламенте. Граница 3.2 сохранена. Каждое допущение 3.3 разобрано выше.

Раздел 4: цели регистрации/поиска/остатка сохранены; согласование и закрытие — не реализованы. Результат 4.3 частичный: веб-код/миграции/тесты/Compose/README есть, SQL demo нет (JS seed); материалы диплома — docs/defense. MoSCoW 4.4 не является доказательством выполнения: все модули 1–17 разобраны по позициям, их прежний приоритет не отменяет отсутствие. Must закрыт не полностью (например лимит, отдельные открытия и реквизиты).

Раздел 7.1–7.5, все правила 7.6, все NFR 8, строки схемы 9, API 10, экраны 11 и все пункты приёмки 12 рассмотрены выше. Дополнительный абзац 8.3: контрольные точки закрытых дней/ежедневный backup отсутствуют; UTC/DateOnly и пагинация есть. Нагрузка 10 пользователей/100000 операций/5 касс не проверена.

Раздел 13: фактическая структура backend/src, frontend/src, scripts/tests/docs заменяет условные Backend/Frontend/Database; Compose имеет db/api/frontend, volume только БД; нет вложений и hosted jobs. Миграции/seed при старте есть; UI seed отдельной командой, не автоматически Compose. Источники: [Compose](../docker-compose.yml), [Program](../backend/src/FaizaCash.Api/Program.cs), [seed-demo](../scripts/seed-demo.mjs). Действие: §4–5/12/15.

- **OLD-STAGE-1.** Старое: Согласование ТЗ, допущений Д-1…Д-9, кассовых документов, правил исправления и закрытия дня. Результат: Утверждение ТЗ/регламента и форм не подтверждено; требуется решение владельца. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-2.** Старое: Модель данных PostgreSQL, миграции, справочники, триггеры неизменяемости. Результат: Модель/миграции/справочники/триггеры есть; неполные ограничения D-02. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-3.** Старое: **Must:** backend касс, справочников и операций (Entity, DTO, Repository, Service, Controller, валидация, ошибки), правило остатка и сторно, нумерация, транзакции. Результат: Финансовое ядро есть с D-01/D-02, без отдельного repository слоя. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-4.** Старое: **Must:** авторизация, роли, аудит; интеграционные тесты прав и остатков. Результат: Auth/roles/audit и API test code есть, текущие HTTP-наборы не выполнены. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-5.** Старое: **Must:** frontend: вход, форма, журнал, фильтры, пагинация, карточка, сторно. Результат: UI основных операций есть, живой браузер не принят. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-6.** Старое: **Must:** отчёты и CSV; сводка. Результат: Отчёты/CSV/сводка есть в коде, актуальные HTTP/PDF не повторены. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-7.** Старое: **Should:** кассовые дни, кассовая книга, ПКО/РКО, панель сводки, резервное копирование. Результат: Книга/PDF/обзор/backup инструкция есть; кассовые дни отсутствуют. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-8.** Старое: **Could:** согласование расходов, вложения, шаблоны, уведомления, хэш-цепочка аудита, импорт CSV, экспорт в Excel, локализация. Результат: Перечисленные Could-подсистемы не найдены; не считаются отменёнными. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

- **OLD-STAGE-9.** Старое: Docker Compose, README, демонстрационные данные, финальная проверка по сценариям, материалы дипломной работы. Результат: Compose/README/demo/docs есть; полный запуск и приёмка не подтверждены. Действие: описать фактический статус в §15–19, не заявлять завершение этапа по наличию файлов.

Раздел 15 (каждый риск): (1) формы/регламент — остаётся открытым, настройки не изолируют все допущения; (2) объём — требует утверждения исключений/этапов; (3) остаток/конкурентность — блокировка SQL есть, расчёт C#, unit успешен, integration не повторена; (4) секреты — ignore/политика есть, TLS/история/полный аудит не проверены; (5) потеря данных — инструкция есть, ежедневного job нет; (6) реальные данные — поставляемые demo вымышленные, реальные записи не читались; (7) рост — контрольных точек/нагрузочного генератора нет; (8) чужие попытки — login+IP ограничитель есть, глобальной login-delay нет; (9) двойное проведение — 409 и блокировка в коде, текущий конкурентный API не испытан. Действие: §13–18/P-01…P-05; доказательства соответствующих FC/V указаны в основном ТЗ.

Раздел 16: внешние ссылки сохранены в архиве как происхождение старого контекста; они не проверялись и не подтверждают текущую реализацию. Приложение А сохраняется как история исходника, не история фактических релизов. Приложение Б (каждая идея): подотчётные/авансовые отчёты, QR, жёсткий лимит, PWA, многофилиальность, обмен проводками/импорт, электронная подпись, таджикская локализация — в коде не найдены; это прежние идеи вне обязательной части, не согласованные новые обязательства. Категория «подотчёт» в demo не означает реализованные авансовые отчёты.

## 10. Проверка полноты сопоставления

Все 88 функциональных маркированных позиций модулей 1–17 получили OLD-M ID; все 17 строк прав, 10 допущений, 16 бизнес-правил 7.6, 55 строк API, 24 строки предварительной схемы, 15 экранов и 9 этапов сопоставлены. Все маркированные NFR/приёмка 8.1–8.4/12.1–12.3 вынесены отдельными позициями. Немаркированные нормативные абзацы, риски и идеи рассмотрены в разделах 4/7/9 этого приложения. Наличие сопоставления не означает закрытие требования; неподтверждённые/отсутствующие пункты остаются явно такими. Историческое удаление функций по текущему отсутствию не утверждается.
