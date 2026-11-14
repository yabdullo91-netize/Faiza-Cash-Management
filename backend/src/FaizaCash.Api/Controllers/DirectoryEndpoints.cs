using FaizaCash.Application;
using FaizaCash.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
namespace FaizaCash.Api;

public static class DirectoryEndpoints
{
    private static string Name(string? value)
    {
        if(string.IsNullOrWhiteSpace(value)||value.Trim().Length>160||value.Contains('\0'))throw new BusinessException("Укажите название длиной от 1 до 160 символов.",400);
        return Regex.Replace(value.Trim(),@"\s+"," ");
    }
    private static Task Lock(CashDb db,string key)=>db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({key},0))");
    public static void MapDirectories(this WebApplication app)
    {
        var auth=new[]{"admin","accountant"};
        app.MapPost("/api/categories",async(CategoryInput x,CashDb db)=>
        {
            var name=Name(x.Name);if(x.Type is not ("income" or "expense"))throw new BusinessException("Выберите направление: приход или расход.",400);
            await using var tx=await db.Database.BeginTransactionAsync();await Lock(db,"category:"+x.Type+":"+name.ToUpperInvariant());
            if((await db.Categories.Where(c=>c.Type==x.Type).Select(c=>c.Name).ToListAsync()).Any(n=>string.Equals(Name(n),name,StringComparison.OrdinalIgnoreCase)))throw new BusinessException("Категория с таким названием и направлением уже существует.");
            if(x.ParentId.HasValue&&!await db.Categories.AnyAsync(c=>c.Id==x.ParentId&&c.Type==x.Type))throw new BusinessException("Родительская категория не найдена.",400);
            db.Categories.Add(new(){Name=name,Type=x.Type!,ParentId=x.ParentId});await db.SaveChangesAsync();await tx.CommitAsync();return Results.NoContent();
        }).RequireAuthorization(p=>p.RequireRole(auth));
        app.MapPatch("/api/categories/{id:long}",async(long id,DirectoryPatch x,CashDb db)=>
        {
            await using var tx=await db.Database.BeginTransactionAsync();var row=await db.Categories.FindAsync(id);if(row==null)return Results.NotFound();
            if(x.Name!=null){var name=Name(x.Name);await Lock(db,"category:"+row.Type+":"+name.ToUpperInvariant());if((await db.Categories.Where(c=>c.Id!=id&&c.Type==row.Type).Select(c=>c.Name).ToListAsync()).Any(n=>string.Equals(Name(n),name,StringComparison.OrdinalIgnoreCase)))throw new BusinessException("Категория с таким названием уже существует.");row.Name=name;}
            if(x.Active.HasValue)row.Active=x.Active.Value;await db.SaveChangesAsync();await tx.CommitAsync();return Results.NoContent();
        }).RequireAuthorization(p=>p.RequireRole(auth));
        app.MapPost("/api/counterparties",async(CounterpartyInput x,CashDb db)=>
        {
            var name=Name(x.Name);if(x.Kind is not ("client" or "supplier" or "employee" or "other"))throw new BusinessException("Выберите тип контрагента.",400);
            await using var tx=await db.Database.BeginTransactionAsync();await Lock(db,"counterparty:"+name.ToUpperInvariant());
            if((await db.Counterparties.Select(c=>c.Name).ToListAsync()).Any(n=>string.Equals(Name(n),name,StringComparison.OrdinalIgnoreCase)))throw new BusinessException("Контрагент с таким названием уже существует.");
            if(x.TaxCode?.Length>40||x.Contact?.Length>160||x.TaxCode?.Contains('\0')==true||x.Contact?.Contains('\0')==true)throw new BusinessException("Некорректные реквизиты контрагента.",400);
            db.Counterparties.Add(new(){Name=name,Kind=x.Kind!,TaxCode=x.TaxCode?.Trim(),Contact=x.Contact?.Trim()});await db.SaveChangesAsync();await tx.CommitAsync();return Results.NoContent();
        }).RequireAuthorization(p=>p.RequireRole(auth));
        app.MapPatch("/api/counterparties/{id:long}",async(long id,DirectoryPatch x,CashDb db)=>
        {
            await using var tx=await db.Database.BeginTransactionAsync();var row=await db.Counterparties.FindAsync(id);if(row==null)return Results.NotFound();
            if(x.Name!=null){var name=Name(x.Name);await Lock(db,"counterparty:"+name.ToUpperInvariant());if((await db.Counterparties.Where(c=>c.Id!=id).Select(c=>c.Name).ToListAsync()).Any(n=>string.Equals(Name(n),name,StringComparison.OrdinalIgnoreCase)))throw new BusinessException("Контрагент с таким названием уже существует.");row.Name=name;}
            if(x.Active.HasValue)row.Active=x.Active.Value;await db.SaveChangesAsync();await tx.CommitAsync();return Results.NoContent();
        }).RequireAuthorization(p=>p.RequireRole(auth));
    }
}
