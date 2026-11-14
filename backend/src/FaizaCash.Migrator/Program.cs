using FaizaCash.Infrastructure;
using Microsoft.EntityFrameworkCore;

var connectionString=Environment.GetEnvironmentVariable("ConnectionStrings__CashDb")
    ??throw new InvalidOperationException("ConnectionStrings__CashDb is not configured for the migration job.");
var options=new DbContextOptionsBuilder<CashDb>().UseNpgsql(connectionString).Options;
await using var db=new CashDb(options);
var pending=await db.Database.GetPendingMigrationsAsync();
await db.Database.MigrateAsync();
Console.WriteLine($"Database migration job completed. Applied {pending.Count()} pending migration(s).");
