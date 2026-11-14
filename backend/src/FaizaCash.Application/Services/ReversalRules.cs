using FaizaCash.Domain;

namespace FaizaCash.Application;

public static class ReversalRules
{
    public static bool MatchesOriginal(CashOperation reversal, CashOperation original, DateOnly today) =>
        reversal.IsReversal && reversal.ReversalOfId == original.Id && reversal.Id != original.Id &&
        original.Status == "posted" && !original.IsReversal &&
        reversal.CashboxId == original.CashboxId && reversal.Amount == original.Amount &&
        reversal.Type == (original.Type == "income" ? "expense" : "income") &&
        reversal.Date >= original.Date && reversal.Date <= today &&
        reversal.CategoryId == original.CategoryId && reversal.CounterpartyId == original.CounterpartyId &&
        reversal.DocumentTypeId == original.DocumentTypeId && !string.IsNullOrWhiteSpace(reversal.ReversalReason);
}
