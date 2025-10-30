using Microsoft.AspNetCore.Mvc;
using Сoursework.Services;

namespace CourseWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationController : ControllerBase
{
    private readonly RegistrationRequestService _service;

    public RegistrationController(RegistrationRequestService service)
    {
        _service = service;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterDto dto)
    {
        if (_service.SubmitRegistrationRequest(dto.UserName, dto.Password, dto.FullName, dto.Phone, dto.Address))
            return Ok("Registration request sent to admin for approval.");
        return BadRequest("Username already exists or invalid data.");
    }

    [HttpGet("pending")]
    public IActionResult GetPending() => Ok(_service.GetPendingRequests());

    [HttpPost("approve/{id}")]
    public IActionResult Approve(string id)
    {
        return _service.ApproveRequest(id) ? Ok("Request approved.") : BadRequest("Request not found or invalid.");
    }

    [HttpPost("reject/{id}")]
    public IActionResult Reject(string id)
    {
        return _service.RejectRequest(id) ? Ok("Request rejected.") : BadRequest("Request not found.");
    }
}

public class RegisterDto
{
    public string UserName { get; set; }
    public string Password { get; set; }
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}
