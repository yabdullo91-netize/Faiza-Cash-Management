# Реестр исследования и проверок ТЗ 4.0

Дата исходного обследования: 13.11.2026, Asia/Dushanbe. **Ниже сохранён срез до очистки; актуальный повторный прогон после очистки приведён в разделе 7 этого реестра.** [Актуальное ТЗ](../ТЗ_диплом_Фаиза_v4.0.md), [сравнение](srs-comparison.md). Исследовано рабочее дерево main, HEAD b9710f328743ccae9a22bac33d93c9b01b40cf2e с незакоммиченными изменениями. Поиск AGENTS.md внутри workspace и по родительской цепочке не обнаружил применимых файлов. Нет заявления об исследовании рабочего сервера, production, реальных записей и всей истории секретов.

## 1. Границы и источники

Источник поведения — исходники и миграции. README/docs использованы как пояснения и исторические отчёты, не как доказательство текущего запуска. Git log доступен: HEAD merge начального репозитория, предыдущие 7d44676/58bd2b9; действующие backend/frontend в исходном status untracked, старый src отмечен удалённым. Даты/официальную отмену каждого требования по истории не выводим. Исходное ТЗ имеет противоречие имени v1.1 и паспорта 3.0.

Исключены `.git` объекты, node_modules, bin/obj/dist, runtime/log/dump/PDF результаты как генерируемые артефакты. Lock и EF Designer/Snapshot лишь индексированы; первичные определения прочитаны. `.env`, `.env.docker`, `.runtime/local.json` и пользовательские данные не читались. PNG прошлых проверок индексированы, их новый визуальный просмотр не выполнялся. В родительском workspace есть docx_render и вспомогательные create_srs_ai*.py; это инструменты генерации прежних документов вне runtime faiza-cash, их содержимое не исследовалось и поведение системы по ним не выводилось. Недоступные внешние сервисы/репозитории не описаны как исследованные.

## 2. Журнал безопасных проверок

| ID | Команда / предмет | Результат 13.11.2026 | Практический предел |
|---|---|---|---|
| V-01 | dotnet test backend/tests/FaizaCash.UnitTests --no-restore | 19 passed / 0 failed / 0 skipped, exit 0 | Только Domain/Application Money/BalanceRules, не HTTP/БД/счётчики/полный workflow |
| V-02 | dotnet build backend/FaizaCash.sln --no-restore --nologo | exit 0, 0 errors / 0 warnings | Компиляция 4 библиотек/приложения + test project, не запуск API |
| V-03 | frontend: npm test | 12 passed / 0 failed / 0 skipped, exit 0 | Mock fetch/SSR/pure functions/цветовые токены, не живой DOM/E2E |
| V-04 | node tests/integration.mjs --suite=integration | Не запускалась | Скрипт пересоздаёт схему строго именованной _test базы; её конфигурация и данные оставлены вне обследования |
| V-05 | node tests/security.mjs | Не запускалась | Та же база/подготовка, нельзя параллельно V-04; не пентест |
| V-06 | Браузер, PDF visual, Docker, нагрузка, restore | Не выполнялись в этой сессии | Предыдущие отчёты и QA PNG не заменяют актуальную приёмку |
| V-07a | frontend: npm run build | exit 1: esbuild не может читать родительский каталог, Access is denied при загрузке vite.config.js | Ограничение файловых прав этой среды; причина не установлена как дефект приложения |
| V-07b | frontend: npm run build -- --configLoader runner | exit 0, 2142 modules, Vite built in 5.85s | Сборка с альтернативной загрузкой config, без правок исходников; браузер/стандартный loader в иной среде не проверены |

Сборки/тесты создали только обычные игнорируемые build/cache артефакты. Исходники, зависимости, конфигурация и миграции намеренно не редактировались. Не запускались run-local/configure-local/seed-demo/verify-backup/run-all, не читались секреты и не выполнялись запросы к рабочей БД.

Исторические 21 integration / 12 security, PDF/backup и локальные HTTP 200 описаны в docs/verification.md и interface-review.md за 12.11.2026; машинные .runtime результаты не читались и не считаются новыми доказательствами. Линтер не настроен, измерения coverage нет.

## 3. Реестр компонентов и точные файлы

Для каждой позиции вход/выход и зависимости описаны в соответствующем FC/разделе ТЗ: API — DTO/query → авторизация/EF/service → JSON/файл/ошибка; Domain/Application — денежные данные → проверка; UI — пользовательское действие → api/state → отрисовка; инфраструктура — настройки/БД → хранение/токены/PDF/log; scripts — локальная конфигурация → изменение только явно выбранного окружения. Таблица уточняет индивидуальное назначение и предел просмотра. «Прочитан» не означает исполнен.

| Файл | Просмотр | Назначение / вывод | Раздел ТЗ |
|---|---|---|---|
| [.env.example](../.env.example) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [.gitignore](../.gitignore) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [README.md](../README.md) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/.dockerignore](../backend/.dockerignore) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/Directory.Build.props](../backend/Directory.Build.props) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/Dockerfile](../backend/Dockerfile) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/FaizaCash.sln](../backend/FaizaCash.sln) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/global.json](../backend/global.json) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Authorization/CurrentActor.cs](../backend/src/FaizaCash.Api/Authorization/CurrentActor.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Configuration/HttpExtensions.cs](../backend/src/FaizaCash.Api/Configuration/HttpExtensions.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs) | Прочитан статически | Маршруты, роли, входы/выходы, проверки/SQL/ошибки; HTTP не запускался | [FC-01…FC-11/§9](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs) | Прочитан статически | Маршруты, роли, входы/выходы, проверки/SQL/ошибки; HTTP не запускался | [FC-01…FC-11/§9](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs) | Прочитан статически | Маршруты, роли, входы/выходы, проверки/SQL/ошибки; HTTP не запускался | [FC-01…FC-11/§9](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs](../backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs) | Прочитан статически | Маршруты, роли, входы/выходы, проверки/SQL/ошибки; HTTP не запускался | [FC-01…FC-11/§9](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/FaizaCash.Api.csproj](../backend/src/FaizaCash.Api/FaizaCash.Api.csproj) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs) | Прочитан статически | Origin/CSRF, доступ, ошибки, decimal JSON либо cache | [§3/9/13/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Middleware/DirectoryCacheMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/DirectoryCacheMiddleware.cs) | Прочитан статически | Origin/CSRF, доступ, ошибки, decimal JSON либо cache | [§3/9/13/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs](../backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs) | Прочитан статически | Origin/CSRF, доступ, ошибки, decimal JSON либо cache | [§3/9/13/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/Program.cs](../backend/src/FaizaCash.Api/Program.cs) | Прочитан, сборка V-02 | DI, аутентификация, HTTP pipeline, миграции и seed при старте | [§4/13/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/appsettings.json](../backend/src/FaizaCash.Api/appsettings.json) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Api/packages.lock.json](../backend/src/FaizaCash.Api/packages.lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/DTOs/Contracts.cs](../backend/src/FaizaCash.Application/DTOs/Contracts.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/DTOs/Projections.cs](../backend/src/FaizaCash.Application/DTOs/Projections.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/DTOs/UserDto.cs](../backend/src/FaizaCash.Application/DTOs/UserDto.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/FaizaCash.Application.csproj](../backend/src/FaizaCash.Application/FaizaCash.Application.csproj) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/Interfaces/ICurrentActor.cs](../backend/src/FaizaCash.Application/Interfaces/ICurrentActor.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/Interfaces/ILedgerService.cs](../backend/src/FaizaCash.Application/Interfaces/ILedgerService.cs) | Прочитан, сборка V-02 | Проведение: касса FOR UPDATE → правила → счётчик/posted/аудит → commit | [FC-06/FC-07/§11](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/Interfaces/IPdfReport.cs](../backend/src/FaizaCash.Application/Interfaces/IPdfReport.cs) | Прочитан, сборка V-02 | QuestPDF, таблица/итоги/учебная пометка; новый PDF не рендерился | [FC-10](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/Services/BalanceRules.cs](../backend/src/FaizaCash.Application/Services/BalanceRules.cs) | Прочитан + V-01 | Decimal ограничения и полный последовательный остаток | [FC-05/06/09](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Application/packages.lock.json](../backend/src/FaizaCash.Application/packages.lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Domain/Entities/Models.cs](../backend/src/FaizaCash.Domain/Entities/Models.cs) | Прочитан статически | Сущности/связи/nullable, индексы, технический аудит, пробелы FK | [§10/FC-11](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Domain/FaizaCash.Domain.csproj](../backend/src/FaizaCash.Domain/FaizaCash.Domain.csproj) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Domain/ValueObjects/Money.cs](../backend/src/FaizaCash.Domain/ValueObjects/Money.cs) | Прочитан + V-01 | Decimal ограничения и полный последовательный остаток | [FC-05/06/09](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Domain/packages.lock.json](../backend/src/FaizaCash.Domain/packages.lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/FaizaCash.Infrastructure.csproj](../backend/src/FaizaCash.Infrastructure/FaizaCash.Infrastructure.csproj) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs](../backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs) | Прочитан, сборка V-02 | PBKDF2, JWT, refresh cookie и аудит; актуальный HTTP не проверен | [FC-01/FC-02/§13](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Logging/JsonFileLogger.cs](../backend/src/FaizaCash.Infrastructure/Logging/JsonFileLogger.cs) | Прочитан, сборка V-02 | JSON console/file, 10MiB/14 дней, не фоновый job | [§16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.Designer.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.Designer.cs) | Индексирован, не построчно | Генерируемое представление EF; приоритет модели/написанным миграциям | [§10](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.cs) | Просмотрен по схеме/ограничениям | CREATE TABLE, типы, FK, CHECK, индексы; не выполнялся SQL | [§10](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs](../backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Migrations/CashDbModelSnapshot.cs](../backend/src/FaizaCash.Infrastructure/Migrations/CashDbModelSnapshot.cs) | Индексирован, не построчно | Генерируемое представление EF; приоритет модели/написанным миграциям | [§10](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs](../backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs) | Прочитан статически | Сущности/связи/nullable, индексы, технический аудит, пробелы FK | [§10/FC-11](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Persistence/DesignFactory.cs](../backend/src/FaizaCash.Infrastructure/Persistence/DesignFactory.cs) | Прочитан, сборка V-02 | Контракты/композиция/интерфейсы/миграция, не самостоятельная runtime-приёмка | [§4/9/10/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs](../backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs) | Прочитан, сборка V-02 | Проведение: касса FOR UPDATE → правила → счётчик/posted/аудит → commit | [FC-06/FC-07/§11](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs](../backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs) | Прочитан, сборка V-02 | QuestPDF, таблица/итоги/учебная пометка; новый PDF не рендерился | [FC-10](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/src/FaizaCash.Infrastructure/packages.lock.json](../backend/src/FaizaCash.Infrastructure/packages.lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/tests/FaizaCash.UnitTests/BalanceRulesTests.cs](../backend/tests/FaizaCash.UnitTests/BalanceRulesTests.cs) | Прочитан + V-01 | xUnit Money/BalanceRules; 19 passed, не API/EF | [§17/V-01](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/tests/FaizaCash.UnitTests/FaizaCash.UnitTests.csproj](../backend/tests/FaizaCash.UnitTests/FaizaCash.UnitTests.csproj) | Прочитан + V-01 | xUnit Money/BalanceRules; 19 passed, не API/EF | [§17/V-01](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/tests/FaizaCash.UnitTests/MoneyTests.cs](../backend/tests/FaizaCash.UnitTests/MoneyTests.cs) | Прочитан + V-01 | xUnit Money/BalanceRules; 19 passed, не API/EF | [§17/V-01](../ТЗ_диплом_Фаиза_v4.0.md) |
| [backend/tests/FaizaCash.UnitTests/packages.lock.json](../backend/tests/FaizaCash.UnitTests/packages.lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docker-compose.yml](../docker-compose.yml) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/architecture.md](../docs/architecture.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/archive/ТЗ_диплом_Фаиза_v1.1_как_получено.md](../docs/archive/ТЗ_диплом_Фаиза_v1.1_как_получено.md) | Архив без изменения | Побайтовая копия предоставленного ТЗ, внутренний паспорт 3.0 | [§1/19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/backup.md](../docs/backup.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/defense.md](../docs/defense.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/interface-review.md](../docs/interface-review.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/permissions.md](../docs/permissions.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/qa/README.md](../docs/qa/README.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/qa/cashbook.png](../docs/qa/cashbook.png) | Индексирован, не просмотрен визуально | Прежний контрольный рендер PDF, не текущий браузер/не новая приёмка | [§17](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/qa/document.png](../docs/qa/document.png) | Индексирован, не просмотрен визуально | Прежний контрольный рендер PDF, не текущий браузер/не новая приёмка | [§17](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/qa/long-report-first.png](../docs/qa/long-report-first.png) | Индексирован, не просмотрен визуально | Прежний контрольный рендер PDF, не текущий браузер/не новая приёмка | [§17](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/qa/long-report-last.png](../docs/qa/long-report-last.png) | Индексирован, не просмотрен визуально | Прежний контрольный рендер PDF, не текущий браузер/не новая приёмка | [§17](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/srs-comparison.md](../docs/srs-comparison.md) | Документация этой сессии | Сопоставление / доказательства / актуальное ТЗ | [§1/20/21](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/testing.md](../docs/testing.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [docs/verification.md](../docs/verification.md) | Документ просмотрен; не новый результат | Предыдущие объяснения/отчёты (12.11), доказательства кода имеют приоритет | [§4/15–19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/.dockerignore](../frontend/.dockerignore) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/.env.example](../frontend/.env.example) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/Dockerfile](../frontend/Dockerfile) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/index.html](../frontend/index.html) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/nginx.conf](../frontend/nginx.conf) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/package-lock.json](../frontend/package-lock.json) | Индексирован, не построчно | Сгенерированный lock зависимостей; версии прямых зависимостей прочитаны в manifest | [§15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/package.json](../frontend/package.json) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/app/App.jsx](../frontend/src/app/App.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/AuditFilters.jsx](../frontend/src/components/AuditFilters.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/Dialog.jsx](../frontend/src/components/Dialog.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/ErrorBoundary.jsx](../frontend/src/components/ErrorBoundary.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/FinancePanels.jsx](../frontend/src/components/FinancePanels.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/OperationDialog.jsx](../frontend/src/components/OperationDialog.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/OperationsTable.jsx](../frontend/src/components/OperationsTable.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/PageState.jsx](../frontend/src/components/PageState.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/components/ui.jsx](../frontend/src/components/ui.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/hooks/usePageData.js](../frontend/src/hooks/usePageData.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/hooks/useRoute.js](../frontend/src/hooks/useRoute.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/main.jsx](../frontend/src/main.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/pages/AuditPage.jsx](../frontend/src/pages/AuditPage.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/pages/Login.jsx](../frontend/src/pages/Login.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/pages/ReportsPage.jsx](../frontend/src/pages/ReportsPage.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/pages/UsersPage.jsx](../frontend/src/pages/UsersPage.jsx) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/services/api.js](../frontend/src/services/api.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/services/contracts.js](../frontend/src/services/contracts.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/styles/app.css](../frontend/src/styles/app.css) | Просмотрен выборочно | Базовый minified CSS; темы/media/import, с refinements и контрастным тестом | [FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/styles/refinements.css](../frontend/src/styles/refinements.css) | Просмотрен по правилам UI | Токены, диалоги, overflow, breakpoints, print/reduced-motion; без визуальной приёмки | [FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/utils/format.js](../frontend/src/utils/format.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/src/utils/route.js](../frontend/src/utils/route.js) | Прочитан статически; V-03/V-07 ограниченно | Входы UI/действия/запросы, состояния и роли; SSR/pure функции не заменяют браузер | [FC-01…FC-12/§8](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/tests/api.test.js](../frontend/tests/api.test.js) | Прочитан + V-03 | Mock HTTP, SSR, контракты, суммы/URL/контраст/demo; 12 passed | [§17/V-03](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/tests/contrast.test.js](../frontend/tests/contrast.test.js) | Прочитан + V-03 | Mock HTTP, SSR, контракты, суммы/URL/контраст/demo; 12 passed | [§17/V-03](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/tests/demo.test.js](../frontend/tests/demo.test.js) | Прочитан + V-03 | Mock HTTP, SSR, контракты, суммы/URL/контраст/demo; 12 passed | [§17/V-03](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/tests/render.test.js](../frontend/tests/render.test.js) | Прочитан + V-03 | Mock HTTP, SSR, контракты, суммы/URL/контраст/demo; 12 passed | [§17/V-03](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/tests/ux.test.js](../frontend/tests/ux.test.js) | Прочитан + V-03 | Mock HTTP, SSR, контракты, суммы/URL/контраст/demo; 12 passed | [§17/V-03](../ТЗ_диплом_Фаиза_v4.0.md) |
| [frontend/vite.config.js](../frontend/vite.config.js) | Просмотрен как конфигурация/документация | Назначение запуска, зависимости, инфраструктура, секретные значения не читались | [§5/15](../ТЗ_диплом_Фаиза_v4.0.md) |
| [scripts/configure-local.mjs](../scripts/configure-local.mjs) | Прочитан, не запускался | Локальные роль/БД, запуск, 21+3 demo или destructive restore только _test; не runtime job | [§15/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [scripts/demo-data.mjs](../scripts/demo-data.mjs) | Прочитан, не запускался | Локальные роль/БД, запуск, 21+3 demo или destructive restore только _test; не runtime job | [§15/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [scripts/run-local.mjs](../scripts/run-local.mjs) | Прочитан, не запускался | Локальные роль/БД, запуск, 21+3 demo или destructive restore только _test; не runtime job | [§15/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [scripts/seed-demo.mjs](../scripts/seed-demo.mjs) | Прочитан, не запускался | Локальные роль/БД, запуск, 21+3 demo или destructive restore только _test; не runtime job | [§15/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [scripts/verify-backup.mjs](../scripts/verify-backup.mjs) | Прочитан, не запускался | Локальные роль/БД, запуск, 21+3 demo или destructive restore только _test; не runtime job | [§15/16](../ТЗ_диплом_Фаиза_v4.0.md) |
| [tests/integration.mjs](../tests/integration.mjs) | Прочитан, не запускался | Реальный API/БД integration/security, отдельная тестовая схема/lock, side effects только тестовые по коду | [§17/V-04/V-05](../ТЗ_диплом_Фаиза_v4.0.md) |
| [tests/review-cases.mjs](../tests/review-cases.mjs) | Прочитан, не запускался | Реальный API/БД integration/security, отдельная тестовая схема/lock, side effects только тестовые по коду | [§17/V-04/V-05](../ТЗ_диплом_Фаиза_v4.0.md) |
| [tests/run-all.mjs](../tests/run-all.mjs) | Прочитан, не запускался | Реальный API/БД integration/security, отдельная тестовая схема/lock, side effects только тестовые по коду | [§17/V-04/V-05](../ТЗ_диплом_Фаиза_v4.0.md) |
| [tests/security.mjs](../tests/security.mjs) | Прочитан, не запускался | Реальный API/БД integration/security, отдельная тестовая схема/lock, side effects только тестовые по коду | [§17/V-04/V-05](../ТЗ_диплом_Фаиза_v4.0.md) |
| [tests/security/cases.mjs](../tests/security/cases.mjs) | Прочитан, не запускался | Реальный API/БД integration/security, отдельная тестовая схема/lock, side effects только тестовые по коду | [§17/V-04/V-05](../ТЗ_диплом_Фаиза_v4.0.md) |
| [ТЗ_диплом_Фаиза_v1.1.md](../docs/archive/ТЗ_диплом_Фаиза_v1.1_как_получено.md) | Прочитан | Предыдущие требования, не доказательство реализации | [§1/19](../ТЗ_диплом_Фаиза_v4.0.md) |
| [ТЗ_диплом_Фаиза_v4.0.md](../ТЗ_диплом_Фаиза_v4.0.md) | Документация этой сессии | Сопоставление / доказательства / актуальное ТЗ | [§1/20/21](../ТЗ_диплом_Фаиза_v4.0.md) |

## 4. Снимок доказательств

Сам реестр `docs/srs-evidence.md` создан после первичного перечисления 112 файлов; это дополнительный документ этой сессии, не пропущенный компонент приложения. Вход — результаты обследования/команд, выход — ссылки, границы проверки и хеши источников; относится к §17/20/21 ТЗ.

SHA-256 относится к прочитанным файлам рабочего дерева, не к production. Это позволяет отличить обследованные незакоммиченные исходники от одной лишь ссылки на HEAD. Копирование старого ТЗ подтверждается полным совпадением хеша. Генерируемые lock/Snapshot и бинарные изображения здесь не хешируются для доказательства поведения.

| Источник | SHA-256 |
|---|---|
| backend/src/FaizaCash.Api/Authorization/CurrentActor.cs | 29bfe3144d920b27ea471e0be6153b50b2bf32f1a60e8aed1f5adc026198b401 |
| backend/src/FaizaCash.Api/Configuration/HttpExtensions.cs | 1961b1c50a4252692cb455ce78f2e7cf1552f2901371d8d79d7cecda0f22780a |
| backend/src/FaizaCash.Api/Controllers/ApiEndpoints.cs | c16e0a8fdce6d7403f14cb364d2dbe24b0104dbec197e7bde791e472c0038621 |
| backend/src/FaizaCash.Api/Controllers/AuditEndpoints.cs | 418658009527524d8ba6c144c33ccf6781e265e3e5cbacfa8892f4b3b2d687a7 |
| backend/src/FaizaCash.Api/Controllers/DirectoryEndpoints.cs | 6ccac454257502d9d58f41e5e1d04a01e7d39dcd2ddb5ef5c5de4ecc6cd0d6a5 |
| backend/src/FaizaCash.Api/Controllers/ReportEndpoints.cs | a4924ada58d2c090c5a2d2d744c83b93cb27a7996a2971da28406968232d5c37 |
| backend/src/FaizaCash.Api/FaizaCash.Api.csproj | 8801e83e699e29effa8c6c73bcb2f8f74623776fd90365d0088d29697f536897 |
| backend/src/FaizaCash.Api/Middleware/AccessMiddleware.cs | b178070759194ec8316a29baa5f1f821d2471253f66be207f72c81a36749f858 |
| backend/src/FaizaCash.Api/Middleware/DirectoryCacheMiddleware.cs | f72f2d691eafa24a6d6d235702daf4a9abdaca23d5ba24621b262a97125dc810 |
| backend/src/FaizaCash.Api/Middleware/RequestMiddleware.cs | 3381a4f1bf51d078eb67b9efb91a6cf871a6233586e9b5963c49f2dec6ef3068 |
| backend/src/FaizaCash.Api/Program.cs | 2630920feab492073ad3d6d5b827a144c87e1b7a4a24dca2b375a6f5e5401ad9 |
| backend/src/FaizaCash.Api/appsettings.json | 800178ca17a6f22a4a77c5d47d14ee0536349d628694dd713d5dddba49564823 |
| backend/src/FaizaCash.Application/DTOs/Contracts.cs | 5f4c294899f0494ff38b4351b0da35536f75d88d684265f0c0afabea48d332f5 |
| backend/src/FaizaCash.Application/DTOs/Projections.cs | aad99aa72a28f8b081b4902bad282b614db95c9d72141af70dc583a58f92de21 |
| backend/src/FaizaCash.Application/DTOs/UserDto.cs | 10eac5e1d2c7c0aa375d47e95cad5b6d7cf37e2584f64b5b288fd0ecbb120791 |
| backend/src/FaizaCash.Application/FaizaCash.Application.csproj | 5d204e1c91353c1609712adc6ece939dd3c0752f6e7aa622734b4c83deac616e |
| backend/src/FaizaCash.Application/Interfaces/ICurrentActor.cs | 315c40c79052532f6b671f53fa6f4ea6e26a04adfa6ca6975e5a05f06529fcbe |
| backend/src/FaizaCash.Application/Interfaces/ILedgerService.cs | bd90b9de1a3138b36cc30998c06779ee60f7808819f73aaba490601e7f371391 |
| backend/src/FaizaCash.Application/Interfaces/IPdfReport.cs | 40260d6ba4725b722ecb6dea895afdf2ab0edb848dbbcf9b18d42317439bf4e4 |
| backend/src/FaizaCash.Application/Services/BalanceRules.cs | 18749e78fb536968e0d5a92e741b2ed8054ec878b64a6d8b703096e97ba19861 |
| backend/src/FaizaCash.Domain/Entities/Models.cs | 5dbda89eb0c7200af5ade9aad0f4f2ed3ed34c374b6e2d102e79e63668f8ba95 |
| backend/src/FaizaCash.Domain/FaizaCash.Domain.csproj | 0239223a1169e4aa40dfc431ef1894bc7c056a253e9b62220449b1878824393a |
| backend/src/FaizaCash.Domain/ValueObjects/Money.cs | eca3eaf692eb06292332d301c0af034ca53f5ea46f4507ac18ff64eed9f59536 |
| backend/src/FaizaCash.Infrastructure/FaizaCash.Infrastructure.csproj | b60c7d2e2ff996006869fbb8b074ca4f80f1a190d02884e8e8d94b8adf5d2454 |
| backend/src/FaizaCash.Infrastructure/Identity/IdentityServices.cs | 9a01ad5dadbee9858302083ad4b29c4822786f8ae60b7e2d14db00420a27f6b6 |
| backend/src/FaizaCash.Infrastructure/Logging/JsonFileLogger.cs | 094f08719cf4da92106d0f4c3619079408a7ccca3e2356df9d94ad452d8fb8e9 |
| backend/src/FaizaCash.Infrastructure/Migrations/20261112052646_InitialLedger.cs | 2085051d078dd35848fa72721a260660e1b4d4377901c4b2c559b80eed9557d9 |
| backend/src/FaizaCash.Infrastructure/Migrations/20261112060000_ImmutableLedger.cs | 1fa37fc7b89f4ace707088fcd15d64cdac81477487bc57cbb900d12c87638a9f |
| backend/src/FaizaCash.Infrastructure/Persistence/CashDb.cs | 693571b726f72e84269ee8155728906f6b3b3eac50691b7fc53d73692f0238a9 |
| backend/src/FaizaCash.Infrastructure/Persistence/DesignFactory.cs | 96ab3b5d764e9044cce6507c2b1aca2b2e7066e01aeb3e2c8989b56fec1adc8c |
| backend/src/FaizaCash.Infrastructure/Services/LedgerService.cs | fad3cf19684a49ed1e9be5f7e25d34867d8ec54844361d90d7df6205fa1ea418 |
| backend/src/FaizaCash.Infrastructure/Services/PdfReport.cs | fc1d94997dac29543b3f63dbcee71e0cf433fe6db9e12fc437e89b4649052f20 |
| docs/archive/ТЗ_диплом_Фаиза_v1.1_как_получено.md | c38c19e779a1f00b995c99ce44b7f887f5e28278e563240122add90b27f3371e |
| frontend/src/app/App.jsx | ef72c2d264e3fcf44725c842d8898995d902c25debbff335674e3b5fe6a8c38e |
| frontend/src/components/AuditFilters.jsx | 7575bc0a964a378cd62118c3a87b64659c451bd2e2112b40e18c1cac9c92bf9c |
| frontend/src/components/Dialog.jsx | 945be9764724fadd8ca653c4756884c4eac465763b6b3faf5779e59efb1853f5 |
| frontend/src/components/ErrorBoundary.jsx | 4a8c36d75ecbe4c996646b644e1c57260fdec112531ee8977a4ebc10817a61f3 |
| frontend/src/components/FinancePanels.jsx | 27c87ee3ebd4620b89134772d46fa62d0b7c919dbe3bbb849cdfad8051eb301f |
| frontend/src/components/OperationDialog.jsx | 4690d02376991d577898746ebe10e32d76dd3e2b1fe757fc75ad86d6184b32d4 |
| frontend/src/components/OperationsTable.jsx | b3cb2bbdd820ab10f174af9c67f441c40d13f54846e07ab08ae07b6a0f325fc7 |
| frontend/src/components/PageState.jsx | 7376c20b4b97ffb69b68343b87ee3a4e4f9269202a18698fad55246dc629a0e6 |
| frontend/src/components/ui.jsx | 703be420f9964d119a6a0f3c52b2a6e07c1216e424290f92e9665bc23d3b180e |
| frontend/src/hooks/usePageData.js | 9c2d47c5989bdcef2076cd49bb0ab96ae97bd3393f8cd61edcedb5446b3cedc7 |
| frontend/src/hooks/useRoute.js | 81798e24b149fc711f6dc5ca9b4a28488aa385a7258b3d1338fbad7882cb3ae8 |
| frontend/src/main.jsx | e71da1c1decc49ee9cd4fb3913d059dcda92e80b828310f89b5a3783a9fbe98a |
| frontend/src/pages/AuditPage.jsx | bb244c1c581bc33236859bb2c6be4a56dc1823c4b78ab2e13952d059c567712c |
| frontend/src/pages/Login.jsx | e6ab5af14783e97c4fc09c73fff9bb5300c2f6cf2bc0e9883d3c3d6500fb6a6a |
| frontend/src/pages/ReportsPage.jsx | d75476c40752d8e6457669ec63c5598cded8a120bb99c374b881cc261acad33e |
| frontend/src/pages/UsersPage.jsx | 7e81baefc113034c4fc5a60c8e3960fbd4f5ca1fd992b8724f41a84ac1bd78cb |
| frontend/src/services/api.js | b67e1663351f0857afd388f0652f3cf8cf247926bb691c4b340e6040a525b5cb |
| frontend/src/services/contracts.js | d828ebe48b7f9c53778867f8800b52f30e444e6a53af5cb805f81a42bd7858a5 |
| frontend/src/utils/format.js | 0686c6b5cc0abb08877b8edb47aef9e55ed5ee727021679dc96d3a52df29262f |
| frontend/src/utils/route.js | 5399de3b1dcb4181e9c67e6f5a58424964d32201382984b8b20279b2744869ff |
| scripts/configure-local.mjs | db9e0a8f87d791d7675c1e3982c82c971d2ea1831dd86f166b8f5d6ae2115947 |
| scripts/demo-data.mjs | fd4c27e0b2aada6e545c6ba9e47854611ecc412ffa335fb699fb33cfce9a59fa |
| scripts/run-local.mjs | f1757b816480285fdf2271e195a4bea85ee58c9ed19a83cbed738be122b8b56f |
| scripts/seed-demo.mjs | 6a780b7aa6cb216c2326665a8c0819a9098d85c5668b8d5189f5271fa260569b |
| scripts/verify-backup.mjs | 2f4595693dd672ce1c6eff3a076eb945563b61047d9755bde06e377499f46f88 |
| tests/integration.mjs | 55052a5c8bd271ae78af10fcf9f860f01394ce36aae32a271846fa4f111ec9fe |
| tests/review-cases.mjs | 54bda9f10a38129244436fd5f410c41b52ce33f6a281d2f9dd57a53f4f0b913e |
| tests/run-all.mjs | f6c921945d4c184721b27721464d2413d63eab8299096d35783d91cc2d885183 |
| tests/security.mjs | 0ef4305f3f188900032a220ce7216c844a98d376d9da42ada39a7ac49726914b |
| tests/security/cases.mjs | 569c6f3272513db0bab53739fb7a302858a2e2d06bf881352ee7e5ae315c0a32 |
| ТЗ_диплом_Фаиза_v1.1.md | c38c19e779a1f00b995c99ce44b7f887f5e28278e563240122add90b27f3371e |

## 5. Остаточная неопределённость и действия

Охват обеспечивает описание доступных ключевых исходников и контрактов, но не полную проверку выполнения. Выборочно просмотрены базовый minified CSS, генерируемые представления EF и lock-файлы; визуальные PNG лишь перечислены. Непроверенными остаются runtime-схема/содержимое БД, HTTP-наборы, прямой SQL-триггерный тест, миграция старых данных, браузер/клавиатура/консоль, Docker/TLS/Origin, нагрузка, coverage, восстановление, независимая безопасность и внешняя нормативная пригодность. Их отсутствие не восполняется названиями методов или наличием пакетов.

Для подтверждения эксплуатации нужны изолированная тестовая БД и её безопасная конфигурация, последовательный V-04/V-05 и backup-прогон, доступный браузер/контейнерная среда и утверждённый регламент. Для завершения документа эти сведения честно обозначены, а не придуманы. Необходимые решения владельца перечислены в §18 основного ТЗ.

## 6. Контроль готовой документации

Проверены все локальные Markdown-ссылки нового ТЗ, сравнения, реестра, README и архива: отсутствующих целей нет. Ограждения блоков кода парные, недопустимых символов замены UTF-8 не найдено. FC-01…FC-12 присутствуют, 204 заголовка OLD-позиций уникальны (допущения, права, схема, правила и экраны дополнительно представлены отдельными пунктами). Сопоставлены 88 функциональных маркированных позиций и 55 строк старого API. Архив побайтово совпадает с исходным ТЗ. `git diff --check` завершился успешно; предупреждения Git касаются уже существующих настроек CRLF/доступа к глобальному ignore, не являются ошибками документации. Новые untracked Markdown проверены отдельно, поскольку обычный git diff их не включает.

Намеренные изменения этой задачи: новое ТЗ 4.0, docs/srs-comparison.md, docs/srs-evidence.md, архивная копия исходника и навигационный блок README. Остальные изменения, уже присутствовавшие при начале обследования, сохранены. Бизнес-код, миграции, настройки и рабочие записи для соответствия документу не менялись.

## 7. Повторная проверка после очистки 13.11.2026

Удалён дубликат старого ТЗ в корне после проверки совпадения SHA-256 с docs/archive/ТЗ_диплом_Фаиза_v1.1_как_получено.md и переноса ссылок; архив без изменений. Удалены не связанные с кассовой системой create_srs_ai.py / create_srs_ai_100.py, пустой docx_render и семь устаревших одноразовых source-rewrite скриптов .runtime. Подтверждены отсутствие обращений к CurrencyInput/OpeningInput по всему backend и отсутствие вызовов старого ApiEndpoints.Csv; эти определения и лишние импорты удалены. Импортный граф от frontend/src/main.jsx достигает всех JS/JSX-модулей, все четыре прямые runtime npm-зависимости используются. Миграции/схема, настройки, .env/local.json, журналы и полезные инструменты проверки не удалялись.

Повторно успешно выполнены V-01 (19 unit), V-02 (build, 0 ошибок/предупреждений), V-03 (12 client), V-04 (21 integration на реальном PostgreSQL), V-05 (12 security на реальном PostgreSQL), V-07b (frontend build --configLoader runner). V-04/V-05 по очереди пересоздавали только проверенную отдельную loopback-базу _test. Свежие машиночитаемые результаты: .runtime/integration-test-results.json, .runtime/security-test-results.json. Unit запускался без записи нового TRX, результат наблюдался непосредственно в выводе команды. Текущий рабочий API и его данные не запускались/не менялись.

Дополнительно node scripts/verify-backup.mjs успешно сравнил количество операций/posted/аудита и знаковую сумму после pg_dump/pg_restore в этой же тестовой базе. Свежий результат .runtime/backup-verification.json. Из frontend временный preview с configFile:false подтвердил HTTP 200 индекса и всех трёх подключённых ресурсов JS/CSS; сервер остановлен по завершении. Это проверка доставки сборки, не браузер/DOM/клики.

V-07a повторён и снова завершился ошибкой доступа esbuild к родительскому каталогу при загрузке vite.config.js. Этот дефект окружения наблюдался и до удаления файлов. Альтернативный loader runner собрал те же исходники, код/скрипты запуска ради обхода не изменялись. V-06 в части настоящего браузера, Docker/TLS, нагрузка и независимый аудит остаются невыполненными.

Хеши и перечень в разделах 3–4 относятся к исходному обследованию до очистки и не выдаются за хеши изменённых файлов. Новые изменения исходников ограничены удалением неиспользуемых объявлений/импортов; функциональные сценарии не переписывались.
