namespace CourseWork.DTOs;

public class CreateSpecialistDto
{
    public string UserName { get; set; }
    public string FullName { get; set; }
    public string Specialty { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string Password { get; set; }
}