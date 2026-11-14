using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FaizaCash.Infrastructure.Migrations;

public partial class FinancialIntegrity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $preflight$
            DECLARE issue_report text;
            BEGIN
                SELECT string_agg(format('%s=%s', issue_name, issue_count), ', ' ORDER BY issue_name)
                INTO issue_report
                FROM (
                    SELECT 'cashbox_currency' AS issue_name, count(*) AS issue_count FROM "Cashboxes" c LEFT JOIN "Currencies" r ON r."Id"=c."CurrencyId" WHERE r."Id" IS NULL
                    UNION ALL SELECT 'operation_cashbox', count(*) FROM "Operations" o LEFT JOIN "Cashboxes" c ON c."Id"=o."CashboxId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'operation_category', count(*) FROM "Operations" o LEFT JOIN "Categories" c ON c."Id"=o."CategoryId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'operation_counterparty', count(*) FROM "Operations" o LEFT JOIN "Counterparties" c ON c."Id"=o."CounterpartyId" WHERE o."CounterpartyId" IS NOT NULL AND c."Id" IS NULL
                    UNION ALL SELECT 'operation_document_type', count(*) FROM "Operations" o LEFT JOIN "DocumentTypes" d ON d."Id"=o."DocumentTypeId" WHERE o."DocumentTypeId" IS NOT NULL AND d."Id" IS NULL
                    UNION ALL SELECT 'operation_shift', count(*) FROM "Operations" o LEFT JOIN "Shifts" s ON s."Id"=o."ShiftId" WHERE o."ShiftId" IS NOT NULL AND s."Id" IS NULL
                    UNION ALL SELECT 'operation_creator', count(*) FROM "Operations" o LEFT JOIN "Users" u ON u."Id"=o."CreatedBy" WHERE u."Id" IS NULL
                    UNION ALL SELECT 'operation_poster', count(*) FROM "Operations" o LEFT JOIN "Users" u ON u."Id"=o."PostedBy" WHERE o."PostedBy" IS NOT NULL AND u."Id" IS NULL
                    UNION ALL SELECT 'operation_reversal_of', count(*) FROM "Operations" o LEFT JOIN "Operations" p ON p."Id"=o."ReversalOfId" WHERE o."ReversalOfId" IS NOT NULL AND p."Id" IS NULL
                    UNION ALL SELECT 'operation_reversal', count(*) FROM "Operations" o LEFT JOIN "Operations" r ON r."Id"=o."ReversalId" WHERE o."ReversalId" IS NOT NULL AND r."Id" IS NULL
                    UNION ALL SELECT 'cash_access_user', count(*) FROM "CashAccess" a LEFT JOIN "Users" u ON u."Id"=a."UserId" WHERE u."Id" IS NULL
                    UNION ALL SELECT 'cash_access_cashbox', count(*) FROM "CashAccess" a LEFT JOIN "Cashboxes" c ON c."Id"=a."CashboxId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'opening_cashbox', count(*) FROM "Openings" o LEFT JOIN "Cashboxes" c ON c."Id"=o."CashboxId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'opening_creator', count(*) FROM "Openings" o LEFT JOIN "Users" u ON u."Id"=o."CreatedBy" WHERE u."Id" IS NULL
                    UNION ALL SELECT 'category_parent', count(*) FROM "Categories" c LEFT JOIN "Categories" p ON p."Id"=c."ParentId" WHERE c."ParentId" IS NOT NULL AND p."Id" IS NULL
                    UNION ALL SELECT 'sequence_cashbox', count(*) FROM "Sequences" s LEFT JOIN "Cashboxes" c ON c."Id"=s."CashboxId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'shift_cashbox', count(*) FROM "Shifts" s LEFT JOIN "Cashboxes" c ON c."Id"=s."CashboxId" WHERE c."Id" IS NULL
                    UNION ALL SELECT 'audit_user', count(*) FROM "AuditEvents" a LEFT JOIN "Users" u ON u."Id"=a."UserId" WHERE a."UserId" IS NOT NULL AND u."Id" IS NULL
                    UNION ALL SELECT 'refresh_user', count(*) FROM "RefreshTokens" r LEFT JOIN "Users" u ON u."Id"=r."UserId" WHERE u."Id" IS NULL
                    UNION ALL SELECT 'refresh_replacement', count(*) FROM "RefreshTokens" r LEFT JOIN "RefreshTokens" n ON n."Id"=r."ReplacedBy" WHERE r."ReplacedBy" IS NOT NULL AND n."Id" IS NULL
                    UNION ALL SELECT 'user_role_user', count(*) FROM "UserRoles" r LEFT JOIN "Users" u ON u."Id"=r."UserId" WHERE u."Id" IS NULL
                    UNION ALL SELECT 'user_role_role', count(*) FROM "UserRoles" r LEFT JOIN "Roles" x ON x."Id"=r."RoleId" WHERE x."Id" IS NULL
                    UNION ALL SELECT 'invalid_operation_status', count(*) FROM "Operations" o WHERE o."Status" NOT IN ('draft','posted')
                    UNION ALL SELECT 'invalid_posting_metadata', count(*) FROM "Operations" o WHERE
                        (o."Status"='posted' AND (o."DocumentNumber" IS NULL OR o."PostingSeq" IS NULL OR o."PostedAt" IS NULL OR o."PostedBy" IS NULL))
                        OR (o."Status"='draft' AND (o."DocumentNumber" IS NOT NULL OR o."PostingSeq" IS NOT NULL OR o."PostedAt" IS NOT NULL OR o."PostedBy" IS NOT NULL))
                    UNION ALL SELECT 'invalid_amount', count(*) FROM "Operations" o WHERE o."Amount"<=0 OR o."Amount">9999999999999999.99
                    UNION ALL SELECT 'invalid_category_type', count(*) FROM "Categories" c WHERE c."Type" NOT IN ('income','expense')
                    UNION ALL SELECT 'invalid_counterparty_kind', count(*) FROM "Counterparties" c WHERE c."Kind" NOT IN ('client','supplier','employee','other')
                    UNION ALL SELECT 'invalid_document_type_code', count(*) FROM "DocumentTypes" d WHERE char_length(btrim(d."Code")) NOT BETWEEN 1 AND 24
                    UNION ALL SELECT 'duplicate_normalized_document_type_code', count(*) FROM (
                        SELECT upper(btrim("Code")) FROM "DocumentTypes" GROUP BY upper(btrim("Code")) HAVING count(*)>1
                    ) duplicates
                    UNION ALL SELECT 'negative_cashbox_limit', count(*) FROM "Cashboxes" c WHERE c."BalanceLimit"<0
                    UNION ALL SELECT 'invalid_reversal_link', count(*) FROM "Operations" o LEFT JOIN "Operations" p ON p."Id"=o."ReversalOfId"
                        WHERE o."IsReversal" IS DISTINCT FROM (o."ReversalOfId" IS NOT NULL)
                           OR (o."IsReversal" AND (btrim(coalesce(o."ReversalReason",''))='' OR p."Id" IS NULL))
                           OR (o."ReversalId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Operations" r WHERE r."Id"=o."ReversalId" AND r."ReversalOfId"=o."Id"))
                    UNION ALL SELECT 'invalid_sequence', count(*) FROM "Sequences" s WHERE s."Type" NOT IN ('income','expense') OR s."Year" NOT BETWEEN 1 AND 9999 OR s."LastNumber"<0
                ) issues
                WHERE issue_count>0;

                IF issue_report IS NOT NULL THEN
                    RAISE EXCEPTION 'Financial integrity migration stopped because existing data violates required constraints'
                        USING DETAIL=issue_report,
                              HINT='Run scripts/diagnose-integrity.sql against this database, resolve the reported rows, then retry the migration.';
                END IF;
            END
            $preflight$;
            """);

        migrationBuilder.DropForeignKey(name: "FK_Cashboxes_Currencies_CurrencyId", table: "Cashboxes");
        migrationBuilder.DropForeignKey(name: "FK_Openings_Cashboxes_CashboxId", table: "Openings");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Categories_CategoryId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Counterparties_CounterpartyId", table: "Operations");

        migrationBuilder.AddColumn<string>(
            name: "NormalizedCode",
            table: "DocumentTypes",
            type: "text",
            nullable: false,
            computedColumnSql: "upper(btrim(\"Code\"))",
            stored: true);

        migrationBuilder.AddCheckConstraint(name: "CK_Sequences_Values", table: "Sequences", sql: "\"Type\" IN ('income','expense') AND \"Year\" BETWEEN 1 AND 9999 AND \"LastNumber\" >= 0");
        migrationBuilder.AddCheckConstraint(name: "CK_Operations_PostingMetadata", table: "Operations", sql: "(\"Status\"='draft' AND \"DocumentNumber\" IS NULL AND \"PostingSeq\" IS NULL AND \"PostedAt\" IS NULL AND \"PostedBy\" IS NULL) OR (\"Status\"='posted' AND \"DocumentNumber\" IS NOT NULL AND \"PostingSeq\" IS NOT NULL AND \"PostedAt\" IS NOT NULL AND \"PostedBy\" IS NOT NULL)");
        migrationBuilder.AddCheckConstraint(name: "CK_Operations_Reversal", table: "Operations", sql: "\"IsReversal\" = (\"ReversalOfId\" IS NOT NULL) AND (NOT \"IsReversal\" OR nullif(btrim(\"ReversalReason\"),'') IS NOT NULL)");
        migrationBuilder.AddCheckConstraint(name: "CK_Operations_Status", table: "Operations", sql: "\"Status\" IN ('draft','posted')");
        migrationBuilder.AddCheckConstraint(name: "CK_DocumentTypes_Code", table: "DocumentTypes", sql: "char_length(btrim(\"Code\")) BETWEEN 1 AND 24");
        migrationBuilder.AddCheckConstraint(name: "CK_Counterparties_Kind", table: "Counterparties", sql: "\"Kind\" IN ('client','supplier','employee','other')");
        migrationBuilder.AddCheckConstraint(name: "CK_Categories_Type", table: "Categories", sql: "\"Type\" IN ('income','expense')");
        migrationBuilder.AddCheckConstraint(name: "CK_Cashboxes_BalanceLimit", table: "Cashboxes", sql: "\"BalanceLimit\" IS NULL OR \"BalanceLimit\" >= 0");

        migrationBuilder.CreateIndex(name: "IX_RefreshTokens_ReplacedBy", table: "RefreshTokens", column: "ReplacedBy");
        migrationBuilder.CreateIndex(name: "IX_Operations_DocumentTypeId", table: "Operations", column: "DocumentTypeId");
        migrationBuilder.CreateIndex(name: "IX_Operations_PostedBy", table: "Operations", column: "PostedBy");
        migrationBuilder.CreateIndex(name: "IX_Operations_ReversalId", table: "Operations", column: "ReversalId", unique: true, filter: "\"ReversalId\" IS NOT NULL");
        migrationBuilder.CreateIndex(name: "IX_Operations_ShiftId", table: "Operations", column: "ShiftId");
        migrationBuilder.CreateIndex(name: "IX_Openings_CreatedBy", table: "Openings", column: "CreatedBy");
        migrationBuilder.CreateIndex(name: "IX_DocumentTypes_NormalizedCode", table: "DocumentTypes", column: "NormalizedCode", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Categories_ParentId", table: "Categories", column: "ParentId");
        migrationBuilder.CreateIndex(name: "IX_CashAccess_CashboxId", table: "CashAccess", column: "CashboxId");
        migrationBuilder.CreateIndex(name: "IX_AuditEvents_UserId", table: "AuditEvents", column: "UserId");

        migrationBuilder.AddForeignKey(name: "FK_AuditEvents_Users_UserId", table: "AuditEvents", column: "UserId", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
        migrationBuilder.AddForeignKey(name: "FK_CashAccess_Cashboxes_CashboxId", table: "CashAccess", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_CashAccess_Users_UserId", table: "CashAccess", column: "UserId", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Cashboxes_Currencies_CurrencyId", table: "Cashboxes", column: "CurrencyId", principalTable: "Currencies", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Categories_Categories_ParentId", table: "Categories", column: "ParentId", principalTable: "Categories", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Openings_Cashboxes_CashboxId", table: "Openings", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Openings_Users_CreatedBy", table: "Openings", column: "CreatedBy", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Cashboxes_CashboxId", table: "Operations", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Categories_CategoryId", table: "Operations", column: "CategoryId", principalTable: "Categories", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Counterparties_CounterpartyId", table: "Operations", column: "CounterpartyId", principalTable: "Counterparties", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_DocumentTypes_DocumentTypeId", table: "Operations", column: "DocumentTypeId", principalTable: "DocumentTypes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Operations_ReversalId", table: "Operations", column: "ReversalId", principalTable: "Operations", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Operations_ReversalOfId", table: "Operations", column: "ReversalOfId", principalTable: "Operations", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Shifts_ShiftId", table: "Operations", column: "ShiftId", principalTable: "Shifts", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Users_PostedBy", table: "Operations", column: "PostedBy", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_RefreshTokens_RefreshTokens_ReplacedBy", table: "RefreshTokens", column: "ReplacedBy", principalTable: "RefreshTokens", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Sequences_Cashboxes_CashboxId", table: "Sequences", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_Shifts_Cashboxes_CashboxId", table: "Shifts", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_AuditEvents_Users_UserId", table: "AuditEvents");
        migrationBuilder.DropForeignKey(name: "FK_CashAccess_Cashboxes_CashboxId", table: "CashAccess");
        migrationBuilder.DropForeignKey(name: "FK_CashAccess_Users_UserId", table: "CashAccess");
        migrationBuilder.DropForeignKey(name: "FK_Cashboxes_Currencies_CurrencyId", table: "Cashboxes");
        migrationBuilder.DropForeignKey(name: "FK_Categories_Categories_ParentId", table: "Categories");
        migrationBuilder.DropForeignKey(name: "FK_Openings_Cashboxes_CashboxId", table: "Openings");
        migrationBuilder.DropForeignKey(name: "FK_Openings_Users_CreatedBy", table: "Openings");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Cashboxes_CashboxId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Categories_CategoryId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Counterparties_CounterpartyId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_DocumentTypes_DocumentTypeId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Operations_ReversalId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Operations_ReversalOfId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Shifts_ShiftId", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_Operations_Users_PostedBy", table: "Operations");
        migrationBuilder.DropForeignKey(name: "FK_RefreshTokens_RefreshTokens_ReplacedBy", table: "RefreshTokens");
        migrationBuilder.DropForeignKey(name: "FK_Sequences_Cashboxes_CashboxId", table: "Sequences");
        migrationBuilder.DropForeignKey(name: "FK_Shifts_Cashboxes_CashboxId", table: "Shifts");

        migrationBuilder.DropCheckConstraint(name: "CK_Sequences_Values", table: "Sequences");
        migrationBuilder.DropCheckConstraint(name: "CK_Operations_PostingMetadata", table: "Operations");
        migrationBuilder.DropCheckConstraint(name: "CK_Operations_Reversal", table: "Operations");
        migrationBuilder.DropCheckConstraint(name: "CK_Operations_Status", table: "Operations");
        migrationBuilder.DropCheckConstraint(name: "CK_DocumentTypes_Code", table: "DocumentTypes");
        migrationBuilder.DropCheckConstraint(name: "CK_Counterparties_Kind", table: "Counterparties");
        migrationBuilder.DropCheckConstraint(name: "CK_Categories_Type", table: "Categories");
        migrationBuilder.DropCheckConstraint(name: "CK_Cashboxes_BalanceLimit", table: "Cashboxes");

        migrationBuilder.DropIndex(name: "IX_RefreshTokens_ReplacedBy", table: "RefreshTokens");
        migrationBuilder.DropIndex(name: "IX_Operations_DocumentTypeId", table: "Operations");
        migrationBuilder.DropIndex(name: "IX_Operations_PostedBy", table: "Operations");
        migrationBuilder.DropIndex(name: "IX_Operations_ReversalId", table: "Operations");
        migrationBuilder.DropIndex(name: "IX_Operations_ShiftId", table: "Operations");
        migrationBuilder.DropIndex(name: "IX_Openings_CreatedBy", table: "Openings");
        migrationBuilder.DropIndex(name: "IX_DocumentTypes_NormalizedCode", table: "DocumentTypes");
        migrationBuilder.DropIndex(name: "IX_Categories_ParentId", table: "Categories");
        migrationBuilder.DropIndex(name: "IX_CashAccess_CashboxId", table: "CashAccess");
        migrationBuilder.DropIndex(name: "IX_AuditEvents_UserId", table: "AuditEvents");
        migrationBuilder.DropColumn(name: "NormalizedCode", table: "DocumentTypes");

        migrationBuilder.AddForeignKey(name: "FK_Cashboxes_Currencies_CurrencyId", table: "Cashboxes", column: "CurrencyId", principalTable: "Currencies", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        migrationBuilder.AddForeignKey(name: "FK_Openings_Cashboxes_CashboxId", table: "Openings", column: "CashboxId", principalTable: "Cashboxes", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Categories_CategoryId", table: "Operations", column: "CategoryId", principalTable: "Categories", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
        migrationBuilder.AddForeignKey(name: "FK_Operations_Counterparties_CounterpartyId", table: "Operations", column: "CounterpartyId", principalTable: "Counterparties", principalColumn: "Id");
    }
}
