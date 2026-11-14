using FaizaCash.Application;
using Xunit;

namespace FaizaCash.UnitTests;

public class BalanceRulesTests
{
    private static readonly DateOnly Day = new(2026, 11, 12);

    [Fact]
    public void ExpenseCannotExceedOpeningBalance() =>
        Assert.False(BalanceRules.CanPost(100m, [], new(Day, 1, "expense", 100.01m)));

    [Fact]
    public void SpendingExactlyTheBalanceIsAllowed() =>
        Assert.True(BalanceRules.CanPost(100m, [], new(Day, 1, "expense", 100m)));

    [Fact]
    public void EmptyCashboxCannotPayEvenOneCent() =>
        Assert.False(BalanceRules.CanPost(0, [], new(Day, 1, "expense", 0.01m)));

    [Fact]
    public void IncomeAndExpensesProduceAnExactAvailableBalance()
    {
        PostingItem[] ledger = [new(Day, 1, "income", 0.10m), new(Day, 2, "income", 0.20m), new(Day, 3, "expense", 0.05m)];
        Assert.True(BalanceRules.CanPost(0, ledger, new(Day, 4, "expense", 0.25m)));
        Assert.False(BalanceRules.CanPost(0, ledger, new(Day, 4, "expense", 0.26m)));
    }

    [Fact]
    public void FutureIncomeCannotFinanceABackdatedExpense()
    {
        PostingItem[] ledger = [new(Day.AddDays(1), 1, "income", 100m)];
        Assert.False(BalanceRules.CanPost(0, ledger, new(Day, 2, "expense", 50m)));
    }

    [Fact]
    public void CandidateCannotMakeALaterPostedExpenseOverdraw()
    {
        PostingItem[] ledger = [new(Day.AddDays(1), 1, "expense", 80m)];
        Assert.False(BalanceRules.CanPost(100m, ledger, new(Day, 2, "expense", 30m)));
    }

    [Fact]
    public void ChronologyAndPostingSequenceDetermineAvailability()
    {
        PostingItem[] unsorted = [new(Day, 2, "expense", 60m), new(Day, 1, "income", 100m)];
        Assert.True(BalanceRules.CanPost(0, unsorted, new(Day, 3, "expense", 40m)));
        Assert.False(BalanceRules.CanPost(0, unsorted, new(Day, 0, "expense", 1m)));
    }
}
