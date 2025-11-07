using CourseWork.DTOs;
using Сoursework.Models;

namespace CourseWork.Mappers;

public static class UserMapper
{
    public static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        UserName = u.UserName,
        Role = u.UserRole.ToString(),
        CreatedAt = u.CreatedAt
    };
}