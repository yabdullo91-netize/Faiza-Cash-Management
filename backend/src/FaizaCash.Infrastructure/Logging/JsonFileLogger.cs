using Microsoft.Extensions.Logging;
using System.Text.Json;
namespace FaizaCash.Infrastructure;
public sealed class JsonFileLoggerProvider(string directory) : ILoggerProvider
{
    private readonly object gate=new();
    public ILogger CreateLogger(string categoryName)=>new FileLogger(this,categoryName);
    public void Dispose(){}
    private void Write(string category,LogLevel level,EventId id,string message)
    {
        lock(gate){Directory.CreateDirectory(directory);foreach(var file in Directory.GetFiles(directory,"*.jsonl"))if(File.GetLastWriteTimeUtc(file)<DateTime.UtcNow.AddDays(-14))File.Delete(file);
        var path=Path.Combine(directory,$"{DateTime.UtcNow:yyyy-MM-dd}.jsonl");
        if(File.Exists(path)&&new FileInfo(path).Length>10*1024*1024)File.Move(path,Path.Combine(directory,$"{DateTime.UtcNow:yyyy-MM-dd-HHmmssfff}.jsonl"));
        File.AppendAllText(path,JsonSerializer.Serialize(new{time=DateTime.UtcNow,level=level.ToString(),category,eventId=id.Id,message})+Environment.NewLine);}
    }
    private sealed class FileLogger(JsonFileLoggerProvider owner,string category) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState:notnull=>null;
        public bool IsEnabled(LogLevel level)=>level>=LogLevel.Information;
        public void Log<TState>(LogLevel level,EventId id,TState state,Exception? ex,Func<TState,Exception?,string> formatter){if(IsEnabled(level))owner.Write(category,level,id,formatter(state,ex));}
    }
}
