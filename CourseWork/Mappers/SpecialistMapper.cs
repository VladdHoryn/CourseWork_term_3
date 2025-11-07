using CourseWork.DTOs;
using Сoursework.Models;

namespace CourseWork.Mappers;

public static class SpecialistMapper
{
    public static SpecialistDto ToDto(User u) => new()
    {
        Id = u.Id,
        UserName = u.UserName,
        Role = u.UserRole.ToString(),
        CreatedAt = u.CreatedAt,
        FullName = u.FullName,
        Speciality = u.Speciality,
        DateOfBirth = u.DateOfBirth
    };
}