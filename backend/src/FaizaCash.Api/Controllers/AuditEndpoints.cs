using FaizaCash.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
namespace FaizaCash.Api;

public static class AuditEndpoints
{
    private static readonly Dictionary<string,string> Actions=new()
    {
        ["login"]="Вход в систему",["login_failed"]="Неудачная попытка входа",["logout"]="Выход из системы",
        ["password_changed"]="Изменён пароль",["user_created"]="Создан пользователь",["user_updated"]="Изменён пользователь",
        ["cashbox_created"]="Создана касса",["cash_access_granted"]="Выдан доступ к кассе",["cash_access_revoked"]="Отозван доступ к кассе",["operation_created"]="Создан черновик",["operation_updated"]="Изменён черновик",
        ["operation_deleted"]="Удалён черновик",["operation_posted"]="Проведён кассовый документ",["reversal_created"]="Создано сторно",
        ["report_exported"]="Выгружен отчёт CSV",["pdf_exported"]="Выгружен отчёт PDF",
        ["data_added"]="Добавлена запись",["data_modified"]="Изменена запись",["data_deleted"]="Удалена запись"
    };
    private static readonly Dictionary<string,string> Entities=new()
    {
        ["user"]="Пользователь",["User"]="Пользователь",["UserRole"]="Роль пользователя",["Role"]="Роль",
        ["cashbox"]="Касса",["Cashbox"]="Касса",["operation"]="Кассовый документ",["CashOperation"]="Кассовый документ",
        ["report"]="Отчёт",["Category"]="Категория",["Counterparty"]="Контрагент",["Organization"]="Организация",
        ["DocumentSequence"]="Нумерация документов",["CashAccess"]="Доступ к кассе",["Currency"]="Валюта",["DocumentType"]="Вид документа",["CashShift"]="Кассовый день",["CashboxOpening"]="Начальный остаток"
    };
    public static void MapAudit(this WebApplication app)
    {
        var group=app.MapGroup("/api/audit").RequireAuthorization(p=>p.RequireRole("admin","accountant","manager","auditor"));
        group.MapGet("/options",async(CashDb db)=>Results.Ok(new {
            users=await db.Users.OrderBy(u=>u.FullName).Select(u=>new {u.Id,u.FullName}).ToListAsync(),
            actions=Actions.Select(x=>new{code=x.Key,name=x.Value}),entities=Entities.Select(x=>new{code=x.Key,name=x.Value})
        }));
        group.MapGet("",async(CashDb db,DateTime? from,DateTime? to,Guid? userId,string? entity,string? action,bool? includeTechnical,int page=1,int pageSize=50)=>
        {
            var rows=db.AuditEvents.AsNoTracking().Where(x=>(!from.HasValue||x.CreatedAt>=from)&&(!to.HasValue||x.CreatedAt<=to)&&(!userId.HasValue||x.UserId==userId)&&(entity==null||x.Entity==entity)&&(action==null||x.Action==action));
            // No events are removed. Technical grouping is an explicit optional filter.
            if(includeTechnical==false)rows=rows.Where(x=>!x.Action.StartsWith("data_") || !(new[]{"CashOperation","DocumentSequence","UserRole","Role","Currency"}).Contains(x.Entity));
            page=Math.Max(1,page);pageSize=Math.Clamp(pageSize,1,100);
            var total=await rows.CountAsync();
            var events=await rows.OrderByDescending(x=>x.CreatedAt).ThenByDescending(x=>x.Id).Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            var users=await db.Users.Where(u=>events.Select(e=>e.UserId).Contains(u.Id)).ToDictionaryAsync(u=>u.Id,u=>u.FullName);
            var operationIds=events.Where(x=>x.Entity=="operation"&&x.EntityId.HasValue).Select(x=>x.EntityId!.Value).ToArray();
            var operations=await db.Operations.Where(x=>operationIds.Contains(x.Id)).ToDictionaryAsync(x=>x.Id,x=>new{x.DocumentNumber,x.Type,x.Description});
            return Results.Ok(new {page,pageSize,total,items=events.Select(e=>{
                var actionName=Actions.GetValueOrDefault(e.Action,"Действие пользователя");
                var entityName=Entities.GetValueOrDefault(e.Entity,"Запись системы");
                var userName=e.UserId.HasValue?users.GetValueOrDefault(e.UserId.Value,"Удалённый пользователь"):"Система";
                var description=entityName;
                if(e.Entity=="operation"&&e.EntityId.HasValue&&operations.TryGetValue(e.EntityId.Value,out var op))description=$"{(op.Type=="income"?"Приход":"Расход")} · {op.DocumentNumber??$"Черновик №{e.EntityId}"} · {op.Description}";
                var details=SafeDetails(e.Details);
                return new {e.Id,e.UserId,e.Action,e.Entity,e.EntityId,e.CreatedAt,details,userName,actionName,entityName,description,isTechnical=e.Action.StartsWith("data_")};
            })});
        });
    }
    private static string SafeDetails(string raw)
    {
        try {
            using var document=JsonDocument.Parse(raw);
            if(document.RootElement.ValueKind!=JsonValueKind.Object)return "{}";
            var safe=document.RootElement.EnumerateObject().Where(p=>!new[]{"password","oldPassword","newPassword","passwordHash","token","accessToken","refreshToken","hash","ip"}.Contains(p.Name,StringComparer.OrdinalIgnoreCase)).ToDictionary(p=>p.Name,p=>p.Value.Clone());
            return JsonSerializer.Serialize(safe);
        } catch(JsonException){return "{}";}
    }
}
