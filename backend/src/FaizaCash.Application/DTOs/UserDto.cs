namespace FaizaCash.Application;
public sealed record UserDto(Guid Id,string Login,string FullName,bool Active,bool MustChangePassword,IReadOnlyList<string> Roles);
