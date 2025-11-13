namespace CourseWork.DTOs;

public class RegistrationRequestDto
{
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}