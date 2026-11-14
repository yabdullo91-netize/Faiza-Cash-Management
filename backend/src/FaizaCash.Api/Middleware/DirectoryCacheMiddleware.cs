using Microsoft.Extensions.Caching.Memory;
namespace FaizaCash.Api.Middleware;
public sealed class DirectoryCacheMiddleware(RequestDelegate next)
{
    private static long version;
    public async Task InvokeAsync(HttpContext c,IMemoryCache cache)
    {
        var path=c.Request.Path.Value;
        var directory=c.Request.Path.StartsWithSegments("/api/categories") || c.Request.Path.StartsWithSegments("/api/counterparties");
        if(c.User.Identity?.IsAuthenticated!=true || !directory){await next(c);return;}
        if(c.Request.Method!="GET"){await next(c);if(c.Response.StatusCode<300)Interlocked.Increment(ref version);return;}
        if(path is not ("/api/categories" or "/api/counterparties")){await next(c);return;}
        var key=$"directories:{version}:{path}:{c.Request.QueryString}";
        if(cache.TryGetValue<byte[]>(key,out var bytes)){c.Response.ContentType="application/json; charset=utf-8";await c.Response.Body.WriteAsync(bytes!);return;}
        var output=c.Response.Body;await using var buffer=new MemoryStream();c.Response.Body=buffer;
        try{await next(c);bytes=buffer.ToArray();if(c.Response.StatusCode==200)cache.Set(key,bytes,TimeSpan.FromSeconds(30));await output.WriteAsync(bytes);}
        finally{c.Response.Body=output;}
    }
}
