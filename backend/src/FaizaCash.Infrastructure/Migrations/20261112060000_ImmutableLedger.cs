using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace FaizaCash.Infrastructure.Migrations;
[DbContext(typeof(CashDb))]
[Migration("20261112060000_ImmutableLedger")]
public sealed class ImmutableLedger : Migration
{
    protected override void Up(MigrationBuilder m)=>m.Sql("""
        CREATE FUNCTION faiza_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Audit is append-only'; END $$;
        CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON "AuditEvents" FOR EACH ROW EXECUTE FUNCTION faiza_audit_immutable();
        CREATE FUNCTION faiza_posted_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF OLD."Status" = 'posted' THEN
            IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Posted documents cannot be deleted'; END IF;
            IF (to_jsonb(NEW) - 'ReversalId' - 'Version') IS DISTINCT FROM (to_jsonb(OLD) - 'ReversalId' - 'Version') THEN
              RAISE EXCEPTION 'Posted documents cannot be changed';
            END IF;
          END IF;
          IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER posted_immutable BEFORE UPDATE OR DELETE ON "Operations" FOR EACH ROW EXECUTE FUNCTION faiza_posted_immutable();
        """);
    protected override void Down(MigrationBuilder m)=>m.Sql("DROP TRIGGER posted_immutable ON \"Operations\"; DROP FUNCTION faiza_posted_immutable(); DROP TRIGGER audit_immutable ON \"AuditEvents\"; DROP FUNCTION faiza_audit_immutable();");
}
