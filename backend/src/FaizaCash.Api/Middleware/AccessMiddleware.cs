using FaizaCash.Infrastructure;
using Microsoft.EntityFrameworkCore;
namespace FaizaCash.Api.Middleware;

public sealed class AccessMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext c, CashDb db)
    {
        if(c.User.Identity?.IsAuthenticated != true) { await next(c); return; }
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u=>u.Id==c.UserId());
        if(user == null || !user.Active) { c.Response.StatusCode=401; return; }
        // Read current roles: disabling a role takes effect before JWT expiry.
        var roles = await db.UserRoles.Where(x=>x.UserId==user.Id).Select(x=>x.Role.Code).ToListAsync();
        if(c.User.FindAll(System.Security.Claims.ClaimTypes.Role).Any(x=>!roles.Contains(x.Value))) { c.Response.StatusCode=401; return; }
        if(user.MustChangePassword && !c.Request.Path.StartsWithSegments("/api/auth")) { await Results.Problem("Сначала смените первоначальный пароль.",statusCode:403).ExecuteAsync(c); return; }
        if(c.User.IsInRole("admin")) { await next(c); return; }
        var path=(c.Request.Path.Value ?? "").TrimEnd('/');
        if(path.Length==0)path="/";
        long? box = long.TryParse(c.Request.Query["cashboxId"],out var b) ? b : null;
        if(c.Request.RouteValues.TryGetValue("id",out var raw) && long.TryParse(raw?.ToString(),out var id))
        {
            if(path.StartsWith("/api/cashboxes/",StringComparison.OrdinalIgnoreCase)) box=id;
            if(path.StartsWith("/api/operations/",StringComparison.OrdinalIgnoreCase)) box=await db.Operations.Where(o=>o.Id==id).Select(o=>(long?)o.CashboxId).SingleOrDefaultAsync();
        }
        if(box.HasValue && !await db.CashAccess.AnyAsync(a=>a.UserId==user.Id&&a.CashboxId==box)) { c.Response.StatusCode=403; return; }
        // Mutation handlers authorize the typed cashbox ID inside their transaction.
        // List endpoints must never leak unassigned cashboxes or operations.
        if(c.Request.Method=="GET" && string.Equals(path,"/api/operations",StringComparison.OrdinalIgnoreCase) && box==null) { await Results.Problem("Выберите доступную кассу.",statusCode:400).ExecuteAsync(c); return; }
        if(c.Request.Method=="GET" && string.Equals(path,"/api/cashboxes",StringComparison.OrdinalIgnoreCase))
        {
            var ids=db.CashAccess.Where(a=>a.UserId==user.Id).Select(a=>a.CashboxId);
            await Results.Ok(await db.Cashboxes.Where(x=>ids.Contains(x.Id)).Select(x=>new {x.Id,x.Code,x.Name,currency=x.Currency.Code,x.Active,x.BalanceLimit}).ToListAsync()).ExecuteAsync(c); return;
        }
        await next(c);
    }
}
