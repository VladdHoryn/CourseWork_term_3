namespace CourseWork.DTOs;

public class CreateUserDto
{
    public string UserName { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Password { get; set; } = null!;

    // Contact info
    public string? Phone { get; set; }
    public string? Address { get; set; }

    // Patient-specific fields
    public int MedicalRecordNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
}