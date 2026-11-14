using FaizaCash.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace FaizaCash.UnitTests;

public class RefreshCookieTests
{
    [Fact]
    public void ProductionConfigurationProducesSecureHttpOnlyStrictCookie()
    {
        var configuration=new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
        {
            ["RefreshCookie:Secure"]="true",
            ["RefreshCookie:SameSite"]="Strict"
        }).Build();

        var cookie=Tokens.Options(new DefaultHttpContext(),configuration);

        Assert.True(cookie.Secure);
        Assert.True(cookie.HttpOnly);
        Assert.Equal(SameSiteMode.Strict,cookie.SameSite);
        Assert.Equal("/api/auth",cookie.Path);
    }

    [Fact]
    public void InvalidSameSiteConfigurationIsRejected()
    {
        var configuration=new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
        {
            ["RefreshCookie:SameSite"]="Unspecified"
        }).Build();

        Assert.Throws<InvalidOperationException>(()=>Tokens.Options(new DefaultHttpContext(),configuration));
    }
}
