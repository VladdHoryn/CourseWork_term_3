namespace CourseWork.DTOs;

public class PatientDto : UserDto
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? MedicalRecordNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
}