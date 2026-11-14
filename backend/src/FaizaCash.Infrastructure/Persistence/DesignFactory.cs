using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace FaizaCash.Infrastructure;
public sealed class DesignFactory : IDesignTimeDbContextFactory<CashDb>
{
    public CashDb CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<CashDb>().UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__CashDb") ?? "Host=localhost;Database=faiza_design").Options);
}
