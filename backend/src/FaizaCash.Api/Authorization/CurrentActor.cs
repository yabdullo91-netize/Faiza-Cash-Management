using FaizaCash.Application;
using System.Security.Claims;
namespace FaizaCash.Api;
public sealed class CurrentActor(IHttpContextAccessor accessor) : ICurrentActor
{
    public Guid? UserId=>Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier),out var id)?id:null;
}
