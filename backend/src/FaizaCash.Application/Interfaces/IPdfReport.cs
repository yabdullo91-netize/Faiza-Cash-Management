namespace FaizaCash.Application;
public record ReportLine(string Number, DateOnly Date, string Description, string Type, decimal Amount, string? Counterparty=null,decimal? Balance=null,string Status="posted");
public interface IPdfReport
{
    byte[] Generate(string organization,string currency,string title,string subtitle,IReadOnlyList<ReportLine> lines, decimal opening=0, bool balances=true);
}
