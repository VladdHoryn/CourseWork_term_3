namespace CourseWork.DTOs;

public class SpecialistDto : UserDto
{
    public string? FullName { get; set; }
    public string? Speciality { get; set; }
    public DateTime? DateOfBirth { get; set; }
}