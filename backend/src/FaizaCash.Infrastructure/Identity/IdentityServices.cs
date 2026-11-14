using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using FaizaCash.Domain;
using FaizaCash.Application;
namespace FaizaCash.Infrastructure;
public class Audit(CashDb db) { public async Task Add(Guid? user, string action, string entity, long? id, object data) { db.AuditEvents.Add(new() { UserId = user, Action = action, Entity = entity, EntityId = id, Details = System.Text.Json.JsonSerializer.Serialize(data) }); await db.SaveChangesAsync(); } }
public static class Password { public static bool Valid(string? s) => s is { Length: >= 10 } && s.Any(char.IsLetter) && s.Any(char.IsDigit); public static string Hash(string s) { var salt = RandomNumberGenerator.GetBytes(16); var hash = Rfc2898DeriveBytes.Pbkdf2(s, salt, 600000, HashAlgorithmName.SHA512, 32); return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}"; } public static bool Verify(string s, string stored) { try { var p = stored.Split(':'); var test = Rfc2898DeriveBytes.Pbkdf2(s, Convert.FromBase64String(p[0]), 600000, HashAlgorithmName.SHA512, 32); return CryptographicOperations.FixedTimeEquals(test, Convert.FromBase64String(p[1])); } catch { return false; } } }
public static class Tokens
{
    public const string Cookie = "faiza_refresh";
    public static CookieOptions Options(HttpContext context,IConfiguration configuration)
    {
        var value=configuration["RefreshCookie:SameSite"]??"Strict";
        if(!Enum.TryParse<SameSiteMode>(value,true,out var sameSite)||!Enum.IsDefined(sameSite)||sameSite==SameSiteMode.Unspecified)
            throw new InvalidOperationException("RefreshCookie:SameSite must be Strict, Lax, or None.");
        return new CookieOptions
        {
            HttpOnly=true,
            Secure=configuration.GetValue<bool?>("RefreshCookie:Secure")??context.Request.IsHttps,
            SameSite=sameSite,
            Path="/api/auth",
            MaxAge=TimeSpan.FromDays(7)
        };
    }
    public static string Hash(string s) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s)));
    public static async Task<object> Issue(User user,HttpContext ctx,CashDb db,IConfiguration cfg,RefreshToken? old=null)
    {
        var raw=Convert.ToHexString(RandomNumberGenerator.GetBytes(48));
        var refresh=new RefreshToken{UserId=user.Id,Hash=Hash(raw),ExpiresAt=DateTime.UtcNow.AddDays(7)};
        db.RefreshTokens.Add(refresh);
        if(old is not null)old.ReplacedBy=refresh.Id;
        await db.SaveChangesAsync();
        ctx.Response.Cookies.Append(Cookie,raw,Options(ctx,cfg));
        var claims=new List<Claim>{new(ClaimTypes.NameIdentifier,user.Id.ToString())};
        claims.AddRange(user.UserRoles.Select(x=>new Claim(ClaimTypes.Role,x.Role.Code)));
        var t=new JwtSecurityToken(cfg["Jwt:Issuer"],cfg["Jwt:Audience"],claims,expires:DateTime.UtcNow.AddMinutes(15),signingCredentials:new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!)),SecurityAlgorithms.HmacSha256));
        return new{accessToken=new JwtSecurityTokenHandler().WriteToken(t),expiresIn=900,user=user.Public()};
    }
}
