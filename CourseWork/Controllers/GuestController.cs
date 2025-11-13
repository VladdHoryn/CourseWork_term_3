using CourseWork.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Services;

namespace CourseWork.Controllers;

[AllowAnonymous]
[ApiController]
[Route("guest")]
public class GuestController : ControllerBase
{
    private readonly GuestService _guestService;

    public GuestController(GuestService guestService)
    {
        _guestService = guestService;
    }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(new
        {
            Message = "Guest dashboard is active",
            Options = new[]
            {
                "view-system-statistics",
                "send-registration-request"
            }
        });
    }

    // -------------------- System Statistics --------------------
    [HttpGet("statistics")]
    public IActionResult GetSystemStatistics([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        if (start >= end)
            return BadRequest("Invalid date range: start date must be earlier than end date.");

        var stats = _guestService.GetSystemStatistics(start, end);
        return Ok(new
        {
            stats.totalUsers,
            stats.totalVisits,
            stats.totalPayments,
            stats.totalRevenue
        });
    }

    // -------------------- Registration Request --------------------
    [HttpPost("register")]
    public IActionResult SendRegistrationRequest([FromBody] RegistrationRequestDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password are required.");

        bool success = _guestService.SendRegistrationRequest(
            dto.Username,
            dto.Password,
            dto.FullName,
            dto.Phone,
            dto.Address
        );

        if (success)
            return Ok($"Registration request for '{dto.Username}' has been sent successfully.");

        return BadRequest("Failed to send registration request. Possibly username already exists or invalid data provided.");
    }
}