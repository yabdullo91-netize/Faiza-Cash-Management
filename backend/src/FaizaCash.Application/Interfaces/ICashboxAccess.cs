namespace FaizaCash.Application;

public interface ICashboxAccess
{
    Task Require(Guid userId, long cashboxId, CancellationToken cancellationToken = default);
    Task<long[]> AllowedCashboxes(Guid userId, CancellationToken cancellationToken = default);
}
