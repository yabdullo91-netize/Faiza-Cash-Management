using FaizaCash.Application;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
namespace FaizaCash.Api.Middleware;

public sealed class DecimalStringConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
    {
        if(r.TokenType==JsonTokenType.String && decimal.TryParse(r.GetString(),NumberStyles.AllowLeadingSign|NumberStyles.AllowDecimalPoint,CultureInfo.InvariantCulture,out var parsed))return parsed;
        if(r.TokenType==JsonTokenType.Number&&r.TryGetDecimal(out var number))return number;
        throw new JsonException("Сумма должна быть точным десятичным числом.");
    }
    public override void Write(Utf8JsonWriter w, decimal v, JsonSerializerOptions o) => w.WriteStringValue(v.ToString("0.00", CultureInfo.InvariantCulture));
}

public sealed class RequestMiddleware(RequestDelegate next, ILogger<RequestMiddleware> log)
{
    public async Task InvokeAsync(HttpContext c)
    {
        c.Response.Headers["X-Request-Id"] = c.TraceIdentifier;
        var started = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            if (c.Request.Method != "GET" && c.Request.Path.StartsWithSegments("/api/auth") && c.Request.Headers.Origin.Count > 0)
            {
                var origin = c.Request.Headers.Origin.ToString();
                var allowed = c.RequestServices.GetRequiredService<IConfiguration>()["Frontend:Origin"] ?? "http://localhost:5173";
                if (origin != allowed && origin != $"{c.Request.Scheme}://{c.Request.Host}") { await Results.Problem("Недопустимый источник запроса.", statusCode:403).ExecuteAsync(c); return; }
            }
            if (c.Request.Cookies.ContainsKey("faiza_refresh") && c.Request.Path.StartsWithSegments("/api/auth") && c.Request.Method != "GET" && !c.Request.Headers.ContainsKey("X-Faiza-Request"))
            { await Results.Problem("Требуется защитный заголовок.",statusCode:403).ExecuteAsync(c); return; }
            if(DateOnly.TryParse(c.Request.Query["from"],out var from) && DateOnly.TryParse(c.Request.Query["to"],out var to) && (from>to || to.DayNumber-from.DayNumber>3660)) { await Results.Problem("Некорректный отчётный период (максимум 10 лет).",statusCode:400).ExecuteAsync(c); return; }
            await next(c);
        }
        catch (BadHttpRequestException ex) { await Results.Problem("Проверьте обязательные параметры и формат данных запроса.",statusCode:ex.StatusCode).ExecuteAsync(c); }
        catch (JsonException) { await Results.Problem("Некорректное тело JSON-запроса.",statusCode:400).ExecuteAsync(c); }
        catch (BusinessException ex) { await Results.Problem(ex.Message,statusCode:ex.StatusCode).ExecuteAsync(c); }
        catch (DbUpdateConcurrencyException) { await Results.Problem("Запись уже изменена. Обновите страницу.",statusCode:409).ExecuteAsync(c); }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" }) { await Results.Problem("Запрос уже обработан или значение занято.",statusCode:409).ExecuteAsync(c); }
        catch (Npgsql.PostgresException ex) when (ex.SqlState is "40001" or "40P01") { await Results.Problem("Конкурентное изменение. Повторите запрос.",statusCode:409).ExecuteAsync(c); }
        catch (KeyNotFoundException) { await Results.Problem("Объект не найден.",statusCode:404).ExecuteAsync(c); }
        finally { log.LogInformation("HTTP {Method} {Path} {Status} {ElapsedMs} {RequestId}",c.Request.Method,c.Request.Path,c.Response.StatusCode,started.ElapsedMilliseconds,c.TraceIdentifier); }
    }
}
