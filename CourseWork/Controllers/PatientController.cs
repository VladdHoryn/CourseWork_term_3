using System.Security.Claims;
using CourseWork.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Route("patient")]
[Authorize(Roles = "Patient")]
public class PatientController : Controller
{
    private readonly PatientService _patientService;
    private readonly VisitService _visitService;
    private readonly PaymentService _paymentService;
    private readonly SpecialistService _specialistService;
    private readonly LoggingService _log;

    public PatientController(
        PatientService patientService,
        VisitService visitService,
        PaymentService paymentService,
        SpecialistService specialistService,
        LoggingService log)
    {
        _patientService = patientService;
        _visitService = visitService;
        _paymentService = paymentService;
        _specialistService = specialistService;
        _log = log;
    }

    private User GetCurrentPatient()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return null;
        return _patientService.GetById(userId);
    }
    
    private void LogAction(string action, string details)
    {
        var userId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var username = User?.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";
        var role = User?.FindFirst(ClaimTypes.Role)?.Value ?? "unknown";

        _log.Log(userId, username, $"{action} (Role={role})", details);
    }

    // -------------------- DASHBOARD --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        LogAction("Dashboard", "Opened dashboard");

        return Ok(patient);
    }

    // -------------------- VISITS --------------------
    [HttpGet("visits")]
    public IActionResult Visits()
    {
        var patient = GetCurrentPatient();
        if (patient == null || patient.MedicalRecordNumber == null) return Unauthorized();

        var visits = _visitService
            .GetAllVisits()
            .Where(v => v.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(v => v.VisitDate)
            .ToList();

        LogAction("Visits", $"Fetched {visits.Count} visits");

        return Ok(visits);
    }

    // -------------------- BILLS --------------------
    [HttpGet("bills")]
    public IActionResult Bills()
    {
        var patient = GetCurrentPatient();
        if (patient == null || patient.MedicalRecordNumber == null) return Unauthorized();

        var payments = _paymentService
            .GetAllPayments()
            .Where(p => p.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(p => p.IssuedDate)
            .ToList();

        LogAction("Bills", $"Fetched {payments.Count} bills");

        return Ok(payments);
    }

    // -------------------- PAYMENTS --------------------
    [HttpPost("payments/pay")]
    public IActionResult Pay([FromBody] PaymentPayDto dto)
    {
        var patient = GetCurrentPatient();
        if (patient == null || patient.MedicalRecordNumber == null) return Unauthorized();

        try
        {
            var payment = _paymentService.GetPaymentById(dto.PaymentId);

            if (payment.PatientMedicalRecord != patient.MedicalRecordNumber.Value)
                return Forbid("You can pay only your own bills.");

            payment.ProcessPayment(dto.Amount);
            _paymentService.UpdatePayment(payment.Id, payment);

            LogAction("Pay", $"Paid {dto.Amount} for payment {dto.PaymentId}");

            return Ok(payment);
        }
        catch (KeyNotFoundException)
        {
            LogAction("Pay", $"Failed to pay: Payment {dto.PaymentId} not found");
            return NotFound("Payment not found.");
        }
        catch (InvalidOperationException ex)
        {
            LogAction("Pay", $"Failed to pay: {ex.Message}");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            LogAction("Pay", $"Failed to pay: Unexpected error {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }

    // -------------------- PROFILE --------------------
    [HttpGet("profile")]
    public IActionResult Profile()
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        LogAction("Profile", "Viewed profile");

        return Ok(patient);
    }

    [HttpPost("profile/update")]
    public IActionResult UpdateProfile(string fullName, string phone, string address)
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        patient.SetFullName(fullName);
        patient.SetContactInfo(phone, address);

        _patientService.UpdateUser(patient);

        LogAction("UpdateProfile", "Updated profile information");

        return Ok();
    }

    [HttpPost("profile/password")]
    public IActionResult UpdatePassword(string newPassword)
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        _patientService.UpdatePassword(patient.UserName, newPassword);

        LogAction("UpdatePassword", "Changed password");

        return Ok();
    }

    // -------------------- SPECIALISTS --------------------
    [HttpGet("specialists")]
    public IActionResult GetAllSpecialists()
    {
        var specialists = _specialistService.GetAllSpecialists();

        LogAction("GetAllSpecialists", $"Fetched {specialists.Count} specialists");

        return Ok(specialists);
    }

    [HttpGet("specialists/by-specialty")]
    public IActionResult GetSpecialistsBySpecialty([FromQuery] string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty)) return BadRequest("Specialty is required");

        var specialists = _specialistService.GetBySpecialty(specialty);

        LogAction("GetSpecialistsBySpecialty", $"Fetched {specialists.Count} specialists for specialty {specialty}");

        return Ok(specialists);
    }
}
