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

    public SpecialistController(SpecialistService specialistService)
    {
        _specialistService = specialistService;
    }
    
    // =====================================================================
    // ============================= HELPERS ================================
    // =====================================================================

    private string? GetCurrentSpecialistId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // =====================================================================
    // ========================== DASHBOARD DATA ============================
    // =====================================================================
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var id = GetCurrentSpecialistId();
        if (id is null)
            return Unauthorized();

        var visits = _specialistService.GetAllVisitsForSpecialist(id);

        var today = visits.Where(v => v.VisitDate.Date == DateTime.Today).ToList();
        var nextWeek = visits.Where(v => v.VisitDate.Date <= DateTime.Today.AddDays(7)).ToList();

        return Ok(new
        {
            Today = today,
            Week = nextWeek
        });
    }

    // =====================================================================
    // =============================== VISITS ===============================
    // =====================================================================

    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        return Ok(_specialistService.GetAllVisitsForSpecialist(specialistId));
    }


    [HttpGet("visits/{id}")]
    public IActionResult GetVisitById(string id)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        try
        {
            var visit = _specialistService.GetVisitForSpecialist(specialistId, id);
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
        if (specialistId is null)
            return Unauthorized();

        try
        {
            // Визначаємо, чи це перший візит пацієнта
            bool isFirstVisit = !_specialistService
                .GetAllVisitsForSpecialist(this.GetCurrentSpecialistId())
                .Any(v => v.PatientMedicalRecord == dto.PatientMedicalRecord);

            var visit = VisitMapper.ToVisitFromCreateDto(dto, dto.PatientMedicalRecord, specialistId, isFirstVisit);

            var success = _specialistService.CreateVisitBySpecialist(specialistId, visit);

            if (!success)
                return BadRequest("Failed to create visit.");

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
        if (specialistId is null)
            return Unauthorized();

        try
        {
            // Отримуємо існуючий візит
            var existing = _specialistService.GetVisitForSpecialist(specialistId, visitId);

            // Застосовуємо оновлення з DTO
            VisitMapper.ApplyUpdate(existing, dto);

            var success = _specialistService.UpdateVisitBySpecialist(specialistId, visitId, existing);

            if (!success)
                return BadRequest("Failed to update visit.");

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
        if (specialistId is null)
            return Unauthorized();

        try
        {
            var success = _specialistService.ChangeVisitStatus(specialistId, visitId, dto.Status);

            if (!success)
                return BadRequest("Failed to change status.");

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


    // =====================================================================
    // =============================== PAYMENTS =============================
    // =====================================================================

    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        return Ok(_specialistService.GetPaymentsForSpecialist(specialistId));
    }


    [HttpGet("payments/{paymentId}")]
    public IActionResult GetPaymentById(string paymentId)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        try
        {
            var payment = _specialistService.GetPaymentForSpecialist(specialistId, paymentId);
            return Ok(payment);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can access only payments related to your visits.");
        }
        catch
        {
            return NotFound("Payment not found.");
        }
    }


    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentCreateDto dto)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        var payment = PaymentMapper.ToPayment(dto, dto.PatientMedicalRecord);

        try
        {
            var success = _specialistService.CreatePaymentBySpecialist(specialistId, payment);

            if (!success)
                return BadRequest("Failed to create payment.");

            return Ok(payment);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can create payments only for your own visits.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpPatch("payments/{paymentId}/cancel")]
    public IActionResult CancelPayment(string paymentId)
    {
        var specialistId = GetCurrentSpecialistId();
        if (specialistId is null)
            return Unauthorized();

        try
        {
            var success = _specialistService.CancelPaymentBySpecialist(specialistId, paymentId);

            if (!success)
                return BadRequest("Failed to cancel payment.");

            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can cancel only your own payments.");
        }
        catch
        {
            return NotFound("Payment not found.");
        }
    }
}