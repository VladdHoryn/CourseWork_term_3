using System.Security.Claims;
using CourseWork.DTOs;
using CourseWork.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Route("specialist")]
[Authorize]
public class SpecialistController : Controller
{
    private readonly SpecialistService _specialistService;
    private readonly LoggingService _log;

    public SpecialistController(
        SpecialistService specialistService,
        LoggingService log)
    {
        _specialistService = specialistService;
        _log = log;
    }
    
    // =====================================================================
    // ============================= HELPERS ================================
    // =====================================================================

    private string? GetCurrentSpecialistId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
    
    private void LogAction(string action, string details)
    {
        var userId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var username = User?.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";
        var role = User?.FindFirst(ClaimTypes.Role)?.Value ?? "unknown";

        _log.Log(userId, username, $"{action} (Role={role})", details);
    }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var id = GetCurrentSpecialistId();
        if (id is null) return Unauthorized();

        LogAction("Dashboard", "Specialist opened dashboard");

        var visits = _specialistService.GetAllVisitsForSpecialist(id);

        var today = visits.Where(v => v.VisitDate.Date == DateTime.Today).ToList();
        var nextWeek = visits.Where(v => v.VisitDate.Date <= DateTime.Today.AddDays(7)).ToList();

        return Ok(new
        {
            Today = today,
            Week = nextWeek
        });
    }

    // -------------------- Visits --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("GetVisits", "Requested all visits");

        return Ok(_specialistService.GetAllVisitsForSpecialist(specialistId));
    }

    [HttpGet("visits/{id}")]
    public IActionResult GetVisitById(string id)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        try
        {
            var visit = _specialistService.GetVisitForSpecialist(specialistId, id);
            LogAction("GetVisitById", $"Viewed visit {id}");
            return Ok(visit);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("This visit does not belong to you.");
        }
        catch
        {
            return NotFound("Visit not found.");
        }
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitCreateDto dto)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        try
        {
            bool isFirstVisit = !_specialistService
                .GetAllVisitsForSpecialist(specialistId)
                .Any(v => v.PatientMedicalRecord == dto.PatientMedicalRecord);

            var visit = VisitMapper.ToVisitFromCreateDto(dto, dto.PatientMedicalRecord, specialistId, isFirstVisit);
            var success = _specialistService.CreateVisitBySpecialist(specialistId, visit);

            LogAction("CreateVisit", success
                ? $"Created visit for patient MR {dto.PatientMedicalRecord}"
                : $"Failed to create visit for patient MR {dto.PatientMedicalRecord}");

            if (!success) return BadRequest("Failed to create visit.");

            return Ok(VisitMapper.ToResponse(visit));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unexpected error: {ex.Message}");
        }
    }

    [HttpPut("visits/{visitId}")]
    public IActionResult UpdateVisit(string visitId, [FromBody] VisitUpdateDto dto)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        try
        {
            var existing = _specialistService.GetVisitForSpecialist(specialistId, visitId);
            VisitMapper.ApplyUpdate(existing, dto);
            var success = _specialistService.UpdateVisitBySpecialist(specialistId, visitId, existing);

            LogAction("UpdateVisit", success
                ? $"Updated visit {visitId}"
                : $"Failed to update visit {visitId}");

            if (!success) return BadRequest("Failed to update visit.");

            return Ok(VisitMapper.ToResponse(existing));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can modify only your own visits.");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Visit not found.");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Unexpected error: {ex.Message}");
        }
    }

    [HttpPatch("visits/{visitId}/status")]
    public IActionResult ChangeVisitStatus(string visitId, [FromBody] StatusChangeDto dto)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        try
        {
            var success = _specialistService.ChangeVisitStatus(specialistId, visitId, dto.Status);

            LogAction("ChangeVisitStatus", success
                ? $"Changed status of visit {visitId} to {dto.Status}"
                : $"Failed to change status of visit {visitId}");

            if (!success) return BadRequest("Failed to change status.");

            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can modify only your own visits.");
        }
        catch
        {
            return NotFound("Visit not found.");
        }
    }

    // -------------------- Payments --------------------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("GetPayments", "Requested all payments");

        return Ok(_specialistService.GetPaymentsForSpecialist(specialistId));
    }

    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentCreateDto dto)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        var payment = PaymentMapper.ToPayment(dto, dto.PatientMedicalRecord);
        var success = _specialistService.CreatePaymentBySpecialist(specialistId, payment);

        LogAction("CreatePayment", success
            ? $"Created payment for patient MR {dto.PatientMedicalRecord}"
            : $"Failed to create payment for patient MR {dto.PatientMedicalRecord}");

        if (!success) return BadRequest("Failed to create payment.");

        return Ok(payment);
    }

    [HttpPatch("payments/{paymentId}/cancel")]
    public IActionResult CancelPayment(string paymentId)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        var success = _specialistService.CancelPaymentBySpecialist(specialistId, paymentId);

        LogAction("CancelPayment", success
            ? $"Canceled payment {paymentId}"
            : $"Failed to cancel payment {paymentId}");

        if (!success) return BadRequest("Failed to cancel payment.");

        return Ok();
    }

    // -------------------- Patients --------------------
    [HttpGet("patients")]
    public IActionResult GetAllPatients()
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("GetAllPatients", "Requested all patients");

        return Ok(_specialistService.GetAllPatients());
    }

    [HttpGet("patients/{medicalRecord}")]
    public IActionResult GetPatientByMedicalRecord(int medicalRecord)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("GetPatientByMR", $"Requested patient with MR {medicalRecord}");

        var patient = _specialistService.GetPatientByMedicalRecord(medicalRecord);
        if (patient is null) return NotFound("Patient not found");

        return Ok(patient);
    }

    [HttpGet("patients/search")]
    public IActionResult SearchPatientsBySurname([FromQuery] string surname)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("SearchPatients", $"Searching patients with surname '{surname}'");

        try
        {
            var result = _specialistService.SearchPatientsBySurname(surname);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("patients/filter")]
    public IActionResult GetPatientsByFilters([FromQuery] DateTime? birthFrom,
                                              [FromQuery] DateTime? birthTo,
                                              [FromQuery] string? healthStatus)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null) return Unauthorized();

        LogAction("FilterPatients", $"Filtering patients from {birthFrom} to {birthTo} with healthStatus={healthStatus}");

        var patients = _specialistService.GetPatientsByFilters(birthFrom, birthTo, specialistId, healthStatus);
        return Ok(patients);
    }
}