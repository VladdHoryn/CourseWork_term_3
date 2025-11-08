namespace CourseWork.DTOs;

public class CreateUserDto
{
    public string UserName { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Password { get; set; } = null!;
}