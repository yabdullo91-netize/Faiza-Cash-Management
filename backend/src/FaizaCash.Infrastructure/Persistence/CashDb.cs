using Microsoft.EntityFrameworkCore;
using FaizaCash.Domain;
using FaizaCash.Application;
using System.Text.Json;
using System.Globalization;
namespace FaizaCash.Infrastructure;
public class CashDb(DbContextOptions<CashDb> options, ICurrentActor? actor = null) : DbContext(options)
{
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken=default)
    {
        var events=ChangeTracker.Entries().Where(e=>e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .Where(e=>e.Entity is not AuditEvent and not RefreshToken and not LoginAttempt)
            .Select(e=>{
                var fields=new[]{"Name","Code","Active","FullName","Currency","BalanceLimit","Amount","Description","Date","Type","Status"};
                object? Safe(object? value)=>value is decimal amount?amount.ToString("0.00",CultureInfo.InvariantCulture):value;
                var changes=e.Properties.Where(p=>fields.Contains(p.Metadata.Name)&&(e.State!=EntityState.Modified||p.IsModified))
                    .ToDictionary(p=>p.Metadata.Name,p=>new {before=e.State==EntityState.Added?null:Safe(p.OriginalValue),after=e.State==EntityState.Deleted?null:Safe(p.CurrentValue)});
                var id=e.Properties.FirstOrDefault(p=>p.Metadata.Name=="Id")?.CurrentValue;
                return new AuditEvent {UserId=actor?.UserId,Action="data_"+e.State.ToString().ToLowerInvariant(),Entity=e.Metadata.ClrType.Name,EntityId=id is long number&&number>0?number:null,Details=JsonSerializer.Serialize(new {changes})};
            }).ToArray();
        AuditEvents.AddRange(events);
        return base.SaveChangesAsync(cancellationToken);
    }
    public DbSet<User> Users => Set<User>(); public DbSet<Role> Roles => Set<Role>(); public DbSet<UserRole> UserRoles => Set<UserRole>(); public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>(); public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>(); public DbSet<Currency> Currencies => Set<Currency>(); public DbSet<Cashbox> Cashboxes => Set<Cashbox>(); public DbSet<CashboxOpening> Openings => Set<CashboxOpening>(); public DbSet<Category> Categories => Set<Category>(); public DbSet<Counterparty> Counterparties => Set<Counterparty>(); public DbSet<DocumentType> DocumentTypes => Set<DocumentType>(); public DbSet<CashOperation> Operations => Set<CashOperation>(); public DbSet<DocumentSequence> Sequences => Set<DocumentSequence>(); public DbSet<CashShift> Shifts => Set<CashShift>(); public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<CashAccess> CashAccess => Set<CashAccess>(); public DbSet<Organization> Organizations => Set<Organization>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<CashAccess>().HasKey(x=>new { x.UserId,x.CashboxId });
        b.Entity<CashAccess>().HasOne<User>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashAccess>().HasOne<Cashbox>().WithMany().HasForeignKey(x=>x.CashboxId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashAccess>().HasIndex(x=>x.CashboxId);

        b.Entity<Organization>().HasKey(x=>x.Id);
        b.Entity<User>().HasIndex(x=>x.Login).IsUnique();
        b.Entity<Role>().HasIndex(x=>x.Code).IsUnique();
        b.Entity<UserRole>().HasKey(x=>new{x.UserId,x.RoleId});

        b.Entity<RefreshToken>().HasIndex(x=>x.Hash).IsUnique();
        b.Entity<RefreshToken>().HasOne<RefreshToken>().WithMany().HasForeignKey(x=>x.ReplacedBy).OnDelete(DeleteBehavior.Restrict);
        b.Entity<AuditEvent>().HasIndex(x=>x.CreatedAt);
        b.Entity<AuditEvent>().HasOne<User>().WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.SetNull);

        b.Entity<Currency>().HasIndex(x=>x.Code).IsUnique();
        b.Entity<Cashbox>().HasIndex(x=>x.Code).IsUnique();
        b.Entity<Cashbox>().HasOne(x=>x.Currency).WithMany().HasForeignKey(x=>x.CurrencyId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Cashbox>().HasOne(x=>x.Opening).WithOne(x=>x.Cashbox).HasForeignKey<CashboxOpening>(x=>x.CashboxId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Cashbox>().Property(x=>x.BalanceLimit).HasPrecision(18,2);
        b.Entity<Cashbox>().ToTable(t=>t.HasCheckConstraint("CK_Cashboxes_BalanceLimit","\"BalanceLimit\" IS NULL OR \"BalanceLimit\" >= 0"));
        b.Entity<CashboxOpening>().Property(x=>x.Amount).HasPrecision(18,2);
        b.Entity<CashboxOpening>().HasOne<User>().WithMany().HasForeignKey(x=>x.CreatedBy).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Category>().HasOne<Category>().WithMany().HasForeignKey(x=>x.ParentId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Category>().ToTable(t=>t.HasCheckConstraint("CK_Categories_Type","\"Type\" IN ('income','expense')"));
        b.Entity<Counterparty>().ToTable(t=>t.HasCheckConstraint("CK_Counterparties_Kind","\"Kind\" IN ('client','supplier','employee','other')"));
        b.Entity<DocumentType>(entity=>
        {
            entity.Property<string>("NormalizedCode").IsRequired().HasComputedColumnSql("upper(btrim(\"Code\"))",stored:true);
            entity.HasIndex("NormalizedCode").IsUnique();
            entity.ToTable(t=>t.HasCheckConstraint("CK_DocumentTypes_Code","char_length(btrim(\"Code\")) BETWEEN 1 AND 24"));
        });

        b.Entity<CashOperation>().HasOne(x=>x.Author).WithMany().HasForeignKey(x=>x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<Cashbox>().WithMany().HasForeignKey(x=>x.CashboxId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne(x=>x.Category).WithMany().HasForeignKey(x=>x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne(x=>x.Counterparty).WithMany().HasForeignKey(x=>x.CounterpartyId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<DocumentType>().WithMany().HasForeignKey(x=>x.DocumentTypeId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<CashShift>().WithMany().HasForeignKey(x=>x.ShiftId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<User>().WithMany().HasForeignKey(x=>x.PostedBy).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<CashOperation>().WithMany().HasForeignKey(x=>x.ReversalOfId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().HasOne<CashOperation>().WithMany().HasForeignKey(x=>x.ReversalId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<CashOperation>().Property(x=>x.Version).IsConcurrencyToken();
        b.Entity<CashOperation>().Property(x=>x.Amount).HasPrecision(18,2);
        b.Entity<CashOperation>().HasIndex(x=>new{x.CreatedBy,x.RequestKey}).IsUnique();
        b.Entity<CashOperation>().HasIndex(x=>x.ReversalOfId).IsUnique().HasFilter("\"ReversalOfId\" IS NOT NULL");
        b.Entity<CashOperation>().HasIndex(x=>x.ReversalId).IsUnique().HasFilter("\"ReversalId\" IS NOT NULL");
        b.Entity<CashOperation>().HasIndex(x=>new{x.CashboxId,x.Date,x.PostingSeq});
        b.Entity<CashOperation>().HasIndex(x=>new{x.CashboxId,x.DocumentNumber}).IsUnique().HasFilter("\"DocumentNumber\" IS NOT NULL");
        b.Entity<CashOperation>().ToTable(t=>
        {
            t.HasCheckConstraint("CK_Amount","\"Amount\" > 0 AND \"Amount\" <= 9999999999999999.99");
            t.HasCheckConstraint("CK_Type","\"Type\" IN ('income','expense')");
            t.HasCheckConstraint("CK_Operations_Status","\"Status\" IN ('draft','posted')");
            t.HasCheckConstraint("CK_Operations_PostingMetadata","(\"Status\"='draft' AND \"DocumentNumber\" IS NULL AND \"PostingSeq\" IS NULL AND \"PostedAt\" IS NULL AND \"PostedBy\" IS NULL) OR (\"Status\"='posted' AND \"DocumentNumber\" IS NOT NULL AND \"PostingSeq\" IS NOT NULL AND \"PostedAt\" IS NOT NULL AND \"PostedBy\" IS NOT NULL)");
            t.HasCheckConstraint("CK_Operations_Reversal","\"IsReversal\" = (\"ReversalOfId\" IS NOT NULL) AND (NOT \"IsReversal\" OR nullif(btrim(\"ReversalReason\"),'') IS NOT NULL)");
        });

        b.Entity<DocumentSequence>().HasKey(x=>new{x.CashboxId,x.Type,x.Year});
        b.Entity<DocumentSequence>().HasOne<Cashbox>().WithMany().HasForeignKey(x=>x.CashboxId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<DocumentSequence>().ToTable(t=>t.HasCheckConstraint("CK_Sequences_Values","\"Type\" IN ('income','expense') AND \"Year\" BETWEEN 1 AND 9999 AND \"LastNumber\" >= 0"));
        b.Entity<CashShift>().HasIndex(x=>new{x.CashboxId,x.Date}).IsUnique();
        b.Entity<CashShift>().HasOne<Cashbox>().WithMany().HasForeignKey(x=>x.CashboxId).OnDelete(DeleteBehavior.Restrict);
    }
}
