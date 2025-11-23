using Сoursework.Models;

namespace CourseWork.DTOs;

public class UpdateUserDtoAdmin
{
    public string? UserName { get; set; } 
    public string? FullName { get; set; }
    public Role UserRole { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    // Role-specific
    public int? MedicalRecordNumber { get; set; }  // Patient
    public string? Speciality { get; set; }        // Specialist
    public DateTime? DateOfBirth { get; set; }     // Patient & Specialist

    // Password не обов'язкове
    public string? PasswordHash { get; set; }
}