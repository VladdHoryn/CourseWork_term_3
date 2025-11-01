using CourseWork.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Services;

namespace CourseWork.Controllers.AuthController;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserService _userService;

    public AuthController(UserService userService)
    {
        _userService = userService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public IActionResult Register([FromBody] RegistrationRequest request)
    {
        try
        {
            _userService.RegisterUser(request);
            return Ok(new { message = "Registration successful" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = _userService.Login(request);
            return Ok(new { message = "Login successful", user = user.UserName, role = user.UserRole });
        }
        catch (Exception ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [Authorize(Roles = "Administrator")]
    [HttpGet("admin-only")]
    public IActionResult AdminEndpoint()
    {
        return Ok("Welcome, Administrator!");
    }
}