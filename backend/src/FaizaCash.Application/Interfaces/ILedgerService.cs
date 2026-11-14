namespace FaizaCash.Application;
public interface ILedgerService
{
    Task<object> Post(long id, int expectedVersion, Guid userId, bool privileged, CancellationToken cancellationToken=default);
}
public sealed class BusinessException(string message, int statusCode=409) : Exception(message)
{
    public int StatusCode { get; }=statusCode;
}
