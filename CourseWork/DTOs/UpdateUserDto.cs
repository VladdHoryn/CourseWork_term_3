namespace CourseWork.DTOs;

public class UpdateUserDto
{
    public string FullName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
}