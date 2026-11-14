using System.Security.Claims;
namespace FaizaCash.Api;
public static class Local { public static DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Asia/Dushanbe")); }
public static class HttpExt { public static Guid UserId(this HttpContext c) => Guid.Parse(c.User.FindFirstValue(ClaimTypes.NameIdentifier)!); }
