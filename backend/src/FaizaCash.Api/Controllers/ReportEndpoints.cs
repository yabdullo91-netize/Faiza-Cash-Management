using FaizaCash.Application;
using FaizaCash.Domain;
using FaizaCash.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Globalization;
using System.Text;
namespace FaizaCash.Api;

public sealed class ReportFilters
{
    public long CashboxId {get;set;}
    public DateOnly From {get;set;}
    public DateOnly To {get;set;}
    public string? Type {get;set;}
    public string? Status {get;set;}
    public long? CategoryId {get;set;}
    public long? CounterpartyId {get;set;}
    public string? Q {get;set;}
    public string? Sort {get;set;}
    public int? Page {get;set;}
    public int? PageSize {get;set;}
}

public static class ReportEndpoints
{
    private const int MaxExportRows=10000;
    public static void MapReports(this WebApplication app)
    {
        var group=app.MapGroup("/api/reports").RequireAuthorization();
        group.MapGet("/cashbook",async([AsParameters]ReportFilters f,HttpContext ctx,CashDb db,ICashboxAccess access)=>
        {
            Validate(f);await access.Require(ctx.UserId(),f.CashboxId,ctx.RequestAborted);
            if(f.Type!=null||f.CategoryId.HasValue||f.CounterpartyId.HasValue||!string.IsNullOrEmpty(f.Q)||f.Status is "all" or "draft")throw new BusinessException("Кассовая книга включает все проведённые документы за период. Для дополнительных фильтров используйте журнал операций.",400);
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead,ctx.RequestAborted);
            var opening=await Opening(db,f.CashboxId,f.From);
            var ledger=Filtered(db,f,true);
            var total=await ledger.CountAsync(ctx.RequestAborted);var page=Math.Clamp(f.Page??1,1,1000000);var size=Math.Clamp(f.PageSize??15,1,100);
            var rows=await ledger.OrderBy(x=>x.Date).ThenBy(x=>x.PostingSeq).ThenBy(x=>x.Id).Skip((page-1)*size).Take(size).Select(x=>new {
                x.Id,x.Date,x.DocumentNumber,x.Description,counterparty=x.Counterparty==null?null:x.Counterparty.Name,x.Type,x.Amount,
                balance=opening+db.Operations.Where(p=>p.CashboxId==f.CashboxId&&p.Status=="posted"&&p.Date>=f.From&&(p.Date<x.Date || p.Date==x.Date&&(p.PostingSeq<x.PostingSeq || p.PostingSeq==x.PostingSeq&&p.Id<=x.Id))).Sum(p=>p.Type=="income"?p.Amount:-p.Amount)
            }).ToListAsync(ctx.RequestAborted);
            var (income,expense)=await Totals(ledger,ctx.RequestAborted);
            await tx.CommitAsync(ctx.RequestAborted);
            return Results.Ok(new {page,pageSize=size,total,opening,income,expense,closing=opening+income-expense,items=rows});
        });
        group.MapGet("/cash.csv",async([AsParameters]ReportFilters f,CashDb db,HttpContext ctx,Audit audit,ICashboxAccess access)=>
        {
            Validate(f);await access.Require(ctx.UserId(),f.CashboxId,ctx.RequestAborted);
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead,ctx.RequestAborted);
            var query=Filtered(db,f);var count=await query.CountAsync(ctx.RequestAborted);
            if(count>MaxExportRows)throw new BusinessException($"Экспорт ограничен {MaxExportRows} строками. Уточните фильтр периода.",413);
            var (income,expense)=await Totals(query,ctx.RequestAborted);
            var book=IsBook(f);var balance=book?await Opening(db,f.CashboxId,f.From):0m;
            ctx.Response.ContentType="text/csv; charset=utf-8";
            ctx.Response.Headers.ContentDisposition="attachment; filename=\"Faiza-Cash.csv\"";
            await ctx.Response.StartAsync(ctx.RequestAborted);
            await using var writer=new StreamWriter(ctx.Response.Body,new UTF8Encoding(true),4096,leaveOpen:true);
            await writer.WriteAsync("Дата;Номер;Тип;Содержание;Контрагент;Категория;Статус;Приход;Расход"+(book?";Остаток после операции":"")+"\r\n");
            if(book)await writer.WriteAsync(";;;"+Cell("Остаток на начало")+";;;;;;"+balance.ToString("0.00",CultureInfo.InvariantCulture)+"\r\n");
            var rows=Ordered(query,f.Sort).Include(x=>x.Counterparty).Include(x=>x.Category).AsAsyncEnumerable();
            await foreach(var row in rows.WithCancellation(ctx.RequestAborted))
            {
                var line=string.Join(';',Cell(row.Date.ToString("dd.MM.yyyy")),Cell(row.DocumentNumber??$"Черновик №{row.Id}"),Cell(row.Type=="income"?"Приход":"Расход"),Cell(row.Description),Cell(row.Counterparty?.Name),Cell(row.Category.Name),Cell(row.Status=="posted"?"Проведено":"Черновик"),row.Type=="income"?row.Amount.ToString("0.00",CultureInfo.InvariantCulture):"",row.Type=="expense"?row.Amount.ToString("0.00",CultureInfo.InvariantCulture):"");
                if(book){balance+=Money.Signed(row.Type,row.Amount);line+=";"+balance.ToString("0.00",CultureInfo.InvariantCulture);}
                await writer.WriteAsync(line+"\r\n");
            }
            if(book)await writer.WriteAsync(";;;"+Cell("Итоги периода / остаток на конец")+";;;;"+income.ToString("0.00",CultureInfo.InvariantCulture)+";"+expense.ToString("0.00",CultureInfo.InvariantCulture)+";"+balance.ToString("0.00",CultureInfo.InvariantCulture)+"\r\n");
            await writer.FlushAsync(ctx.RequestAborted);
            await audit.Add(ctx.UserId(),"report_exported","report",null,new{f.CashboxId,f.From,f.To,count});
            await tx.CommitAsync(ctx.RequestAborted);
            return Results.Empty;
        });
        group.MapGet("/cash.pdf",async([AsParameters]ReportFilters f,CashDb db,HttpContext ctx,Audit audit,IPdfReport pdf,ICashboxAccess access)=>
        {
            Validate(f);await access.Require(ctx.UserId(),f.CashboxId,ctx.RequestAborted);
            await using var tx=await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead,ctx.RequestAborted);
            var query=Filtered(db,f);var count=await query.CountAsync(ctx.RequestAborted);
            if(count>MaxExportRows)throw new BusinessException($"Экспорт ограничен {MaxExportRows} строками. Уточните фильтр периода.",413);
            var org=await db.Organizations.SingleAsync(ctx.RequestAborted);var box=await db.Cashboxes.SingleOrDefaultAsync(x=>x.Id==f.CashboxId,ctx.RequestAborted)??throw new KeyNotFoundException();
            var rows=await Ordered(query,f.Sort).Include(x=>x.Counterparty).ToListAsync(ctx.RequestAborted);
            var isBook=IsBook(f);
            var opening=isBook?await Opening(db,f.CashboxId,f.From):0m;var balance=opening;
            var lines=(isBook?rows.OrderBy(x=>x.Date).ThenBy(x=>x.PostingSeq).ThenBy(x=>x.Id):rows.AsEnumerable()).Select(x=>{balance+=Money.Signed(x.Type,x.Amount);return new ReportLine(x.DocumentNumber??$"Черновик №{x.Id}",x.Date,x.Description,x.Type,x.Amount,x.Counterparty?.Name,isBook?balance:null,x.Status);}).ToList();
            var bytes=pdf.Generate(org.Name,org.Currency,isBook?"Учебная кассовая книга":"Отфильтрованный журнал операций",$"{box.Name} · {f.From:dd.MM.yyyy} — {f.To:dd.MM.yyyy} · Все найденные записи",lines,opening,balances:isBook);
            await audit.Add(ctx.UserId(),"pdf_exported","report",null,new{f.CashboxId,f.From,f.To,count});
            await tx.CommitAsync(ctx.RequestAborted);
            return Results.File(bytes,"application/pdf","Faiza-Cash.pdf");
        });
    }
    private static void Validate(ReportFilters f)
    {
        if(f.CashboxId<=0 || f.From==DateOnly.MinValue || f.From>f.To || f.To.DayNumber-f.From.DayNumber>3660)throw new BusinessException("Укажите кассу и корректный период (не более 10 лет).",400);
        if(f.Type is not (null or "income" or "expense") || f.Status is not (null or "all" or "draft" or "posted") || f.Sort is not (null or "amount_asc" or "amount_desc" or "date_asc" or "date_desc") || f.Q?.Length>1000 || f.Q?.Contains('\0')==true)
            throw new BusinessException("Некорректный фильтр операций.",400);
    }
    private static IQueryable<CashOperation> Filtered(CashDb db,ReportFilters f,bool posted=false)=>db.Operations.AsNoTracking().Where(x=>x.CashboxId==f.CashboxId&&x.Date>=f.From&&x.Date<=f.To&&(posted?x.Status=="posted":f.Status=="all"||x.Status==(f.Status??"posted"))&&(f.Type==null||x.Type==f.Type)&&(!f.CategoryId.HasValue||x.CategoryId==f.CategoryId)&&(!f.CounterpartyId.HasValue||x.CounterpartyId==f.CounterpartyId)&&(string.IsNullOrEmpty(f.Q)||x.Description.Contains(f.Q)||(x.DocumentNumber??"").Contains(f.Q)));
    private static bool IsBook(ReportFilters f)=>f.Sort==null&&f.Type==null&&f.CategoryId==null&&f.CounterpartyId==null&&string.IsNullOrEmpty(f.Q)&&f.Status is null or "posted";
    private static IOrderedQueryable<CashOperation> Ordered(IQueryable<CashOperation> rows,string? sort)=>sort switch{"amount_asc"=>rows.OrderBy(x=>x.Amount).ThenBy(x=>x.Id),"amount_desc"=>rows.OrderByDescending(x=>x.Amount).ThenBy(x=>x.Id),"date_desc"=>rows.OrderByDescending(x=>x.Date).ThenByDescending(x=>x.Id),"date_asc"=>rows.OrderBy(x=>x.Date).ThenBy(x=>x.Id),_=>rows.OrderBy(x=>x.Date).ThenBy(x=>x.PostingSeq).ThenBy(x=>x.Id)};
    private static async Task<decimal> Opening(CashDb db,long box,DateOnly from)
    {
        if(!await db.Cashboxes.AnyAsync(x=>x.Id==box))throw new KeyNotFoundException();
        var initial=await db.Openings.Where(x=>x.CashboxId==box&&x.Date<from).SumAsync(x=>x.Amount);
        return initial+await db.Operations.Where(x=>x.CashboxId==box&&x.Status=="posted"&&x.Date<from).SumAsync(x=>x.Type=="income"?x.Amount:-x.Amount);
    }
    private static async Task<(decimal Income,decimal Expense)> Totals(IQueryable<CashOperation> rows,CancellationToken cancellationToken)
    {
        var totals=await rows.GroupBy(_=>1).Select(group=>new
        {
            Income=group.Where(x=>x.Type=="income").Sum(x=>x.Amount),
            Expense=group.Where(x=>x.Type=="expense").Sum(x=>x.Amount)
        }).SingleOrDefaultAsync(cancellationToken);
        return(totals?.Income??0m,totals?.Expense??0m);
    }
    public static string Cell(string? text)
    {
        text??="";if(text.TrimStart().Length>0&&"=+-@\t\r\n".Contains(text.TrimStart()[0]) || text.Length>0&&"\t\r\n".Contains(text[0]))text="'"+text;
        return "\""+text.Replace("\"","\"\"")+"\"";
    }
}
