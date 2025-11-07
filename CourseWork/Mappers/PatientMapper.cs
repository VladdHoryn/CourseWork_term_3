using CourseWork.DTOs;
using Сoursework.Models;

namespace CourseWork.Mappers;

public static class PatientMapper
{
    public static PatientDto ToDto(User u) => new()
    {
        Id = u.Id,
        UserName = u.UserName,
        Role = u.UserRole.ToString(),
        CreatedAt = u.CreatedAt,
        FullName = u.FullName,
        Phone = u.Phone,
        Address = u.Address,
        DateOfBirth = u.DateOfBirth,
        MedicalRecordNumber = u.MedicalRecordNumber
    };
}