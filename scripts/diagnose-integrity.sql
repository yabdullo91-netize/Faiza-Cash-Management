BEGIN TRANSACTION READ ONLY;

WITH checks(name) AS (
    VALUES
        ('cashbox_currency'),
        ('operation_cashbox'),
        ('operation_category'),
        ('operation_counterparty'),
        ('operation_document_type'),
        ('operation_shift'),
        ('operation_creator'),
        ('operation_poster'),
        ('operation_reversal_of'),
        ('operation_reversal'),
        ('cash_access_user'),
        ('cash_access_cashbox'),
        ('opening_cashbox'),
        ('opening_creator'),
        ('category_parent'),
        ('sequence_cashbox'),
        ('shift_cashbox'),
        ('audit_user'),
        ('refresh_user'),
        ('refresh_replacement'),
        ('user_role_user'),
        ('user_role_role'),
        ('invalid_operation_status'),
        ('invalid_posting_metadata'),
        ('invalid_amount'),
        ('invalid_category_type'),
        ('invalid_counterparty_kind'),
        ('blank_document_type_code'),
        ('duplicate_normalized_document_type_code'),
        ('negative_cashbox_limit'),
        ('invalid_reversal_link')
), findings(name, sample_id) AS (
    SELECT 'cashbox_currency', c."Id"::text FROM "Cashboxes" c LEFT JOIN "Currencies" r ON r."Id"=c."CurrencyId" WHERE r."Id" IS NULL
    UNION ALL SELECT 'operation_cashbox', o."Id"::text FROM "Operations" o LEFT JOIN "Cashboxes" c ON c."Id"=o."CashboxId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'operation_category', o."Id"::text FROM "Operations" o LEFT JOIN "Categories" c ON c."Id"=o."CategoryId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'operation_counterparty', o."Id"::text FROM "Operations" o LEFT JOIN "Counterparties" c ON c."Id"=o."CounterpartyId" WHERE o."CounterpartyId" IS NOT NULL AND c."Id" IS NULL
    UNION ALL SELECT 'operation_document_type', o."Id"::text FROM "Operations" o LEFT JOIN "DocumentTypes" d ON d."Id"=o."DocumentTypeId" WHERE o."DocumentTypeId" IS NOT NULL AND d."Id" IS NULL
    UNION ALL SELECT 'operation_shift', o."Id"::text FROM "Operations" o LEFT JOIN "Shifts" s ON s."Id"=o."ShiftId" WHERE o."ShiftId" IS NOT NULL AND s."Id" IS NULL
    UNION ALL SELECT 'operation_creator', o."Id"::text FROM "Operations" o LEFT JOIN "Users" u ON u."Id"=o."CreatedBy" WHERE u."Id" IS NULL
    UNION ALL SELECT 'operation_poster', o."Id"::text FROM "Operations" o LEFT JOIN "Users" u ON u."Id"=o."PostedBy" WHERE o."PostedBy" IS NOT NULL AND u."Id" IS NULL
    UNION ALL SELECT 'operation_reversal_of', o."Id"::text FROM "Operations" o LEFT JOIN "Operations" p ON p."Id"=o."ReversalOfId" WHERE o."ReversalOfId" IS NOT NULL AND p."Id" IS NULL
    UNION ALL SELECT 'operation_reversal', o."Id"::text FROM "Operations" o LEFT JOIN "Operations" r ON r."Id"=o."ReversalId" WHERE o."ReversalId" IS NOT NULL AND r."Id" IS NULL
    UNION ALL SELECT 'cash_access_user', a."UserId"::text FROM "CashAccess" a LEFT JOIN "Users" u ON u."Id"=a."UserId" WHERE u."Id" IS NULL
    UNION ALL SELECT 'cash_access_cashbox', a."CashboxId"::text FROM "CashAccess" a LEFT JOIN "Cashboxes" c ON c."Id"=a."CashboxId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'opening_cashbox', o."Id"::text FROM "Openings" o LEFT JOIN "Cashboxes" c ON c."Id"=o."CashboxId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'opening_creator', o."Id"::text FROM "Openings" o LEFT JOIN "Users" u ON u."Id"=o."CreatedBy" WHERE u."Id" IS NULL
    UNION ALL SELECT 'category_parent', c."Id"::text FROM "Categories" c LEFT JOIN "Categories" p ON p."Id"=c."ParentId" WHERE c."ParentId" IS NOT NULL AND p."Id" IS NULL
    UNION ALL SELECT 'sequence_cashbox', s."CashboxId"::text FROM "Sequences" s LEFT JOIN "Cashboxes" c ON c."Id"=s."CashboxId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'shift_cashbox', s."Id"::text FROM "Shifts" s LEFT JOIN "Cashboxes" c ON c."Id"=s."CashboxId" WHERE c."Id" IS NULL
    UNION ALL SELECT 'audit_user', a."Id"::text FROM "AuditEvents" a LEFT JOIN "Users" u ON u."Id"=a."UserId" WHERE a."UserId" IS NOT NULL AND u."Id" IS NULL
    UNION ALL SELECT 'refresh_user', r."Id"::text FROM "RefreshTokens" r LEFT JOIN "Users" u ON u."Id"=r."UserId" WHERE u."Id" IS NULL
    UNION ALL SELECT 'refresh_replacement', r."Id"::text FROM "RefreshTokens" r LEFT JOIN "RefreshTokens" n ON n."Id"=r."ReplacedBy" WHERE r."ReplacedBy" IS NOT NULL AND n."Id" IS NULL
    UNION ALL SELECT 'user_role_user', r."UserId"::text FROM "UserRoles" r LEFT JOIN "Users" u ON u."Id"=r."UserId" WHERE u."Id" IS NULL
    UNION ALL SELECT 'user_role_role', r."UserId"::text FROM "UserRoles" r LEFT JOIN "Roles" x ON x."Id"=r."RoleId" WHERE x."Id" IS NULL
    UNION ALL SELECT 'invalid_operation_status', o."Id"::text FROM "Operations" o WHERE o."Status" NOT IN ('draft','posted')
    UNION ALL SELECT 'invalid_posting_metadata', o."Id"::text FROM "Operations" o WHERE
        (o."Status"='posted' AND (o."DocumentNumber" IS NULL OR o."PostingSeq" IS NULL OR o."PostedAt" IS NULL OR o."PostedBy" IS NULL))
        OR (o."Status"='draft' AND (o."DocumentNumber" IS NOT NULL OR o."PostingSeq" IS NOT NULL OR o."PostedAt" IS NOT NULL OR o."PostedBy" IS NOT NULL))
    UNION ALL SELECT 'invalid_amount', o."Id"::text FROM "Operations" o WHERE o."Amount"<=0 OR o."Amount">9999999999999999.99
    UNION ALL SELECT 'invalid_category_type', c."Id"::text FROM "Categories" c WHERE c."Type" NOT IN ('income','expense')
    UNION ALL SELECT 'invalid_counterparty_kind', c."Id"::text FROM "Counterparties" c WHERE c."Kind" NOT IN ('client','supplier','employee','other')
    UNION ALL SELECT 'blank_document_type_code', d."Id"::text FROM "DocumentTypes" d WHERE btrim(d."Code")=''
    UNION ALL SELECT 'duplicate_normalized_document_type_code', d."Id"::text FROM "DocumentTypes" d
        WHERE upper(btrim(d."Code")) IN (SELECT upper(btrim("Code")) FROM "DocumentTypes" GROUP BY upper(btrim("Code")) HAVING count(*)>1)
    UNION ALL SELECT 'negative_cashbox_limit', c."Id"::text FROM "Cashboxes" c WHERE c."BalanceLimit"<0
    UNION ALL SELECT 'invalid_reversal_link', o."Id"::text FROM "Operations" o LEFT JOIN "Operations" p ON p."Id"=o."ReversalOfId"
        WHERE o."IsReversal" IS DISTINCT FROM (o."ReversalOfId" IS NOT NULL)
           OR (o."IsReversal" AND (btrim(coalesce(o."ReversalReason",''))='' OR p."Id" IS NULL))
           OR (o."ReversalId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Operations" r WHERE r."Id"=o."ReversalId" AND r."ReversalOfId"=o."Id"))
)
SELECT c.name AS check_name,
       count(f.sample_id) AS issue_count,
       coalesce((
           SELECT string_agg(s.sample_id, ', ' ORDER BY s.sample_id)
           FROM (SELECT f2.sample_id FROM findings f2 WHERE f2.name=c.name ORDER BY f2.sample_id LIMIT 20) s
       ), '—') AS sample_ids
FROM checks c
LEFT JOIN findings f ON f.name=c.name
GROUP BY c.name
ORDER BY c.name;

ROLLBACK;
