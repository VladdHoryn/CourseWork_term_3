using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Authorize(Roles = "Operator")]
[ApiController]
[Route("api/operator")]
public class OperatorController : ControllerBase
{
    private readonly OperatorService _service;
    private readonly SpecialistService _specialistService;

    public OperatorController(OperatorService service, SpecialistService specialistService)
    {
        _service = service;
        _specialistService = specialistService;
    }

    // ---------- Patients ----------
    [HttpGet("patients")]
    public IActionResult GetPatients()
    {
        return Ok(_service.GetAllUsers());
    }

    [HttpPost("patients")]
    public IActionResult CreatePatient([FromBody] User user, [FromQuery] string password)
    {
        _service.CreateUserByOperator(user, password);
        return Ok();
    }

    [HttpPut("patients/{id}")]
    public IActionResult UpdatePatient([FromRoute] string id, [FromBody] User updated)
    {
        updated.Id = id;
        _service.UpdateUserByOperator(updated);
        return Ok();
    }

    [HttpDelete("patients/{id}")]
    public IActionResult DeletePatient(string id)
    {
        _service.DeleteUserByOperator(id);
        return Ok();
    }

    // ---------- Specialists ----------
    [HttpGet("specialists")]
    public IActionResult GetSpecialists()
    {
        return Ok(_specialistService.GetAllSpecialists());
    }

    [HttpGet("specialists/count/{specialty}")]
    public IActionResult GetSpecialistsCount(string specialty)
    {
        return Ok(_specialistService.CountBySpecialty(specialty));
    }

    // ---------- Visits ----------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        return Ok(_service.GetAllVisitsByOperator());
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] Visit visit)
    {
        _service.CreateVisitByOperator(visit);
        return Ok();
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] Visit visit)
    {
        _service.UpdateVisitByOperator(id, visit);
        return Ok();
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        _service.DeleteVisitByOperator(id);
        return Ok();
    }

    // ---------- Payments ----------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        return Ok(_service.GetAllPaymentsByOperator());
    }

    [HttpDelete("payments/{id}")]
    public IActionResult DeletePayment(string id)
    {
        _service.DeletePaymentByOperator(id);
        return Ok();
    }

    // ---------- Queries UI (поки без SQL) ----------
    [HttpPost("queries/execute")]
    public IActionResult ExecuteQuery([FromBody] string sql)
    {
        return BadRequest("Custom SQL execution disabled due to architecture rules.");
    }
}