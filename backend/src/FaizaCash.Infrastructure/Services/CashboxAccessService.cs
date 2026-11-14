using FaizaCash.Application;
using Microsoft.EntityFrameworkCore;

namespace FaizaCash.Infrastructure;

public sealed class CashboxAccessService(CashDb db) : ICashboxAccess
{
    public async Task<long[]> AllowedCashboxes(Guid userId, CancellationToken cancellationToken = default)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId && x.Active, cancellationToken))
            throw new BusinessException("Сеанс недействителен.", 401);
        if (await db.UserRoles.AnyAsync(x => x.UserId == userId && x.Role.Code == "admin", cancellationToken))
            return await db.Cashboxes.Select(x => x.Id).ToArrayAsync(cancellationToken);
        return await db.CashAccess.Where(x => x.UserId == userId).Select(x => x.CashboxId).ToArrayAsync(cancellationToken);
    }

    public async Task Require(Guid userId, long cashboxId, CancellationToken cancellationToken = default)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId && x.Active, cancellationToken))
            throw new BusinessException("Сеанс недействителен.", 401);
        var admin = await db.UserRoles.AnyAsync(x => x.UserId == userId && x.Role.Code == "admin", cancellationToken);
        if (!admin && !await db.CashAccess.AnyAsync(x => x.UserId == userId && x.CashboxId == cashboxId, cancellationToken))
            throw new BusinessException("Нет доступа к кассе.", 403);
    }
}
