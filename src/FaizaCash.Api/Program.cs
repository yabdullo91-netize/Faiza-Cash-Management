using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

const string Admin = "admin", Accountant = "accountant", Manager = "manager", Auditor = "auditor";
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(x => x.Limits.MaxRequestBodySize = 6 * 1024 * 1024);
var cs = builder.Configuration.GetConnectionString("CashDb") ?? throw new InvalidOperationException("CashDb is not configured.");
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
if (jwtKey.Length < 32) throw new InvalidOperationException("Jwt:Key must have at least 32 characters.");
builder.Services.AddDbContext<CashDb>(x => x.UseNpgsql(cs));
builder.Services.AddScoped<Audit>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(x => x.TokenValidationParameters = new()
{
    ValidateIssuer = true, ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidateAudience = true, ValidAudience = builder.Configuration["Jwt:Audience"],
    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(20),
    NameClaimType = ClaimTypes.NameIdentifier, RoleClaimType = ClaimTypes.Role
});
builder.Services.AddAuthorization();
var app = builder.Build();
app.UseExceptionHandler(e => e.Run(async c =>
{
    app.Logger.LogError(c.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error, "Unhandled exception");
    await Results.Problem("Внутренняя ошибка сервера.", statusCode: 500).ExecuteAsync(c);
}));
app.Use(async (c, next) =>
{
    c.Response.Headers["X-Content-Type-Options"] = "nosniff";
    c.Response.Headers["X-Frame-Options"] = "DENY";
    c.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    c.Response.Headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'";
    await next();
});
app.UseDefaultFiles(); app.UseStaticFiles(); app.UseAuthentication(); app.UseAuthorization();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CashDb>();
    await db.Database.EnsureCreatedAsync();
    await Seed(db, builder.Configuration, scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Seed"));
}

app.MapGet("/health", async (CashDb db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok", utc = DateTime.UtcNow }) : Results.Problem("База данных недоступна.", statusCode: 503));

app.MapPost("/api/auth/login", async (LoginDto input, HttpContext ctx, CashDb db, Audit audit) =>
{
    var login = (input.Login ?? "").Trim().ToLowerInvariant();
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var count = await db.LoginAttempts.CountAsync(x => x.Login == login && x.Ip == ip && !x.Succeeded && x.CreatedAt > DateTime.UtcNow.AddMinutes(-15));
    if (count >= 5) return Results.Problem("Вход временно ограничен. Повторите попытку позже.", statusCode: 429);
    var user = await db.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.Login == login);
    var valid = user is not null && user.Active && Password.Verify(input.Password ?? "", user.PasswordHash);
    db.LoginAttempts.Add(new() { Login = login, Ip = ip, Succeeded = valid }); await db.SaveChangesAsync();
    if (!valid)
    {
        await audit.Add(null, "login_failed", "user", null, new { login, ip });
        await Task.Delay(Math.Min(1000, 150 * (count + 1)), ctx.RequestAborted);
        return Results.Problem("Неверный логин или пароль.", statusCode: 401);
    }
    var result = await Tokens.Issue(user!, ctx, db, builder.Configuration);
    await audit.Add(user!.Id, "login", "user", null, new { ip });
    return Results.Ok(result);
});
app.MapPost("/api/auth/refresh", async (HttpContext ctx, CashDb db) =>
{
    if (!ctx.Request.Cookies.TryGetValue(Tokens.Cookie, out var raw)) return Results.Problem("Сеанс не найден.", statusCode: 401);
    var old = await db.RefreshTokens.Include(x => x.User).ThenInclude(x => x.UserRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.Hash == Tokens.Hash(raw) && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow);
    if (old is null || !old.User.Active) return Results.Problem("Сеанс недействителен.", statusCode: 401);
    old.RevokedAt = DateTime.UtcNow;
    var response = await Tokens.Issue(old.User, ctx, db, builder.Configuration, old);
    await db.SaveChangesAsync();
    return Results.Ok(response);
});
app.MapPost("/api/auth/logout", [Authorize] async (HttpContext ctx, CashDb db, Audit audit) =>
{
    if (ctx.Request.Cookies.TryGetValue(Tokens.Cookie, out var raw))
    {
        var token = await db.RefreshTokens.SingleOrDefaultAsync(x => x.Hash == Tokens.Hash(raw) && x.RevokedAt == null);
        if (token is not null) { token.RevokedAt = DateTime.UtcNow; await db.SaveChangesAsync(); }
    }
    ctx.Response.Cookies.Delete(Tokens.Cookie, Tokens.Options);
    await audit.Add(ctx.UserId(), "logout", "user", null, new { });
    return Results.NoContent();
});
app.MapGet("/api/auth/me", [Authorize] async (HttpContext ctx, CashDb db) => Results.Ok((await db.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleAsync(x => x.Id == ctx.UserId())).Public()));
app.MapPost("/api/auth/change-password", [Authorize] async (PasswordDto input, HttpContext ctx, CashDb db, Audit audit) =>
{
    var u = await db.Users.SingleAsync(x => x.Id == ctx.UserId());
    if (!Password.Verify(input.OldPassword ?? "", u.PasswordHash)) return Results.Problem("Неверный текущий пароль.", statusCode: 400);
    if (!Password.Valid(input.NewPassword)) return Results.Problem("Пароль: минимум 10 символов, буквы и цифры.", statusCode: 400);
    u.PasswordHash = Password.Hash(input.NewPassword!); u.MustChangePassword = false; await db.SaveChangesAsync();
    await audit.Add(u.Id, "password_changed", "user", null, new { }); return Results.NoContent();
});

app.MapGet("/api/users", [Authorize(Roles = Admin)] async (CashDb db, int page = 1, int pageSize = 25, string? q = null) =>
    await Paged(db.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).Where(x => q == null || x.Login.Contains(q) || x.FullName.Contains(q)).OrderBy(x => x.Login), page, pageSize, x => x.Public()));
app.MapPost("/api/users", [Authorize(Roles = Admin)] async (UserInput input, HttpContext ctx, CashDb db, Audit audit) =>
{
    if (string.IsNullOrWhiteSpace(input.Login) || string.IsNullOrWhiteSpace(input.FullName) || !Password.Valid(input.Password)) return Results.Problem("Проверьте логин, имя и пароль.", statusCode: 400);
    var login = input.Login.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(x => x.Login == login)) return Results.Problem("Логин уже занят.", statusCode: 409);
    var roles = await db.Roles.Where(x => input.Roles.Contains(x.Code)).ToListAsync();
    if (roles.Count != input.Roles.Count) return Results.Problem("Неизвестная роль.", statusCode: 400);
    var u = new User { Login = login, FullName = input.FullName.Trim(), PasswordHash = Password.Hash(input.Password!), MustChangePassword = input.MustChangePassword };
    u.UserRoles = roles.Select(x => new UserRole { Role = x }).ToList(); db.Users.Add(u); await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "user_created", "user", null, new { u.Login }); return Results.Created($"/api/users/{u.Id}", u.Public());
});
app.MapPatch("/api/users/{id:guid}", [Authorize(Roles = Admin)] async (Guid id, UserPatch input, CashDb db) =>
{
    var u = await db.Users.Include(x => x.UserRoles).SingleOrDefaultAsync(x => x.Id == id); if (u is null) return Results.NotFound();
    if (input.FullName is not null) u.FullName = input.FullName.Trim(); if (input.Active.HasValue) u.Active = input.Active.Value;
    if (input.Roles is not null) { var rs = await db.Roles.Where(x => input.Roles.Contains(x.Code)).ToListAsync(); if (rs.Count != input.Roles.Count) return Results.Problem("Неизвестная роль.", statusCode: 400); u.UserRoles = rs.Select(x => new UserRole { UserId = id, RoleId = x.Id }).ToList(); }
    await db.SaveChangesAsync(); return Results.NoContent();
});
app.MapGet("/api/roles", [Authorize] async (CashDb db) => Results.Ok(await db.Roles.AsNoTracking().OrderBy(x => x.Code).ToListAsync()));

app.MapGet("/api/currencies", [Authorize] async (CashDb db) => Results.Ok(await db.Currencies.AsNoTracking().OrderBy(x => x.Code).ToListAsync()));
app.MapPost("/api/currencies", [Authorize(Roles = Admin)] async (CurrencyInput x, CashDb db) =>
{
    if (x.Code?.Length != 3 || string.IsNullOrWhiteSpace(x.Name)) return Results.Problem("Код валюты состоит из трёх символов.", statusCode: 400);
    var code = x.Code.ToUpperInvariant(); if (await db.Currencies.AnyAsync(c => c.Code == code)) return Results.Problem("Валюта уже существует.", statusCode: 409);
    db.Currencies.Add(new() { Code = code, Name = x.Name.Trim() }); await db.SaveChangesAsync(); return Results.NoContent();
});
app.MapGet("/api/cashboxes", [Authorize] async (CashDb db, bool? active = null) => Results.Ok(await db.Cashboxes.Include(x => x.Currency).Where(x => !active.HasValue || x.Active == active).Select(x => new { x.Id, x.Code, x.Name, currency = x.Currency.Code, x.BalanceLimit, x.Active }).ToListAsync()));
app.MapPost("/api/cashboxes", [Authorize(Roles = Admin)] async (CashboxInput x, HttpContext ctx, CashDb db, Audit audit) =>
{
    if (string.IsNullOrWhiteSpace(x.Code) || string.IsNullOrWhiteSpace(x.Name) || x.BalanceLimit < 0 || !await db.Currencies.AnyAsync(c => c.Id == x.CurrencyId)) return Results.Problem("Некорректные реквизиты кассы.", statusCode: 400);
    var code = x.Code.Trim().ToUpperInvariant(); if (await db.Cashboxes.AnyAsync(c => c.Code == code)) return Results.Problem("Код кассы уже существует.", statusCode: 409);
    var c = new Cashbox { Code = code, Name = x.Name.Trim(), CurrencyId = x.CurrencyId, BalanceLimit = x.BalanceLimit }; db.Cashboxes.Add(c); await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "cashbox_created", "cashbox", c.Id, new { c.Code }); return Results.Created($"/api/cashboxes/{c.Id}", c);
});
app.MapPatch("/api/cashboxes/{id:long}", [Authorize(Roles = Admin)] async (long id, CashboxPatch x, CashDb db) => { var c = await db.Cashboxes.FindAsync(id); if (c is null) return Results.NotFound(); if (x.Name is not null) c.Name = x.Name.Trim(); if (x.Active.HasValue) c.Active = x.Active.Value; if (x.BalanceLimit is >= 0) c.BalanceLimit = x.BalanceLimit; await db.SaveChangesAsync(); return Results.NoContent(); });
app.MapPut("/api/cashboxes/{id:long}/opening", [Authorize(Roles = Admin)] async (long id, OpeningInput x, HttpContext ctx, CashDb db, Audit audit) =>
{
    var c = await db.Cashboxes.Include(c => c.Opening).SingleOrDefaultAsync(c => c.Id == id); if (c is null) return Results.NotFound();
    if (x.Amount < 0 || x.Date > Local.Today) return Results.Problem("Некорректные дата или остаток.", statusCode: 400);
    if (await db.Operations.AnyAsync(o => o.CashboxId == id && o.Status == "posted")) return Results.Problem("После проведения операций начальный остаток не меняется.", statusCode: 409);
    c.Opening ??= new() { CashboxId = id, CreatedBy = ctx.UserId() }; c.Opening.Date = x.Date; c.Opening.Amount = x.Amount; await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "opening_set", "cashbox", id, new { x.Date, x.Amount }); return Results.NoContent();
});
app.MapGet("/api/cashboxes/{id:long}/balance", [Authorize] async (long id, DateOnly? date, CashDb db) => Results.Ok(await Balance(db, id, date ?? Local.Today)));

app.MapGet("/api/categories", [Authorize] async (CashDb db, string? type, string? q) => Results.Ok(await db.Categories.Where(x => (type == null || x.Type == type) && (q == null || x.Name.Contains(q))).OrderBy(x => x.Name).ToListAsync()));
app.MapPost("/api/categories", [Authorize(Roles = Admin + "," + Accountant)] async (CategoryInput x, CashDb db) => { if (x.Type is not ("income" or "expense") || string.IsNullOrWhiteSpace(x.Name)) return Results.Problem("Некорректная категория.", statusCode: 400); db.Categories.Add(new() { Type = x.Type, Name = x.Name.Trim(), ParentId = x.ParentId }); await db.SaveChangesAsync(); return Results.NoContent(); });
app.MapPatch("/api/categories/{id:long}", [Authorize(Roles = Admin + "," + Accountant)] async (long id, DirectoryPatch x, CashDb db) => { var c = await db.Categories.FindAsync(id); if (c is null) return Results.NotFound(); if (x.Name is not null) c.Name = x.Name.Trim(); if (x.Active.HasValue) c.Active = x.Active.Value; await db.SaveChangesAsync(); return Results.NoContent(); });
app.MapGet("/api/counterparties", [Authorize] async (CashDb db, string? q) => Results.Ok(await db.Counterparties.Where(x => q == null || x.Name.Contains(q)).OrderBy(x => x.Name).ToListAsync()));
app.MapPost("/api/counterparties", [Authorize(Roles = Admin + "," + Accountant)] async (CounterpartyInput x, CashDb db) => { if (string.IsNullOrWhiteSpace(x.Name) || x.Kind is not ("client" or "supplier" or "employee" or "other")) return Results.Problem("Некорректный контрагент.", statusCode: 400); db.Counterparties.Add(new() { Name = x.Name.Trim(), Kind = x.Kind, TaxCode = x.TaxCode?.Trim(), Contact = x.Contact?.Trim() }); await db.SaveChangesAsync(); return Results.NoContent(); });
app.MapGet("/api/document-types", [Authorize] async (CashDb db) => Results.Ok(await db.DocumentTypes.OrderBy(x => x.Name).ToListAsync()));
app.MapPost("/api/document-types", [Authorize(Roles = Admin + "," + Accountant)] async (DocumentTypeInput x, CashDb db) => { if (string.IsNullOrWhiteSpace(x.Code) || string.IsNullOrWhiteSpace(x.Name)) return Results.Problem("Укажите код и название.", statusCode: 400); db.DocumentTypes.Add(new() { Code = x.Code.Trim().ToUpperInvariant(), Name = x.Name.Trim() }); await db.SaveChangesAsync(); return Results.NoContent(); });

app.MapGet("/api/operations", [Authorize] async (CashDb db, long? cashboxId, DateOnly? from, DateOnly? to, string? type, string? status, long? categoryId, long? counterpartyId, string? q, int page = 1, int pageSize = 25) =>
{
    var rows = db.Operations.Include(x => x.Category).Include(x => x.Counterparty).Include(x => x.Author).Where(x =>
        (!cashboxId.HasValue || x.CashboxId == cashboxId) && (!from.HasValue || x.Date >= from) && (!to.HasValue || x.Date <= to) &&
        (type == null || x.Type == type) && (status == null || x.Status == status) && (!categoryId.HasValue || x.CategoryId == categoryId) &&
        (!counterpartyId.HasValue || x.CounterpartyId == counterpartyId) && (q == null || x.Description.Contains(q) || (x.DocumentNumber ?? "").Contains(q)));
    return await Paged(rows.OrderByDescending(x => x.Date).ThenByDescending(x => x.PostingSeq), page, pageSize, x => x.View());
});
app.MapGet("/api/operations/{id:long}", [Authorize] async (long id, CashDb db) => { var x = await db.Operations.Include(x => x.Category).Include(x => x.Counterparty).Include(x => x.Author).SingleOrDefaultAsync(x => x.Id == id); return x is null ? Results.NotFound() : Results.Ok(x.View()); });
app.MapPost("/api/operations", [Authorize(Roles = Accountant)] async (OperationInput x, HttpContext ctx, CashDb db, Audit audit) =>
{
    var bad = await Validate(x, db); if (bad is not null) return bad;
    var o = new CashOperation { CashboxId = x.CashboxId, Date = x.Date, Type = x.Type!, Amount = x.Amount, Description = x.Description!.Trim(), CategoryId = x.CategoryId, CounterpartyId = x.CounterpartyId, DocumentTypeId = x.DocumentTypeId, CreatedBy = ctx.UserId() };
    db.Operations.Add(o); await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "operation_created", "operation", o.Id, new { }); return Results.Created($"/api/operations/{o.Id}", o.View());
});
app.MapPatch("/api/operations/{id:long}", [Authorize(Roles = Accountant)] async (long id, OperationPatch x, HttpContext ctx, CashDb db, Audit audit) =>
{
    var o = await db.Operations.SingleOrDefaultAsync(x => x.Id == id); if (o is null) return Results.NotFound();
    if (o.CreatedBy != ctx.UserId() || o.Status != "draft") return Results.Problem("Можно изменить только собственный черновик.", statusCode: 403);
    if (o.Version != x.Version) return Results.Problem("Черновик изменён другим пользователем.", statusCode: 409);
    var input = new OperationInput(x.CashboxId ?? o.CashboxId, x.Date ?? o.Date, x.Type ?? o.Type, x.Amount ?? o.Amount, x.Description ?? o.Description, x.CategoryId ?? o.CategoryId, x.CounterpartyId ?? o.CounterpartyId, x.DocumentTypeId ?? o.DocumentTypeId);
    var bad = await Validate(input, db); if (bad is not null) return bad;
    o.CashboxId = input.CashboxId; o.Date = input.Date; o.Type = input.Type!; o.Amount = input.Amount; o.Description = input.Description!.Trim(); o.CategoryId = input.CategoryId; o.CounterpartyId = input.CounterpartyId; o.DocumentTypeId = input.DocumentTypeId; o.Version++; o.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "operation_updated", "operation", id, new { }); return Results.Ok(o.View());
});
app.MapDelete("/api/operations/{id:long}", [Authorize(Roles = Accountant)] async (long id, int version, HttpContext ctx, CashDb db, Audit audit) =>
{
    var o = await db.Operations.FindAsync(id); if (o is null) return Results.NotFound();
    if (o.CreatedBy != ctx.UserId() || o.Status != "draft") return Results.Problem("Можно удалить только собственный черновик.", statusCode: 403);
    if (o.Version != version) return Results.Problem("Черновик изменён другим пользователем.", statusCode: 409);
    db.Operations.Remove(o); await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "operation_deleted", "operation", id, new { }); return Results.NoContent();
});
app.MapPost("/api/operations/{id:long}/post", [Authorize(Roles = Accountant)] async (long id, HttpContext ctx, CashDb db, Audit audit) =>
{
    await using var tx = await db.Database.BeginTransactionAsync();
    var o = await db.Operations.SingleOrDefaultAsync(x => x.Id == id); if (o is null) return Results.NotFound();
    if (o.CreatedBy != ctx.UserId() || o.Status != "draft") return Results.Problem($"Проведение невозможно: статус {o.Status}.", statusCode: 409);
    var c = await db.Cashboxes.FromSqlInterpolated($"SELECT * FROM \"Cashboxes\" WHERE \"Id\" = {o.CashboxId} FOR UPDATE").SingleAsync();
    if (!c.Active || o.Date > Local.Today || (c.Opening is not null && o.Date < c.Opening.Date)) return Results.Problem("Нельзя провести операцию на эту дату.", statusCode: 400);
    if (await db.Shifts.AnyAsync(x => x.CashboxId == c.Id && x.Status == "closed" && x.Date >= o.Date)) return Results.Problem("Кассовый день уже закрыт.", statusCode: 409);
    var seq = (await db.Operations.Where(x => x.CashboxId == c.Id).MaxAsync(x => (long?)x.PostingSeq) ?? 0) + 1;
    if (!await IsBalanceValid(db, o, seq)) return Results.Problem("Проведение создаёт отрицательный остаток.", statusCode: 409);
    var doc = await db.Sequences.SingleOrDefaultAsync(x => x.CashboxId == c.Id && x.Type == o.Type && x.Year == o.Date.Year);
    if (doc is null) { doc = new() { CashboxId = c.Id, Type = o.Type, Year = (short)o.Date.Year }; db.Sequences.Add(doc); }
    doc.LastNumber++; o.PostingSeq = seq; o.DocumentNumber = $"{(o.Type == "income" ? "ПКО" : "РКО")}-{c.Code}-{o.Date.Year}-{doc.LastNumber:D6}"; o.Status = "posted"; o.PostedBy = ctx.UserId(); o.PostedAt = DateTime.UtcNow;
    var shift = await db.Shifts.SingleOrDefaultAsync(x => x.CashboxId == c.Id && x.Date == o.Date);
    if (shift is null) { var before = await Balance(db, c.Id, o.Date.AddDays(-1)); shift = new() { CashboxId = c.Id, Date = o.Date, OpeningBalance = before.Balance }; db.Shifts.Add(shift); await db.SaveChangesAsync(); } o.ShiftId = shift.Id;
    await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "operation_posted", "operation", o.Id, new { o.DocumentNumber }); await tx.CommitAsync(); return Results.Ok(o.View());
});
app.MapPost("/api/operations/{id:long}/reversals", [Authorize(Roles = Accountant)] async (long id, ReversalInput x, HttpContext ctx, CashDb db, Audit audit) =>
{
    var original = await db.Operations.SingleOrDefaultAsync(o => o.Id == id); if (original is null) return Results.NotFound();
    if (original.Status != "posted" || original.IsReversal || original.ReversalId.HasValue) return Results.Problem("Эту операцию нельзя сторнировать.", statusCode: 409);
    var date = x.Date ?? Local.Today; if (string.IsNullOrWhiteSpace(x.Reason) || date < original.Date || date > Local.Today) return Results.Problem("Укажите причину и корректную дату.", statusCode: 400);
    var reversal = new CashOperation { CashboxId = original.CashboxId, Date = date, Type = original.Type == "income" ? "expense" : "income", Amount = original.Amount, Description = "СТОРНО: " + original.Description, CategoryId = original.CategoryId, CounterpartyId = original.CounterpartyId, DocumentTypeId = original.DocumentTypeId, CreatedBy = ctx.UserId(), IsReversal = true, ReversalOfId = original.Id };
    db.Operations.Add(reversal); await db.SaveChangesAsync(); await audit.Add(ctx.UserId(), "reversal_created", "operation", original.Id, new { reversal.Id, x.Reason }); return Results.Created($"/api/operations/{reversal.Id}", reversal.View());
});

app.MapGet("/api/summary", [Authorize] async (CashDb db, long cashboxId, DateOnly? from, DateOnly? to) =>
{
    var end = to ?? Local.Today; var start = from ?? end.AddDays(-30); var opening = await Balance(db, cashboxId, start.AddDays(-1));
    var rows = await db.Operations.Where(x => x.CashboxId == cashboxId && x.Status == "posted" && x.Date >= start && x.Date <= end).ToListAsync();
    return Results.Ok(new { from = start, to = end, opening = opening.Balance, income = rows.Where(x => x.Type == "income").Sum(x => x.Amount), expense = rows.Where(x => x.Type == "expense").Sum(x => x.Amount), closing = opening.Balance + rows.Sum(x => x.Type == "income" ? x.Amount : -x.Amount) });
});
app.MapGet("/api/reports/cash.csv", [Authorize] async (CashDb db, HttpContext ctx, Audit audit, long cashboxId, DateOnly from, DateOnly to) =>
{
    var data = await db.Operations.Where(x => x.CashboxId == cashboxId && x.Status == "posted" && x.Date >= from && x.Date <= to).OrderBy(x => x.Date).ThenBy(x => x.PostingSeq).ToListAsync();
    var csv = new StringBuilder("\uFEFFДата;Номер;Тип;Содержание;Сумма\r\n");
    foreach (var x in data) csv.AppendJoin(';', Csv(x.Date.ToString()), Csv(x.DocumentNumber), Csv(x.Type == "income" ? "Приход" : "Расход"), Csv(x.Description), x.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)).Append("\r\n");
    await audit.Add(ctx.UserId(), "report_exported", "report", null, new { from, to }); return Results.File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv; charset=utf-8", "cash-report.csv");
});
app.MapGet("/api/audit", [Authorize(Roles = Admin + "," + Manager + "," + Auditor)] async (CashDb db, DateTime? from, DateTime? to, Guid? userId, string? entity, int page = 1, int pageSize = 50) =>
{
    var rows = db.AuditEvents.Where(x => (!from.HasValue || x.CreatedAt >= from) && (!to.HasValue || x.CreatedAt <= to) && (!userId.HasValue || x.UserId == userId) && (entity == null || x.Entity == entity)).OrderByDescending(x => x.CreatedAt);
    return await Paged(rows, page, pageSize, x => x);
});

app.Run();

static async Task<IResult?> Validate(OperationInput x, CashDb db)
{
    if (x.Type is not ("income" or "expense") || x.Amount <= 0 || string.IsNullOrWhiteSpace(x.Description) || x.Date > Local.Today) return Results.Problem("Проверьте тип, дату, сумму и содержание.", statusCode: 400);
    var box = await db.Cashboxes.Include(c => c.Opening).SingleOrDefaultAsync(c => c.Id == x.CashboxId);
    if (box is null || !box.Active || (box.Opening is not null && x.Date < box.Opening.Date)) return Results.Problem("Касса недоступна для этой даты.", statusCode: 400);
    if (!await db.Categories.AnyAsync(c => c.Id == x.CategoryId && c.Active && c.Type == x.Type)) return Results.Problem("Укажите активную категорию нужного типа.", statusCode: 400);
    if (x.CounterpartyId.HasValue && !await db.Counterparties.AnyAsync(c => c.Id == x.CounterpartyId && c.Active)) return Results.Problem("Контрагент не найден.", statusCode: 400);
    if (x.DocumentTypeId.HasValue && !await db.DocumentTypes.AnyAsync(c => c.Id == x.DocumentTypeId && c.Active)) return Results.Problem("Тип документа не найден.", statusCode: 400);
    return null;
}
static async Task<BalanceDto> Balance(CashDb db, long boxId, DateOnly date)
{
    var box = await db.Cashboxes.Include(x => x.Opening).SingleOrDefaultAsync(x => x.Id == boxId) ?? throw new KeyNotFoundException("Касса не найдена.");
    var opening = box.Opening is not null && box.Opening.Date <= date ? box.Opening.Amount : 0m;
    var delta = await db.Operations.Where(x => x.CashboxId == boxId && x.Status == "posted" && x.Date <= date).SumAsync(x => x.Type == "income" ? x.Amount : -x.Amount);
    return new(boxId, date, opening + delta);
}
static async Task<bool> IsBalanceValid(CashDb db, CashOperation candidate, long seq)
{
    var box = await db.Cashboxes.Include(x => x.Opening).SingleAsync(x => x.Id == candidate.CashboxId);
    var balance = box.Opening?.Amount ?? 0m;
    var data = await db.Operations.Where(x => x.CashboxId == candidate.CashboxId && x.Status == "posted").OrderBy(x => x.Date).ThenBy(x => x.PostingSeq).Select(x => new PostingItem(x.Date, x.PostingSeq, x.Type, x.Amount)).ToListAsync();
    data.Add(new PostingItem(candidate.Date, seq, candidate.Type, candidate.Amount));
    foreach (var x in data.OrderBy(x => x.Date).ThenBy(x => x.PostingSeq)) { balance += x.Type == "income" ? x.Amount : -x.Amount; if (balance < 0) return false; }
    return true;
}
static string Csv(string? text) { text ??= ""; if (text.Length > 0 && "=+-@".Contains(text[0])) text = "'" + text; return $"\"{text.Replace("\"", "\"\"")}\""; }
static async Task<IResult> Paged<T, R>(IQueryable<T> q, int page, int size, Func<T, R> map) { page = Math.Max(1, page); size = Math.Clamp(size, 1, 100); var count = await q.CountAsync(); var rows = await q.Skip((page - 1) * size).Take(size).ToListAsync(); return Results.Ok(new { page, pageSize = size, total = count, items = rows.Select(map) }); }
static async Task Seed(CashDb db, IConfiguration cfg, ILogger log)
{
    if (!await db.Roles.AnyAsync()) { db.Roles.AddRange(new Role { Code = Admin, Name = "Администратор" }, new Role { Code = Accountant, Name = "Бухгалтер" }, new Role { Code = Manager, Name = "Руководитель" }, new Role { Code = Auditor, Name = "Аудитор" }); db.Currencies.Add(new Currency { Code = "TJS", Name = "Таджикский сомони" }); await db.SaveChangesAsync(); }
    if (!await db.Users.AnyAsync())
    {
        var pass = cfg["Seed:AdminPassword"];
        if (Password.Valid(pass)) { var u = new User { Login = cfg["Seed:AdminLogin"] ?? "admin", FullName = "Системный администратор", PasswordHash = Password.Hash(pass!), MustChangePassword = true }; u.UserRoles.Add(new UserRole { Role = await db.Roles.SingleAsync(x => x.Code == Admin) }); db.Users.Add(u); await db.SaveChangesAsync(); }
        else log.LogWarning("Первый администратор не создан. Задайте Seed__AdminPassword.");
    }
}

record LoginDto(string? Login, string? Password); record PasswordDto(string? OldPassword, string? NewPassword); record UserInput(string? Login, string? Password, string? FullName, List<string> Roles, bool MustChangePassword = true); record UserPatch(string? FullName, bool? Active, List<string>? Roles); record CurrencyInput(string? Code, string? Name); record CashboxInput(string? Code, string? Name, short CurrencyId, decimal? BalanceLimit); record CashboxPatch(string? Name, bool? Active, decimal? BalanceLimit); record OpeningInput(DateOnly Date, decimal Amount); record CategoryInput(string? Type, string? Name, long? ParentId); record DirectoryPatch(string? Name, bool? Active); record CounterpartyInput(string? Name, string? Kind, string? TaxCode, string? Contact); record DocumentTypeInput(string? Code, string? Name); record OperationInput(long CashboxId, DateOnly Date, string? Type, decimal Amount, string? Description, long CategoryId, long? CounterpartyId, short? DocumentTypeId); record OperationPatch(long? CashboxId, DateOnly? Date, string? Type, decimal? Amount, string? Description, long? CategoryId, long? CounterpartyId, short? DocumentTypeId, int Version); record ReversalInput(string? Reason, DateOnly? Date); record BalanceDto(long CashboxId, DateOnly Date, decimal Balance); record PostingItem(DateOnly Date, long? PostingSeq, string Type, decimal Amount);

class CashDb(DbContextOptions<CashDb> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>(); public DbSet<Role> Roles => Set<Role>(); public DbSet<UserRole> UserRoles => Set<UserRole>(); public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>(); public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>(); public DbSet<Currency> Currencies => Set<Currency>(); public DbSet<Cashbox> Cashboxes => Set<Cashbox>(); public DbSet<CashboxOpening> Openings => Set<CashboxOpening>(); public DbSet<Category> Categories => Set<Category>(); public DbSet<Counterparty> Counterparties => Set<Counterparty>(); public DbSet<DocumentType> DocumentTypes => Set<DocumentType>(); public DbSet<CashOperation> Operations => Set<CashOperation>(); public DbSet<DocumentSequence> Sequences => Set<DocumentSequence>(); public DbSet<CashShift> Shifts => Set<CashShift>(); public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(x => x.Login).IsUnique(); b.Entity<Role>().HasIndex(x => x.Code).IsUnique(); b.Entity<UserRole>().HasKey(x => new { x.UserId, x.RoleId }); b.Entity<RefreshToken>().HasIndex(x => x.Hash).IsUnique(); b.Entity<Currency>().HasIndex(x => x.Code).IsUnique(); b.Entity<Cashbox>().HasIndex(x => x.Code).IsUnique(); b.Entity<Cashbox>().HasOne(x => x.Opening).WithOne(x => x.Cashbox).HasForeignKey<CashboxOpening>(x => x.CashboxId); b.Entity<CashOperation>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<CashboxOpening>().Property(x => x.Amount).HasPrecision(18, 2); b.Entity<Cashbox>().Property(x => x.BalanceLimit).HasPrecision(18, 2); b.Entity<CashOperation>().HasIndex(x => new { x.CashboxId, x.Date, x.PostingSeq }); b.Entity<CashOperation>().HasIndex(x => new { x.CashboxId, x.DocumentNumber }).IsUnique().HasFilter("\"DocumentNumber\" IS NOT NULL"); b.Entity<DocumentSequence>().HasKey(x => new { x.CashboxId, x.Type, x.Year }); b.Entity<CashShift>().HasIndex(x => new { x.CashboxId, x.Date }).IsUnique(); b.Entity<AuditEvent>().HasIndex(x => x.CreatedAt);
    }
}
class User { public Guid Id { get; set; } = Guid.NewGuid(); public string Login { get; set; } = ""; public string PasswordHash { get; set; } = ""; public string FullName { get; set; } = ""; public bool Active { get; set; } = true; public bool MustChangePassword { get; set; } = true; public List<UserRole> UserRoles { get; set; } = []; public object Public() => new { Id, Login, FullName, Active, MustChangePassword, roles = UserRoles.Select(x => x.Role.Code) }; }
class Role { public short Id { get; set; } public string Code { get; set; } = ""; public string Name { get; set; } = ""; }
class UserRole { public Guid UserId { get; set; } public short RoleId { get; set; } public User User { get; set; } = null!; public Role Role { get; set; } = null!; }
class RefreshToken { public Guid Id { get; set; } = Guid.NewGuid(); public Guid UserId { get; set; } public User User { get; set; } = null!; public string Hash { get; set; } = ""; public DateTime ExpiresAt { get; set; } public DateTime? RevokedAt { get; set; } public Guid? ReplacedBy { get; set; } }
class LoginAttempt { public long Id { get; set; } public string Login { get; set; } = ""; public string Ip { get; set; } = ""; public bool Succeeded { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
class Currency { public short Id { get; set; } public string Code { get; set; } = ""; public string Name { get; set; } = ""; public byte MinorUnits { get; set; } = 2; }
class Cashbox { public long Id { get; set; } public string Code { get; set; } = ""; public string Name { get; set; } = ""; public short CurrencyId { get; set; } public Currency Currency { get; set; } = null!; public decimal? BalanceLimit { get; set; } public bool Active { get; set; } = true; public CashboxOpening? Opening { get; set; } }
class CashboxOpening { public long Id { get; set; } public long CashboxId { get; set; } public Cashbox Cashbox { get; set; } = null!; public DateOnly Date { get; set; } public decimal Amount { get; set; } public Guid CreatedBy { get; set; } }
class Category { public long Id { get; set; } public string Type { get; set; } = ""; public long? ParentId { get; set; } public string Name { get; set; } = ""; public bool Active { get; set; } = true; }
class Counterparty { public long Id { get; set; } public string Name { get; set; } = ""; public string Kind { get; set; } = "other"; public string? TaxCode { get; set; } public string? Contact { get; set; } public bool Active { get; set; } = true; }
class DocumentType { public short Id { get; set; } public string Code { get; set; } = ""; public string Name { get; set; } = ""; public bool Active { get; set; } = true; }
class CashOperation { public long Id { get; set; } public long CashboxId { get; set; } public DateOnly Date { get; set; } public string Type { get; set; } = ""; public string Status { get; set; } = "draft"; public decimal Amount { get; set; } public string Description { get; set; } = ""; public long CategoryId { get; set; } public Category Category { get; set; } = null!; public long? CounterpartyId { get; set; } public Counterparty? Counterparty { get; set; } public short? DocumentTypeId { get; set; } public string? DocumentNumber { get; set; } public long? ShiftId { get; set; } public long? PostingSeq { get; set; } public bool IsReversal { get; set; } public long? ReversalOfId { get; set; } public long? ReversalId { get; set; } public Guid CreatedBy { get; set; } public User Author { get; set; } = null!; public Guid? PostedBy { get; set; } public DateTime? PostedAt { get; set; } public DateTime CreatedAt { get; set; } = DateTime.UtcNow; public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; public int Version { get; set; } = 1; public object View() => new { Id, CashboxId, Date, Type, Status, Amount, Description, CategoryId, category = Category?.Name, CounterpartyId, counterparty = Counterparty?.Name, DocumentTypeId, DocumentNumber, PostingSeq, IsReversal, ReversalOfId, CreatedBy, createdBy = Author?.FullName, CreatedAt, PostedAt, Version }; }
class DocumentSequence { public long CashboxId { get; set; } public string Type { get; set; } = ""; public short Year { get; set; } public int LastNumber { get; set; } }
class CashShift { public long Id { get; set; } public long CashboxId { get; set; } public DateOnly Date { get; set; } public string Status { get; set; } = "open"; public decimal OpeningBalance { get; set; } public decimal? ClosingBalance { get; set; } }
class AuditEvent { public long Id { get; set; } public Guid? UserId { get; set; } public string Action { get; set; } = ""; public string Entity { get; set; } = ""; public long? EntityId { get; set; } public string Details { get; set; } = "{}"; public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
class Audit(CashDb db) { public async Task Add(Guid? user, string action, string entity, long? id, object data) { db.AuditEvents.Add(new() { UserId = user, Action = action, Entity = entity, EntityId = id, Details = System.Text.Json.JsonSerializer.Serialize(data) }); await db.SaveChangesAsync(); } }
static class Password { public static bool Valid(string? s) => s is { Length: >= 10 } && s.Any(char.IsLetter) && s.Any(char.IsDigit); public static string Hash(string s) { var salt = RandomNumberGenerator.GetBytes(16); var hash = Rfc2898DeriveBytes.Pbkdf2(s, salt, 600000, HashAlgorithmName.SHA512, 32); return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}"; } public static bool Verify(string s, string stored) { try { var p = stored.Split(':'); var test = Rfc2898DeriveBytes.Pbkdf2(s, Convert.FromBase64String(p[0]), 600000, HashAlgorithmName.SHA512, 32); return CryptographicOperations.FixedTimeEquals(test, Convert.FromBase64String(p[1])); } catch { return false; } } }
static class Tokens { public const string Cookie = "faiza_refresh"; public static CookieOptions Options => new() { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Path = "/api/auth", MaxAge = TimeSpan.FromDays(7) }; public static string Hash(string s) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s))); public static async Task<object> Issue(User user, HttpContext ctx, CashDb db, IConfiguration cfg, RefreshToken? old = null) { var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(48)); var refresh = new RefreshToken { UserId = user.Id, Hash = Hash(raw), ExpiresAt = DateTime.UtcNow.AddDays(7) }; db.RefreshTokens.Add(refresh); if (old is not null) old.ReplacedBy = refresh.Id; await db.SaveChangesAsync(); ctx.Response.Cookies.Append(Cookie, raw, Options); var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id.ToString()) }; claims.AddRange(user.UserRoles.Select(x => new Claim(ClaimTypes.Role, x.Role.Code))); var t = new JwtSecurityToken(cfg["Jwt:Issuer"], cfg["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256)); return new { accessToken = new JwtSecurityTokenHandler().WriteToken(t), expiresIn = 900, user = user.Public() }; } }
static class Local { public static DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Dushanbe")); }
static class HttpExt { public static Guid UserId(this HttpContext c) => Guid.Parse(c.User.FindFirstValue(ClaimTypes.NameIdentifier)!); }
