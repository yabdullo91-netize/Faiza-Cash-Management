using FaizaCash.Domain;
using Xunit;

namespace FaizaCash.UnitTests;

public class MoneyTests
{
    [Theory]
    [InlineData("0")]
    [InlineData("-0.01")]
    [InlineData("-100")]
    [InlineData("0.001")]
    [InlineData("1.999")]
    [InlineData("10000000000000000")]
    public void RejectsNonpositiveSubCentAndOverflowAmounts(string value) =>
        Assert.False(Money.IsValid(decimal.Parse(value, System.Globalization.CultureInfo.InvariantCulture)));

    [Theory]
    [InlineData("0.01")]
    [InlineData("1.00")]
    [InlineData("100.10")]
    [InlineData("9999999999999999.99")]
    public void AcceptsAmountsWithinDatabasePrecision(string value) =>
        Assert.True(Money.IsValid(decimal.Parse(value, System.Globalization.CultureInfo.InvariantCulture)));

    [Fact]
    public void SignedAmountsKeepDecimalPrecision()
    {
        var balance = Money.Signed("income", 0.10m) + Money.Signed("income", 0.20m) + Money.Signed("expense", 0.05m);
        Assert.Equal(0.25m, balance);
    }

    [Fact]
    public void UnknownOperationTypeIsRejected() =>
        Assert.Throws<ArgumentException>(() => Money.Signed("transfer", 1m));
}
