namespace CourseWork.DTOs;

public class RegistrationRequest
{
    public string UserName { get; set; }
    public string Password { get; set; }
    public string FullName { get; set; }
    public string Role { get; set; } // "Patient", "Specialist", etc.
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Speciality { get; set; }
    public int? MedicalRecordNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
}